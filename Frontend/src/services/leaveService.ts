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

// Helper to compute working days between two dates
function calculateDaysRequested(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return 0;
  let days = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) days++;
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// Map from DB row to LeaveRequest
function mapLeaveRequest(row: any): LeaveRequest {
  return {
    id: row.id,
    employeeId: row.employeeId,
    leaveType: row.type || 'paid-time-off', // map type -> leaveType
    startDate: row.startDate,
    endDate: row.endDate,
    daysRequested: calculateDaysRequested(row.startDate, row.endDate),
    status: row.status,
    remarks: row.reason, // map reason -> remarks
    adminComment: row.approvedBy, // map approvedBy -> adminComment
    createdAt: row.startDate // fallback
  };
}

export async function getLeaveRequests(employeeId?: string): Promise<LeaveRequest[]> {
  let query = supabase.from('leave_requests').select('*');
  if (employeeId) {
    query = query.eq('employeeId', employeeId);
  }
  const { data, error } = await query;
  if (error) return [];
  return (data as any[]).map(mapLeaveRequest);
}

export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest | null> {
  const id = 'leave-' + Date.now();
  
  // Map LeaveRequest to DB row
  const dbRow = {
    id,
    employeeId: request.employeeId,
    startDate: request.startDate,
    endDate: request.endDate,
    type: request.leaveType, // map leaveType -> type
    status: 'pending',
    reason: request.remarks, // map remarks -> reason
    // attachmentName and createdAt are dropped since they don't exist in the DB schema
  };

  const { data, error } = await supabase.from('leave_requests')
    .insert([dbRow])
    .select().single();
    
  if (error) {
    console.error('Error creating leave request:', error);
    return null;
  }
  return mapLeaveRequest(data);
}

export async function updateLeaveRequestStatus(requestId: string, status: 'approved' | 'rejected', adminComment?: string): Promise<LeaveRequest | null> {
  const { data, error } = await supabase.from('leave_requests')
    .update({ status, approvedBy: adminComment }) // map adminComment -> approvedBy
    .eq('id', requestId).select().single();
  if (error) return null;
  return mapLeaveRequest(data);
}
