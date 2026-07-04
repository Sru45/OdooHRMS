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

  const rawEmp = employees[0];
  const nameParts = (rawEmp.name || '').split(' ');
  const employee = {
    ...rawEmp,
    firstName: nameParts[0] || 'Unknown',
    lastName: nameParts.slice(1).join(' ') || ''
  } as Employee;

  // Check password against the database (or allow fallback if missing)
  if (rawEmp.password) {
    if (rawEmp.password !== password) {
      return { success: false, error: 'Invalid password. Please try again.' };
    }
  } else {
    // Fallback for legacy demo users before password column was fully populated
    if (password !== 'password123' && password.length < 6) {
      return { success: false, error: 'Invalid password. Please try again.' };
    }
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
  role?: 'admin' | 'employee';
}): Promise<{ success: boolean; employee?: Employee; loginId?: string; tempPassword?: string; error?: string }> {
  
  // Check if email exists
  const { data: existing } = await supabase.from('employees').select('id').eq('email', data.email);
  if (existing && existing.length > 0) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  // Generate simple IDs (in a real app, use UUIDs)
  const companyId = 'company-' + Date.now();
  const empId = 'emp-' + Date.now();

  // Insert company first only if admin
  if (data.role !== 'employee') {
    const { data: company, error: companyError } = await supabase.from('companies').insert([{
      id: companyId,
      name: data.companyName,
      subscriptionPlan: 'Enterprise',
      employeeCount: 1,
      createdAt: new Date().toISOString()
    }]).select().single();

    if (companyError || !company) {
      console.error('Company creation error:', companyError);
      return { success: false, error: 'Failed to create company.' };
    }
  }

  // Insert employee
  const { data: employee, error: empError } = await supabase.from('employees').insert([{
    id: empId,
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    role: data.role || 'admin',
    department: data.role === 'employee' ? 'General' : 'Management',
    title: data.role === 'employee' ? 'Employee' : 'CEO',
    joinDate: new Date().toISOString().split('T')[0],
    dateOfJoining: new Date().toISOString().split('T')[0],
    status: 'active',
    password: data.password
  }]).select().single();

  if (empError || !employee) {
    console.error('Employee creation error:', empError);
    return { success: false, error: 'Failed to create admin user.' };
  }

  return {
    success: true,
    loginId: employee.id,
    tempPassword: data.password,
  };
}

export async function getCurrentUser(userId: string): Promise<AuthUser | null> {
  const { data: rawEmp } = await supabase.from('employees').select('*').eq('id', userId).single();
  if (!rawEmp) return null;

  const nameParts = (rawEmp.name || '').split(' ');
  const employee = {
    ...rawEmp,
    firstName: nameParts[0] || 'Unknown',
    lastName: nameParts.slice(1).join(' ') || ''
  } as Employee;

  const { data: companies } = await supabase.from('companies').select('*').limit(1);
  const company = companies?.[0];
  if (!company) return null;

  return {
    employee,
    company,
    isAdmin: employee.role === 'admin',
  };
}

export async function resetPassword(email: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  // Find employee by email
  const { data: employees, error: searchError } = await supabase
    .from('employees')
    .select('id')
    .eq('email', email);

  if (searchError || !employees || employees.length === 0) {
    return { success: false, error: 'No account found with this email.' };
  }

  const employeeId = employees[0].id;

  // Update password
  const { error: updateError } = await supabase
    .from('employees')
    .update({ password: newPassword })
    .eq('id', employeeId);

  if (updateError) {
    console.error('Password reset error:', updateError);
    return { success: false, error: 'Failed to reset password.' };
  }

  return { success: true };
}
