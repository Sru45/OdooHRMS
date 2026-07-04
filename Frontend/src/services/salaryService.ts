import { supabase } from '../lib/supabase';
import type { SalaryStructure } from '../types';

export async function getSalaryStructures(): Promise<SalaryStructure[]> {
  const { data, error } = await supabase.from('salaries').select('*');
  if (error) return [];
  return data as SalaryStructure[];
}

export async function getSalaryStructure(employeeId: string): Promise<SalaryStructure | undefined> {
  const { data, error } = await supabase.from('salaries')
    .select('*')
    .eq('employeeId', employeeId)
    .single();
  if (error) return undefined;
  return data as SalaryStructure;
}

export async function calculateNetSalary(structure: SalaryStructure): Promise<number> {
  const totalAllowances = structure.allowances.reduce((sum, a) => sum + a.amount, 0);
  const totalDeductions = structure.deductions.reduce((sum, d) => sum + d.amount, 0);
  return structure.baseSalary + totalAllowances - totalDeductions;
}

export async function updateSalaryStructure(structure: SalaryStructure): Promise<SalaryStructure | null> {
  const { data, error } = await supabase.from('salaries')
    .update(structure)
    .eq('employeeId', structure.employeeId).select().single();
  if (error) return null;
  return data as SalaryStructure;
}
