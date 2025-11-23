
import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Plus, User, Star, ChevronDown } from 'lucide-react';
import { StaffMember, Role } from '../types';
import { FORMAT_CURRENCY } from '../constants';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (staff: StaffMember, newRole?: Role) => void;
  roles: Role[];
  initialData?: StaffMember;
}

const QUALIFICATION_SUGGESTIONS = [
    'CSCS Green (Labourer)',
    'CSCS Blue (Skilled)',
    'CSCS Gold (Supervisor)',
    'CSCS Black (Manager)',
    'CPCS',
    'JIB Gold'
];

export const StaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose, onSubmit, roles, initialData }) => {
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    roleId: '',
    dailyRateP: 0,
    rating: 'Good',
    abilities: [],
    qualifications: '',
    training: [],
    active: true
  });

  // Combobox States
  const [roleInput, setRoleInput] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  
  const [qualInput, setQualInput] = useState('');
  const [isQualDropdownOpen, setIsQualDropdownOpen] = useState(false);

  // Custom Input States for Tags
  const [newAbility, setNewAbility] = useState('');
  const [newTraining, setNewTraining] = useState('');

  const roleRef = useRef<HTMLDivElement>(null);
  const qualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (qualRef.current && !qualRef.current.contains(event.target as Node)) {
        setIsQualDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setFormData({ ...initialData });
            const roleName = roles.find(r => r.id === initialData.roleId)?.name || '';
            setRoleInput(roleName);
            setQualInput(initialData.qualifications || '');
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                roleId: '',
                dailyRateP: 0,
                rating: 'Good',
                abilities: [],
                qualifications: '',
                training: [],
                active: true
            });
            setRoleInput('');
            setQualInput('');
        }
    }
  }, [isOpen, initialData, roles]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'dailyRateP' ? parseFloat(value) * 100 : value 
    }));
  };

  // Handle Role Selection
  const selectRole = (role: Role) => {
      setRoleInput(role.name);
      setFormData(prev => ({
          ...prev,
          roleId: role.id,
          dailyRateP: prev.dailyRateP || role.defaultDayRateP // Only set if 0/empty? Or overwrite? Let's respect existing unless 0
      }));
      setIsRoleDropdownOpen(false);
  };

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(roleInput.toLowerCase()));

  // Handle Qualification Selection
  const selectQual = (q: string) => {
      setQualInput(q);
      setFormData(prev => ({ ...prev, qualifications: q }));
      setIsQualDropdownOpen(false);
  };

  const filteredQuals = QUALIFICATION_SUGGESTIONS.filter(q => q.toLowerCase().includes(qualInput.toLowerCase()));

  const addTag = (field: 'abilities' | 'training', value: string, setter: (s: string) => void) => {
      if (value.trim()) {
          setFormData(prev => ({
              ...prev,
              [field]: [...(prev[field] || []), value.trim()]
          }));
          setter('');
      }
  };

  const removeTag = (field: 'abilities' | 'training', index: number) => {
      setFormData(prev => ({
          ...prev,
          [field]: (prev[field] || []).filter((_, i) => i !== index)
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalRoleId = formData.roleId;
    let newRoleObj: Role | undefined = undefined;

    // Check if role input matches an existing role by name
    const existingRole = roles.find(r => r.name.toLowerCase() === roleInput.trim().toLowerCase());
    
    if (existingRole) {
        finalRoleId = existingRole.id;
    } else if (roleInput.trim()) {
        // Create New Role
        finalRoleId = Math.random().toString(36).substr(2, 9);
        newRoleObj = {
            id: finalRoleId,
            name: roleInput.trim(),
            defaultDayRateP: formData.dailyRateP || 0,
            color: 'bg-gray-100 text-gray-800 border-gray-200' // Default styling
        };
    }

    const staff: StaffMember = {
        id: initialData?.id || Math.random().toString(36).substr(2, 9),
        name: formData.name || 'Unknown',
        active: formData.active || true,
        ...formData,
        qualifications: qualInput, // Ensure sync
        roleId: finalRoleId || '' // Ensure sync
    } as StaffMember;
    
    onSubmit(staff, newRoleObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#00B5D8]" />
            {initialData ? 'Edit Staff Profile' : 'Add Staff Member'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name *</label>
                    <input 
                        type="text" name="name" required
                        value={formData.name} onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                        placeholder="e.g. Dave Smith"
                    />
                </div>
                
                {/* Editable Role Dropdown */}
                <div className="space-y-1 relative" ref={roleRef}>
                    <label className="text-xs font-bold text-gray-500 uppercase">Role *</label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            value={roleInput}
                            onChange={(e) => { setRoleInput(e.target.value); setIsRoleDropdownOpen(true); }}
                            onFocus={() => setIsRoleDropdownOpen(true)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                            placeholder="Select or type new role..."
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)} />
                    </div>
                    
                    {isRoleDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                            {filteredRoles.length > 0 ? (
                                filteredRoles.map(r => (
                                    <div 
                                        key={r.id} 
                                        onClick={() => selectRole(r)}
                                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 flex items-center justify-between"
                                    >
                                        {r.name}
                                        <span className="text-xs text-gray-400">{FORMAT_CURRENCY(r.defaultDayRateP)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500 italic">
                                    "{roleInput}" will be created as a new role
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                    <input 
                        type="email" name="email"
                        value={formData.email} onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                    <input 
                        type="tel" name="phone"
                        value={formData.phone} onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                    />
                </div>
                <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                    <input 
                        type="text" name="address"
                        value={formData.address} onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                        placeholder="Street Address, City, Postcode"
                    />
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* Professional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Daily Rate (£)</label>
                    <input 
                        type="number" step="0.01" name="dailyRateP"
                        value={((formData.dailyRateP || 0) / 100).toFixed(2)}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Performance Rating</label>
                    <select 
                        name="rating"
                        value={formData.rating} onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                    >
                        <option value="Very Good">Very Good 🌟</option>
                        <option value="Good">Good 👍</option>
                        <option value="OK">OK</option>
                        <option value="Not Good">Not Good ⚠️</option>
                    </select>
                </div>
                
                {/* Editable Qualification Dropdown */}
                <div className="space-y-1 relative" ref={qualRef}>
                    <label className="text-xs font-bold text-gray-500 uppercase">Qualification (Card)</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={qualInput}
                            onChange={(e) => { setQualInput(e.target.value); setIsQualDropdownOpen(true); }}
                            onFocus={() => setIsQualDropdownOpen(true)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                            placeholder="e.g. CSCS Gold"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" onClick={() => setIsQualDropdownOpen(!isQualDropdownOpen)} />
                    </div>
                    
                    {isQualDropdownOpen && filteredQuals.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-auto">
                            {filteredQuals.map(q => (
                                <div 
                                    key={q} 
                                    onClick={() => selectQual(q)}
                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                                >
                                    {q}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={formData.active}
                            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                            className="w-5 h-5 text-[#00B5D8] rounded focus:ring-[#00B5D8]"
                        />
                        Active Staff Member
                    </label>
                </div>
            </div>

            {/* Custom Tags: Abilities & Training */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Abilities & Skills</label>
                    <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                        {formData.abilities?.map((skill, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md flex items-center gap-1 border border-blue-100">
                                {skill}
                                <button type="button" onClick={() => removeTag('abilities', i)} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newAbility} 
                            onChange={(e) => setNewAbility(e.target.value)}
                            placeholder="Add skill (e.g. Spraying)..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00B5D8] text-gray-900"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('abilities', newAbility, setNewAbility))}
                        />
                        <button type="button" onClick={() => addTag('abilities', newAbility, setNewAbility)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Training & Certs</label>
                    <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                        {formData.training?.map((t, i) => (
                            <span key={i} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md flex items-center gap-1 border border-purple-100">
                                {t}
                                <button type="button" onClick={() => removeTag('training', i)} className="hover:text-purple-900"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newTraining} 
                            onChange={(e) => setNewTraining(e.target.value)}
                            placeholder="Add training (e.g. IPAF)..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00B5D8] text-gray-900"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('training', newTraining, setNewTraining))}
                        />
                        <button type="button" onClick={() => addTag('training', newTraining, setNewTraining)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
                <button type="submit" className="px-6 py-2.5 bg-[#00B5D8] text-white font-bold rounded-xl hover:bg-[#009bb8] shadow-sm transition-colors flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Save Profile
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};