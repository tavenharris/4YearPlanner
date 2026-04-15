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

const DATA_FILE = path.join(__dirname, '..', 'aggregate_evals.json');
const MAJORS_FILE = path.join(__dirname, '..', 'data', 'csci_requirements.json');

async function uploadData() {
  console.log('Reading aggregate_evals JSON file...');
  let data = {};
  if (fs.existsSync(DATA_FILE)) {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    data = JSON.parse(rawData);
  } else {
    console.warn(`File not found: ${DATA_FILE}. Skipping aggregate evaluations upload.`);
  }

  const courses = [];
  const professors = [];
  const departmentStats = [];

  console.log('Categorizing data...');
  for (const key of Object.keys(data)) {
    if (key === 'departmentStatistics') {
      departmentStats.push({ id: 'all_departments', data: data[key] });
    } else if (/^[A-Z]+[0-9]+[A-Z]*$/.test(key)) {
      courses.push({ id: key, data: data[key] });
    } else {
      professors.push({ id: key, data: data[key] });
    }
  }

  console.log(`Found ${courses.length} courses, ${professors.length} professors, ${departmentStats.length} department stats.`);

  async function batchInsert(table, items) {
    if (items.length === 0) return;
    const BATCH_SIZE = 500;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const chunk = items.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from(table).upsert(chunk);
      if (error) {
        console.error(`Error inserting batch into ${table}:`, error);
      } else {
        console.log(`Inserted ${chunk.length} items into ${table} (Progress: ${Math.min(i + BATCH_SIZE, items.length)}/${items.length})`);
      }
    }
  }

  await batchInsert('department_statistics', departmentStats);
  await batchInsert('courses', courses);
  await batchInsert('professors', professors);

  console.log('Reading majors JSON file...');
  if (fs.existsSync(MAJORS_FILE)) {
    const rawMajorsData = fs.readFileSync(MAJORS_FILE, 'utf-8');
    const majorData = JSON.parse(rawMajorsData);
    
    const majorRecord = {
      id: majorData.id,
      name: majorData.name,
      requirements: {
        major_requirements: majorData.major_requirements,
        core_requirements: majorData.core_requirements
      }
    };
    
    console.log(`Uploading major: ${majorRecord.name}`);
    const { error } = await supabase.from('majors').upsert([majorRecord]);
    if (error) {
      console.error(`Error inserting major into majors:`, error);
    } else {
      console.log(`Successfully uploaded major: ${majorRecord.id}`);
    }
  } else {
    console.warn(`File not found: ${MAJORS_FILE}. Skipping majors upload.`);
  }

  console.log('Upload complete!');
}

uploadData().catch(console.error);
