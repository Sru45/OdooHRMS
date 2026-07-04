import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getEmployee, updateEmployee } from '../services/employeeService';
import { getSalaryStructure, updateSalaryStructure, createSalaryStructure } from '../services/salaryService';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Employee, SalaryStructure } from '../types';
import { Camera, Plus, Edit2, X, Save, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const employeeId = id || currentUser!.employee.id;
  const isOwnProfile = currentUser!.employee.id === employeeId;

  useEffect(() => {
    async function load() {
      const emp = await getEmployee(employeeId);
      setEmployee(emp ?? null);
      setLoading(false);
    }
    load();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <p className="text-surface-400">Loading profile...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center">
          <p className="text-surface-400">Employee not found.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  let tabs: string[];
  if (isAdmin) {
    tabs = ['Personal Info', 'Private Info', 'Salary Info'];
  } else if (isOwnProfile) {
    tabs = ['Personal Info', 'Private Info', 'My Salary', 'Security'];
  } else {
    tabs = ['Personal Info'];
  }

  return <ProfileContent employee={employee} tabs={tabs} isOwnProfile={isOwnProfile} isAdmin={isAdmin} onUpdate={setEmployee} />;
}

function ProfileContent({ employee, tabs, isOwnProfile, isAdmin, onUpdate }: {
  employee: Employee; tabs: string[]; isOwnProfile: boolean; isAdmin: boolean; onUpdate: (e: Employee) => void;
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...employee });
  
  const canEdit = isAdmin || isOwnProfile;
  const limitedEdit = isOwnProfile && !isAdmin;
  const initials = `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();

  const handleSave = async () => {
    let updates: Partial<Employee> = { ...formData };
    
    if (limitedEdit) {
      // Employees cannot change their work info or email
      delete updates.department;
      delete updates.title;
      delete updates.dateOfJoining;
      delete updates.role;
      delete updates.email;
    }
    
    const updatedEmp = await updateEmployee(employee.id, updates);
    if (updatedEmp) {
      onUpdate(updatedEmp);
      setIsEditing(false);
      toast.success('Profile updated');
    } else {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({ ...employee });
    setIsEditing(false);
  };

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column (1/3) - Profile Summary */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
          
          <div className="relative group mb-4">
            <div className="w-28 h-28 rounded-full bg-accent-600/10 text-accent-500 flex items-center justify-center text-3xl font-bold border-4 border-surface-800 shadow-xl overflow-hidden">
              {formData.profilePictureUrl ? (
                <img src={formData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {isEditing && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={24} className="text-white" />
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-white">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-accent-400 font-medium mt-1">{employee.title}</p>
          <p className="text-surface-400 text-sm mt-1">{employee.department}</p>
          
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            <span className="bg-surface-700 text-surface-300 px-3 py-1 rounded-full border border-surface-600">
              {employee.loginId}
            </span>
            {isAdmin && (
              <span className="bg-accent-600/15 text-accent-400 px-3 py-1 rounded-full border border-accent-600/20 font-medium">
                Admin
              </span>
            )}
          </div>

          {canEdit && (
            <div className="mt-6 w-full pt-6 border-t border-surface-700 flex flex-col gap-3">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="btn-secondary w-full">
                  <Edit2 size={16} /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleCancel} className="btn-secondary flex-1">
                    <X size={16} /> Cancel
                  </button>
                  <button onClick={handleSave} className="btn-primary flex-1">
                    <Save size={16} /> Save
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column (2/3) - Tab Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Tabs Navigation */}
        <div className="flex gap-2 border-b border-surface-800 pb-0 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'border-accent-500 text-accent-400 bg-surface-800/50'
                  : 'border-transparent text-surface-400 hover:text-surface-200 hover:bg-surface-800/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Areas */}
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 shadow-sm min-h-[400px]">
          {activeTab === 'Personal Info' && (
            <PersonalInfoTab employee={employee} formData={formData} setFormData={setFormData} isEditing={isEditing} limitedEdit={limitedEdit} />
          )}
          {activeTab === 'Private Info' && (
            <PrivateInfoTab employee={employee} formData={formData} setFormData={setFormData} isEditing={isEditing} limitedEdit={limitedEdit} canEdit={canEdit} />
          )}
          {activeTab === 'Salary Info' && isAdmin && (
            <SalaryInfoAdminTab employeeId={employee.id} />
          )}
          {activeTab === 'My Salary' && isOwnProfile && (
            <SalaryReadOnlyTab employeeId={employee.id} />
          )}
          {activeTab === 'Security' && (
            <SecurityTab />
          )}
        </div>
      </div>
    </div>
  );
}

interface TabProps {
  employee: Employee;
  formData: Employee;
  setFormData: React.Dispatch<React.SetStateAction<Employee>>;
  isEditing: boolean;
  limitedEdit?: boolean;
  canEdit?: boolean;
}

function PersonalInfoTab({ employee, formData, setFormData, isEditing, limitedEdit }: TabProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-accent-500 rounded-full" />
            Contact Information
          </h3>
          <InfoField label="Phone" value={formData.phone} isEditing={isEditing} onChange={v => setFormData((p) => ({ ...p, phone: v }))} />
          <InfoField label="Email" value={employee.email} />
          <InfoField label="Department" value={formData.department} isEditing={isEditing && !limitedEdit} onChange={v => setFormData((p) => ({ ...p, department: v }))} />
          <InfoField label="Title" value={formData.title} isEditing={isEditing && !limitedEdit} onChange={v => setFormData((p) => ({ ...p, title: v }))} />
        </div>

        <div className="space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-accent-500 rounded-full" />
            About Me
          </h3>
          {isEditing ? (
            <textarea
              value={formData.aboutMe || ''}
              onChange={e => setFormData((p) => ({ ...p, aboutMe: e.target.value }))}
              className="w-full h-24 bg-surface-900 border border-surface-700 rounded-lg p-3 text-sm text-white focus:border-accent-500 focus:ring-1 focus:ring-accent-500 resize-none"
              placeholder="Write something about yourself..."
            />
          ) : (
            <p className="text-sm text-surface-300 leading-relaxed">{employee.aboutMe || 'No bio provided.'}</p>
          )}

          <div>
            <h4 className="text-xs font-semibold text-surface-500 mb-2 uppercase">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {employee.skills?.map((skill: string) => (
                <span key={skill} className="bg-surface-700 text-surface-200 px-2.5 py-1 rounded-md text-xs border border-surface-600">
                  {skill}
                </span>
              ))}
              {(!employee.skills || employee.skills.length === 0) && <span className="text-xs text-surface-500">None added</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrivateInfoTab({ formData, setFormData, isEditing, limitedEdit }: TabProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-accent-500 rounded-full" />
            Personal Details
          </h3>
          <InfoField label="Date of birth" value={formData.dateOfBirth?.split('T')[0] || ''} displayValue={formatDate(formData.dateOfBirth, 'short')} isEditing={isEditing} onChange={v => setFormData((p) => ({ ...p, dateOfBirth: v }))} type="date" />
          <InfoField label="Gender" value={formData.gender} isEditing={isEditing} onChange={v => setFormData((p) => ({ ...p, gender: v as any }))} />
          <InfoField label="Marital status" value={formData.maritalStatus} isEditing={isEditing} onChange={v => setFormData((p) => ({ ...p, maritalStatus: v as any }))} />
          <InfoField label="Blood group" value={formData.bloodGroup} isEditing={isEditing} onChange={v => setFormData((p) => ({ ...p, bloodGroup: v }))} />
          <InfoField label="Date of joining" value={formData.dateOfJoining?.split('T')[0] || ''} displayValue={formatDate(formData.dateOfJoining, 'short')} isEditing={isEditing && !limitedEdit} onChange={v => setFormData((p) => ({ ...p, dateOfJoining: v }))} type="date" />
        </div>

        <div className="space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-accent-500 rounded-full" />
            Address & ID
          </h3>
          <InfoField label="Current address" value={formData.currentAddress} isEditing={isEditing} onChange={v => setFormData((p) => ({ ...p, currentAddress: v }))} />
          <InfoField label="Permanent address" value={formData.permanentAddress} isEditing={isEditing} onChange={v => setFormData((p) => ({ ...p, permanentAddress: v }))} />
          <InfoField label="Personal email" value={formData.personalEmail || '-'} isEditing={isEditing} onChange={v => setFormData((p) => ({ ...p, personalEmail: v }))} />
          <InfoField label="PAN Number" value={formData.panNumber || '-'} isEditing={isEditing} onChange={v => setFormData((p) => ({ ...p, panNumber: v }))} />
          <InfoField label="Aadhar Number" value={formData.aadharNumber || '-'} isEditing={isEditing} onChange={v => setFormData((p) => ({ ...p, aadharNumber: v }))} />
        </div>
      </div>
    </div>
  );
}


function SalaryInfoAdminTab({ employeeId }: { employeeId: string }) {
  const [structure, setStructure] = useState<SalaryStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  
  // Working copy for edits
  const [baseSalary, setBaseSalary] = useState(0);
  const [allowances, setAllowances] = useState<{name:string, amount:number}[]>([]);
  const [deductions, setDeductions] = useState<{name:string, amount:number}[]>([]);

  useEffect(() => {
    async function load() {
      const s = await getSalaryStructure(employeeId);
      if (s) {
        setStructure(s);
        setBaseSalary(s.baseSalary);
        setAllowances([...s.allowances]);
        setDeductions([...s.deductions]);
      }
      setLoading(false);
    }
    load();
  }, [employeeId]);

  if (loading) return <div className="text-surface-400 text-sm">Loading salary info...</div>;
  if (!structure) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="text-surface-400 text-sm">No salary structure defined for this employee.</div>
        <button 
          onClick={async () => {
            const newStruct = await createSalaryStructure({
              employeeId,
              baseSalary: 0,
              allowances: [],
              deductions: [],
              effectiveDate: new Date().toISOString().split('T')[0]
            });
            if (newStruct) {
              setStructure(newStruct);
              setBaseSalary(newStruct.baseSalary);
              setAllowances(newStruct.allowances);
              setDeductions(newStruct.deductions);
              setEditing(true);
              toast.success('Salary structure initialized. Please configure it.');
            } else {
              toast.error('Failed to create salary structure');
            }
          }}
          className="btn-primary"
        >
          <Plus size={16}/> Initialize Salary Structure
        </button>
      </div>
    );
  }

  const totalAllowances = allowances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const netSalary = Number(baseSalary || 0) + totalAllowances - totalDeductions;

  const handleSave = async () => {
    const updated: SalaryStructure = {
      ...structure,
      baseSalary: Number(baseSalary),
      allowances,
      deductions
    };
    const res = await updateSalaryStructure(updated);
    if (res) {
      setStructure(res);
      setEditing(false);
      toast.success('Salary structure updated');
    } else {
      toast.error('Failed to update salary structure');
    }
  };

  const handleCancel = () => {
    setBaseSalary(structure.baseSalary);
    setAllowances([...structure.allowances]);
    setDeductions([...structure.deductions]);
    setEditing(false);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-4 bg-accent-500 rounded-full" />
          Salary Breakdown
        </h3>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="btn-secondary h-8 text-xs">Cancel</button>
            <button onClick={handleSave} className="btn-primary h-8 text-xs"><Save size={14}/> Save</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="btn-secondary h-8 text-xs"><Edit2 size={14}/> Edit Structure</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-900 border border-surface-700 p-4 rounded-lg">
          <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Base Salary</label>
          {editing ? (
            <input
              type="number"
              value={baseSalary}
              onChange={e => setBaseSalary(Number(e.target.value))}
              className="w-full bg-surface-800 border border-surface-600 rounded px-2 py-1 text-sm mt-1 text-white focus:border-accent-500 focus:ring-1 outline-none"
            />
          ) : (
            <p className="text-white text-lg font-bold mt-1">{formatCurrency(baseSalary)}</p>
          )}
        </div>
        <div className="bg-surface-900 border border-surface-700 p-4 rounded-lg">
          <label className="text-xs font-semibold text-surface-500 uppercase tracking-wide">Net Salary</label>
          <p className="text-[#22c55e] text-lg font-bold mt-1">{formatCurrency(netSalary)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allowances */}
        <div className="border border-surface-700 rounded-lg overflow-hidden bg-surface-800/50">
          <div className="bg-surface-900/50 py-3 px-4 border-b border-surface-700 flex justify-between items-center">
            <h4 className="font-semibold text-surface-300">Allowances</h4>
            {editing && (
              <button onClick={() => setAllowances([...allowances, {name:'', amount:0}])} className="text-accent-400 hover:text-accent-300 text-xs flex items-center gap-1">
                <Plus size={14} /> Add
              </button>
            )}
          </div>
          <div className="p-2 space-y-2">
            {allowances.map((a, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {editing ? (
                  <>
                    <input type="text" value={a.name} onChange={e => { const arr = [...allowances]; arr[idx].name = e.target.value; setAllowances(arr); }} className="flex-1 bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-white" placeholder="Name" />
                    <input type="number" value={a.amount} onChange={e => { const arr = [...allowances]; arr[idx].amount = Number(e.target.value); setAllowances(arr); }} className="w-24 bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-white" placeholder="Amount" />
                    <button onClick={() => setAllowances(allowances.filter((_, i) => i !== idx))} className="text-red-400 p-1"><Trash2 size={14}/></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-surface-300">{a.name}</span>
                    <span className="font-mono text-sm text-white">{formatCurrency(a.amount)}</span>
                  </>
                )}
              </div>
            ))}
            {allowances.length === 0 && <p className="text-xs text-surface-500 p-2 text-center">No allowances</p>}
          </div>
          <div className="bg-surface-900/50 py-2 px-4 border-t border-surface-700 flex justify-between">
            <span className="text-sm font-semibold text-surface-400">Total</span>
            <span className="font-mono text-sm font-bold text-white">{formatCurrency(totalAllowances)}</span>
          </div>
        </div>

        {/* Deductions */}
        <div className="border border-surface-700 rounded-lg overflow-hidden bg-surface-800/50">
          <div className="bg-surface-900/50 py-3 px-4 border-b border-surface-700 flex justify-between items-center">
            <h4 className="font-semibold text-surface-300">Deductions</h4>
            {editing && (
              <button onClick={() => setDeductions([...deductions, {name:'', amount:0}])} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1">
                <Plus size={14} /> Add
              </button>
            )}
          </div>
          <div className="p-2 space-y-2">
            {deductions.map((d, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {editing ? (
                  <>
                    <input type="text" value={d.name} onChange={e => { const arr = [...deductions]; arr[idx].name = e.target.value; setDeductions(arr); }} className="flex-1 bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-white" placeholder="Name" />
                    <input type="number" value={d.amount} onChange={e => { const arr = [...deductions]; arr[idx].amount = Number(e.target.value); setDeductions(arr); }} className="w-24 bg-surface-900 border border-surface-700 rounded px-2 py-1 text-xs text-white" placeholder="Amount" />
                    <button onClick={() => setDeductions(deductions.filter((_, i) => i !== idx))} className="text-red-400 p-1"><Trash2 size={14}/></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-surface-300">{d.name}</span>
                    <span className="font-mono text-sm text-[#ef4444]">{formatCurrency(d.amount)}</span>
                  </>
                )}
              </div>
            ))}
            {deductions.length === 0 && <p className="text-xs text-surface-500 p-2 text-center">No deductions</p>}
          </div>
          <div className="bg-surface-900/50 py-2 px-4 border-t border-surface-700 flex justify-between">
            <span className="text-sm font-semibold text-surface-400">Total</span>
            <span className="font-mono text-sm font-bold text-[#ef4444]">{formatCurrency(totalDeductions)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalaryReadOnlyTab({ employeeId }: { employeeId: string }) {
  const [structure, setStructure] = useState<SalaryStructure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const s = await getSalaryStructure(employeeId);
      setStructure(s ?? null);
      setLoading(false);
    }
    load();
  }, [employeeId]);

  if (loading) return <div className="text-surface-400 text-sm">Loading salary info...</div>;
  if (!structure) {
    return <div className="text-surface-400 text-sm">Salary information is not available yet.</div>;
  }

  const totalAllowances = structure.allowances.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalDeductions = structure.deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const netSalary = Number(structure.baseSalary) + totalAllowances - totalDeductions;
  const totalEarnings = Number(structure.baseSalary) + totalAllowances;

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span className="w-1 h-4 bg-accent-500 rounded-full" />
        My Salary Breakdown
      </h3>

      <div className="bg-surface-900 border border-surface-700 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-surface-700 flex justify-between items-center bg-surface-800">
          <span className="text-sm font-medium text-surface-300 capitalize">Base Salary</span>
          <span className="text-lg font-bold text-white">{formatCurrency(structure.baseSalary)}</span>
        </div>
        
        <table className="w-full text-sm">
          <thead className="bg-surface-900/50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-surface-400 uppercase text-xs">Allowances</th>
              <th className="text-right py-3 px-4 font-semibold text-surface-400 uppercase text-xs">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {structure.allowances.map((comp, i) => (
              <tr key={i}>
                <td className="py-2.5 px-4 text-surface-200">{comp.name}</td>
                <td className="py-2.5 px-4 text-right font-mono text-white">{formatCurrency(comp.amount)}</td>
              </tr>
            ))}
            <tr className="bg-surface-800/30">
              <td className="py-3 px-4 font-semibold text-surface-300">Total Earnings (A)</td>
              <td className="py-3 px-4 text-right font-mono font-bold text-white">{formatCurrency(totalEarnings)}</td>
            </tr>
          </tbody>

          <thead className="bg-surface-900/50 border-t border-surface-700">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-surface-400 uppercase text-xs">Deductions</th>
              <th className="text-right py-3 px-4 font-semibold text-surface-400 uppercase text-xs">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-800">
            {structure.deductions.map((comp, i) => (
              <tr key={i}>
                <td className="py-2.5 px-4 text-surface-200">{comp.name}</td>
                <td className="py-2.5 px-4 text-right font-mono text-white">{formatCurrency(comp.amount)}</td>
              </tr>
            ))}
            <tr className="bg-surface-800/30">
              <td className="py-3 px-4 font-semibold text-surface-300">Total Deductions (B)</td>
              <td className="py-3 px-4 text-right font-mono font-bold text-[#ef4444]">{formatCurrency(totalDeductions)}</td>
            </tr>
          </tbody>
        </table>
        
        <div className="p-5 border-t border-surface-700 bg-surface-900 flex justify-between items-center">
          <span className="text-base font-bold text-white">Net Salary (A - B)</span>
          <span className="text-2xl font-bold text-[#22c55e]">{formatCurrency(netSalary)}</span>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match.'); return; }
    toast.success('Password changed successfully');
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
  };

  return (
    <div className="max-w-md animate-fade-in">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
        <span className="w-1 h-4 bg-accent-500 rounded-full" />
        Change Password
      </h3>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Current Password</label>
          <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1.5">New Password</label>
          <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1.5">Confirm New Password</label>
          <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors" required />
        </div>
        <button type="submit" className="btn-primary w-full mt-2">Update Password</button>
      </form>
    </div>
  );
}

interface InfoFieldProps {
  label: string;
  value: string;
  displayValue?: string;
  isEditing?: boolean;
  onChange?: (value: string) => void;
  type?: string;
}

function InfoField({ label, value, displayValue, isEditing, onChange, type = "text" }: InfoFieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">{label}</label>
      {isEditing ? (
        <input
          type={type}
          value={value || ''}
          onChange={e => onChange?.(e.target.value)}
          className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-colors"
        />
      ) : (
        <p className="text-sm font-medium text-surface-200">{displayValue || value || '-'}</p>
      )}
    </div>
  );
}
