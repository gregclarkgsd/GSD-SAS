import React, { useState } from 'react';
import { MOCK_APPLICATIONS, MOCK_PROJECTS, MOCK_CLIENTS, MOCK_RETENTIONS } from '../services/mockData';
import { ApplicationStatus, Project, ProjectStage, Application, RetentionRecord, RetentionStatus } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { Plus, Calendar, AlertTriangle, ArrowRight, LayoutList, Kanban, PieChart, BarChart3, CheckCircle, FileText } from 'lucide-react';
import { ApplicationSetupWizard } from '../components/ApplicationSetupWizard';
import { Badge } from '../components/Badge';
import { ApplicationDetailModal } from '../components/ApplicationDetailModal';
import { ReportingView } from '../components/ReportingView';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';

const COLUMNS = [
  { id: ApplicationStatus.TO_DO, title: 'To Do', color: 'bg-gray-500' },
  { id: ApplicationStatus.APPLIED, title: 'Applied', color: 'bg-blue-500' },
  { id: ApplicationStatus.CERTIFIED, title: 'Certified', color: 'bg-indigo-500' },
  { id: ApplicationStatus.INVOICED, title: 'Invoiced', color: 'bg-cyan-500' },
  { id: ApplicationStatus.PAID, title: 'Paid', color: 'bg-emerald-500' },
];

