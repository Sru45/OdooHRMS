import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployees, createEmployee } from '../services/employeeService';
import type { Employee } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { X, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getEmployees();
      setEmployees(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleEmployeeAdded = (newEmp: Employee) => {
    setEmployees(prev => [...prev, newEmp]);
  };

  const departments = useMemo(() => {
    const deps = new Set(employees.map(e => e.department));
    return Array.from(deps).filter(Boolean);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e => 
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
      );
    }
    if (departmentFilter) {
      result = result.filter(e => e.department === departmentFilter);
    }
    return result;
  }, [search, departmentFilter, employees]);

  if (isLoading) {
    return <div className="text-white text-center py-10 animate-pulse">Loading employees...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Employees</h1>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-10 px-4 bg-accent-600 hover:bg-accent-500 active:bg-accent-700 text-white font-medium text-sm rounded-lg flex items-center gap-2 transition-colors mr-2"
            >
              <Plus size={16} />
              Add Employee
            </button>
          )}
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="input-base w-44 text-sm"
          >
            <option value="">All departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative w-64">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-base pl-10 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left py-3 px-4">Employee</th>
              <th className="text-left py-3 px-4">Login ID</th>
              <th className="text-left py-3 px-4">Department</th>
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-center py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Email</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => {
              // Mock status for now since attendance is not loaded here
              const statusColor = 'bg-status-green';

              return (
                <tr
                  key={emp.id}
                  className="table-row cursor-pointer"
                  onClick={() => navigate(`/employees/${emp.id}`)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-700 flex items-center justify-center text-xs font-medium text-surface-300 border border-surface-600 shrink-0">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div className="font-medium text-surface-200">
                        {emp.firstName} {emp.lastName}
                        {emp.role === 'admin' && (
                          <span className="ml-2 badge bg-accent-600/15 text-accent-400 border border-accent-600/20 text-[10px]">Admin</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-surface-400 font-mono text-xs">{emp.loginId}</td>
                  <td className="py-3 px-4 text-surface-400">{emp.department}</td>
                  <td className="py-3 px-4 text-surface-400">{emp.title}</td>
                  <td className="py-3 px-4 text-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusColor} mx-auto`} />
                  </td>
                  <td className="py-3 px-4 text-surface-400 text-xs">{emp.email}</td>
                </tr>
              );
            })}
            {filteredEmployees.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-surface-500">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <AddEmployeeModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleEmployeeAdded}
        />
      )}
    </div>
  );
}

function AddEmployeeModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (emp: Employee) => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: 'Engineering',
    title: '',
    role: 'employee' as 'employee' | 'admin',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }
    
    const newEmpData: any = {
      ...formData,
      status: 'active',
      dateOfJoining: new Date().toISOString().split('T')[0],
      loginId: formData.email.split('@')[0]
    };

    const res = await createEmployee(newEmpData);
    setIsSubmitting(false);

    if (res.success && res.employee) {
      toast.success(`Employee added successfully!`, { duration: 5000 });
      onSuccess(res.employee);
      onClose();
    } else {
      toast.error(res.error || 'Failed to add employee');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface-800 border border-surface-600 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-surface-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Add New Employee</h2>
          <button onClick={onClose} className="p-2 text-surface-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">First Name</label>
              <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="input-base w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Last Name</label>
              <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="input-base w-full" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-base w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Department</label>
              <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="input-base w-full">
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Product">Product</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Management">Management</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Job Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-base w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Role</label>
              <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="input-base w-full">
                <option value="employee">Employee</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Initial Password</label>
              <input required type="text" minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="input-base w-full" placeholder="e.g. secure123" />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-surface-700">
            <button type="button" onClick={onClose} className="btn-secondary h-10 px-5">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary h-10 px-5">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
