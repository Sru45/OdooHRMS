import { supabase } from '../lib/supabase';
import { 
  companies, 
  employees, 
  attendanceRecords, 
  salaryStructures, 
  leaveAllocations, 
  leaveRequests 
} from '../data/mockData';

export async function seedSupabase() {
  console.log('Seeding data to Supabase...');
  try {
    // 1. Companies
    console.log('Seeding companies...');
    const { error: companyError } = await supabase.from('companies').upsert(companies);
    if (companyError) throw companyError;

    // 2. Employees
    console.log('Seeding employees...');
    // We map password out since we might not want it in raw text, but for mock it's fine
    const emps = employees.map(e => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      email: e.email,
      role: e.role,
      department: e.department,
      title: e.title,
      joinDate: e.dateOfJoining,
      status: 'active'
    }));
    const { error: empError } = await supabase.from('employees').upsert(emps);
    if (empError) throw empError;

    // 3. Attendance
    console.log('Seeding attendance...');
    const { error: attError } = await supabase.from('attendance').upsert(attendanceRecords.map(a => ({
      id: a.id,
      employeeId: a.employeeId,
      date: a.date,
      checkIn: a.checkIn,
      checkOut: a.checkOut,
      status: a.status === 'leave' ? 'absent' : a.status,
      workHours: a.workHours
    })));
    if (attError) throw attError;

    // 4. Leave Allocations
    console.log('Seeding leave allocations...');
    const { error: allocError } = await supabase.from('leave_allocations').upsert(leaveAllocations.map(a => ({
      id: a.id,
      employeeId: a.employeeId,
      leaveType: a.leaveType,
      daysAllocated: a.daysAllocated,
      daysUsed: a.daysUsed,
      year: a.year
    })));
    if (allocError) throw allocError;

    // 5. Leave Requests
    console.log('Seeding leave requests...');
    const { error: reqError } = await supabase.from('leave_requests').upsert(leaveRequests.map(r => ({
      id: r.id,
      employeeId: r.employeeId,
      startDate: r.startDate,
      endDate: r.endDate,
      leaveType: r.leaveType || 'paid-time-off',
      status: r.status,
      remarks: r.remarks || '',
      adminComment: r.adminComment || '',
      daysRequested: 1,
      createdAt: new Date().toISOString()
    })));
    if (reqError) throw reqError;

    // 6. Salaries
    console.log('Seeding salaries...');
    const { error: salError } = await supabase.from('salaries').upsert(salaryStructures.map(s => ({
      id: s.id || `sal-${s.employeeId}`,
      employeeId: s.employeeId,
      baseSalary: s.baseSalary,
      allowances: s.allowances || [],
      deductions: s.deductions || [],
      effectiveDate: s.effectiveDate || new Date().toISOString()
    })));
    if (salError) throw salError;

    console.log('Seeding complete!');
    return { success: true };
  } catch (err: any) {
    console.error('Seeding error:', err);
    return { success: false, error: err.message };
  }
}
