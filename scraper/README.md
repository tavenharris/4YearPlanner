# SCU Course Evaluations Scraper

Scrapes course evaluation data from [scu.edu/apps/evaluations](https://www.scu.edu/apps/evaluations/) and saves it as `aggregate_evals.json` in the project root, ready to upload to Supabase via `scripts/update_evals.js`.

## Setup

```bash
pip install -r scraper/requirements.txt
playwright install chromium
```

Add your SCU credentials to `.env.local` in the project root:

```
SCU_USERNAME="your@scu.edu"
SCU_PASSWORD="yourpassword"
```

---

## Usage

```bash
python scraper/course_eval_scrape.py [options]
```

### Scrape everything (recommended)

```bash
python scraper/course_eval_scrape.py
```

Loops through all 54 SCU departments one at a time, scraping up to 500 results per search. Saves progress after every department so you can safely stop and resume.

### Scrape a single department or course

```bash
python scraper/course_eval_scrape.py --query "CSCI"
python scraper/course_eval_scrape.py --query "Math 11"
```

---

## Arguments

| Argument | Default | Description |
|---|---|---|
| `--query` | *(empty)* | Search term. If omitted, scrapes all departments automatically. Examples: `"CSCI"`, `"Math 11"`, `"ENGL"`. |
| `--output` | `aggregate_evals.json` | Path to the output JSON file. Defaults to the project root where the upload scripts expect it. |
| `--workers` | `4` | Number of departments to scrape in parallel. Higher is faster but increases the chance of being rate-limited by the site. Start at `4`, drop to `2` if you see errors. |
| `--headless` | off | Run the browser in headless mode (no visible window). Only works reliably if your SCU session is already trusted and Duo MFA doesn't prompt. Without this flag the browser window is always visible. |
| `--no-resume` | off | Ignore any existing `aggregate_evals.json` and start fresh. By default the scraper skips departments that are already in the output file so you can stop and continue a run. |
| `--username` | `$SCU_USERNAME` | Your SCU username. Defaults to the `SCU_USERNAME` environment variable from `.env.local`. |
| `--password` | `$SCU_PASSWORD` | Your SCU password. Defaults to the `SCU_PASSWORD` environment variable from `.env.local`. |

---

## Authentication

The site uses SCU's Shibboleth SSO with Duo MFA.

1. The script opens a browser window and fills in your credentials automatically.
2. A Duo push is sent to your phone — **approve it**.
3. The "Is this your device?" screen is clicked automatically.
4. All parallel worker tabs reuse the same session cookies, so you only authenticate once per run.

---

## How the site limit is handled

The SCU evaluations site caps every search at **500 results (10 pages)**. To get complete data the scraper uses this strategy:

1. Search by department code (e.g. `CSCI`) — up to 500 results.
2. If the cap is hit, automatically subdivide by first digit: `CSCI 1`, `CSCI 2` ... `CSCI 9`.
3. If a digit-level search still hits the cap, subdivide by two digits: `CSCI 10`, `CSCI 11` ... `CSCI 19`.

---

## Uploading to Supabase

Once the scrape finishes, upload the data:

```bash
node scripts/update_evals.js
```

This uses `.upsert()` — it adds new records and updates existing ones. It will **never delete** data already in your database.
