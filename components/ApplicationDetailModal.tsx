import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, CheckCircle, Mail, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { Application, ApplicationStatus, Reminder, Project } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { MOCK_PROJECTS } from '../services/mockData';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onSave: (updatedApp: Application) => void;
  onFinalize?: (updatedApp: Application) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  application, 
  onSave,
  onFinalize
}) => {
  const [formData, setFormData] = useState({
    appliedAmount: '',
    grossCertifiedAmount: '',
    retentionDeducted: '',
    certifiedAmount: '',
    invoicedAmount: '',
    status: ApplicationStatus.TO_DO,
    applicationDate: '',
    dueDate: '',
    finalDateForPayment: ''
  });

  // Project Context for Retention %
  const [projectRetentionPercent, setProjectRetentionPercent] = useState(5);

  // Reminder State
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminder, setNewReminder] = useState({
      email: '',
      daysBefore: 3,
      triggerField: 'dueDate' as const
  });

  useEffect(() => {
    if (isOpen && application) {
      // Find project to get default retention %
      const project = MOCK_PROJECTS.find(p => p.id === application.projectId);
      // Prioritize the application's specific retention %, fallback to project
      const retPct = application.retentionPercentage !== undefined 
        ? application.retentionPercentage 
        : (project?.retentionPercentage || 5);
        
      setProjectRetentionPercent(retPct);

      setFormData({
        appliedAmount: (application.appliedAmountP / 100).toFixed(2),
        grossCertifiedAmount: (application.grossCertifiedAmountP / 100).toFixed(2),
        retentionDeducted: (application.retentionDeductedP / 100).toFixed(2),
        certifiedAmount: (application.certifiedAmountP / 100).toFixed(2),
        invoicedAmount: (application.invoicedAmountP / 100).toFixed(2),
        status: application.status,
        applicationDate: application.applicationDate,
        dueDate: application.dueDate,
        finalDateForPayment: application.finalDateForPayment
      });
      setReminders(application.reminders || []);
    }
  }, [isOpen, application]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-calculate retention logic
    if (name === 'grossCertifiedAmount') {
        const gross = parseFloat(value || '0');
        const retention = (gross * projectRetentionPercent) / 100;
        const net = gross - retention;
        
        setFormData(prev => ({
            ...prev,
            grossCertifiedAmount: value,
            retentionDeducted: retention.toFixed(2),
            certifiedAmount: net.toFixed(2)
        }));
    } else if (name === 'retentionDeducted') {
        // Manual override of retention
        const ret = parseFloat(value || '0');
        const gross = parseFloat(formData.grossCertifiedAmount || '0');
        const net = gross - ret;
        
        setFormData(prev => ({
            ...prev,
            retentionDeducted: value,
            certifiedAmount: net.toFixed(2)
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddReminder = () => {
      if (!newReminder.email) return;
      
      const reminder: Reminder = {
          id: Math.random().toString(36).substr(2, 9),
          email: newReminder.email,
          daysBefore: newReminder.daysBefore,
          triggerField: newReminder.triggerField
      };
      
      setReminders([...reminders, reminder]);
      setNewReminder({ ...newReminder, email: '' });
  };

  const handleRemoveReminder = (id: string) => {
      setReminders(reminders.filter(r => r.id !== id));
  };

  const constructUpdatedApplication = (): Application => {
    const appliedP = Math.round(parseFloat(formData.appliedAmount || '0') * 100);
    const grossCertifiedP = Math.round(parseFloat(formData.grossCertifiedAmount || '0') * 100);
    const retentionP = Math.round(parseFloat(formData.retentionDeducted || '0') * 100);
    const certifiedP = grossCertifiedP - retentionP; // Ensure strict math on save
    const invoicedP = Math.round(parseFloat(formData.invoicedAmount || '0') * 100);
    
    // Determine current amount based on status for list view display
    let currentAmountP = 0;
    if (formData.status === ApplicationStatus.TO_DO || formData.status === ApplicationStatus.APPLIED) {
        currentAmountP = appliedP;
    } else if (formData.status === ApplicationStatus.CERTIFIED) {
        currentAmountP = certifiedP;
    } else {
        currentAmountP = invoicedP;
    }

    return {
      ...application,
      appliedAmountP: appliedP,
      grossCertifiedAmountP: grossCertifiedP,
      retentionDeductedP: retentionP,
      certifiedAmountP: certifiedP,
      invoicedAmountP: invoicedP,
      amountP: currentAmountP,
      status: formData.status,
      applicationDate: formData.applicationDate,
      dueDate: formData.dueDate,
      finalDateForPayment: formData.finalDateForPayment,
      reminders: reminders,
      retentionPercentage: projectRetentionPercent // Persist potentially updated percentage
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedApp = constructUpdatedApplication();
    onSave(updatedApp);
    onClose();
  };

  const handleFinalizeAction = () => {
    if (onFinalize) {
        const updatedApp = constructUpdatedApplication();
        onFinalize(updatedApp);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Application Details</h2>
            <p className="text-xs text-gray-500">{application.projectName} - {application.periodMonth}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Current Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-sm font-medium text-gray-900"
            >
              <option value={ApplicationStatus.TO_DO}>To Do</option>
              <option value={ApplicationStatus.APPLIED}>Applied</option>
              <option value={ApplicationStatus.CERTIFIED}>Certified</option>
              <option value={ApplicationStatus.INVOICED}>Invoiced</option>
              <option value={ApplicationStatus.PAID}>Paid</option>
            </select>
          </div>

          {/* Amounts Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Financial Values</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">Applied Amount (£)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  name="appliedAmount"
                  step="0.01"
                  value={formData.appliedAmount}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 bg-blue-50/50 border border-blue-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 font-medium"
                />
              </div>
            </div>

            {/* Certification Breakdown Box */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Gross Certified Amount (£)</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                        type="number"
                        name="grossCertifiedAmount"
                        step="0.01"
                        value={formData.grossCertifiedAmount}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-900 font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between">
                        <label className="text-xs font-medium text-orange-600 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Less Retention ({projectRetentionPercent}%)
                        </label>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 font-bold">-</span>
                        <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                        <input
                        type="number"
                        name="retentionDeducted"
                        step="0.01"
                        value={formData.retentionDeducted}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-2 bg-white border border-orange-200 rounded-lg text-sm text-orange-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 text-right">Editable for Release/Adjustments</p>
                </div>

                <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-700">Net Certified Amount</span>
                        <span className="text-lg font-bold text-indigo-700">
                            {FORMAT_CURRENCY(Math.round((parseFloat(formData.certifiedAmount) || 0) * 100))}
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500">Invoiced Amount (£)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  name="invoicedAmount"
                  step="0.01"
                  value={formData.invoicedAmount}
                  onChange={handleChange}
                  className="w-full pl-9 pr-4 py-2 bg-cyan-50/50 border border-cyan-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-gray-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Key Dates</h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Application Date</label>
                <input
                    type="date"
                    name="applicationDate"
                    value={formData.applicationDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00B5D8] text-gray-900"
                />
                </div>
                <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">Due Date</label>
                <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00B5D8] text-gray-900"
                />
                </div>
            </div>
          </div>

           {/* Email Reminders Section */}
           <div className="space-y-4">
               <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                   <Mail className="w-4 h-4 text-gray-500" />
                   Email Reminders
               </h3>
               
               {reminders.length > 0 && (
                   <div className="space-y-2 mb-4">
                       {reminders.map(rem => (
                           <div key={rem.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg text-xs border border-gray-100">
                               <div>
                                   <p className="font-semibold text-gray-700">{rem.email}</p>
                                   <p className="text-gray-500">
                                       {rem.daysBefore} days before {rem.triggerField.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                   </p>
                               </div>
                               <button 
                                type="button" 
                                onClick={() => handleRemoveReminder(rem.id)}
                                className="text-gray-400 hover:text-red-500 p-1"
                               >
                                   <Trash2 className="w-3 h-3" />
                               </button>
                           </div>
                       ))}
                   </div>
               )}

               <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60">
                   <p className="text-xs font-semibold text-gray-700 mb-2">Add New Reminder</p>
                   <div className="space-y-2">
                       <input 
                            type="email" 
                            placeholder="Enter email address..." 
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00B5D8] text-gray-900"
                            value={newReminder.email}
                            onChange={(e) => setNewReminder({ ...newReminder, email: e.target.value })}
                       />
                       <div className="flex gap-2">
                           <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 w-20">
                               <input 
                                    type="number" 
                                    min="0"
                                    className="w-full py-2 text-xs outline-none text-gray-900"
                                    value={newReminder.daysBefore}
                                    onChange={(e) => setNewReminder({ ...newReminder, daysBefore: parseInt(e.target.value) })}
                               />
                               <span className="text-[10px] text-gray-400 pr-1">days</span>
                           </div>
                           <select 
                                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00B5D8] text-gray-900"
                                value={newReminder.triggerField}
                                onChange={(e) => setNewReminder({ ...newReminder, triggerField: e.target.value as any })}
                           >
                               <option value="applicationDate">Before Application Date</option>
                               <option value="dueDate">Before Due Date</option>
                               <option value="finalDateForPayment">Before Final Payment</option>
                           </select>
                       </div>
                       <button 
                            type="button"
                            onClick={handleAddReminder}
                            className="w-full py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                       >
                           <Plus className="w-3 h-3" /> Add Reminder
                       </button>
                   </div>
               </div>
           </div>

           {/* Final Account Section */}
           {onFinalize && (
               <div className="pt-4 border-t border-gray-100 mt-6">
                   <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                       <CheckCircle className="w-4 h-4 text-green-600" />
                       Final Account
                   </h3>
                   <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                       <p className="text-xs text-green-800 mb-3 leading-relaxed">
                           Is this the final payment application for the project? Creating a Final Account will:
                           <ul className="list-disc list-inside mt-1 ml-1 opacity-80">
                               <li>Finalize the project status</li>
                               <li>Stop future monthly application generation</li>
                               <li>Move the project to the Retention/DLP phase</li>
                           </ul>
                       </p>
                       <button
                           type="button"
                           onClick={handleFinalizeAction}
                           className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-green-200 text-green-700 text-sm font-bold rounded-lg hover:bg-green-100 transition-colors shadow-sm"
                       >
                           Create Final Account Application
                       </button>
                   </div>
               </div>
           )}

        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                Cancel
            </button>
            <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-[#00B5D8] hover:bg-[#009bb8] rounded-lg shadow-sm transition-colors flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};