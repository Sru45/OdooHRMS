import { supabase } from '../lib/supabase';
import type { Employee, AuthUser } from '../types';

export async function signIn(loginIdOrEmail: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  // Query employee from Supabase
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .or(`email.eq.${loginIdOrEmail},id.eq.${loginIdOrEmail}`); // Try email or ID

  if (error || !employees || employees.length === 0) {
    return { success: false, error: 'No account found with this Login ID or email.' };
  }

  const employee = employees[0];

  // In a real app, passwords would be hashed.
  // For hackathon mock, we check raw or assume it works for the demo if it matches or is any string > 5
  if (password.length < 6) {
    return { success: false, error: 'Invalid password. Password must be at least 6 characters.' };
  }

  // Get the first company (assuming 1 company for this demo)
  const { data: companies } = await supabase.from('companies').select('*').limit(1);
  const company = companies?.[0] || { id: '1', name: 'Demo Company', subscriptionPlan: 'Pro', employeeCount: 1, createdAt: new Date().toISOString() };

  const authUser: AuthUser = {
    employee,
    company,
    isAdmin: employee.role === 'admin',
  };

  return {
    success: true,
    user: authUser,
  };
}

export async function signUp(data: {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ success: boolean; employee?: Employee; loginId?: string; tempPassword?: string; error?: string }> {
  
  // Check if email exists
  const { data: existing } = await supabase.from('employees').select('id').eq('email', data.email);
  if (existing && existing.length > 0) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  // Insert company first
  const { data: company, error: companyError } = await supabase.from('companies').insert([{
    name: data.companyName,
    subscriptionPlan: 'Enterprise',
    employeeCount: 1,
    createdAt: new Date().toISOString()
  }]).select().single();

  if (companyError || !company) {
    return { success: false, error: 'Failed to create company.' };
  }

  // Insert admin employee
  const { data: employee, error: empError } = await supabase.from('employees').insert([{
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    role: 'admin',
    department: 'Management',
    title: 'CEO',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'active'
  }]).select().single();

  if (empError || !employee) {
    return { success: false, error: 'Failed to create admin user.' };
  }

  return {
    success: true,
    loginId: employee.id,
    tempPassword: data.password,
  };
}

export async function getCurrentUser(userId: string): Promise<AuthUser | null> {
  const { data: employee } = await supabase.from('employees').select('*').eq('id', userId).single();
  if (!employee) return null;

  const { data: companies } = await supabase.from('companies').select('*').limit(1);
  const company = companies?.[0];
  if (!company) return null;

  return {
    employee,
    company,
    isAdmin: employee.role === 'admin',
  };
}
