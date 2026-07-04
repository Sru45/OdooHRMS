import { supabase } from '../lib/supabase';
import type { AttendanceRecord } from '../types';

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase.from('attendance').select('*');
  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
  return data as AttendanceRecord[];
}

export async function getAttendanceByEmployee(employeeId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase.from('attendance').select('*').eq('employeeId', employeeId);
  if (error) {
    console.error('Error fetching attendance by employee:', error);
    return [];
  }
  return data as AttendanceRecord[];
}

export async function getAttendanceByDateRange(startDate: string, endDate: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase.from('attendance')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);
  if (error) {
    console.error('Error fetching attendance by date range:', error);
    return [];
  }
  return data as AttendanceRecord[];
}

export async function checkIn(employeeId: string): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const id = 'att-' + Date.now();
  const { data, error } = await supabase.from('attendance').insert([{
    id,
    employeeId,
    date: today,
    checkIn: now,
    status: 'present'
  }]).select().single();
  
  if (error) {
    console.error('Error during checkIn:', error);
    return null;
  }
  return data as AttendanceRecord;
}

export async function checkOut(employeeId: string): Promise<AttendanceRecord | null> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Find today's record
  const { data: records } = await supabase.from('attendance')
    .select('*')
    .eq('employeeId', employeeId)
    .eq('date', today);
    
  if (!records || records.length === 0) return null;
  
  const record = records[0];
  const { data, error } = await supabase.from('attendance')
    .update({ checkOut: now, workHours: 8 }) // Mock 8 hours
    .eq('id', record.id).select().single();
    
  if (error) return null;
  return data as AttendanceRecord;
}
