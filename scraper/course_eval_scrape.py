"""
SCU Course Evaluations Scraper
Scrapes course evaluation data from https://www.scu.edu/apps/evaluations/
and writes aggregate_evals.json compatible with scripts/update_evals.js.

Usage:
    python course_eval_scrape.py                          # scrape everything
    python course_eval_scrape.py --query "Math 11"        # scrape one course
    python course_eval_scrape.py --max-pages 50           # scrape everything, first 50 pages

Environment variables:
    SCU_USERNAME  - SCU email or username
    SCU_PASSWORD  - SCU password
"""

import argparse
import asyncio
import json
import os
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from playwright.async_api import Page, async_playwright

_project_root = Path(__file__).resolve().parent.parent
load_dotenv(_project_root / ".env.local")

BASE_URL = "https://www.scu.edu/apps/evaluations/"
DEFAULT_OUTPUT = str(_project_root / "aggregate_evals.json")


@dataclass
class CourseEval:
    term: str
    course: str
    title: str
    instructor: str
    school: str
    section: str
    enrolled: str
    responses: str
    response_rate: str
    overall_quality: str
    detail_url: str = ""


def normalize_course_id(raw: str) -> str:
    """Turn 'Math 11' or 'MATH 11L' into 'MATH11L'."""
    return re.sub(r"\s+", "", raw.strip().upper())


def dept_from_course_id(course_id: str) -> str:
    """Extract 'ANTH' from 'ANTH1' or 'ANTH11A'."""
    m = re.match(r"^([A-Z]+)", course_id)
    return m.group(1) if m else "UNKNOWN"


def to_float(val: str) -> Optional[float]:
    try:
        return float(val.replace("%", "").strip())
    except (ValueError, AttributeError):
        return None


def _term_sort_key(term: str) -> tuple:
    """Sort terms most-recent-first. Format: 'Fall 2025', 'Spring 2024', etc."""
    order = {"Fall": 4, "Summer": 3, "Spring": 2, "Winter": 1}
    parts = term.split()
    try:
        year = int(parts[-1])
        season = order.get(parts[0], 0)
        return (-year, -season)
    except (ValueError, IndexError):
        return (0, 0)


def _stats_bucket() -> dict:
    return {"qualityTotal": 0.0, "qualityCount": 0,
            "difficultyTotal": 0.0, "difficultyCount": 0,
            "workloadTotal": 0.0, "workloadCount": 0}


def _add_quality(bucket: dict, quality: Optional[float]) -> None:
    if quality is not None:
        bucket["qualityTotal"] += quality
        bucket["qualityCount"] += 1


def build_aggregate(evals: list[CourseEval]) -> dict:
    """Build aggregate_evals.json matching the expected schema."""
    # Accumulators (keyed by course_id / instructor name / dept)
    courses: dict = {}       # course_id -> working data
    professors: dict = {}    # instructor -> working data
    dept_avgs: dict = {}     # dept -> list of per-section quality averages

    for e in evals:
        course_id = normalize_course_id(e.course)
        if not course_id:
            continue
        dept = dept_from_course_id(course_id)
        instructor = e.instructor.strip()
        quality = to_float(e.overall_quality)
        term = e.term.strip()

        # ── course ──────────────────────────────────────────────────────────
        if course_id not in courses:
            courses[course_id] = {
                **_stats_bucket(),
                "recentTerms": [],
                "courseName": e.title.strip(),
                "professors": [],
                "type": "course",
            }
        c = courses[course_id]
        _add_quality(c, quality)
        if term and term not in c["recentTerms"]:
            c["recentTerms"].append(term)
        if instructor and instructor not in c["professors"]:
            c["professors"].append(instructor)

        # ── professor ────────────────────────────────────────────────────────
        if instructor and instructor not in ("—", ""):
            if instructor not in professors:
                professors[instructor] = {
                    "type": "prof",
                    "overall": _stats_bucket(),
                }
            p = professors[instructor]
            _add_quality(p["overall"], quality)

            # per-department bucket on the prof
            if dept not in p:
                p[dept] = _stats_bucket()
            _add_quality(p[dept], quality)

            # per-course bucket on the prof
            if course_id not in p:
                p[course_id] = {**_stats_bucket(), "recentTerms": []}
            _add_quality(p[course_id], quality)
            if term and term not in p[course_id]["recentTerms"]:
                p[course_id]["recentTerms"].append(term)

        # ── department quality avgs (one entry per section) ──────────────────
        if quality is not None:
            dept_avgs.setdefault(dept, []).append(round(quality, 4))

    # ── finalise ─────────────────────────────────────────────────────────────
    aggregate: dict = {}

    for cid, data in courses.items():
        data["recentTerms"] = sorted(data["recentTerms"], key=_term_sort_key)
        aggregate[cid] = data

    for name, data in professors.items():
        for key in list(data.keys()):
            if key in ("type", "overall"):
                continue
            if "recentTerms" in data[key]:
                data[key]["recentTerms"] = sorted(data[key]["recentTerms"], key=_term_sort_key)
        aggregate[name] = data

    aggregate["departmentStatistics"] = {
        dept: {"qualityAvgs": sorted(avgs)}
        for dept, avgs in dept_avgs.items()
    }

    return aggregate


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

