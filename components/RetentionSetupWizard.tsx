import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle, Calendar, ArrowRight, ShieldCheck, ArrowDown, Upload, Loader2, Sparkles, FileText, Mail, Bell, Zap } from 'lucide-react';
import { RetentionRecord, RetentionStatus } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { analyzeFinalAccountDocument } from '../services/aiService';

interface RetentionSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  record: RetentionRecord;
  onSubmit: (updatedRecord: RetentionRecord) => void;
}

export const RetentionSetupWizard: React.FC<RetentionSetupWizardProps> = ({
  isOpen,
  onClose,
  record,
  onSubmit
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    pcDate: '',
    dlpMonths: 12,
    // Automation Fields
    clientEmail: '',
    staffEmail: '',
    clientAppDate: '',
    staffReminderDate: '',
    enableAutomation: true
  });
  const [uploadedFile, setUploadedFile] = useState<string | undefined>(undefined);
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Date Calculations for Automation
  useEffect(() => {
      if (formData.pcDate && formData.dlpMonths) {
          const pc = new Date(formData.pcDate);
          // Calculate DLP End
          const end = new Date(pc);
          end.setMonth(pc.getMonth() + formData.dlpMonths);
          
          // Set Client App Date to DLP End Date (ISO String)
          const clientDate = end.toISOString().split('T')[0];
          
          // Set Staff Reminder Date to 14 days before DLP End
          const reminder = new Date(end);
          reminder.setDate(end.getDate() - 14);
          const staffDate = reminder.toISOString().split('T')[0];

          setFormData(prev => ({
              ...prev,
              clientAppDate: clientDate,
              staffReminderDate: staffDate
          }));
      }
  }, [formData.pcDate, formData.dlpMonths]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, pcDate: e.target.value }));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, dlpMonths: parseInt(e.target.value) }));
  };

  const handleAutomationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Calculate DLP End Date
  const calculateEndDate = () => {
    if (!formData.pcDate) return '';
    const date = new Date(formData.pcDate);
    date.setMonth(date.getMonth() + formData.dlpMonths);
    return date.toISOString().split('T')[0];
  };

  const dlpEndDate = calculateEndDate();

  // Calculate Retention Breakdown
  const totalHeld = record.totalRetentionHeldP;
  const firstMoiety = Math.round(totalHeld / 2); // 50% Release
  const secondMoiety = totalHeld - firstMoiety; // Remaining 50%

  // AI File Handling
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        await processFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          await processFile(e.dataTransfer.files[0]);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const processFile = async (file: File) => {
      setIsAnalyzing(true);
      setAnalysisSuccess(false);
      setUploadedFile(file.name);
      
      try {
          // Call mock AI service
          const result = await analyzeFinalAccountDocument(file);
          if (result.practicalCompletionDate) {
              setFormData(prev => ({ ...prev, pcDate: result.practicalCompletionDate! }));
              setAnalysisSuccess(true);
          }
      } catch (error) {
          console.error("AI Analysis failed", error);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleSubmit = () => {
    const updatedRecord: RetentionRecord = {
      ...record,
      status: RetentionStatus.IN_DLP,
      practicalCompletionDate: formData.pcDate,
      dlpMonths: formData.dlpMonths,
      dlpEndDate: dlpEndDate,
      totalRetentionHeldP: secondMoiety, // Update held amount to Second Moiety
      finalAccountDocument: uploadedFile,
      
      // Automation Data
      clientContactEmail: formData.clientEmail,
      staffContactEmail: formData.staffEmail,
      applicationSendDate: formData.clientAppDate,
      staffReminderDate: formData.staffReminderDate,
      automationEnabled: formData.enableAutomation
    };
    onSubmit(updatedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in duration-200 flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
               <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">Defects Liability Period Setup</h2>
                <p className="text-sm text-gray-500">{record.projectName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 overflow-y-auto">
          
          {/* Stepper */}
          <div className="flex items-center justify-center mb-2">
             <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${step === 1 ? 'border-blue-600 bg-blue-50' : 'border-green-600 bg-green-100'}`}>
                    {step === 1 ? '1' : <CheckCircle className="w-5 h-5" />}
                </div>
                <span className="text-sm font-bold">Dates</span>
             </div>
             
             <div className="w-12 h-0.5 bg-gray-200 mx-2"></div>
             
             <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600' : (step > 2 ? 'text-green-600' : 'text-gray-400')}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${step === 2 ? 'border-blue-600 bg-blue-50' : (step > 2 ? 'border-green-600 bg-green-100' : 'border-gray-200')}`}>
                    {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
                </div>
                <span className="text-sm font-bold">Review</span>
             </div>

             <div className="w-12 h-0.5 bg-gray-200 mx-2"></div>

             <div className={`flex items-center gap-2 ${step === 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all ${step === 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>3</div>
                <span className="text-sm font-bold">Automation</span>
             </div>
          </div>

          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* AI Drop Zone */}
                <div 
                    className={`
                        relative border-2 border-dashed rounded-2xl p-6 text-center transition-all group cursor-pointer
                        ${isAnalyzing ? 'border-[#00B5D8] bg-[#00B5D8]/5' : 'border-gray-200 hover:border-[#00B5D8] hover:bg-gray-50'}
                    `}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.txt"
                    />
                    
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-2">
                            <Loader2 className="w-8 h-8 text-[#00B5D8] animate-spin mb-2" />
                            <h3 className="text-sm font-bold text-gray-900">Analyzing Final Account...</h3>
                            <p className="text-xs text-gray-500">Extracting Practical Completion Date</p>
                        </div>
                    ) : analysisSuccess ? (
                        <div className="flex flex-col items-center justify-center py-2 animate-in fade-in zoom-in">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">Date Extracted!</h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <FileText className="w-3 h-3" />
                                {uploadedFile}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-2 pointer-events-none">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                <Upload className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">Upload Final Account</h3>
                            <p className="text-xs text-gray-500 max-w-xs mx-auto">
                                Drag & drop the signed Final Account Statement here to auto-fill the PC Date.
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
                    <div className="shrink-0 mt-0.5">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-sm text-blue-800">
                        <p className="font-bold mb-1">Set Practical Completion Date</p>
                        <p className="opacity-90">This date marks the official handover. It triggers the release of the first half of retention.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Practical Completion (PC) Date</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={formData.pcDate}
                                onChange={handleDateChange}
                                className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-medium shadow-sm"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">DLP Duration (Months)</label>
                        <input 
                            type="number" 
                            min="1"
                            value={formData.dlpMonths}
                            onChange={handleDurationChange}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 font-medium shadow-sm"
                        />
                    </div>
                </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Visualization of Split */}
                <div>
                    <div className="flex justify-between text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">
                        <span>Total Retention Pot</span>
                        <span>{FORMAT_CURRENCY(totalHeld)}</span>
                    </div>
                    
                    <div className="flex w-full h-16 rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative">
                        {/* First Half */}
                        <div className="w-1/2 bg-green-100 flex items-center justify-center border-r border-white/50 relative group cursor-help">
                            <div className="text-center">
                                <p className="text-green-800 font-bold text-sm">First Moiety</p>
                                <p className="text-green-600 text-xs font-semibold">50%</p>
                            </div>
                            <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        {/* Second Half */}
                        <div className="w-1/2 bg-orange-100 flex items-center justify-center relative group cursor-help">
                            <div className="text-center">
                                <p className="text-orange-800 font-bold text-sm">Second Moiety</p>
                                <p className="text-orange-600 text-xs font-semibold">50%</p>
                            </div>
                            <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        
                        {/* Split Marker */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white flex items-center justify-center overflow-visible">
                            <div className="w-6 h-6 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center z-10">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between mt-4 gap-4">
                        {/* Release Card */}
                        <div className="flex-1 p-4 bg-green-50 rounded-xl border border-green-200 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
                            <p className="text-xs font-bold text-green-700 uppercase mb-1">Release Immediately</p>
                            <p className="text-xl font-bold text-gray-900">{FORMAT_CURRENCY(firstMoiety)}</p>
                            <p className="text-[10px] text-green-600 mt-1">Triggered by PC Date</p>
                        </div>

                        <ArrowRight className="w-6 h-6 text-gray-300 self-center shrink-0" />

                        {/* Held Card */}
                        <div className="flex-1 p-4 bg-orange-50 rounded-xl border border-orange-200 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>
                            <p className="text-xs font-bold text-orange-700 uppercase mb-1">Retain for DLP</p>
                            <p className="text-xl font-bold text-gray-900">{FORMAT_CURRENCY(secondMoiety)}</p>
                            <p className="text-[10px] text-orange-600 mt-1">Until {dlpEndDate}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex gap-4 items-center">
                    <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Final Release Date</p>
                        <p className="text-sm font-medium text-gray-900">
                            Retention will be held until <span className="font-bold text-blue-600">{dlpEndDate}</span>
                        </p>
                    </div>
                </div>
            </div>
          ) : (
            /* STEP 3: AUTOMATION & CONTACTS */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.enableAutomation ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-500'}`}>
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Enable Automated Workflows</p>
                            <p className="text-xs text-gray-500">Auto-send applications and internal reminders</p>
                        </div>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                            type="checkbox" 
                            name="enableAutomation" 
                            id="toggle" 
                            checked={formData.enableAutomation}
                            onChange={(e) => setFormData({...formData, enableAutomation: e.target.checked})}
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out"
                            style={{ right: formData.enableAutomation ? '0' : '50%', borderColor: formData.enableAutomation ? '#7C6FF6' : '#E5E7EB' }}
                        />
                        <label 
                            htmlFor="toggle" 
                            className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.enableAutomation ? 'bg-purple-500' : 'bg-gray-300'}`}
                        ></label>
                    </div>
                </div>

                <div className={`space-y-6 transition-opacity ${formData.enableAutomation ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    
                    {/* Client Automation */}
                    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                            <Mail className="w-4 h-4 text-blue-500" />
                            <h3 className="text-sm font-bold text-gray-900">Client Application</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500">Client Contact Email</label>
                                <input 
                                    type="email"
                                    name="clientEmail"
                                    placeholder="client@company.com"
                                    value={formData.clientEmail}
                                    onChange={handleAutomationChange}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500">Send Date (DLP End)</label>
                                <input 
                                    type="date"
                                    name="clientAppDate"
                                    value={formData.clientAppDate}
                                    onChange={handleAutomationChange}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">A draft retention release application will be emailed to this contact on the specified date.</p>
                    </div>

                    {/* Internal Reminder */}
                    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
                            <Bell className="w-4 h-4 text-orange-500" />
                            <h3 className="text-sm font-bold text-gray-900">Internal Reminder</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500">Staff Email</label>
                                <input 
                                    type="email"
                                    name="staffEmail"
                                    placeholder="staff@yourcompany.com"
                                    value={formData.staffEmail}
                                    onChange={handleAutomationChange}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500">Reminder Date</label>
                                <input 
                                    type="date"
                                    name="staffReminderDate"
                                    value={formData.staffReminderDate}
                                    onChange={handleAutomationChange}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Your staff will receive a notification to prepare the final account documents.</p>
                    </div>

                </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
            {step > 1 && (
                <button onClick={() => setStep((prev) => (prev - 1) as any)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                    Back
                </button>
            )}
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                Cancel
            </button>
            
            {step < 3 ? (
                <button 
                    onClick={() => setStep((prev) => (prev + 1) as any)}
                    disabled={step === 1 && !formData.pcDate}
                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    Next Step <ArrowRight className="w-4 h-4" />
                </button>
            ) : (
                <button 
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20"
                >
                    <CheckCircle className="w-4 h-4" /> Confirm & Activate
                </button>
            )}
        </div>
      </div>
    </div>
  );
};