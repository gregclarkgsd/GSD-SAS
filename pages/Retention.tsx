
import React, { useState } from 'react';
import { MOCK_RETENTIONS } from '../services/mockData';
import { RetentionRecord, RetentionStatus } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { RetentionSetupWizard } from '../components/RetentionSetupWizard';
import { RetentionEditModal } from '../components/RetentionEditModal';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { AlertTriangle, ArrowRight, ShieldCheck, Search, Filter, Calendar, LayoutList, Kanban, Briefcase, AlertCircle, FileText, Users, Clock, Edit2 } from 'lucide-react';

const RETENTION_COLUMNS = [
  { id: RetentionStatus.PENDING_SETUP, title: 'To Do / Setup', color: 'bg-orange-50/50 border-orange-100' },
  { id: RetentionStatus.IN_DLP, title: 'In DLP', color: 'bg-blue-50/50 border-blue-100' },
  { id: RetentionStatus.RELEASE_DUE, title: 'Release Due', color: 'bg-green-50/50 border-green-100' },
  { id: RetentionStatus.RELEASED, title: 'Released', color: 'bg-cyan-50/50 border-cyan-100' },
  { id: RetentionStatus.PAID, title: 'Paid', color: 'bg-gray-100/50 border-gray-200' },
];

export const Retention: React.FC = () => {
  const [retentions, setRetentions] = useState<RetentionRecord[]>(MOCK_RETENTIONS);
  
  // Wizard & Modal State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RetentionRecord | null>(null);
  
  // Document Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [clientFilter, setClientFilter] = useState<string>('All Clients');
  const [yearFilter, setYearFilter] = useState<string>('All Years');
  const [periodFilter, setPeriodFilter] = useState<string>('All Periods');
  
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');

  // Derived Data for Filter Options
  const uniqueClients = Array.from(new Set(retentions.map(r => r.clientName))).sort();
  const uniqueYears = Array.from(new Set(retentions.map(r => {
      if (!r.dlpEndDate) return 'Pending';
      return r.dlpEndDate.split('-')[0];
  }))).sort().filter(y => y !== 'Pending');

  const activeRecords = retentions.filter(r => r.status !== RetentionStatus.PENDING_SETUP);

  const filteredRecords = retentions.filter(r => {
    // Status Filter
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    
    // Client Filter
    if (clientFilter !== 'All Clients' && r.clientName !== clientFilter) return false;

    // Year Filter (Based on DLP End Date)
    if (yearFilter !== 'All Years') {
        const rYear = r.dlpEndDate ? r.dlpEndDate.split('-')[0] : 'Pending';
        if (rYear !== yearFilter) return false;
    }

    // Period Filter (Quarterly based on DLP End Date)
    if (periodFilter !== 'All Periods' && r.dlpEndDate) {
        const date = new Date(r.dlpEndDate);
        const month = date.getMonth();
        const quarter = Math.floor(month / 3) + 1;
        
        if (periodFilter.startsWith('Q') && `Q${quarter}` !== periodFilter) return false;
    }

    // Search Filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
            r.projectName.toLowerCase().includes(query) || 
            r.clientName.toLowerCase().includes(query) ||
            r.projectNumber.toLowerCase().includes(query)
        );
    }

    return true;
  });

  const openSetupWizard = (record: RetentionRecord) => {
    setSelectedRecord(record);
    setIsWizardOpen(true);
  };

  const openEditModal = (record: RetentionRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleWizardSubmit = (updatedRecord: RetentionRecord) => {
    setRetentions(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    setIsWizardOpen(false);
    setSelectedRecord(null);
  };

  const handleEditSubmit = (updatedRecord: RetentionRecord) => {
    setRetentions(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    setIsEditModalOpen(false);
    setSelectedRecord(null);
  };

  const handleGenerateDocument = (record: RetentionRecord) => {
      const docData = {
          type: 'Retention Release',
          applicationNo: 'RET-001',
          date: new Date().toLocaleDateString(),
          project: {
              name: record.projectName,
              code: record.projectNumber,
              ref: record.projectId
          },
          client: {
              name: record.clientName,
              address: ['1 Main Street', 'City Center', 'London', 'SW1 1AA']
          },
          financials: {
              grossValuation: record.totalCertifiedAmountP,
              lessRetention: 0,
              netValuation: record.totalCertifiedAmountP,
              lessPrevious: record.totalCertifiedAmountP - record.totalRetentionHeldP,
              amountDue: record.totalRetentionHeldP
          }
      };
      setPreviewData(docData);
      setIsPreviewOpen(true);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, recordId: string) => {
    e.dataTransfer.setData('text/plain', recordId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: RetentionStatus) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData('text/plain');
    const record = retentions.find(r => r.id === recordId);

    if (record && record.status !== newStatus) {
      // Special Logic: If moving FROM Pending Setup TO any active state, Trigger Wizard
      if (record.status === RetentionStatus.PENDING_SETUP && newStatus !== RetentionStatus.PENDING_SETUP) {
          openSetupWizard(record);
          return;
      }

      // Otherwise just update status
      setRetentions(prev => prev.map(r => 
        r.id === recordId ? { ...r, status: newStatus } : r
      ));
    }
  };

  const handleStatusChange = (recordId: string, newStatus: string) => {
      const record = retentions.find(r => r.id === recordId);
      if (record && record.status === RetentionStatus.PENDING_SETUP && newStatus !== RetentionStatus.PENDING_SETUP) {
          openSetupWizard(record);
      } else {
          setRetentions(prev => prev.map(r => 
            r.id === recordId ? { ...r, status: newStatus as RetentionStatus } : r
          ));
      }
  };

  // Calculate Totals for KPI
  const totalHeld = activeRecords.reduce((sum, r) => sum + r.totalRetentionHeldP, 0);
  const dueRelease = activeRecords.filter(r => r.status === RetentionStatus.RELEASE_DUE).reduce((sum, r) => sum + r.totalRetentionHeldP, 0);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
            <h2 className="text-xl font-bold text-gray-900">Retention Management</h2>
            <p className="text-sm text-gray-500">Phase 3: Defects Liability Period & Final Release</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
            {/* KPI Cards Mini */}
            <div className="flex items-center gap-3">
                <div className="py-2 px-4 bg-white border-l-4 border-l-orange-500 rounded-lg shadow-sm">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total Held (DLP)</p>
                    <p className="text-base font-bold text-gray-900">{FORMAT_CURRENCY(totalHeld)}</p>
                </div>
                <div className="py-2 px-4 bg-white border-l-4 border-l-green-500 rounded-lg shadow-sm">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Due for Release</p>
                    <p className="text-base font-bold text-green-700">{FORMAT_CURRENCY(dueRelease)}</p>
                </div>
            </div>

            {/* View Toggle */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200">
                <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'kanban' 
                    ? 'bg-white text-[#00B5D8] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                >
                <Kanban className="w-4 h-4 mr-2" />
                Board
                </button>
                <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'list' 
                    ? 'bg-white text-[#00B5D8] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                >
                <LayoutList className="w-4 h-4 mr-2" />
                List
                </button>
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 pb-4 shrink-0">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search projects or clients..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] shadow-sm text-gray-900"
                />
            </div>
            
            {/* Filter Group */}
            <div className="flex flex-wrap gap-2">
                <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <select 
                        value={clientFilter}
                        onChange={(e) => setClientFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] appearance-none cursor-pointer shadow-sm text-gray-700"
                    >
                        <option>All Clients</option>
                        {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <select 
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] appearance-none cursor-pointer shadow-sm text-gray-700"
                    >
                        <option>All Years</option>
                        {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <select 
                        value={periodFilter}
                        onChange={(e) => setPeriodFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] appearance-none cursor-pointer shadow-sm text-gray-700"
                    >
                        <option>All Periods</option>
                        <option value="Q1">Q1 (Jan-Mar)</option>
                        <option value="Q2">Q2 (Apr-Jun)</option>
                        <option value="Q3">Q3 (Jul-Sep)</option>
                        <option value="Q4">Q4 (Oct-Dec)</option>
                    </select>
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] appearance-none cursor-pointer shadow-sm text-gray-700"
                    >
                        <option value="All">All Status</option>
                        <option value={RetentionStatus.PENDING_SETUP}>Pending Setup</option>
                        <option value={RetentionStatus.IN_DLP}>In DLP</option>
                        <option value={RetentionStatus.RELEASE_DUE}>Release Due</option>
                        <option value={RetentionStatus.RELEASED}>Released</option>
                        <option value={RetentionStatus.PAID}>Paid</option>
                    </select>
                </div>
            </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        
        {viewMode === 'kanban' ? (
            <div className="h-full overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-[1200px] h-full">
                    {RETENTION_COLUMNS.map(column => {
                        const columnItems = filteredRecords.filter(r => r.status === column.id);
                        const count = columnItems.length;
                        const totalValue = columnItems.reduce((sum, r) => sum + r.totalRetentionHeldP, 0);

                        return (
                            <div 
                                key={column.id} 
                                className="flex-1 flex flex-col min-w-[300px] bg-gray-100/50 rounded-2xl border border-gray-200/60 max-h-full"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
                                {/* Column Header */}
                                <div className={`p-4 border-b rounded-t-2xl backdrop-blur-sm ${column.color}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-gray-800 text-sm">{column.title}</h3>
                                        <span className="bg-white/50 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium border border-gray-200">
                                            {count}
                                        </span>
                                    </div>
                                    <div className="text-xs font-medium text-gray-500">
                                        Total Held: <span className="text-gray-900 font-bold">{FORMAT_CURRENCY(totalValue)}</span>
                                    </div>
                                </div>

                                {/* Cards */}
                                <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                    {columnItems.map(record => {
                                        const isPending = record.status === RetentionStatus.PENDING_SETUP;
                                        
                                        return (
                                            <div 
                                                key={record.id} 
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, record.id)}
                                                className={`
                                                    bg-white p-4 rounded-xl shadow-sm border transition-all group flex flex-col gap-3 relative cursor-grab active:cursor-grabbing
                                                    ${isPending ? 'border-l-4 border-l-orange-500 border-y-orange-100 border-r-orange-100' : 'border-gray-100 hover:border-[#00B5D8] hover:shadow-md'}
                                                `}
                                            >
                                                {isPending && (
                                                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                                        ACTION
                                                    </div>
                                                )}

                                                {/* Card Header */}
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-sm leading-tight mb-1">{record.projectName}</h4>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Briefcase className="w-3 h-3" /> {record.clientName}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => openEditModal(record)}
                                                        className="text-gray-300 hover:text-[#00B5D8] transition-colors p-1"
                                                        title="Edit Record"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                {/* Financials */}
                                                <div className={`grid grid-cols-2 gap-2 text-xs p-2 rounded-lg border ${isPending ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                                                    <div>
                                                        <p className="text-gray-400">Contract Value</p>
                                                        <p className="font-medium text-gray-700">{FORMAT_CURRENCY(record.contractValueP)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400">Final Acc.</p>
                                                        <p className="font-medium text-gray-700">{FORMAT_CURRENCY(record.totalCertifiedAmountP)}</p>
                                                    </div>
                                                </div>

                                                {/* Status/Action Footer */}
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                    <div className="text-xs">
                                                        <p className="text-gray-400">Retention Held</p>
                                                        <p className={`font-bold text-sm ${isPending ? 'text-orange-600' : 'text-gray-800'}`}>{FORMAT_CURRENCY(record.totalRetentionHeldP)}</p>
                                                    </div>
                                                    
                                                    {isPending ? (
                                                        <button 
                                                            onClick={() => openSetupWizard(record)}
                                                            className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-1 shadow-sm"
                                                        >
                                                            Setup DLP <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => handleGenerateDocument(record)}
                                                                className="p-1.5 text-gray-400 hover:text-[#00B5D8] hover:bg-gray-50 rounded-md transition-colors"
                                                                title="Generate Release Application"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                            </button>
                                                            <div className="text-xs text-right">
                                                                <p className="text-gray-400">DLP Ends</p>
                                                                <p className="font-medium text-gray-700 flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                                    {record.dlpEndDate || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredRecords.filter(r => r.status === column.id).length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                                            <span>Drop here</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : (
            /* List View */
            <div className="h-full overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">Project Details</th>
                                <th className="px-6 py-4 text-right">Contract Value</th>
                                <th className="px-6 py-4 text-right">Final Account Value</th>
                                <th className="px-6 py-4 text-right text-orange-500">Retention Held</th>
                                <th className="px-6 py-4">Key Dates</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRecords.length > 0 ? filteredRecords.map(record => (
                                <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">{record.projectName}</p>
                                        <p className="text-xs text-gray-500">{record.clientName} • {record.projectNumber}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-600">{FORMAT_CURRENCY(record.contractValueP)}</td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-800">{FORMAT_CURRENCY(record.totalCertifiedAmountP)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-orange-600">{FORMAT_CURRENCY(record.totalRetentionHeldP)}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-16">PC Date:</span> 
                                            <span className="font-medium text-gray-700">{record.practicalCompletionDate || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-16">DLP Ends:</span> 
                                            <span className="font-medium text-gray-700">{record.dlpEndDate || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <select 
                                            value={record.status}
                                            onChange={(e) => handleStatusChange(record.id, e.target.value)}
                                            className={`
                                                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-[#00B5D8] cursor-pointer outline-none
                                                ${record.status === RetentionStatus.IN_DLP ? 'bg-blue-100 text-blue-800' : 
                                                  record.status === RetentionStatus.RELEASE_DUE ? 'bg-green-100 text-green-800' : 
                                                  record.status === RetentionStatus.PENDING_SETUP ? 'bg-orange-100 text-orange-800' :
                                                  'bg-gray-100 text-gray-800'
                                                }
                                            `}
                                        >
                                            {Object.values(RetentionStatus).map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => openEditModal(record)}
                                                className="text-gray-400 hover:text-[#00B5D8] transition-colors p-1"
                                                title="Edit Record"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            
                                            {record.status === RetentionStatus.PENDING_SETUP ? (
                                                <button 
                                                    onClick={() => openSetupWizard(record)}
                                                    className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                                                >
                                                    Setup
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleGenerateDocument(record)}
                                                    className="text-gray-400 hover:text-[#00B5D8] transition-colors p-1"
                                                    title="Generate Release Application"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                        No retention records found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </div>

      {selectedRecord && isWizardOpen && (
        <RetentionSetupWizard 
            isOpen={isWizardOpen}
            onClose={() => { setIsWizardOpen(false); setSelectedRecord(null); }}
            record={selectedRecord}
            onSubmit={handleWizardSubmit}
        />
      )}

      {selectedRecord && isEditModalOpen && (
        <RetentionEditModal
            isOpen={isEditModalOpen}
            onClose={() => { setIsEditModalOpen(false); setSelectedRecord(null); }}
            record={selectedRecord}
            onSave={handleEditSubmit}
        />
      )}

      <DocumentPreviewModal 
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={previewData}
      />
    </div>
  );
};