async def wait_for_scu_redirect(page: Page, timeout: int = 120_000) -> None:
    try:
        await page.wait_for_url("**scu.edu**", timeout=timeout)
    except Exception:
        pass
    await page.wait_for_load_state("networkidle")


async def shibboleth_login(page: Page, username: str, password: str) -> None:
    await page.wait_for_load_state("networkidle")

    url = page.url
    if "idp" not in url and "ssp" not in url and "login" not in url.lower():
        return

    print("Authenticating via Shibboleth SSO...")

    username_sel = (
        'input[name="j_username"], input[name="username"], '
        'input[type="email"], input[id*="username"], input[id*="user"]'
    )
    await page.locator(username_sel).first.fill(username)

    password_sel = 'input[name="j_password"], input[name="password"], input[type="password"]'
    await page.locator(password_sel).first.fill(password)

    submit_sel = (
        'button[type="submit"], input[type="submit"], '
        'button:has-text("Login"), button:has-text("Sign in")'
    )
    await page.locator(submit_sel).first.click()
    await page.wait_for_load_state("networkidle")

    if "duo" in page.url.lower() or await page.locator("iframe[src*='duo']").count() > 0:
        print("\n[!] Duo MFA detected. Approve the push notification on your phone...")

        # Wait up to 2 minutes for the user to approve the Duo push
        await page.wait_for_function(
            "() => !window.location.href.includes('duosecurity.com') || "
            "document.querySelector('button, input[type=submit]') !== null",
            timeout=120_000,
        )

        # Handle "Is this your device?" / "Trust this browser?" screen
        trust_sel = (
            "button:has-text('Yes, this is my device'), "
            "button:has-text('Yes, trust browser'), "
            "button:has-text('Trust Browser'), "
            "input[value*='Yes'], "
            "button:has-text('Yes')"
        )
        try:
            trust_btn = page.locator(trust_sel).first
            await trust_btn.wait_for(state="visible", timeout=10_000)
            print("Clicking 'Yes, this is my device'...")
            await trust_btn.click()
        except Exception:
            pass  # Screen didn't appear — that's fine, continue

        print("Waiting for redirect back to SCU...")
        await wait_for_scu_redirect(page)

    print(f"Logged in. Current URL: {page.url}")


# All known SCU department/subject codes.
# The site caps results at 500 per search, so we search one department at a time.
# If any single dept still hits 500, it's automatically subdivided by first digit (0-9).
SCU_DEPARTMENTS = [
    "ACTG", "AMTH", "ANTH", "ARAB", "ARTH", "ARTS", "BIOE", "BIOL",
    "BUSN", "CENG", "CHEM", "CHIN", "CLAS", "COMM", "CSCI", "DANC",
    "ECEN", "ECON", "ENGL", "ENGR", "ENVS", "ETHN", "FNCE", "FREN",
    "GERM", "GREK", "HIST", "ITAL", "JAPN", "LEAD", "LIBE", "LING",
    "MARK", "MATH", "MGMT", "MILS", "MKTG", "MUSC", "NEUR", "OMIS",
    "PHED", "PHIL", "PHSC", "PHYS", "POLS", "PSYC", "RSOC", "SCTR",
    "SOCI", "SPAN", "TESP", "THTR", "UGST", "WGST",
]

