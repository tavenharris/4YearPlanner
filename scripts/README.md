# Supabase Data Scripts

This directory contains utility scripts for populating and updating your Supabase database with course evaluations and major requirements.

## `upload_to_supabase.js` (The Initial Seeder)

**Purpose:** This is your primary "initialization" script. It is designed to be run when you are first setting up the project or if you ever need to completely re-seed your database from scratch.

**What it does:**
1. **Evaluations:** It reads the `aggregate_evals.json` file in the root directory and bulk upserts all the data into the `courses`, `professors`, and `department_statistics` tables.
2. **Requirements:** It reads the `data/csci_requirements.json` file and uploads the major requirements into the `majors` table.

**How to run it:**
```bash
node scripts/upload_to_supabase.js
```

---

## `update_evals.js` (The Semester Updater)

**Purpose:** This script is specifically for updating your database when a new batch of course evaluation data comes out (e.g., at the end of a new semester).

**What it does:**
1. It focuses *only* on the evaluations data (`courses`, `professors`, `department_statistics`). It intentionally ignores the `majors` table so you don't accidentally overwrite manual changes to degree requirements.
2. It uses an "upsert" (update/insert) mechanism. If a course or professor already exists in the database, their stats are seamlessly overwritten with the new data. If a new course/professor appears in the file, they are added as a new row.
3. It accepts a command-line argument, allowing you to point it at any JSON file on your computer without having to overwrite the `aggregate_evals.json` file in your project root.

**How to run it:**

REMINDER: You will need a .json file containing the new evaluations data. It need to be called `aggregate_evals.json`

*Option 1: Update using the default file in the project root:*
```bash
node scripts/update_evals.js
```

*Option 2: Update using a newly downloaded file from anywhere on your computer:*
```bash
node scripts/update_evals.js /path/to/your/downloads/new_evals_Fall_2024.json
```
