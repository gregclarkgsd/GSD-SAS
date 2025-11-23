
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { RetentionRecord, RetentionStatus } from '../types';

interface RetentionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RetentionRecord;
  onSave: (updatedRecord: RetentionRecord) => void;
}

export const RetentionEditModal: React.FC<RetentionEditModalProps> = ({ isOpen, onClose, record, onSave }) => {
  const [formData, setFormData] = useState<RetentionRecord>({ ...record });

  useEffect(() => {
    setFormData({ ...record });
  }, [record]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalRetentionHeldP' || name === 'contractValueP' || name === 'totalCertifiedAmountP'
        ? Math.round(parseFloat(value) * 100)
        : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Retention Record</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Read Only Info */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                <p className="text-sm font-bold text-gray-900">{formData.projectName}</p>
                <p className="text-xs text-gray-500">{formData.clientName}</p>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Status</label>
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                >
                    {Object.values(RetentionStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">PC Date</label>
                    <input
                        type="date"
                        name="practicalCompletionDate"
                        value={formData.practicalCompletionDate || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700">DLP End Date</label>
                    <input
                        type="date"
                        name="dlpEndDate"
                        value={formData.dlpEndDate || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Retention Held (£)</label>
                <input
                    type="number"
                    step="0.01"
                    value={(formData.totalRetentionHeldP / 100).toFixed(2)}
                    onChange={(e) => handleChange({ target: { name: 'totalRetentionHeldP', value: e.target.value } } as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900"
                />
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" className="flex items-center px-4 py-2 bg-[#00B5D8] text-white rounded-lg hover:bg-[#009bb8]">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
