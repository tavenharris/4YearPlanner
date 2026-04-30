"""
SCU Course Eval PDF Detail Scraper
Reads sections_raw.json, downloads each section's Class Climate PDF,
parses quality / difficulty / workload scores, and updates aggregate_evals.json.

Run AFTER course_eval_scrape.py has finished.

Usage:
    python scraper/pdf_detail_scrape.py
    python scraper/pdf_detail_scrape.py --workers 20 --save-every 100
"""

import asyncio
import io
import json
import os
import re
import sys
from pathlib import Path
from typing import Optional

import aiohttp
import pdfplumber
from dotenv import load_dotenv
from playwright.async_api import async_playwright

_project_root = Path(__file__).resolve().parent.parent
load_dotenv(_project_root / ".env.local")

SECTIONS_FILE = _project_root / "sections_raw.json"
AGGREGATE_FILE = _project_root / "aggregate_evals.json"
BASE_URL = "https://www.scu.edu/apps/evaluations/"

WORKLOAD_MIDPOINTS = {
    "0-1": 0.5,
    "2-3": 2.5,
    "4-5": 4.5,
    "6-7": 6.5,
    "8-10": 9.0,
    "11-14": 12.5,
    "15+": 17.5,
}


# ---------------------------------------------------------------------------
# PDF parsing
# ---------------------------------------------------------------------------

def parse_eval_pdf(pdf_bytes: bytes) -> Optional[dict]:
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
    except Exception:
        return None

    full_text = "\n".join(pages)
    result: dict = {"n_responses": 0, "quality_avg": None, "difficulty_avg": None, "workload_avg": None}

    m = re.search(r"No\.\s*of\s*responses\s*=\s*(\d+)", full_text)
    if m:
        result["n_responses"] = int(m.group(1))

    profile_text = pages[-1] if pages else ""
    all_avgs = re.findall(r"n=\d+\s+av\.=([\d.]+)", profile_text)
    if len(all_avgs) >= 9:
        quality_vals = [float(v) for v in all_avgs[:9]]
        result["quality_avg"] = round(sum(quality_vals) / len(quality_vals), 4)
    if len(all_avgs) >= 10:
        result["difficulty_avg"] = float(all_avgs[9])

    ws_match = re.search(r"2\.1\)(.*?)(?=2\.2\)|$)", full_text, re.DOTALL)
    if ws_match:
        ws_text = ws_match.group(1)
        total_weight = 0.0
        total_pct = 0.0
        for label, midpoint in WORKLOAD_MIDPOINTS.items():
            m = re.search(re.escape(label) + r"\s+([\d.]+)%", ws_text)
            if m:
                pct = float(m.group(1))
                total_weight += pct * midpoint
                total_pct += pct
        if total_pct > 0:
            result["workload_avg"] = round(total_weight / total_pct, 4)

    return result


# ---------------------------------------------------------------------------
# Auth — Playwright just for login, cookies handed to aiohttp
# ---------------------------------------------------------------------------

async def wait_for_scu_redirect(page, timeout: int = 120_000) -> None:
    try:
        await page.wait_for_url("**scu.edu**", timeout=timeout)
    except Exception:
        pass
    await page.wait_for_load_state("networkidle")


async def get_session_cookies(username: str, password: str, headless: bool) -> dict:
    """Log in via Playwright, return cookies as a plain dict for aiohttp."""
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=headless)
        ctx = await browser.new_context()
        page = await ctx.new_page()

        await page.goto(BASE_URL)
        await page.wait_for_load_state("networkidle")

        if "idp" in page.url or "ssp" in page.url or "login" in page.url.lower():
            print("Authenticating via Shibboleth SSO...")
            await page.locator(
                'input[name="j_username"], input[name="username"], input[type="email"], input[id*="username"]'
            ).first.fill(username)
            await page.locator(
                'input[name="j_password"], input[name="password"], input[type="password"]'
            ).first.fill(password)
            await page.locator(
                'button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign in")'
            ).first.click()
            await page.wait_for_load_state("networkidle")

            if "duo" in page.url.lower() or await page.locator("iframe[src*='duo']").count() > 0:
                print("\n[!] Duo MFA — approve on your phone...")
                await page.wait_for_function(
                    "() => !window.location.href.includes('duosecurity.com') || "
                    "document.querySelector('button, input[type=submit]') !== null",
                    timeout=120_000,
                )
                try:
                    trust_btn = page.locator(
                        "button:has-text('Yes, this is my device'), button:has-text('Yes, trust browser'), "
                        "button:has-text('Trust Browser'), button:has-text('Yes')"
                    ).first
                    await trust_btn.wait_for(state="visible", timeout=10_000)
                    await trust_btn.click()
                except Exception:
                    pass
                await wait_for_scu_redirect(page)

        pw_cookies = await ctx.cookies()
        await browser.close()

    # Convert Playwright cookie list → aiohttp-compatible dict
    cookies = {c["name"]: c["value"] for c in pw_cookies}
    print(f"Authenticated. Got {len(cookies)} session cookies.\n")
    return cookies


# ---------------------------------------------------------------------------
# aiohttp download
# ---------------------------------------------------------------------------

