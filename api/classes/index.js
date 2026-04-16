const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

module.exports = async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id');

    if (error) throw error;

    const classes = data.map(course => course.id);
    return res.status(200).json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