const MONTHS = [
    'All Months', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>(MOCK_APPLICATIONS);
  const [retentions, setRetentions] = useState<RetentionRecord[]>(MOCK_RETENTIONS); // In real app, this would come from a store/context
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'reporting'>('overview');

  // View State (Overview Tab)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [monthFilter, setMonthFilter] = useState<string>('All Months');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardProject, setWizardProject] = useState<Project | null>(null);
  const [wizardClientTerms, setWizardClientTerms] = useState<number>(30);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Document Preview State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Derived Data
  const availableYears = Array.from(new Set(MOCK_APPLICATIONS.map(a => a.dueDate.split('-')[0]))).sort();
  if (!availableYears.includes(new Date().getFullYear().toString())) {
      availableYears.push(new Date().getFullYear().toString());
  }
  availableYears.sort();

  // Filter Applications
  const filteredApplications = applications.filter(app => {
      const appYear = app.dueDate.split('-')[0];
      // Match Year
      if (yearFilter !== 'All Years' && appYear !== yearFilter) return false;
      
      // Match Month
      if (monthFilter !== 'All Months') {
          if (!app.periodMonth.includes(monthFilter)) return false;
      }

      // Match Status
      if (statusFilter !== 'All Statuses' && app.status !== statusFilter) return false;

      return true;
  });

  // Identify projects that are "Active" (Pre-Start or On-Site) but don't have any applications generated yet
  const unscheduledProjects = MOCK_PROJECTS.filter(project => {
    const isProjectActive = project.stage === ProjectStage.ON_SITE || project.stage === ProjectStage.PRE_START;
    const hasApplications = applications.some(app => app.projectId === project.id);
    return isProjectActive && !hasApplications;
  });

  const openWizard = (project: Project) => {
    const client = MOCK_CLIENTS.find(c => c.id === project.clientId) || MOCK_CLIENTS.find(c => c.name === project.client);
    setWizardClientTerms(client?.paymentTermDays || 30);
    setWizardProject(project);
    setIsWizardOpen(true);
  };

  const handleWizardSubmit = (newApplications: Application[]) => {
    setApplications(prev => [...prev, ...newApplications]);
    setIsWizardOpen(false);
    setWizardProject(null);
  };

  const handleEditClick = (app: Application) => {
      setSelectedApplication(app);
      setIsEditModalOpen(true);
  };

  const handleSaveApplication = (updatedApp: Application) => {
      setApplications(prev => prev.map(a => a.id === updatedApp.id ? updatedApp : a));
  };

  const handleGenerateDocument = (app: Application) => {
      const project = MOCK_PROJECTS.find(p => p.id === app.projectId);
      
      const docData = {
          type: 'Interim',
          applicationNo: app.id,
          date: app.applicationDate,
          project: {
              name: app.projectName,
              code: project?.code || '',
              ref: app.projectId
          },
          client: {
              name: project?.client || 'Client',
              address: ['1 Main Street', 'City Center', 'London', 'SW1 1AA'] // Mock
          },
          financials: {
              grossValuation: app.grossCertifiedAmountP,
              lessRetention: app.retentionDeductedP,
              netValuation: app.certifiedAmountP,
              lessPrevious: 0, // In real app, sum previous certified amounts
              amountDue: app.certifiedAmountP
          }
      };
      setPreviewData(docData);
      setIsPreviewOpen(true);
  };

  const handleFinalizeProject = (project: Project, currentApps = applications) => {
      if (window.confirm(`Are you sure you want to create the Final Account for ${project.name}? This will stop monthly applications and move the project to the Retention tab.`)) {
          const projectApps = currentApps.filter(a => a.projectId === project.id);
          const totalCertified = projectApps.reduce((sum, a) => sum + a.grossCertifiedAmountP, 0);
          const totalRetention = projectApps.reduce((sum, a) => sum + a.retentionDeductedP, 0);

          const newRetention: RetentionRecord = {
              id: `RET-${Math.random().toString(36).substr(2, 9)}`,
              projectId: project.id,
              projectName: project.name,
              clientName: project.client,
              projectNumber: project.code,
              contractValueP: project.contractValueP,
              totalCertifiedAmountP: totalCertified,
              totalRetentionHeldP: totalRetention,
              status: RetentionStatus.PENDING_SETUP,
              amountReleasedP: 0
          };

          MOCK_RETENTIONS.push(newRetention); 
          project.stage = ProjectStage.FINAL_ACCOUNT;
          
          alert(`Project ${project.name} moved to Final Account. Retention record created.`);
          window.location.hash = '#/retention';
      }
  };

  const handleFinalizeFromModal = (updatedApp: Application) => {
      const updatedApplications = applications.map(a => a.id === updatedApp.id ? updatedApp : a);
      setApplications(updatedApplications); 
      
      const project = MOCK_PROJECTS.find(p => p.id === updatedApp.projectId);
      
      if (project) {
          handleFinalizeProject(project, updatedApplications);
          setIsEditModalOpen(false);
      }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Top Controls & Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 shrink-0">
        
        {/* Left: Title & Tab Navigation */}
        <div className="flex items-center gap-6 w-full xl:w-auto">
            <h2 className="text-xl font-bold text-gray-900">Applications</h2>
            
            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'overview'
                            ? 'bg-white text-[#00B5D8] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <LayoutList className="w-4 h-4 mr-2" />
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('reporting')}
                    className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'reporting'
                            ? 'bg-white text-[#00B5D8] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Reporting
                </button>
            </div>
        </div>

        {/* Right: Tab Specific Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto justify-end">
            
            {activeTab === 'overview' && (
                <>
                    {/* New Button */}
                    <button className="order-last sm:order-first flex items-center px-4 py-2 bg-[#00B5D8] text-white rounded-xl text-sm font-medium hover:bg-[#009bb8] shadow-md shadow-cyan-500/20 transition-all whitespace-nowrap">
                        <Plus className="w-4 h-4 mr-2" />
                        New App
                    </button>

                    {/* Date Filters */}
                    <div className="flex gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <select 
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="bg-transparent text-sm font-medium text-gray-700 px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer hover:bg-gray-50"
                        >
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <div className="w-[1px] bg-gray-200"></div>
                        <select 
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="bg-transparent text-sm font-medium text-gray-700 px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer hover:bg-gray-50"
                        >
                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="w-[1px] bg-gray-200"></div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-sm font-medium text-gray-700 px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer hover:bg-gray-50"
                        >
                            <option>All Statuses</option>
                            <option value={ApplicationStatus.TO_DO}>To Do</option>
                            <option value={ApplicationStatus.APPLIED}>Applied</option>
                            <option value={ApplicationStatus.CERTIFIED}>Certified</option>
                            <option value={ApplicationStatus.INVOICED}>Invoiced</option>
                            <option value={ApplicationStatus.PAID}>Paid</option>
                        </select>
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
                </>
            )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
          <>
            {/* Pending Setup Section */}
            {unscheduledProjects.length > 0 && (
                <div className="mb-8 shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Action Required: Project Schedule Setup</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {unscheduledProjects.map(project => (
                            <div 
                            key={`setup-${project.id}`} 
                            className="bg-white border-l-4 border-l-orange-500 p-4 rounded-r-xl shadow-sm border-y border-r border-gray-100 flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 leading-tight">{project.name}</h4>
                                    <span className="text-[10px] font-semibold bg-orange-50 text-orange-600 px-2 py-1 rounded-md uppercase">
                                        Needs Setup
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mb-4">{project.client}</p>
                                <button 
                                    onClick={() => openWizard(project)}
                                    className="mt-auto w-full flex items-center justify-center py-2 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors border border-orange-100"
                                >
                                    Configure Schedule <ArrowRight className="w-3 h-3 ml-1" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Overview Area */}
            {viewMode === 'kanban' ? (
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-6 min-w-[1000px] h-full">
                    {COLUMNS.map(column => {
                        const columnApps = filteredApplications.filter(a => a.status === column.id);
                        const total = columnApps.reduce((sum, a) => sum + a.amountP, 0);
                        const itemsCount = columnApps.length;

                        return (
                        <div key={column.id} className="flex-1 flex flex-col min-w-[280px] bg-gray-100/50 rounded-2xl border border-gray-200/60 max-h-full">
                            {/* Column Header */}
                            <div className="p-4 border-b border-gray-200/60 bg-white/50 rounded-t-2xl backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${column.color}`} />
                                <h3 className="font-semibold text-gray-700 text-sm">{column.title}</h3>
                                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                    {itemsCount}
                                </span>
                                </div>
                            </div>
                            <div className="text-xs font-medium text-gray-500">
                                Total: <span className="text-gray-900">{FORMAT_CURRENCY(total)}</span>
                            </div>
                            </div>

                            {/* Cards Container */}
                            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                            
                            {columnApps.map(app => (
                                <div 
                                    key={app.id} 
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#00B5D8] transition-all cursor-pointer group relative"
                                >
                                    <div 
                                        className="absolute inset-0 z-0"
                                        onClick={() => handleEditClick(app)}
                                    />
                                    <div className="flex justify-between items-start mb-2 relative z-10 pointer-events-none">
                                        <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                                        {app.periodMonth}
                                        </span>
                                        <div className="opacity-0 group-hover:opacity-100 text-xs text-[#00B5D8] font-medium">Edit</div>
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-1 leading-tight pointer-events-none">{app.projectName}</h4>
                                    <div className="text-lg font-bold text-gray-900 mb-3 pointer-events-none">
                                        {FORMAT_CURRENCY(app.amountP)}
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 relative z-10">
                                        <div className="flex items-center text-xs text-gray-400 pointer-events-none">
                                            <Calendar className="w-3 h-3 mr-1.5" />
                                            Due: {app.dueDate}
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleGenerateDocument(app); }}
                                            className="p-1.5 text-gray-400 hover:text-[#00B5D8] hover:bg-gray-50 rounded-md transition-colors"
                                            title="Generate Application Document"
                                        >
                                            <FileText className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {itemsCount === 0 && (
                                <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                                    <LayoutList className="w-5 h-5 opacity-50" />
                                    <span>No items for {monthFilter} {yearFilter}</span>
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
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4">Period</th>
                                    <th className="px-6 py-4">Project</th>
                                    <th className="px-6 py-4 text-right">Applied (£)</th>
                                    <th className="px-6 py-4 text-right">Gross Cert (£)</th>
                                    <th className="px-6 py-4 text-right text-orange-500">Retention (£)</th>
                                    <th className="px-6 py-4 text-right text-indigo-700">Net Cert (£)</th>
                                    <th className="px-6 py-4 text-right text-cyan-600">Invoiced (£)</th>
                                    <th className="px-6 py-4">Dates</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredApplications.length > 0 ? filteredApplications.map(app => (
                                    <tr key={app.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900">{app.periodMonth}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-800">{app.projectName}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right text-blue-600">{FORMAT_CURRENCY(app.appliedAmountP)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-700">{FORMAT_CURRENCY(app.grossCertifiedAmountP || 0)}</td>
                                        <td className="px-6 py-4 text-right text-orange-500">-{FORMAT_CURRENCY(app.retentionDeductedP || 0)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-indigo-700">{FORMAT_CURRENCY(app.certifiedAmountP)}</td>
                                        <td className="px-6 py-4 text-right text-cyan-600">{FORMAT_CURRENCY(app.invoicedAmountP)}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500 space-y-1">
                                            <div className="flex justify-between gap-2"><span>Due:</span> <span className="font-medium text-gray-700">{app.dueDate}</span></div>
                                            <div className="flex justify-between gap-2"><span>Pay Less:</span> <span className="text-gray-600">{app.payLessNoticeDate}</span></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge status={app.status} size="sm" />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleEditClick(app)}
                                                    className="text-gray-400 hover:text-[#00B5D8] font-medium text-xs uppercase transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleGenerateDocument(app)}
                                                    className="text-gray-400 hover:text-[#00B5D8] transition-colors"
                                                    title="Generate Document"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const project = MOCK_PROJECTS.find(p => p.id === app.projectId);
                                                        if (project) handleFinalizeProject(project);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-green-600 hover:text-green-700 transition-opacity"
                                                    title="Create Final Account"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                                            No applications found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </>
      ) : (
          <div className="flex-1 overflow-y-auto">
              <ReportingView />
          </div>
      )}

      {/* Modals */}
      {wizardProject && (
          <ApplicationSetupWizard 
             isOpen={isWizardOpen}
             onClose={() => { setIsWizardOpen(false); setWizardProject(null); }}
             project={wizardProject}
             clientPaymentTermsDays={wizardClientTerms}
             onSubmit={handleWizardSubmit}
          />
      )}

      {selectedApplication && (
          <ApplicationDetailModal 
            isOpen={isEditModalOpen}
            onClose={() => { setIsEditModalOpen(false); setSelectedApplication(null); }}
            application={selectedApplication}
            onSave={handleSaveApplication}
            onFinalize={handleFinalizeFromModal}
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