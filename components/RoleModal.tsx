
import React, { useState, useEffect } from 'react';
import { X, Save, Check } from 'lucide-react';
import { Role } from '../types';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Role) => void;
  initialData?: Role;
}

const COLOR_OPTIONS = [
  { id: 'purple', class: 'bg-purple-100 text-purple-800 border-purple-200', bg: 'bg-purple-500' },
  { id: 'blue', class: 'bg-blue-100 text-blue-800 border-blue-200', bg: 'bg-blue-500' },
  { id: 'green', class: 'bg-green-100 text-green-800 border-green-200', bg: 'bg-green-500' },
  { id: 'yellow', class: 'bg-yellow-100 text-yellow-800 border-yellow-200', bg: 'bg-yellow-500' },
  { id: 'red', class: 'bg-red-100 text-red-800 border-red-200', bg: 'bg-red-500' },
  { id: 'indigo', class: 'bg-indigo-100 text-indigo-800 border-indigo-200', bg: 'bg-indigo-500' },
  { id: 'gray', class: 'bg-gray-100 text-gray-800 border-gray-200', bg: 'bg-gray-500' },
  { id: 'orange', class: 'bg-orange-100 text-orange-800 border-orange-200', bg: 'bg-orange-500' },
];

export const RoleModal: React.FC<RoleModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Role>>({
    name: '',
    defaultDayRateP: 0,
    color: COLOR_OPTIONS[0].class
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({ ...initialData });
      } else {
        setFormData({
          name: '',
          defaultDayRateP: 0,
          color: COLOR_OPTIONS[0].class
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'defaultDayRateP' ? parseFloat(value) * 100 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const role: Role = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name || '',
      defaultDayRateP: formData.defaultDayRateP || 0,
      color: formData.color || COLOR_OPTIONS[0].class
    };
    onSave(role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{initialData ? 'Edit Role' : 'New Role'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Role Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
              placeholder="e.g. Plasterer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Default Day Rate (£)</label>
            <input
              type="number"
              name="defaultDayRateP"
              required
              step="0.01"
              value={((formData.defaultDayRateP || 0) / 100).toFixed(2)}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Badge Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: option.class }))}
                  className={`w-8 h-8 rounded-full ${option.bg} flex items-center justify-center transition-transform hover:scale-110 ${formData.color === option.class ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                >
                  {formData.color === option.class && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
            <div className="mt-2 p-2 bg-gray-50 rounded-lg flex justify-center">
                <span className={`text-xs font-bold px-2 py-1 rounded border ${formData.color}`}>
                    Preview Badge
                </span>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full flex items-center justify-center px-4 py-2 bg-[#00B5D8] text-white font-bold rounded-xl hover:bg-[#009bb8] shadow-sm transition-colors">
              <Save className="w-4 h-4 mr-2" /> Save Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
