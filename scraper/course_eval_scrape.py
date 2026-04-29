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
    """Turn 'Math 11' or 'MATH 11L' into 'MATH11L' to match the scripts' key pattern."""
    return re.sub(r"\s+", "", raw.strip().upper())


def to_float(val: str) -> Optional[float]:
    try:
        return float(val.replace("%", "").strip())
    except (ValueError, AttributeError):
        return None


def build_aggregate(evals: list[CourseEval]) -> dict:
    """
    Transform flat eval rows into the aggregate_evals.json format:
      { "MATH11": { ...course data... }, "Jane Smith": { ...prof data... }, "departmentStatistics": {...} }
    """
    courses: dict = {}
    professors: dict = {}
    dept_totals: dict = {}

    for e in evals:
        course_id = normalize_course_id(e.course)
        instructor = e.instructor.strip()
        quality = to_float(e.overall_quality)
        rate = to_float(e.response_rate)

        row = {
            "term": e.term,
            "section": e.section,
            "instructor": instructor,
            "enrolled": e.enrolled,
            "responses": e.responses,
            "response_rate": e.response_rate,
            "overall_quality": e.overall_quality,
            "detail_url": e.detail_url,
        }

        # --- course bucket ---
        if course_id not in courses:
            courses[course_id] = {
                "title": e.title,
                "department": e.school,
                "evaluations": [],
                "quality_sum": 0.0,
                "quality_count": 0,
            }
        courses[course_id]["evaluations"].append(row)
        if quality is not None:
            courses[course_id]["quality_sum"] += quality
            courses[course_id]["quality_count"] += 1

        # --- professor bucket ---
        if instructor and instructor != "—":
            if instructor not in professors:
                professors[instructor] = {
                    "courses_taught": [],
                    "evaluations": [],
                    "quality_sum": 0.0,
                    "quality_count": 0,
                }
            prof = professors[instructor]
            prof["evaluations"].append({**row, "course": course_id})
            if course_id not in prof["courses_taught"]:
                prof["courses_taught"].append(course_id)
            if quality is not None:
                prof["quality_sum"] += quality
                prof["quality_count"] += 1

        # --- department totals ---
        dept = e.school.strip() or "Unknown"
        if dept not in dept_totals:
            dept_totals[dept] = {"quality_sum": 0.0, "quality_count": 0, "total_evals": 0}
        dept_totals[dept]["total_evals"] += 1
        if quality is not None:
            dept_totals[dept]["quality_sum"] += quality
            dept_totals[dept]["quality_count"] += 1

    aggregate: dict = {}

    for cid, data in courses.items():
        count = data.pop("quality_count")
        qsum = data.pop("quality_sum")
        data["avg_overall_quality"] = round(qsum / count, 2) if count else None
        data["total_evaluations"] = len(data["evaluations"])
        aggregate[cid] = data

    for name, data in professors.items():
        count = data.pop("quality_count")
        qsum = data.pop("quality_sum")
        data["avg_overall_quality"] = round(qsum / count, 2) if count else None
        data["total_evaluations"] = len(data["evaluations"])
        aggregate[name] = data

    dept_stats = {}
    for dept, d in dept_totals.items():
        dept_stats[dept] = {
            "avg_overall_quality": round(d["quality_sum"] / d["quality_count"], 2) if d["quality_count"] else None,
            "total_evaluations": d["total_evals"],
        }
    aggregate["departmentStatistics"] = dept_stats

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

        texts = [(await cells.nth(j).text_content() or "").strip() for j in range(cell_count)]

        link_el = row.locator("a").first
        detail_url = ""
        if await link_el.count() > 0:
            href = await link_el.get_attribute("href") or ""
            detail_url = href if href.startswith("http") else ("https://www.scu.edu" + href if href else "")

        evals.append(CourseEval(
            term=texts[0] if len(texts) > 0 else "",
            course=texts[1] if len(texts) > 1 else "",
            title=texts[2] if len(texts) > 2 else "",
            instructor=texts[3] if len(texts) > 3 else "",
            school=texts[4] if len(texts) > 4 else "",
            section=texts[5] if len(texts) > 5 else "",
            enrolled=texts[6] if len(texts) > 6 else "",
            responses=texts[7] if len(texts) > 7 else "",
            response_rate=texts[8] if len(texts) > 8 else "",
            overall_quality=texts[9] if len(texts) > 9 else "",
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

        if page_num == 10:
            break

        next_btn = page.locator(
            "a:has-text('Next'), a:has-text('>'), [aria-label='Next page'], "
            ".pagination .next:not(.disabled) a"
        ).first
        if await next_btn.count() == 0 or not await next_btn.is_enabled():
            break

        await next_btn.click()
        await page.wait_for_load_state("networkidle")

    return all_evals, False


async def scrape_department(page: Page, dept: str) -> list[CourseEval]:
    """
    Scrape all evals for a department.
    If the 500-result cap is hit, subdivide by first digit, then second digit if needed.
    e.g. AMTH -> AMTH 8 (still capped) -> AMTH 80, AMTH 81 ... AMTH 89
    """
    url = build_search_url(query=dept)
    evals, hit_cap = await scrape_search(page, url, dept)
    if not hit_cap:
        return evals

    print(f"  [{dept}] Hit cap — subdividing by first digit...")
    all_evals: list[CourseEval] = []
    for d1 in "0123456789":
        query1 = f"{dept} {d1}"
        sub_evals, sub_hit_cap = await scrape_search(page, build_search_url(query=query1), query1)

        if not sub_hit_cap:
            all_evals.extend(sub_evals)
            continue

        # Still capped — go one digit deeper
        print(f"  [{query1}] Still hit cap — subdividing by second digit...")
        for d2 in "0123456789":
            query2 = f"{dept} {d1}{d2}"
            sub2_evals, sub2_hit_cap = await scrape_search(page, build_search_url(query=query2), query2)
            all_evals.extend(sub2_evals)
            if sub2_hit_cap:
                print(f"  WARNING: [{query2}] still hit the cap — some results may be missing.")

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


def save_aggregate(aggregate: dict, output: str) -> None:
    with open(output, "w") as f:
        json.dump(aggregate, f, indent=2)
    courses_count = sum(1 for k in aggregate if re.match(r"^[A-Z]+[0-9]+[A-Z]*$", k))
    profs_count = sum(1 for k in aggregate if k != "departmentStatistics" and not re.match(r"^[A-Z]+[0-9]+[A-Z]*$", k))
    print(f"  Saved: {courses_count} courses, {profs_count} professors, "
          f"{len(aggregate.get('departmentStatistics', {}))} departments  →  {output}")


async def dept_worker(
    browser,
    cookies: list,
    dept: str,
    semaphore: asyncio.Semaphore,
    save_lock: asyncio.Lock,
    existing: dict,
    output: str,
    completed: list,
    total: int,
) -> None:
    async with semaphore:
        ctx = await browser.new_context()
        await ctx.add_cookies(cookies)
        page = await ctx.new_page()
        try:
            print(f"\n[{len(completed) + 1}/{total}] Starting {dept}...")
            dept_evals = await scrape_department(page, dept)
            print(f"  {dept}: {len(dept_evals)} total rows — done.")

            if dept_evals:
                dept_aggregate = build_aggregate(dept_evals)
                async with save_lock:
                    merge_aggregate(existing, dept_aggregate)
                    save_aggregate(existing, output)
        finally:
            completed.append(dept)
            await ctx.close()


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
        done_depts = set(existing.get("departmentStatistics", {}).keys())
        print(f"Resuming — {len(done_depts)} departments already scraped.")

    remaining = [d for d in SCU_DEPARTMENTS if d not in done_depts]
    if not remaining:
        print("All departments already scraped.")
        return

    print(f"{len(remaining)} departments to scrape with {workers} parallel workers.\n")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=headless)

        # Auth once in a single context, then copy cookies to all workers
        auth_ctx = await browser.new_context()
        auth_page = await auth_ctx.new_page()
        print("Authenticating...")
        await auth_page.goto(BASE_URL)
        if "idp" in auth_page.url or "ssp" in auth_page.url or "login" in auth_page.url.lower():
            await shibboleth_login(auth_page, username, password)
        cookies = await auth_ctx.cookies()
        await auth_ctx.close()
        print(f"Auth complete. Launching {workers} workers...\n")

        semaphore = asyncio.Semaphore(workers)
        save_lock = asyncio.Lock()
        completed: list = []

        tasks = [
            dept_worker(browser, cookies, dept, semaphore, save_lock, existing, output, completed, len(remaining))
            for dept in remaining
        ]
        await asyncio.gather(*tasks)
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
    parser.add_argument("--username", default=os.environ.get("SCU_USERNAME", ""))
    parser.add_argument("--password", default=os.environ.get("SCU_PASSWORD", ""))
    args = parser.parse_args()

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