MAX_RESULTS_PER_SEARCH = 500  # site hard cap


# ---------------------------------------------------------------------------
# Scraping helpers
# ---------------------------------------------------------------------------

def build_search_url(query: str = "", course: str = "") -> str:
    from urllib.parse import quote_plus
    params = [
        ("ds", "1"),
        ("searchq", query),
        ("ds", "2"),
        ("term", ""),
        ("school", ""),
        ("faculty", ""),
        ("course", course),
    ]
    return BASE_URL + "?" + "&".join(f"{k}={quote_plus(str(v))}" for k, v in params)


DEBUG_COLUMNS = False  # set via --debug-columns flag


async def parse_page(page: Page) -> list[CourseEval]:
    await page.wait_for_load_state("networkidle")

    rows = page.locator("table tbody tr")
    if await rows.count() == 0:
        rows = page.locator("[class*='result-row'], [class*='eval-row'], .row[data-course]")

    evals = []
    for i in range(await rows.count()):
        row = rows.nth(i)
        cells = row.locator("td")
        cell_count = await cells.count()
        if cell_count == 0:
            continue

        # inner_text() respects CSS visibility and skips hidden sort-key spans
        texts = [(await cells.nth(j).inner_text() or "").strip() for j in range(cell_count)]

        if DEBUG_COLUMNS and i < 3:
            print(f"\n  [DEBUG row {i}] {cell_count} cells:")
            for ci, t in enumerate(texts):
                print(f"    [{ci}] {repr(t)}")

        link_el = row.locator("a").first
        detail_url = ""
        if await link_el.count() > 0:
            href = await link_el.get_attribute("href") or ""
            detail_url = href if href.startswith("http") else (BASE_URL.rstrip("/") + "/" + href.lstrip("/") if href else "")

        # Column order (confirmed from table inspection):
        # 0: term   1: course   2: section-key   3: title   4: instructor
        # 5: school   6: section   7: enrolled   8: responses   9: rate   10: quality
        evals.append(CourseEval(
            term=texts[0] if len(texts) > 0 else "",
            course=texts[1] if len(texts) > 1 else "",
            title=texts[3] if len(texts) > 3 else "",
            instructor=texts[4] if len(texts) > 4 else "",
            school=texts[5] if len(texts) > 5 else "",
            section=texts[6] if len(texts) > 6 else "",
            enrolled=texts[7] if len(texts) > 7 else "",
            responses=texts[8] if len(texts) > 8 else "",
            response_rate=texts[9] if len(texts) > 9 else "",
            overall_quality=texts[10] if len(texts) > 10 else "",
            detail_url=detail_url,
        ))
    return evals


async def scrape_search(page: Page, url: str, label: str) -> tuple[list[CourseEval], bool]:
    """
    Navigate to url, page through results (max 10 pages), return (evals, hit_cap).
    hit_cap=True means the site showed the 'Too Many Results' banner — caller should subdivide.
    """
    await page.goto(url)
    await page.wait_for_load_state("networkidle")

    # Bail out immediately if the site tells us results were truncated
    if await page.locator("text=Too Many Results").count() > 0:
        print(f"  [{label}] Too Many Results — subdividing.")
        return [], True

    all_evals: list[CourseEval] = []

    for page_num in range(1, 11):  # site hard-caps at 10 pages / 500 results
        page_evals = await parse_page(page)
        all_evals.extend(page_evals)
        print(f"  [{label}] page {page_num}: {len(page_evals)} rows  (subtotal: {len(all_evals)})")

        # Fewer than 50 rows means this is the last page — no need to check further
        if len(page_evals) < 50 or page_num == 10:
            break

        await page.locator(
            "a:has-text('Next'), a:has-text('>'), [aria-label='Next page'], "
            ".pagination .next:not(.disabled) a"
        ).first.click()
        await page.wait_for_load_state("networkidle")

    return all_evals, False


