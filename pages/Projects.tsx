import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProjectModal } from '../components/NewProjectModal';
import { ProjectAnalytics } from '../components/ProjectAnalytics';
import { MOCK_PROJECTS, MOCK_CLIENTS } from '../services/mockData';
import { FORMAT_CURRENCY, FINANCIAL_YEARS, STAGE_ORDER } from '../constants';
import { Filter, Plus, Download, Layers, PieChart, Calendar as CalendarIcon, Check, Search, Users, AlertTriangle, ChevronDown, ChevronRight, Trash2, BarChart3 } from 'lucide-react';
import { Project, ProjectStage, Client, FYAllocation } from '../types';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All Stages');
  const [clientFilter, setClientFilter] = useState<string>('All Clients');
  
  // View Control States
  const [viewMode, setViewMode] = useState<'totals' | 'fy' | 'analytics'>('totals');
  const [selectedFy, setSelectedFy] = useState<string>(FINANCIAL_YEARS[1]); // Default to current FY (e.g., 24/25)

  // Inline Editing State
  const [editingCell, setEditingCell] = useState<{ projectId: string, field: string } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Row Expansion State
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const handleSaveProject = (projectData: Omit<Project, 'id' | 'progress'>) => {
    if (editingProject) {
      // Update existing project
      const updatedProject = { ...editingProject, ...projectData };
      setProjects(prev => prev.map(p => 
        p.id === editingProject.id 
          ? updatedProject
          : p
      ));
    } else {
      // Create new project
      const newProject: Project = {
        ...projectData,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
      };
      setProjects(prev => [newProject, ...prev]);
    }
    setIsModalOpen(false);
    setEditingProject(undefined);
  };

  const handleAddClient = (newClient: Client) => {
    setClients(prev => [...prev, newClient]);
  };

  const openNewProjectModal = () => {
    setEditingProject(undefined);
    setIsModalOpen(true);
  };

  const openEditProjectModal = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  // Row Expansion Handlers
  const toggleRow = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAddFy = (projectId: string) => {
    setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        const existingFys = p.fyAllocations.map(a => a.fyLabel);
        const nextFy = FINANCIAL_YEARS.find(fy => !existingFys.includes(fy));
        
        if (!nextFy) {
            alert('All available financial years have been allocated.');
            return p;
        }

        return {
            ...p,
            fyAllocations: [
                ...p.fyAllocations,
                { fyLabel: nextFy, incomeP: 0, costP: 0, progress: 0 }
            ]
        };
    }));
  };

  const handleRemoveFy = (projectId: string, fyLabel: string) => {
    if (window.confirm(`Are you sure you want to remove the allocation for ${fyLabel}?`)) {
        setProjects(prev => prev.map(p => {
            if (p.id !== projectId) return p;
            return {
                ...p,
                fyAllocations: p.fyAllocations.filter(a => a.fyLabel !== fyLabel)
            };
        }));
    }
  };

  const handleUpdateFy = (projectId: string, fyLabel: string, field: keyof FYAllocation, value: number) => {
    setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return {
            ...p,
            fyAllocations: p.fyAllocations.map(a => {
                if (a.fyLabel !== fyLabel) return a;
                return { ...a, [field]: value };
            })
        };
    }));
  };

  // Inline Editing Handlers
  const startEditing = (projectId: string, field: string, value: number) => {
    setEditingCell({ projectId, field });
    if (field === 'progress') {
        setInputValue(value.toString());
    } else {
        setInputValue((value / 100).toFixed(2));
    }
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setInputValue('');
  };

  const saveEditing = () => {
    if (!editingCell) return;

    // Determine value type based on field
    let finalValue = 0;
    if (editingCell.field === 'progress') {
        finalValue = Math.min(100, Math.max(0, parseInt(inputValue) || 0));
    } else {
        finalValue = Math.round(parseFloat(inputValue) * 100);
    }

    setProjects(prev => prev.map(p => {
      if (p.id !== editingCell.projectId) return p;

      if (viewMode === 'totals') {
        // Update root project properties
        return { ...p, [editingCell.field]: finalValue };
      } else {
        // Update FY Allocations
        const newAllocations = [...p.fyAllocations];
        const fyIndex = newAllocations.findIndex(a => a.fyLabel === selectedFy);
        
        // Map generic field names to FY allocation properties
        let allocField: 'incomeP' | 'costP' | 'progress';
        if (editingCell.field === 'income') allocField = 'incomeP';
        else if (editingCell.field === 'cost') allocField = 'costP';
        else if (editingCell.field === 'progress') allocField = 'progress';
        else return p; // Should not happen

        if (fyIndex >= 0) {
           newAllocations[fyIndex] = {
             ...newAllocations[fyIndex],
             [allocField]: finalValue
           };
        } else {
          // Create new allocation if missing
          newAllocations.push({
            fyLabel: selectedFy,
            incomeP: allocField === 'incomeP' ? finalValue : 0,
            costP: allocField === 'costP' ? finalValue : 0,
            progress: allocField === 'progress' ? finalValue : 0,
          });
        }
        return { ...p, fyAllocations: newAllocations };
      }
    }));
    setEditingCell(null);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const filteredProjects = projects
    .filter(project => {
      // Stage Filter
      if (stageFilter !== 'All Stages' && project.stage !== stageFilter) return false;
      
      // Client Filter
      if (clientFilter !== 'All Clients' && project.client !== clientFilter) return false;
      
      // Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesCode = project.code.toLowerCase().includes(query);
        const matchesName = project.name.toLowerCase().includes(query);
        if (!matchesCode && !matchesName) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const indexA = STAGE_ORDER.indexOf(a.stage);
      const indexB = STAGE_ORDER.indexOf(b.stage);
      return indexA - indexB;
    });

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
        
        {/* Left Side: Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search project or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/50 focus:border-[#00B5D8] transition-all text-gray-900 shadow-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Client Filter */}
          <div className="relative w-full sm:w-auto">
            <select 
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-[#00B5D8] shadow-sm text-sm cursor-pointer min-w-[160px] text-gray-900"
            >
              <option>All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.name}>{client.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <Users className="w-4 h-4" />
            </div>
          </div>

          {/* Stage Filter */}
          <div className="relative w-full sm:w-auto">
            <select 
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-[#00B5D8] shadow-sm text-sm cursor-pointer min-w-[160px] text-gray-900"
            >
              <option>All Stages</option>
              {STAGE_ORDER.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <Filter className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Center/Right: View Toggle & FY Selector */}
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* View Toggle */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200 self-start sm:self-auto">
            <button
              onClick={() => { setViewMode('totals'); cancelEditing(); }}
              className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'totals' 
                  ? 'bg-white text-[#00B5D8] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers className="w-4 h-4 mr-2" />
              Totals
            </button>
            <button
              onClick={() => { setViewMode('fy'); cancelEditing(); }}
              className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'fy' 
                  ? 'bg-white text-[#00B5D8] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PieChart className="w-4 h-4 mr-2" />
              FY View
            </button>
            <button
              onClick={() => { setViewMode('analytics'); cancelEditing(); }}
              className={`flex items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'analytics' 
                  ? 'bg-white text-[#00B5D8] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>
          </div>

          {/* FY Dropdown (Visible in FY & Analytics modes) */}
          {(viewMode === 'fy' || viewMode === 'analytics') && (
            <div className="relative animate-in fade-in slide-in-from-left-2 duration-200 self-start sm:self-auto">
              <select 
                value={selectedFy}
                onChange={(e) => { setSelectedFy(e.target.value); cancelEditing(); }}
                className="appearance-none bg-white border border-[#00B5D8] text-[#00B5D8] font-medium py-2.5 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 shadow-sm text-sm cursor-pointer text-gray-900"
              >
                {FINANCIAL_YEARS.map(fy => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#00B5D8]">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
          )}
          
           {/* Right Side: Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button 
              onClick={openNewProjectModal}
              className="flex items-center px-4 py-2.5 bg-[#00B5D8] text-white rounded-xl text-sm font-medium hover:bg-[#009bb8] shadow-md shadow-cyan-500/20 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'analytics' ? (
          <div className="flex-1 overflow-y-auto">
              <ProjectAnalytics projects={filteredProjects} selectedFy={selectedFy} />
          </div>
      ) : (
          <Card className="overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left text-gray-500 relative">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="w-10 px-6 py-4 bg-gray-50/90"></th>
                    <th className="px-6 py-4 font-semibold w-24 bg-gray-50/90">Code</th>
                    <th className="px-6 py-4 font-semibold min-w-[200px] bg-gray-50/90">Project Name</th>
                    <th className="px-6 py-4 font-semibold bg-gray-50/90">Client</th>
                    <th className="px-6 py-4 font-semibold bg-gray-50/90">Stage</th>
                    
                    {/* Dynamic Columns based on View Mode */}
                    <th className="px-6 py-4 font-semibold text-right bg-gray-50/90">
                      {viewMode === 'totals' ? 'Total Value' : `${selectedFy} Income`}
                    </th>
                    
                    {viewMode === 'fy' && (
                        <>
                            <th className="px-6 py-4 font-semibold text-right bg-gray-50/90">Progress</th>
                            <th className="px-6 py-4 font-semibold text-right text-green-600 bg-gray-50/90">Completed</th>
                            <th className="px-6 py-4 font-semibold text-right text-orange-500 bg-gray-50/90">Outstanding</th>
                        </>
                    )}

                    <th className="px-6 py-4 font-semibold text-right bg-gray-50/90">
                      {viewMode === 'totals' ? 'Total Cost' : `${selectedFy} Cost`}
                    </th>
                    <th className="px-6 py-4 font-semibold text-right text-gray-700 bg-gray-50/90">
                      {viewMode === 'totals' ? 'Net Profit' : `${selectedFy} Profit`}
                    </th>
                    <th className="px-6 py-4 font-semibold text-right text-gray-700 bg-gray-50/90">
                      Margin %
                    </th>
                    
                    {/* Only show progress in Totals view */}
                    {viewMode === 'totals' && <th className="px-6 py-4 font-semibold text-right bg-gray-50/90">Progress</th>}
                    <th className="px-6 py-4 text-center bg-gray-50/90">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => {
                      let displayValue = 0;
                      let displayCost = 0;
                      let displayProgress = 0;
                      let valueField = '';
                      let costField = '';
                      
                      // Validation Check
                      const allocatedIncome = project.fyAllocations.reduce((sum, a) => sum + a.incomeP, 0);
                      const allocatedCost = project.fyAllocations.reduce((sum, a) => sum + a.costP, 0);
                      const hasAllocationWarning = allocatedIncome !== project.contractValueP || allocatedCost !== project.forecastBudgetP;

                      if (viewMode === 'totals') {
                        displayValue = project.contractValueP;
                        displayCost = project.forecastBudgetP;
                        displayProgress = project.progress;
                        valueField = 'contractValueP';
                        costField = 'forecastBudgetP';
                      } else {
                        // Find allocation for selected FY
                        const allocation = project.fyAllocations.find(a => a.fyLabel === selectedFy);
                        displayValue = allocation ? allocation.incomeP : 0;
                        displayCost = allocation ? allocation.costP : 0;
                        displayProgress = allocation ? allocation.progress : 0;
                        valueField = 'income'; // Mapped internally in saveEditing
                        costField = 'cost';
                      }

                      const profit = displayValue - displayCost;
                      const margin = displayValue > 0 ? (profit / displayValue) * 100 : 0;
                      
                      // Value Completed Calculation
                      const valueCompletedP = Math.round(displayValue * (displayProgress / 100));
                      const valueOutstandingP = displayValue - valueCompletedP;

                      // Render function for editable cells
                      const renderEditableCell = (field: string, value: number, type: 'money' | 'percent', textColor: string = 'text-gray-900') => {
                        const isEditing = editingCell?.projectId === project.id && editingCell?.field === field;
                        
                        if (isEditing) {
                          return (
                            <div className="flex items-center justify-end gap-1">
                              {type === 'money' && <span className="text-gray-400 text-xs">£</span>}
                              <input
                                ref={inputRef}
                                type="number"
                                step={type === 'money' ? "0.01" : "1"}
                                min="0"
                                max={type === 'percent' ? "100" : undefined}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={saveEditing}
                                className="w-20 px-2 py-1 text-right text-sm border border-[#00B5D8] rounded focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 text-gray-900"
                              />
                              {type === 'percent' && <span className="text-gray-400 text-xs">%</span>}
                            </div>
                          );
                        }

                        return (
                          <div 
                            onClick={() => startEditing(project.id, field, value)}
                            className={`cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors text-right font-medium ${textColor} group/cell relative`}
                            title="Click to edit"
                          >
                            {type === 'money' ? FORMAT_CURRENCY(value) : `${value}%`}
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 -mr-6 text-gray-400">
                              <Check className="w-3 h-3" />
                            </span>
                          </div>
                        );
                      };

                      const isExpanded = expandedId === project.id;

                      return (
                        <React.Fragment key={project.id}>
                        <tr className={`bg-white hover:bg-gray-50 transition-colors group ${isExpanded ? 'bg-gray-50' : ''}`}>
                          <td className="px-6 py-4 text-center">
                            <button 
                                onClick={() => toggleRow(project.id)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-[#00B5D8] transition-colors"
                            >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-500 text-xs">{project.code}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <span 
                                className="hover:text-[#00B5D8] hover:underline cursor-pointer transition-colors"
                                onClick={() => openEditProjectModal(project)}
                              >
                                {project.name}
                              </span>
                              {hasAllocationWarning && (
                                <div className="group/tooltip relative">
                                    <AlertTriangle className="w-4 h-4 text-orange-500 cursor-help" />
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                        FY Allocations do not match Project Totals. Check edit details.
                                    </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{project.client}</td>
                          <td className="px-6 py-4">
                            <Badge status={project.stage} size="sm" />
                          </td>
                          
                          {/* Editable Financials */}
                          <td className="px-6 py-4">
                            {renderEditableCell(valueField, displayValue, 'money')}
                          </td>

                          {/* FY Specific Columns */}
                          {viewMode === 'fy' && (
                            <>
                                <td className="px-6 py-4">
                                    {renderEditableCell('progress', displayProgress, 'percent')}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-green-600">
                                    {FORMAT_CURRENCY(valueCompletedP)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-orange-500">
                                    {FORMAT_CURRENCY(valueOutstandingP)}
                                </td>
                            </>
                          )}

                          <td className="px-6 py-4">
                            {renderEditableCell(costField, displayCost, 'money', 'text-gray-600')}
                          </td>
                          
                          {/* Computed columns (Not editable directly) */}
                          <td className={`px-6 py-4 text-right font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {FORMAT_CURRENCY(profit)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              margin >= 15 ? 'bg-green-100 text-green-700' :
                              margin >= 5 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>

                          {/* Progress (Totals View Only) */}
                          {viewMode === 'totals' && (
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                          className={`h-full ${project.progress === 100 ? 'bg-green-500' : 'bg-[#00B5D8]'}`}
                                          style={{ width: `${project.progress}%` }}
                                      />
                                  </div>
                                  <span className="text-xs font-medium w-8 text-right">{project.progress}%</span>
                              </div>
                            </td>
                          )}
                          
                          <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                            <button 
                              onClick={() => openEditProjectModal(project)}
                              className="text-gray-400 hover:text-[#00B5D8] transition-colors font-medium text-xs uppercase"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                            <tr className="bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-200">
                                <td colSpan={viewMode === 'totals' ? 12 : 14} className="p-0">
                                    <div className="p-6 pl-16 bg-gray-50 border-b border-gray-200 shadow-inner">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-gray-800 text-sm">Financial Year Allocations</h4>
                                            <button 
                                                onClick={() => handleAddFy(project.id)}
                                                className="flex items-center px-3 py-1.5 text-xs font-medium text-[#00B5D8] bg-white border border-[#00B5D8]/20 hover:bg-[#00B5D8]/5 rounded-lg transition-colors"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Add FY
                                            </button>
                                        </div>
                                        
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="text-gray-500 border-b border-gray-200/60">
                                                        <th className="text-left py-2 px-4">Financial Year</th>
                                                        <th className="text-right py-2 px-4">Income Allocation</th>
                                                        <th className="text-right py-2 px-4">Cost Allocation</th>
                                                        <th className="text-right py-2 px-4">Progress %</th>
                                                        <th className="text-right py-2 px-4 text-green-600">Value Completed</th>
                                                        <th className="text-right py-2 px-4 text-orange-500">Value Outstanding</th>
                                                        <th className="text-right py-2 px-4">Margin %</th>
                                                        <th className="py-2 px-4"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {project.fyAllocations.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={8} className="py-4 text-center text-gray-400 italic">No allocations yet.</td>
                                                        </tr>
                                                    ) : (
                                                        project.fyAllocations.sort((a,b) => a.fyLabel.localeCompare(b.fyLabel)).map((alloc, idx) => {
                                                            const allocProfit = alloc.incomeP - alloc.costP;
                                                            const allocMargin = alloc.incomeP > 0 ? (allocProfit / alloc.incomeP) * 100 : 0;
                                                            const comp = Math.round(alloc.incomeP * (alloc.progress / 100));
                                                            const out = alloc.incomeP - comp;

                                                            return (
                                                                <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                                                                    <td className="py-2 px-4 font-medium text-gray-700">{alloc.fyLabel}</td>
                                                                    <td className="py-2 px-4 text-right">
                                                                        <div className="flex items-center justify-end gap-1">
                                                                            <span className="text-gray-400 text-[10px]">£</span>
                                                                            <input 
                                                                                type="number"
                                                                                className="w-20 bg-transparent text-right focus:bg-white focus:ring-2 focus:ring-[#00B5D8]/20 rounded px-1 py-0.5 outline-none text-gray-900"
                                                                                value={(alloc.incomeP / 100).toFixed(2)}
                                                                                onChange={(e) => handleUpdateFy(project.id, alloc.fyLabel, 'incomeP', Math.round(parseFloat(e.target.value || '0') * 100))}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-4 text-right">
                                                                        <div className="flex items-center justify-end gap-1">
                                                                            <span className="text-gray-400 text-[10px]">£</span>
                                                                            <input 
                                                                                type="number"
                                                                                className="w-20 bg-transparent text-right focus:bg-white focus:ring-2 focus:ring-[#00B5D8]/20 rounded px-1 py-0.5 outline-none text-gray-900"
                                                                                value={(alloc.costP / 100).toFixed(2)}
                                                                                onChange={(e) => handleUpdateFy(project.id, alloc.fyLabel, 'costP', Math.round(parseFloat(e.target.value || '0') * 100))}
                                                                            />
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-4 text-right">
                                                                        <div className="flex items-center justify-end gap-1">
                                                                            <input 
                                                                                type="number"
                                                                                min="0" max="100"
                                                                                className="w-12 bg-transparent text-right focus:bg-white focus:ring-2 focus:ring-[#00B5D8]/20 rounded px-1 py-0.5 outline-none text-gray-900"
                                                                                value={alloc.progress}
                                                                                onChange={(e) => handleUpdateFy(project.id, alloc.fyLabel, 'progress', parseInt(e.target.value || '0'))}
                                                                            />
                                                                            <span className="text-gray-400 text-[10px]">%</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-4 text-right font-medium text-green-600">{FORMAT_CURRENCY(comp)}</td>
                                                                    <td className="py-2 px-4 text-right font-medium text-orange-500">{FORMAT_CURRENCY(out)}</td>
                                                                    <td className="py-2 px-4 text-right">
                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${allocMargin < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                                            {allocMargin.toFixed(1)}%
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-4 text-right">
                                                                        <button 
                                                                            onClick={() => handleRemoveFy(project.id, alloc.fyLabel)}
                                                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                                                            title="Remove Allocation"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={viewMode === 'totals' ? 12 : 14} className="px-6 py-8 text-center text-gray-500">
                        No projects found for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* Footer Row for Totals */}
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={5} className="px-6 py-3 font-bold text-gray-900 text-right">Totals:</td>
                    <td className="px-6 py-3 font-bold text-gray-900 text-right">
                      {FORMAT_CURRENCY(filteredProjects.reduce((sum, p) => {
                        if (viewMode === 'totals') return sum + p.contractValueP;
                        const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
                        return sum + (alloc?.incomeP || 0);
                      }, 0))}
                    </td>

                    {viewMode === 'fy' && (
                      <>
                        <td></td>
                        <td className="px-6 py-3 font-bold text-green-700 text-right">
                            {FORMAT_CURRENCY(filteredProjects.reduce((sum, p) => {
                                const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
                                const income = alloc?.incomeP || 0;
                                const progress = alloc?.progress || 0;
                                return sum + Math.round(income * (progress / 100));
                            }, 0))}
                        </td>
                        <td className="px-6 py-3 font-bold text-orange-600 text-right">
                            {FORMAT_CURRENCY(filteredProjects.reduce((sum, p) => {
                                const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
                                const income = alloc?.incomeP || 0;
                                const progress = alloc?.progress || 0;
                                const completed = Math.round(income * (progress / 100));
                                return sum + (income - completed);
                            }, 0))}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-3 font-bold text-gray-900 text-right">
                      {FORMAT_CURRENCY(filteredProjects.reduce((sum, p) => {
                        if (viewMode === 'totals') return sum + p.forecastBudgetP;
                        const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
                        return sum + (alloc?.costP || 0);
                      }, 0))}
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-900 text-right">
                      {FORMAT_CURRENCY(filteredProjects.reduce((sum, p) => {
                        let val = 0, cost = 0;
                        if (viewMode === 'totals') {
                          val = p.contractValueP;
                          cost = p.forecastBudgetP;
                        } else {
                          const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
                          val = alloc?.incomeP || 0;
                          cost = alloc?.costP || 0;
                        }
                        return sum + (val - cost);
                      }, 0))}
                    </td>
                    <td colSpan={viewMode === 'totals' ? 2 : 1}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
      )}

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveProject}
        initialData={editingProject}
        clients={clients}
        onAddClient={handleAddClient}
      />
    </div>
  );
};