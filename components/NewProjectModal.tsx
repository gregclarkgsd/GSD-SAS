import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectStage, Project, Client, FYAllocation } from '../types';
import { NewClientModal } from './NewClientModal';
import { FINANCIAL_YEARS, FORMAT_CURRENCY, STAGE_ORDER } from '../constants';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: Omit<Project, 'id' | 'progress'>) => void;
  initialData?: Project;
  clients: Client[];
  onAddClient: (client: Client) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, initialData, clients, onAddClient }) => {
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    clientId: '',
    stage: ProjectStage.NEGOTIATION,
    contractValue: '',
    forecastBudget: '',
    retentionPercentage: 5,
    startDate: '',
    endDate: '',
    // Address Fields
    address: '',
    city: '',
    postcode: ''
  });

  // FY Allocations State
  const [allocations, setAllocations] = useState<FYAllocation[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          code: initialData.code,
          name: initialData.name,
          clientId: initialData.clientId || clients.find(c => c.name === initialData.client)?.id || '',
          stage: initialData.stage,
          contractValue: (initialData.contractValueP / 100).toFixed(2),
          forecastBudget: (initialData.forecastBudgetP / 100).toFixed(2),
          retentionPercentage: initialData.retentionPercentage || 5,
          startDate: initialData.startDate,
          endDate: initialData.endDate,
          address: initialData.address || '',
          city: initialData.city || '',
          postcode: initialData.postcode || ''
        });
        // Deep copy allocations to avoid mutating initialData directly
        setAllocations([...initialData.fyAllocations]);
        // Expand optional section if data exists
        if (initialData.address || initialData.city || initialData.postcode) {
            setShowOptional(true);
        }
      } else {
        setFormData({
          code: '',
          name: '',
          clientId: '',
          stage: ProjectStage.NEGOTIATION,
          contractValue: '',
          forecastBudget: '',
          retentionPercentage: 5,
          startDate: '',
          endDate: '',
          address: '',
          city: '',
          postcode: ''
        });
        setAllocations([]);
        setShowOptional(false);
      }
    }
  }, [isOpen, initialData, clients]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedClient = clients.find(c => c.id === formData.clientId);
    const clientName = selectedClient ? selectedClient.name : 'Unknown Client';

    onSubmit({
      code: formData.code,
      name: formData.name,
      client: clientName,
      clientId: formData.clientId,
      stage: formData.stage,
      contractValueP: parseFloat(formData.contractValue || '0') * 100, // Convert to pence
      forecastBudgetP: parseFloat(formData.forecastBudget || '0') * 100, // Convert to pence
      retentionPercentage: Number(formData.retentionPercentage),
      startDate: formData.startDate,
      endDate: formData.endDate,
      fyAllocations: allocations,
      address: formData.address,
      city: formData.city,
      postcode: formData.postcode
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewClientSubmit = (newClient: Client) => {
    onAddClient(newClient);
    setFormData(prev => ({ ...prev, clientId: newClient.id }));
    setIsClientModalOpen(false);
  };

  // FY Allocation Handlers
  const addAllocation = () => {
    const remainingFy = FINANCIAL_YEARS.find(fy => !allocations.some(a => a.fyLabel === fy));
    if (remainingFy) {
      setAllocations([...allocations, { fyLabel: remainingFy, incomeP: 0, costP: 0, progress: 0 }]);
    }
  };

  const removeAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const updateAllocation = (index: number, field: 'incomeP' | 'costP' | 'fyLabel', value: any) => {
    const newAllocations = [...allocations];
    newAllocations[index] = { ...newAllocations[index], [field]: value };
    setAllocations(newAllocations);
  };

  // Percentage Calculators
  const calculatePercentage = (amountP: number, totalP: number) => {
    if (!totalP) return 0;
    return ((amountP / totalP) * 100).toFixed(1);
  };

  const updateAllocationFromPercentage = (index: number, field: 'incomeP' | 'costP', percentage: string) => {
    const totalP = field === 'incomeP' 
      ? parseFloat(formData.contractValue || '0') * 100 
      : parseFloat(formData.forecastBudget || '0') * 100;
    
    const amountP = Math.round((parseFloat(percentage) / 100) * totalP);
    updateAllocation(index, field, amountP);
  };

  // Derived Financials
  const totalValueP = parseFloat(formData.contractValue || '0') * 100;
  const totalCostP = parseFloat(formData.forecastBudget || '0') * 100;
  const totalProfitP = totalValueP - totalCostP;
  const totalMargin = totalValueP ? (totalProfitP / totalValueP) * 100 : 0;

  const allocatedIncomeP = allocations.reduce((sum, a) => sum + a.incomeP, 0);
  const allocatedCostP = allocations.reduce((sum, a) => sum + a.costP, 0);

  const remainingIncomeP = totalValueP - allocatedIncomeP;
  const remainingCostP = totalCostP - allocatedCostP;

  // Helper to get status color and text for allocation balance
  const getAllocationStatus = (allocated: number, total: number) => {
    if (allocated === total) return { color: 'text-green-600', bg: 'bg-green-500', border: 'border-green-200', bgLight: 'bg-green-50', text: 'Balanced' };
    if (allocated > total) return { color: 'text-red-600', bg: 'bg-red-500', border: 'border-red-200', bgLight: 'bg-red-50', text: 'Over Allocated' };
    return { color: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-200', bgLight: 'bg-orange-50', text: 'Remaining' };
  };

  const incomeStatus = getAllocationStatus(allocatedIncomeP, totalValueP);
  const costStatus = getAllocationStatus(allocatedCostP, totalCostP);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? 'Edit Project' : 'Create New Project'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-6">
            <form id="project-form" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Section 1: Basic Info */}
              <div className="space-y-4">
                 <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    Basic Information
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Selection */}
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex justify-between items-center">
                          <label className="text-sm font-semibold text-gray-700">Client *</label>
                          <button 
                              type="button"
                              onClick={() => setIsClientModalOpen(true)}
                              className="flex items-center text-xs font-medium text-[#00B5D8] hover:text-[#009bb8] bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-lg transition-colors border border-cyan-100"
                          >
                              <Plus className="w-3 h-3 mr-1" />
                              New Client
                          </button>
                      </div>
                      <select
                        name="clientId"
                        required
                        value={formData.clientId}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] transition-all appearance-none text-gray-900"
                      >
                        <option value="">Select a client...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Code & Stage */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Project Code</label>
                      <input
                        type="text"
                        name="code"
                        placeholder="Leave blank for auto-gen"
                        value={formData.code}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] transition-all text-gray-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Stage *</label>
                      <select
                        name="stage"
                        value={formData.stage}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] transition-all appearance-none text-gray-900"
                      >
                        {STAGE_ORDER.map((stage) => (
                          <option key={stage} value={stage}>{stage}</option>
                        ))}
                      </select>
                    </div>

                    {/* Name */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-semibold text-gray-700">Project Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Enter project name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] transition-all text-gray-900"
                      />
                    </div>
                 </div>
              </div>

              {/* Optional: Additional Project Details (Address) */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button 
                    type="button"
                    onClick={() => setShowOptional(!showOptional)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
                  >
                      <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#00B5D8]" />
                          Additional Project Details (Optional)
                      </div>
                      {showOptional ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  
                  {showOptional && (
                      <div className="p-4 bg-white border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="space-y-4">
                              <div className="space-y-2">
                                  <label className="text-sm font-semibold text-gray-700">Project Address</label>
                                  <input
                                    type="text"
                                    name="address"
                                    placeholder="Street Address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                                  />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <label className="text-sm font-semibold text-gray-700">City</label>
                                      <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-sm font-semibold text-gray-700">Postcode</label>
                                      <input
                                        type="text"
                                        name="postcode"
                                        placeholder="Postcode"
                                        value={formData.postcode}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* Section 2: Financial Totals */}
              <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Financial Totals</h3>
                  <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Contract Value (£) *</label>
                            <input
                                type="number"
                                name="contractValue"
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.contractValue}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Forecast Budget (£) *</label>
                            <input
                                type="number"
                                name="forecastBudget"
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.forecastBudget}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Retention Percentage *</label>
                            <select
                                name="retentionPercentage"
                                value={formData.retentionPercentage}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                            >
                                <option value="0">0%</option>
                                <option value="3">3%</option>
                                <option value="5">5%</option>
                                <option value="10">10%</option>
                            </select>
                            <p className="text-xs text-gray-500">Retention amount to withhold</p>
                          </div>
                      </div>

                      {/* Summary Box */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div>
                              <p className="text-sm text-gray-500">Project Profit</p>
                              <p className={`text-lg font-bold ${totalProfitP >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                                {FORMAT_CURRENCY(totalProfitP)}
                              </p>
                          </div>
                          <div className="text-right">
                              <p className="text-sm text-gray-500">Margin</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                                  totalMargin >= 15 ? 'bg-green-100 text-green-700' :
                                  totalMargin >= 5 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                              }`}>
                                  {totalMargin.toFixed(1)}%
                              </span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Section 3: Financial Year Allocations */}
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Financial Year Allocations</h3>
                      <button 
                        type="button" 
                        onClick={addAllocation}
                        className="flex items-center px-3 py-1.5 text-sm font-medium text-[#00B5D8] bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add FY
                      </button>
                  </div>
                  
                  {/* Validation / Balance Indicator */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Income Balance Card */}
                      <div className={`p-4 rounded-xl border ${incomeStatus.bgLight} ${incomeStatus.border}`}>
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-gray-600">Income Allocation</span>
                              <span className={`text-xs font-bold ${incomeStatus.color}`}>{incomeStatus.text}</span>
                          </div>
                          <div className="flex items-end gap-2 mb-2">
                              <div className="flex-1">
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${incomeStatus.bg}`} 
                                        style={{ width: `${Math.min((allocatedIncomeP / (totalValueP || 1)) * 100, 100)}%` }}
                                      />
                                  </div>
                              </div>
                              <span className="text-xs font-medium text-gray-700 w-12 text-right">
                                {calculatePercentage(allocatedIncomeP, totalValueP)}%
                              </span>
                          </div>
                          <div className="flex justify-between text-xs">
                             <span className="text-gray-500">Allocated: {FORMAT_CURRENCY(allocatedIncomeP)}</span>
                             <span className={`font-medium ${incomeStatus.color}`}>
                                {allocatedIncomeP > totalValueP ? '+' : ''}{FORMAT_CURRENCY(remainingIncomeP * -1)}
                             </span>
                          </div>
                      </div>

                      {/* Cost Balance Card */}
                      <div className={`p-4 rounded-xl border ${costStatus.bgLight} ${costStatus.border}`}>
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-gray-600">Cost Allocation</span>
                              <span className={`text-xs font-bold ${costStatus.color}`}>{costStatus.text}</span>
                          </div>
                          <div className="flex items-end gap-2 mb-2">
                              <div className="flex-1">
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${costStatus.bg}`} 
                                        style={{ width: `${Math.min((allocatedCostP / (totalCostP || 1)) * 100, 100)}%` }}
                                      />
                                  </div>
                              </div>
                              <span className="text-xs font-medium text-gray-700 w-12 text-right">
                                {calculatePercentage(allocatedCostP, totalCostP)}%
                              </span>
                          </div>
                          <div className="flex justify-between text-xs">
                             <span className="text-gray-500">Allocated: {FORMAT_CURRENCY(allocatedCostP)}</span>
                             <span className={`font-medium ${costStatus.color}`}>
                                {allocatedCostP > totalCostP ? '+' : ''}{FORMAT_CURRENCY(remainingCostP * -1)}
                             </span>
                          </div>
                      </div>
                  </div>
                  
                  {allocations.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
                        No allocations yet. Click "Add FY" to split the project totals across financial years.
                    </div>
                  ) : (
                    <div className="space-y-3">
                        {allocations.map((alloc, index) => (
                            <div key={index} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <select 
                                        value={alloc.fyLabel}
                                        onChange={(e) => updateAllocation(index, 'fyLabel', e.target.value)}
                                        className="bg-transparent font-semibold text-gray-900 focus:outline-none cursor-pointer hover:text-[#00B5D8]"
                                    >
                                        {FINANCIAL_YEARS.map(fy => (
                                            <option key={fy} value={fy}>{fy}</option>
                                        ))}
                                    </select>
                                    <button 
                                        type="button" 
                                        onClick={() => removeAllocation(index)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Income Allocation */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500">Allocated Income</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">£</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={(alloc.incomeP / 100).toFixed(2)}
                                                    onChange={(e) => updateAllocation(index, 'incomeP', Math.round(parseFloat(e.target.value || '0') * 100))}
                                                    className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                                                />
                                            </div>
                                            <div className="relative w-20">
                                                <input
                                                    type="number"
                                                    placeholder="%"
                                                    value={calculatePercentage(alloc.incomeP, totalValueP)}
                                                    onChange={(e) => updateAllocationFromPercentage(index, 'incomeP', e.target.value)}
                                                    className="w-full pl-2 pr-6 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cost Allocation */}
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500">Allocated Cost</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">£</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={(alloc.costP / 100).toFixed(2)}
                                                    onChange={(e) => updateAllocation(index, 'costP', Math.round(parseFloat(e.target.value || '0') * 100))}
                                                    className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                                                />
                                            </div>
                                            <div className="relative w-20">
                                                <input
                                                    type="number"
                                                    placeholder="%"
                                                    value={calculatePercentage(alloc.costP, totalCostP)}
                                                    onChange={(e) => updateAllocationFromPercentage(index, 'costP', e.target.value)}
                                                    className="w-full pl-2 pr-6 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                  )}
              </div>

              {/* Section 4: Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Start Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                name="startDate"
                                required
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900 appearance-none"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">End Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                name="endDate"
                                required
                                value={formData.endDate}
                                onChange={handleChange}
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] text-gray-900 appearance-none"
                            />
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 px-6 py-4 border-t border-gray-100 shrink-0 bg-white rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="project-form"
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#00B5D8] hover:bg-[#009bb8] rounded-xl shadow-md shadow-cyan-500/20 transition-all"
            >
              {initialData ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>

      <NewClientModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSubmit={handleNewClientSubmit}
      />
    </>
  );
};