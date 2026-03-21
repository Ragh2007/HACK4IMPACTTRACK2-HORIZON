import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

let supabase = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn("Supabase credentials missing. Database logging disabled.");
}

export const logQuery = async (queryText, intent, crop, location, lang, responseText) => {
  if (!supabase) return;
  try {
    await supabase
      .from('user_queries')
      .insert([
        { query_text: queryText, intent, crop, location, language: lang, response_text: responseText }
      ]);
  } catch (err) {
    console.error("Failed to log query to Supabase:", err);
  }
};
