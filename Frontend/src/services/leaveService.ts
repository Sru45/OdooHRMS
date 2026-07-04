import { supabase } from '../lib/supabase';
import type { LeaveRequest, LeaveType, LeaveAllocation, LeaveBalance } from '../types';

export async function getLeaveAllocations(employeeId: string, year: number): Promise<LeaveAllocation[]> {
  const { data, error } = await supabase.from('leave_allocations')
    .select('*')
    .eq('employeeId', employeeId)
    .eq('year', year);
  if (error) return [];
  return data as LeaveAllocation[];
}

export async function getLeaveBalance(employeeId: string, leaveType: LeaveType, year: number): Promise<LeaveBalance> {
  const { data, error } = await supabase.from('leave_allocations')
    .select('*')
    .eq('employeeId', employeeId)
    .eq('year', year)
    .eq('leaveType', leaveType)
    .single();
    
  if (error || !data) {
    return { allocated: 0, used: 0, available: 0 };
  }
  
  return {
    allocated: data.daysAllocated,
    used: data.daysUsed,
    available: data.daysAllocated - data.daysUsed
  };
}

export async function getLeaveRequests(employeeId?: string): Promise<LeaveRequest[]> {
  let query = supabase.from('leave_requests').select('*');
  if (employeeId) {
    query = query.eq('employeeId', employeeId);
  }
  const { data, error } = await query;
  if (error) return [];
  return data as LeaveRequest[];
}

export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest | null> {
  const { data, error } = await supabase.from('leave_requests')
    .insert([{ ...request, status: 'pending' }])
    .select().single();
  if (error) return null;
  return data as LeaveRequest;
}

export async function updateLeaveRequestStatus(requestId: string, status: 'approved' | 'rejected', approvedBy?: string): Promise<LeaveRequest | null> {
  const { data, error } = await supabase.from('leave_requests')
    .update({ status, approvedBy })
    .eq('id', requestId).select().single();
  if (error) return null;
  return data as LeaveRequest;
}