async def scrape_department_parallel(browser, cookies: list, dept: str, workers: int) -> list[CourseEval]:
    """
    Scrape a full department using a work queue shared across all workers.
    If a query hits the 500-result cap it pushes 10 digit-subdivisions back
    onto the queue instead of blocking — no deadlock possible.
    """
    queue: asyncio.Queue = asyncio.Queue()
    await queue.put(dept)

    all_evals: list[CourseEval] = []
    results_lock = asyncio.Lock()

    async def worker() -> None:
        while True:
            query = await queue.get()
            ctx = await browser.new_context()
            await ctx.add_cookies(cookies)
            page = await ctx.new_page()
            try:
                evals, hit_cap = await scrape_search(page, build_search_url(query=query), query)
                if hit_cap:
                    # Push narrower queries onto the queue for any free worker to pick up
                    prefix = query[len(dept):].strip()
                    for digit in "0123456789":
                        sub = f"{dept} {prefix}{digit}".strip()
                        await queue.put(sub)
                else:
                    async with results_lock:
                        all_evals.extend(evals)
            finally:
                await ctx.close()
                queue.task_done()

    worker_tasks = [asyncio.create_task(worker()) for _ in range(workers)]
    await queue.join()
    for task in worker_tasks:
        task.cancel()
    await asyncio.gather(*worker_tasks, return_exceptions=True)

    return all_evals


# ---------------------------------------------------------------------------
# Main scrape entry point
# ---------------------------------------------------------------------------

def merge_aggregate(existing: dict, new_agg: dict) -> dict:
    for key, val in new_agg.items():
        if key == "departmentStatistics":
            existing.setdefault("departmentStatistics", {}).update(val)
        else:
            existing[key] = val
    return existing


def append_raw_sections(evals: list[CourseEval], aggregate_output: str) -> None:
    """Merge new eval rows into sections_raw.json, deduplicating by detail_url."""
    raw_path = Path(aggregate_output).parent / "sections_raw.json"
    tmp_path = raw_path.with_suffix(".tmp")

    existing: list = []
    if raw_path.exists():
        try:
            with open(raw_path) as f:
                existing = json.load(f)
        except Exception:
            existing = []

    seen_urls = {r["detail_url"] for r in existing if r.get("detail_url")}
    added = 0
    for e in evals:
        if e.detail_url and e.detail_url not in seen_urls:
            seen_urls.add(e.detail_url)
            existing.append({
                "course_id": normalize_course_id(e.course),
                "term": e.term,
                "instructor": e.instructor.strip(),
                "detail_url": e.detail_url,
                "pdf_processed": False,
            })
            added += 1

    # Atomic write: write to .tmp then rename to avoid corruption
    with open(tmp_path, "w") as f:
        json.dump(existing, f, indent=2)
    tmp_path.replace(raw_path)

    if added:
        print(f"  +{added} new sections → sections_raw.json ({len(existing):,} total)")


def save_aggregate(aggregate: dict, output: str) -> None:
    with open(output, "w") as f:
        json.dump(aggregate, f, indent=2)
    courses_count = sum(1 for k in aggregate if re.match(r"^[A-Z]+[0-9]+[A-Z]*$", k))
    profs_count = sum(1 for k in aggregate if k != "departmentStatistics" and not re.match(r"^[A-Z]+[0-9]+[A-Z]*$", k))
    print(f"  Saved: {courses_count} courses, {profs_count} professors, "
          f"{len(aggregate.get('departmentStatistics', {}))} departments  →  {output}")


