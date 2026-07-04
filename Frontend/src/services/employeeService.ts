import { supabase } from '../lib/supabase';
import type { Employee } from '../types';

export async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from('employees').select('*');
  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data.map((row: any) => {
    const nameParts = (row.name || '').split(' ');
    return {
      ...row,
      firstName: nameParts[0] || 'Unknown',
      lastName: nameParts.slice(1).join(' ') || ''
    };
  }) as Employee[];
}

export async function getEmployee(id: string): Promise<Employee | undefined> {
  const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
  if (error) {
    console.error('Error fetching employee:', error);
    return undefined;
  }
  const nameParts = (data.name || '').split(' ');
  return {
    ...data,
    firstName: nameParts[0] || 'Unknown',
    lastName: nameParts.slice(1).join(' ') || ''
  } as Employee;
}

export async function createEmployee(
  employeeData: Omit<Employee, 'id'>
): Promise<{ success: boolean; employee?: Employee; tempPassword?: string; error?: string }> {
  
  const payload: any = { ...employeeData };
  payload.name = `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
  payload.id = 'emp-' + Date.now();
  payload.companyId = '1';
  delete payload.firstName;
  delete payload.lastName;

  const { data, error } = await supabase.from('employees').insert([payload]).select().single();
  
  if (error) {
    console.error('Error creating employee:', error);
    return { success: false, error: 'Failed to create employee' };
  }
  
  const nameParts = (data.name || '').split(' ');
  const returnedEmployee = {
    ...data,
    firstName: nameParts[0] || 'Unknown',
    lastName: nameParts.slice(1).join(' ') || ''
  } as Employee;

  return { success: true, employee: returnedEmployee, tempPassword: payload.password };
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
  const payload: any = { ...updates };

  if (payload.firstName !== undefined || payload.lastName !== undefined) {
    const currentEmp = await getEmployee(id);
    const fName = payload.firstName !== undefined ? payload.firstName : currentEmp?.firstName;
    const lName = payload.lastName !== undefined ? payload.lastName : currentEmp?.lastName;
    payload.name = `${fName} ${lName}`.trim();
  }
  
  delete payload.firstName;
  delete payload.lastName;

  const { error } = await supabase.from('employees').update(payload).eq('id', id).select().single();
  if (error) {
    console.error('Error updating employee:', error);
    return null;
  }
  
  // Refetch to get the properly mapped firstName and lastName
  const updatedEmp = await getEmployee(id);
  return updatedEmp || null;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) {
    console.error('Error deleting employee:', error);
    return false;
  }
  return true;
}
