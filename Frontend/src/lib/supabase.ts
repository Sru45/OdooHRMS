import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hfplfrnbubahtnayexjh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xahYWynD-qm4NMAsd6EiOQ_wGc_6BC3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
