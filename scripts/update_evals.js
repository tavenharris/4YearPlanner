const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get file path from command line arguments, default to the existing file if none provided
const inputFileArg = process.argv[2] || 'aggregate_evals.json';
const DATA_FILE = path.resolve(process.cwd(), inputFileArg);

if (!fs.existsSync(DATA_FILE)) {
  console.error(`Error: File not found at ${DATA_FILE}`);
  console.log("Usage: node scripts/update_evals.js <path-to-new-evals-json>");
  process.exit(1);
}

async function updateData() {
  console.log(`Reading updated JSON data from ${DATA_FILE}...`);
  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  const data = JSON.parse(rawData);

  const courses = [];
  const professors = [];
  const departmentStats = [];

  let skippedInternal = 0;
  let skippedNoData = 0;

  console.log('Categorizing new data...');
  for (const key of Object.keys(data)) {
    // Skip internal tracking keys (e.g. _completedDepartments)
    if (key.startsWith('_')) {
      skippedInternal++;
      continue;
    }

    if (key === 'departmentStatistics') {
      departmentStats.push({ id: 'all_departments', data: data[key] });
    } else if (/^[A-Z]+[0-9]+[A-Z]*$/.test(key)) {
      // Skip courses where no PDF data was ever pulled (all totals are zero)
      if ((data[key].qualityCount ?? 0) === 0) {
        skippedNoData++;
        continue;
      }
      courses.push({ id: key, data: data[key] });
    } else {
      // Skip professors where no PDF data was ever pulled
      if ((data[key].overall?.qualityCount ?? 0) === 0) {
        skippedNoData++;
        continue;
      }
      professors.push({ id: key, data: data[key] });
    }
  }

  console.log(`Found ${courses.length} courses, ${professors.length} professors, and ${departmentStats.length} department stats to process.`);
  if (skippedInternal) console.log(`Skipped ${skippedInternal} internal key(s).`);
  if (skippedNoData) console.log(`Skipped ${skippedNoData} entries with no PDF data (qualityCount = 0).`);

  // Using .upsert() is key here. It inserts new rows and OVERWRITES existing rows
  // based on the primary key ('id').
  async function batchUpsert(table, items) {
    if (items.length === 0) return;
    const BATCH_SIZE = 500;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const chunk = items.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from(table).upsert(chunk);
      if (error) {
        console.error(`Error upserting batch into ${table}:`, error);
      } else {
        console.log(`Upserted ${chunk.length} items into ${table} (Progress: ${Math.min(i + BATCH_SIZE, items.length)}/${items.length})`);
      }
    }
  }

  await batchUpsert('department_statistics', departmentStats);
  await batchUpsert('courses', courses);
  await batchUpsert('professors', professors);

  console.log('✅ Update complete! Your Supabase database is now perfectly in sync with the new evaluations data.');
}

updateData().catch(console.error);
