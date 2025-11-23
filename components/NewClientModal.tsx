import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Client } from '../types';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (client: Client) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    paymentTerms: '30 Days End of Month',
    paymentTermDays: 30,
    paymentDelayDays: 0,
    insuredAmount: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      contactEmail: formData.contactEmail,
      paymentTerms: formData.paymentTerms,
      paymentTermDays: Number(formData.paymentTermDays),
      paymentDelayDays: Number(formData.paymentDelayDays),
      insuredAmountP: parseFloat(formData.insuredAmount || '0') * 100 // Convert to pence
    };
    onSubmit(newClient);
    setFormData({
      name: '',
      contactEmail: '',
      paymentTerms: '30 Days End of Month',
      paymentTermDays: 30,
      paymentDelayDays: 0,
      insuredAmount: ''
    });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create New Client</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2 text-sm text-gray-500">
          Enter the client details below to add a new client.
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Client Name */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Client Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Enter client name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] transition-all text-gray-900"
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              placeholder="contact@client.com"
              value={formData.contactEmail}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] transition-all text-gray-900"
            />
          </div>

          {/* Payment Terms */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Payment Terms *</label>
            <select
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] transition-all appearance-none text-gray-900"
            >
              <option value="30 Days End of Month">30 Days End of Month</option>
              <option value="45 Days End of Month">45 Days End of Month</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
              <option value="14 Days">14 Days</option>
              <option value="Immediate">Immediate</option>
            </select>
            <p className="text-xs text-gray-500">Contractual payment terms for this client</p>
          </div>

          {/* Payment Term Days */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Payment Term Days *</label>
            <input
              type="number"
              name="paymentTermDays"
              required
              min="0"
              value={formData.paymentTermDays}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] transition-all text-gray-900"
            />
             <p className="text-xs text-gray-500">Number of days for payment (usually 30 or 45)</p>
          </div>

          {/* Payment Delay */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Typical Payment Delay (days)</label>
            <input
              type="number"
              name="paymentDelayDays"
              value={formData.paymentDelayDays}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] transition-all text-gray-900"
            />
            <p className="text-xs text-gray-500">Extra days this client usually takes to pay (e.g., +15 if they always pay 15 days late)</p>
          </div>
          
          {/* Insured Amount */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Insured Amount (£)</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">£</span>
                <input
                type="number"
                name="insuredAmount"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.insuredAmount}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] transition-all text-gray-900"
                />
            </div>
            <p className="text-xs text-gray-500">Amount we have the insured for</p>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-xl shadow-lg transition-all"
            >
              Create Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};