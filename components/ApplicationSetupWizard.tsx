import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, ArrowRight, CheckCircle, AlertTriangle, Upload, FileText, Sparkles, Loader2, Mail, Plus, Trash2, Percent } from 'lucide-react';
import { Project, PaymentScheduleConfig, Application, ApplicationStatus, Reminder } from '../types';
import { analyzeContractDocument } from '../services/aiService';

interface ApplicationSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  clientPaymentTermsDays: number;
  onSubmit: (applications: Application[]) => void;
}

export const ApplicationSetupWizard: React.FC<ApplicationSetupWizardProps> = ({
  isOpen,
  onClose,
  project,
  clientPaymentTermsDays,
  onSubmit
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  
  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [analyzedFileName, setAnalyzedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Step 1: Configuration State
  const [config, setConfig] = useState<PaymentScheduleConfig>({
    firstDueDate: '',
    paymentTermsDays: clientPaymentTermsDays || 14, // Default to client terms or 14
    payLessNoticeOffset: 5, // JCT standard
    applicationOffset: 7, // Typical standard
    recurrenceMonths: 12
  });

  // Retention Configuration
  const [retentionPercentage, setRetentionPercentage] = useState(5);

  // Reminder Configuration State
  const [reminderRules, setReminderRules] = useState<Omit<Reminder, 'id'>[]>([]);
  const [newRule, setNewRule] = useState({
      email: '',
      daysBefore: 3,
      triggerField: 'dueDate' as const
  });

  // Step 2: Generated Preview State
  const [generatedSchedule, setGeneratedSchedule] = useState<Application[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Initialize with reasonable defaults based on project start date or today
      const startDate = project.startDate ? new Date(project.startDate) : new Date();
      // Default first due date to end of the start month
      const defaultDueDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      setConfig(prev => ({
        ...prev,
        firstDueDate: defaultDueDate.toISOString().split('T')[0],
        paymentTermsDays: clientPaymentTermsDays || 14
      }));
      setRetentionPercentage(project.retentionPercentage || 5);
      setReminderRules([]); // Reset reminders
      setStep(1);
      setAnalysisSuccess(false);
      setIsAnalyzing(false);
      setAnalyzedFileName('');
    }
  }, [isOpen, project, clientPaymentTermsDays]);

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
      setAnalyzedFileName(file.name);
      
      try {
          // Call mock AI service
          const extractedData = await analyzeContractDocument(file);
          
          // Merge extracted data into config
          setConfig(prev => ({
              ...prev,
              ...extractedData,
              // Ensure we fallback to existing values if AI returns undefined for some fields
              firstDueDate: extractedData.firstDueDate || prev.firstDueDate,
              paymentTermsDays: extractedData.paymentTermsDays || prev.paymentTermsDays,
          }));
          setAnalysisSuccess(true);
      } catch (error) {
          console.error("AI Analysis failed", error);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleAddRule = () => {
      if (!newRule.email) return;
      setReminderRules([...reminderRules, { ...newRule }]);
      setNewRule({ ...newRule, email: '' }); // Keep other settings, clear email
  };

  const handleRemoveRule = (index: number) => {
      setReminderRules(reminderRules.filter((_, i) => i !== index));
  };

  const handleGeneratePreview = () => {
    const apps: Application[] = [];
    const baseDate = new Date(config.firstDueDate);

    for (let i = 0; i < config.recurrenceMonths; i++) {
      // Calculate Due Date for this iteration (Monthly recurrence)
      const currentDueDate = new Date(baseDate);
      currentDueDate.setMonth(baseDate.getMonth() + i);

      // 1. Due Date (Fixed)
      // If date overflows (e.g. Jan 31 -> Feb 28), Date object handles it, but we might want strict "Last Day" logic if started on last day.
      // For simplicity here, we rely on native Date month increment behavior which clamps to end of month.
      
      // 2. Application Date (Due Date - Offset)
      const appDate = new Date(currentDueDate);
      appDate.setDate(currentDueDate.getDate() - config.applicationOffset);

      // 3. Final Date for Payment (Due Date + Terms)
      const finalDate = new Date(currentDueDate);
      finalDate.setDate(currentDueDate.getDate() + config.paymentTermsDays);

      // 4. Pay Less Notice Date (Final Date - Offset)
      const plnDate = new Date(finalDate);
      plnDate.setDate(finalDate.getDate() - config.payLessNoticeOffset);

      // Format Month Label (e.g. "Jan 2024")
      const monthLabel = currentDueDate.toLocaleString('default', { month: 'short', year: 'numeric' });

      // Generate reminders for this specific application instance
      const appReminders: Reminder[] = reminderRules.map((rule, rIdx) => ({
          id: `rem-${i}-${rIdx}-${Math.random().toString(36).substr(2, 5)}`,
          email: rule.email,
          daysBefore: rule.daysBefore,
          triggerField: rule.triggerField
      }));

      apps.push({
        id: `TEMP-${i}`,
        projectId: project.id,
        projectName: project.name,
        periodMonth: monthLabel,
        
        appliedAmountP: 0,
        grossCertifiedAmountP: 0,
        retentionDeductedP: 0,
        retentionPercentage: retentionPercentage,
        certifiedAmountP: 0,
        invoicedAmountP: 0,
        amountP: 0, // Initial amount is 0
        status: ApplicationStatus.TO_DO,
        
        applicationDate: appDate.toISOString().split('T')[0],
        dueDate: currentDueDate.toISOString().split('T')[0],
        finalDateForPayment: finalDate.toISOString().split('T')[0],
        payLessNoticeDate: plnDate.toISOString().split('T')[0],
        reminders: appReminders
      });
    }

    setGeneratedSchedule(apps);
    setStep(2);
  };

  const handleUpdateScheduleItem = (index: number, field: keyof Application, value: string) => {
    setGeneratedSchedule(prev => {
        const newSchedule = [...prev];
        newSchedule[index] = {
            ...newSchedule[index],
            [field]: value
        };
        return newSchedule;
    });
  };

  const handleConfirm = () => {
    onSubmit(generatedSchedule);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Schedule Setup</h2>
            <p className="text-sm text-gray-500 mt-1">Configure JCT payment timeline for <span className="font-semibold text-[#00B5D8]">{project.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* Progress Steps */}
          <div className="flex items-center mb-8">
            <div className={`flex items-center gap-2 ${step === 1 ? 'text-[#00B5D8]' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step === 1 ? 'border-[#00B5D8] bg-[#00B5D8]/10' : 'border-green-600 bg-green-100'}`}>
                {step === 1 ? '1' : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className="font-medium">Configuration</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-200 mx-4"></div>
            <div className={`flex items-center gap-2 ${step === 2 ? 'text-[#00B5D8]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step === 2 ? 'border-[#00B5D8] bg-[#00B5D8]/10' : 'border-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Review Schedule</span>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-8">
              
              {/* AI Drop Zone */}
              <div 
                className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center transition-all group
                    ${isAnalyzing ? 'border-[#00B5D8] bg-[#00B5D8]/5' : 'border-gray-200 hover:border-[#00B5D8] hover:bg-gray-50 cursor-pointer'}
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
                    accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                />
                
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="w-10 h-10 text-[#00B5D8] animate-spin mb-3" />
                        <h3 className="text-lg font-bold text-gray-900">Analyzing {analyzedFileName}...</h3>
                        <p className="text-sm text-gray-500">Gemini is extracting payment terms and dates.</p>
                    </div>
                ) : analysisSuccess ? (
                     <div className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Data Extracted Successfully!</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <FileText className="w-4 h-4" />
                            {analyzedFileName}
                        </div>
                        <p className="text-sm text-gray-500">We've auto-filled the fields below based on your document.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-2 pointer-events-none">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Auto-fill with Gemini AI</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                            Drag & drop your contract or payment schedule here. We'll extract the dates and terms for you.
                        </p>
                        <div className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm">
                            Select Document
                        </div>
                    </div>
                )}
              </div>

              {/* Manual Configuration Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Due Date */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">First Payment Due Date</label>
                  <div className="relative">
                    <input 
                      type="date"
                      value={config.firstDueDate}
                      onChange={(e) => setConfig({...config, firstDueDate: e.target.value})}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500">The date the first payment legally becomes due.</p>
                </div>

                {/* Recurrence */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Schedule Duration (Months)</label>
                  <input 
                    type="number"
                    min="1"
                    max="60"
                    value={config.recurrenceMonths}
                    onChange={(e) => setConfig({...config, recurrenceMonths: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                  />
                </div>

                {/* Payment Terms */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Payment Terms (Days)</label>
                  <input 
                    type="number"
                    min="0"
                    value={config.paymentTermsDays}
                    onChange={(e) => setConfig({...config, paymentTermsDays: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                  />
                  <p className="text-xs text-gray-500">Days after Due Date for Final Payment (e.g. 14).</p>
                </div>

                {/* Pay Less Notice Offset */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Pay Less Notice Offset (Days)</label>
                  <input 
                    type="number"
                    min="1"
                    value={config.payLessNoticeOffset}
                    onChange={(e) => setConfig({...config, payLessNoticeOffset: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                  />
                  <p className="text-xs text-gray-500">Days before Final Payment Date (Default 5).</p>
                </div>

                 {/* Application Offset */}
                 <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Application Submission Offset (Days)</label>
                  <input 
                    type="number"
                    min="0"
                    value={config.applicationOffset}
                    onChange={(e) => setConfig({...config, applicationOffset: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                  />
                  <p className="text-xs text-gray-500">Days before Due Date for Contractor Application.</p>
                </div>

                {/* Retention Percentage */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Retention Percentage (%)</label>
                  <div className="relative">
                    <input 
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={retentionPercentage}
                        onChange={(e) => setRetentionPercentage(parseFloat(e.target.value))}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500">Default retention to be withheld.</p>
                </div>
              </div>

               {/* Reminder Configuration */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">Email Reminders</h3>
                  </div>
                  
                  {/* Rules List */}
                  {reminderRules.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reminderRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{rule.email}</p>
                            <p className="text-xs text-gray-500">
                              {rule.daysBefore} days before {rule.triggerField.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleRemoveRule(idx)}
                            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Rule Inputs */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
                      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Add Global Reminder</p>
                      <div className="flex flex-col md:flex-row gap-3">
                         <div className="flex-1">
                             <input 
                                type="email"
                                placeholder="Recipient Email"
                                value={newRule.email}
                                onChange={(e) => setNewRule({ ...newRule, email: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                             />
                         </div>
                         <div className="flex gap-3">
                             <div className="w-24 relative">
                                <input 
                                    type="number"
                                    min="0"
                                    value={newRule.daysBefore}
                                    onChange={(e) => setNewRule({ ...newRule, daysBefore: parseInt(e.target.value) })}
                                    className="w-full pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">days</span>
                             </div>
                             <div className="flex-1 min-w-[140px]">
                                <select 
                                    value={newRule.triggerField}
                                    onChange={(e) => setNewRule({ ...newRule, triggerField: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                                >
                                    <option value="applicationDate">Before App Date</option>
                                    <option value="dueDate">Before Due Date</option>
                                    <option value="finalDateForPayment">Before Payment</option>
                                </select>
                             </div>
                             <button 
                                onClick={handleAddRule}
                                disabled={!newRule.email}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                             >
                                <Plus className="w-4 h-4" />
                             </button>
                         </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">These reminders will be applied to every payment cycle generated.</p>
                  </div>
               </div>

              {/* JCT Info Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                 <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                 <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">JCT Payment Rules</p>
                    <p>This wizard helps generate a schedule of interim payments compliant with JCT contracts. Upload your contract above to auto-populate these fields.</p>
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Period</th>
                                <th className="px-6 py-3 text-blue-600 whitespace-nowrap">App Date</th>
                                <th className="px-6 py-3 text-gray-900 font-bold whitespace-nowrap">Due Date</th>
                                <th className="px-6 py-3 text-orange-600 whitespace-nowrap">PLN Deadline</th>
                                <th className="px-6 py-3 text-green-600 whitespace-nowrap">Final Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {generatedSchedule.map((app, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900">{app.periodMonth}</td>
                                    <td className="px-6 py-3">
                                        <input 
                                            type="date"
                                            value={app.applicationDate}
                                            onChange={(e) => handleUpdateScheduleItem(idx, 'applicationDate', e.target.value)}
                                            className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[#00B5D8] rounded px-2 py-1 outline-none transition-colors text-gray-600 focus:bg-white text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-3 font-semibold">
                                        <input 
                                            type="date"
                                            value={app.dueDate}
                                            onChange={(e) => handleUpdateScheduleItem(idx, 'dueDate', e.target.value)}
                                            className="w-full bg-transparent border border-gray-200 focus:border-[#00B5D8] rounded px-2 py-1 outline-none transition-colors text-gray-900 focus:bg-white text-sm font-bold"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                         <input 
                                            type="date"
                                            value={app.payLessNoticeDate}
                                            onChange={(e) => handleUpdateScheduleItem(idx, 'payLessNoticeDate', e.target.value)}
                                            className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[#00B5D8] rounded px-2 py-1 outline-none transition-colors text-gray-600 focus:bg-white text-sm"
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                         <input 
                                            type="date"
                                            value={app.finalDateForPayment}
                                            onChange={(e) => handleUpdateScheduleItem(idx, 'finalDateForPayment', e.target.value)}
                                            className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:border-[#00B5D8] rounded px-2 py-1 outline-none transition-colors text-gray-600 focus:bg-white text-sm"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-sm text-gray-500 text-center">
                    Review the calculated dates above. You can manually edit any date before generating the schedule.
                </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-gray-100 flex justify-between bg-gray-50 rounded-b-2xl">
           {step === 2 && (
               <button 
                onClick={() => setStep(1)}
                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
               >
                   Back
               </button>
           )}
           <div className="flex gap-3 ml-auto">
               <button 
                onClick={onClose}
                className="px-6 py-2.5 text-gray-500 font-medium hover:text-gray-700 transition-colors"
               >
                   Cancel
               </button>
               {step === 1 ? (
                   <button 
                    onClick={handleGeneratePreview}
                    disabled={!config.firstDueDate}
                    className="px-6 py-2.5 bg-[#00B5D8] text-white font-bold rounded-xl hover:bg-[#009bb8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                   >
                       Calculate Dates <ArrowRight className="w-4 h-4" />
                   </button>
               ) : (
                   <button 
                    onClick={handleConfirm}
                    className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20"
                   >
                       <CheckCircle className="w-4 h-4" /> Generate Schedule
                   </button>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};