async def download_pdf(session: aiohttp.ClientSession, url: str) -> Optional[bytes]:
    try:
        async with session.get(url, allow_redirects=True, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            if resp.status != 200:
                return None
            body = await resp.read()
            return body if body.startswith(b"%PDF") else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Aggregate update
# ---------------------------------------------------------------------------

def update_aggregate(aggregate: dict, section: dict, parsed: dict) -> None:
    course_id = section["course_id"]
    instructor = section.get("instructor", "").strip()
    n = parsed["n_responses"]
    if n == 0:
        return

    dept_m = re.match(r"^([A-Z]+)", course_id)
    dept_code = dept_m.group(1) if dept_m else None

    def _add(bucket: dict, field: str, avg: Optional[float]) -> None:
        if avg is not None and field + "Total" in bucket:
            bucket[field + "Total"] += round(avg * n, 6)
            bucket[field + "Count"] += n

    if course_id in aggregate:
        c = aggregate[course_id]
        _add(c, "quality", parsed["quality_avg"])
        _add(c, "difficulty", parsed["difficulty_avg"])
        _add(c, "workload", parsed["workload_avg"])

    if instructor and instructor in aggregate:
        p = aggregate[instructor]
        for bucket_key in ["overall", dept_code, course_id]:
            if bucket_key and bucket_key in p and isinstance(p[bucket_key], dict):
                _add(p[bucket_key], "quality", parsed["quality_avg"])
                _add(p[bucket_key], "difficulty", parsed["difficulty_avg"])
                _add(p[bucket_key], "workload", parsed["workload_avg"])


# ---------------------------------------------------------------------------
# Atomic file save
# ---------------------------------------------------------------------------

def atomic_save(path: Path, data) -> None:
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2)
    tmp.replace(path)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def run(username: str, password: str, workers: int = 20, save_every: int = 50, headless: bool = False) -> None:
    if not SECTIONS_FILE.exists():
        print(f"Error: {SECTIONS_FILE} not found. Run course_eval_scrape.py first.")
        sys.exit(1)
    if not AGGREGATE_FILE.exists():
        print(f"Error: {AGGREGATE_FILE} not found. Run course_eval_scrape.py first.")
        sys.exit(1)

    with open(SECTIONS_FILE) as f:
        sections: list = json.load(f)
    with open(AGGREGATE_FILE) as f:
        aggregate: dict = json.load(f)

    pending = [s for s in sections if not s.get("pdf_processed") and s.get("detail_url")]
    total = len(pending)
    done_count = len(sections) - total
    print(f"{total:,} sections to process  ({done_count:,} already done).")
    if not total:
        print("Nothing to do.")
        return

    cookies = await get_session_cookies(username, password, headless)

    # Counters shared across workers
    completed = 0
    dirty = 0                   # sections processed since last save
    lock = asyncio.Lock()

    connector = aiohttp.TCPConnector(limit=workers, ssl=False)
    async with aiohttp.ClientSession(cookies=cookies, connector=connector) as session:

        async def process(section: dict, idx: int) -> None:
            nonlocal completed, dirty

            url = section["detail_url"]
            pdf_bytes = await download_pdf(session, url)

            parsed = parse_eval_pdf(pdf_bytes) if pdf_bytes else None

            async with lock:
                section["pdf_processed"] = True
                if parsed and parsed["n_responses"] > 0:
                    update_aggregate(aggregate, section, parsed)
                    print(f"  [{idx + 1}/{total}] {section['course_id']} | "
                          f"q={parsed['quality_avg']}  d={parsed['difficulty_avg']}  "
                          f"w={parsed['workload_avg']}  n={parsed['n_responses']}")

                completed += 1
                dirty += 1

                # Save in batches — not on every single section
                if dirty >= save_every:
                    atomic_save(AGGREGATE_FILE, aggregate)
                    atomic_save(SECTIONS_FILE, sections)
                    print(f"  --- saved ({completed:,}/{total:,} done) ---")
                    dirty = 0

        semaphore = asyncio.Semaphore(workers)

        async def bounded(section, idx):
            async with semaphore:
                await process(section, idx)

        await asyncio.gather(*[bounded(s, i) for i, s in enumerate(pending)])

    # Final save
    atomic_save(AGGREGATE_FILE, aggregate)
    atomic_save(SECTIONS_FILE, sections)
    print(f"\nDone. {completed:,} sections processed. aggregate_evals.json updated.")


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(description="Parse Class Climate PDFs -> aggregate_evals.json")
    parser.add_argument("--workers", type=int, default=20, help="Parallel downloads (default: 20)")
    parser.add_argument("--save-every", type=int, default=50, help="Save to disk every N sections (default: 50)")
    parser.add_argument("--headless", action="store_true", help="Run auth browser headless")
    parser.add_argument("--username", default=os.environ.get("SCU_USERNAME", ""))
    parser.add_argument("--password", default=os.environ.get("SCU_PASSWORD", ""))
    args = parser.parse_args()

    if not args.username or not args.password:
        print("Error: SCU credentials required. Set SCU_USERNAME and SCU_PASSWORD in .env.local.", file=sys.stderr)
        sys.exit(1)

    asyncio.run(run(args.username, args.password,
                    workers=args.workers,
                    save_every=args.save_every,
                    headless=args.headless))


if __name__ == "__main__":
    main()