async def scrape_all_departments(
    username: str,
    password: str,
    output: str = DEFAULT_OUTPUT,
    resume: bool = True,
    workers: int = 4,
    headless: bool = False,
) -> None:
    existing: dict = {}
    done_depts: set = set()
    if resume and os.path.exists(output):
        with open(output) as f:
            existing = json.load(f)

        # Backfill _completedDepartments from departmentStatistics for files
        # that were scraped before this key existed.
        if "_completedDepartments" not in existing:
            inferred = [d for d in SCU_DEPARTMENTS if d in existing.get("departmentStatistics", {})]
            existing["_completedDepartments"] = inferred
            with open(output, "w") as f:
                json.dump(existing, f, indent=2)
            print(f"Migrated: inferred {len(inferred)} completed departments from existing data.")

        done_depts = set(existing["_completedDepartments"])
        print(f"Resuming — {len(done_depts)}/{len(SCU_DEPARTMENTS)} departments already scraped.")

    remaining = [d for d in SCU_DEPARTMENTS if d not in done_depts]
    if not remaining:
        print("All departments already scraped.")
        return

    print(f"{len(remaining)} departments to scrape, {workers} parallel workers per department.\n")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=headless)

        # Auth once, share cookies across all worker pages
        auth_ctx = await browser.new_context()
        auth_page = await auth_ctx.new_page()
        print("Authenticating...")
        await auth_page.goto(BASE_URL)
        if "idp" in auth_page.url or "ssp" in auth_page.url or "login" in auth_page.url.lower():
            await shibboleth_login(auth_page, username, password)
        cookies = await auth_ctx.cookies()
        await auth_ctx.close()
        print(f"Auth complete.\n")

        for i, dept in enumerate(remaining, 1):
            print(f"\n[{i}/{len(remaining)}] Scraping {dept} with {workers} parallel workers...")
            dept_evals = await scrape_department_parallel(browser, cookies, dept, workers)
            print(f"  {dept}: {len(dept_evals)} total rows — done.")

            if dept_evals:
                dept_aggregate = build_aggregate(dept_evals)
                merge_aggregate(existing, dept_aggregate)
                append_raw_sections(dept_evals, output)

            existing.setdefault("_completedDepartments", [])
            if dept not in existing["_completedDepartments"]:
                existing["_completedDepartments"].append(dept)
            save_aggregate(existing, output)

        await browser.close()

    print(f"\nDone. Full database saved to {output}")


async def scrape_single(
    query: str,
    username: str,
    password: str,
    output: str = DEFAULT_OUTPUT,
    headless: bool = False,
) -> None:
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=headless)
        context = await browser.new_context()
        page = await context.new_page()

        url = build_search_url(query=query)
        print(f"Navigating to: {url}")
        await page.goto(url)

        if "idp" in page.url or "ssp" in page.url or "login" in page.url.lower():
            await shibboleth_login(page, username, password)
            if page.url != url:
                await page.goto(url)
                await page.wait_for_load_state("networkidle")

        evals, _ = await scrape_search(page, page.url, query)
        await browser.close()

    print(f"\nTotal rows scraped: {len(evals)}")
    aggregate = build_aggregate(evals)

    existing: dict = {}
    if os.path.exists(output):
        with open(output) as f:
            existing = json.load(f)
    existing = merge_aggregate(existing, aggregate)
    save_aggregate(existing, output)


def main():
    parser = argparse.ArgumentParser(description="Scrape SCU course evaluations -> aggregate_evals.json")
    parser.add_argument("--query", default="", help="Search a specific course/dept. Omit to scrape all departments.")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help=f"Output JSON file (default: {DEFAULT_OUTPUT})")
    parser.add_argument("--no-resume", action="store_true", help="Ignore existing file and start fresh")
    parser.add_argument("--workers", type=int, default=4, help="Parallel browser tabs (default: 4)")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    parser.add_argument("--debug-columns", action="store_true", help="Print raw cell values for first 3 rows to verify column mapping")
    parser.add_argument("--username", default=os.environ.get("SCU_USERNAME", ""))
    parser.add_argument("--password", default=os.environ.get("SCU_PASSWORD", ""))
    args = parser.parse_args()

    if args.debug_columns:
        import course_eval_scrape as _self
        _self.DEBUG_COLUMNS = True

    if not args.username or not args.password:
        print(
            "Error: SCU credentials required. Set SCU_USERNAME and SCU_PASSWORD "
            "in .env.local or pass --username / --password.",
            file=sys.stderr,
        )
        sys.exit(1)

    if args.query:
        asyncio.run(scrape_single(
            query=args.query,
            username=args.username,
            password=args.password,
            output=args.output,
            headless=args.headless,
        ))
    else:
        asyncio.run(scrape_all_departments(
            username=args.username,
            password=args.password,
            output=args.output,
            resume=not args.no_resume,
            workers=args.workers,
            headless=args.headless,
        ))


if __name__ == "__main__":
    main()
