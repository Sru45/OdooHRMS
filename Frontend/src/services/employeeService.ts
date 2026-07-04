import { supabase } from '../lib/supabase';
import type { Employee } from '../types';

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from('employees').select('*');
  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data as Employee[];
}

export async function getEmployee(id: string): Promise<Employee | undefined> {
  const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
  if (error) {
    console.error('Error fetching employee:', error);
    return undefined;
  }
  return data as Employee;
}

export async function createEmployee(
  employeeData: Omit<Employee, 'id'>
): Promise<{ success: boolean; employee?: Employee; tempPassword?: string; error?: string }> {
  const { data, error } = await supabase.from('employees').insert([employeeData]).select().single();
  if (error) {
    console.error('Error creating employee:', error);
    return { success: false, error: 'Failed to create employee' };
  }
  return { success: true, employee: data as Employee, tempPassword: 'password123' };
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
  const { data, error } = await supabase.from('employees').update(updates).eq('id', id).select().single();
  if (error) {
    console.error('Error updating employee:', error);
    return null;
  }
  return data as Employee;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) {
    console.error('Error deleting employee:', error);
    return false;
  }
  return true;
}
