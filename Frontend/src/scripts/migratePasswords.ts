import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hfplfrnbubahtnayexjh.supabase.co';
const supabaseAnonKey = 'sb_publishable_xahYWynD-qm4NMAsd6EiOQ_wGc_6BC3';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function migratePasswords() {
  console.log('Starting password migration...');
  
  // Get all employees
  const { data: employees, error: fetchError } = await supabase.from('employees').select('id, password');
  
  if (fetchError) {
    console.error('Failed to fetch employees:', fetchError);
    return { success: false, error: fetchError };
  }
  
  console.log(`Found ${employees.length} employees.`);
  
  let updatedCount = 0;
  for (const emp of employees) {
    // Only update if password is null or empty
    if (!emp.password) {
      const { error: updateError } = await supabase
        .from('employees')
        .update({ password: 'password123' })
        .eq('id', emp.id);
        
      if (updateError) {
        console.error(`Failed to update password for employee ${emp.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }
  
  console.log(`Migration complete. Updated ${updatedCount} employees with default password.`);
  return { success: true, updatedCount };
}

migratePasswords().then(console.log).catch(console.error);
