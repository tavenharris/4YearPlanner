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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing class ID' });
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, data')
      .eq('id', id.toUpperCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Class not found' });
      }
      throw error;
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error(`Error fetching class ${id}:`, error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
