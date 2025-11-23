
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_PROJECTS, MOCK_ROLES, MOCK_STAFF, MOCK_STAFFING_FORECAST, MOCK_STAFF_ASSIGNMENTS } from '../services/mockData';
import { Project, Role, StaffMember, StaffingForecast, ProjectStage, StaffAssignment } from '../types';
import { FORMAT_CURRENCY, STAGE_ORDER } from '../constants';
import { Card } from '../components/Card';
import { StaffModal } from '../components/StaffModal';
import { RoleModal } from '../components/RoleModal';
import { StaffImportModal } from '../components/StaffImportModal';
import { RotaPlanner } from '../components/RotaPlanner';
import { Users, ChevronLeft, ChevronRight, Calendar, Plus, UserPlus, Trash2, Briefcase, Settings2, Search, Filter as FilterIcon, Star, Upload, Download, X, Info, Edit2, LayoutGrid, Check } from 'lucide-react';

// Helper to calculate ISO week number
const getWeekNumber = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const Staffing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'rota' | 'resources'>('forecast');
  
  // Planner View State
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [weekRange, setWeekRange] = useState<number>(8);
  const [startDate, setStartDate] = useState(new Date()); // Anchor date

  // Data States
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_STAFF);
  const [forecasts, setForecasts] = useState<StaffingForecast[]>(MOCK_STAFFING_FORECAST);
  const [assignments, setAssignments] = useState<StaffAssignment[]>(MOCK_STAFF_ASSIGNMENTS);

  // Per-Project Role Visibility State
  const [projectRoles, setProjectRoles] = useState<Record<string, string[]>>({});
  const [roleSelectorOpen, setRoleSelectorOpen] = useState<string | null>(null);

  // Modal States
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>(undefined);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Filter States
  const [staffSearch, setStaffSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [qualFilter, setQualFilter] = useState('All Cards');
  const [skillFilter, setSkillFilter] = useState('All Skills');
  const [projectStageFilter, setProjectStageFilter] = useState('All Active');

  // Initialize Default Roles per Project
  useEffect(() => {
      if (roles.length > 0 && MOCK_PROJECTS.length > 0 && Object.keys(projectRoles).length === 0) {
           const defaults: Record<string, string[]> = {};
           // Match defaults: Supervisor, Painter, Sprayer (fallback to first few if not found)
           const defaultIds = roles.filter(r => {
               const n = r.name.toLowerCase();
               return n.includes('supervisor') || n.includes('painter') || n.includes('sprayer');
           }).map(r => r.id);
           
           // Fallback if specific named roles aren't in the mock data, just pick the first 3
           const initialIds = defaultIds.length > 0 ? defaultIds : roles.slice(0, 3).map(r => r.id);

           MOCK_PROJECTS.forEach(p => {
               defaults[p.id] = initialIds;
           });
           setProjectRoles(defaults);
      }
  }, [roles]);

  const toggleProjectRole = (projectId: string, roleId: string) => {
      setProjectRoles(prev => {
          const current = prev[projectId] || [];
          if (current.includes(roleId)) {
              return { ...prev, [projectId]: current.filter(id => id !== roleId) };
          } else {
              return { ...prev, [projectId]: [...current, roleId] };
          }
      });
  };

  // --- Helper Functions ---
  const getMonday = (d: Date) => {
    const dClone = new Date(d);
    const day = dClone.getDay();
    const diff = dClone.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(dClone.setDate(diff));
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  // Generate Grid Periods (Weeks or Months)
  const periods = useMemo(() => {
    const periodsArr = [];
    
    if (viewMode === 'weekly') {
        const start = getMonday(startDate);
        for (let i = 0; i < weekRange; i++) {
            const d = addDays(start, i * 7);
            periodsArr.push({
                key: formatDateKey(d),
                label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                subLabel: `W${getWeekNumber(d)}`,
                date: d,
                type: 'week'
            });
        }
    } else {
        // Monthly View - Show 12 months from start date
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        for (let i = 0; i < 12; i++) {
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            periodsArr.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, // YYYY-MM
                label: d.toLocaleDateString('en-GB', { month: 'long' }),
                subLabel: d.getFullYear().toString(),
                date: d,
                type: 'month'
            });
        }
    }
    return periodsArr;
  }, [startDate, viewMode, weekRange]);

  // --- Handlers ---
  const handleTimeShift = (direction: 'prev' | 'next') => {
    if (viewMode === 'weekly') {
        setStartDate(prev => addDays(prev, direction === 'next' ? weekRange * 7 : -(weekRange * 7)));
    } else {
        setStartDate(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + (direction === 'next' ? 12 : -12));
            return d;
        });
    }
  };

  const handleForecastChange = (projectId: string, roleId: string, periodKey: string, value: string) => {
    const count = parseInt(value) || 0;
    
    setForecasts(prev => {
        let newForecasts = [...prev];

        if (viewMode === 'weekly') {
            // Update specific week
            const existingIndex = newForecasts.findIndex(f => f.projectId === projectId && f.roleId === roleId && f.weekStartDate === periodKey);
            
            if (existingIndex >= 0) {
                if (count === 0) newForecasts.splice(existingIndex, 1);
                else newForecasts[existingIndex] = { ...newForecasts[existingIndex], headcount: count };
            } else if (count > 0) {
                newForecasts.push({
                    id: Math.random().toString(36).substr(2, 9),
                    projectId,
                    roleId,
                    weekStartDate: periodKey,
                    headcount: count,
                    daysPerWeek: 5
                });
            }
        } else {
            // Monthly Mode: Apply to all weeks starting in this month
            const [year, month] = periodKey.split('-').map(Number);
            
            // Find all Mondays in this month
            const mondaysInMonth = [];
            let d = new Date(year, month - 1, 1);
            // Advance to first Monday
            while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
            
            while (d.getMonth() === month - 1) {
                mondaysInMonth.push(formatDateKey(d));
                d.setDate(d.getDate() + 7);
            }

            // Update/Create forecasts for each week
            mondaysInMonth.forEach(weekKey => {
                const idx = newForecasts.findIndex(f => f.projectId === projectId && f.roleId === roleId && f.weekStartDate === weekKey);
                if (idx >= 0) {
                    if (count === 0) newForecasts.splice(idx, 1);
                    else newForecasts[idx] = { ...newForecasts[idx], headcount: count };
                } else if (count > 0) {
                    newForecasts.push({
                        id: Math.random().toString(36).substr(2, 9),
                        projectId,
                        roleId,
                        weekStartDate: weekKey,
                        headcount: count,
                        daysPerWeek: 5
                    });
                }
            });
        }
        return newForecasts;
    });
  };

  // Get value for a cell (aggregates if monthly)
  const getForecastValue = (projectId: string, roleId: string, period: any) => {
      if (period.type === 'week') {
          const entry = forecasts.find(f => f.projectId === projectId && f.roleId === roleId && f.weekStartDate === period.key);
          return entry?.headcount || '';
      } else {
          // Monthly: Find average of weeks in this month
          const [year, month] = period.key.split('-').map(Number);
          const relevantForecasts = forecasts.filter(f => {
              if (f.projectId !== projectId || f.roleId !== roleId) return false;
              const d = new Date(f.weekStartDate);
              return d.getFullYear() === year && d.getMonth() === month - 1;
          });
          
          if (relevantForecasts.length === 0) return '';
          // Return max headcount in that month to ensure peak coverage is visible
          const maxHeadcount = Math.max(...relevantForecasts.map(f => f.headcount));
          return maxHeadcount || '';
      }
  };

  const handleSaveStaff = (newStaff: StaffMember, newRole?: Role) => {
      if (newRole) {
          setRoles(prev => [...prev, newRole]);
      }

      if (editingStaff) {
          setStaff(prev => prev.map(s => s.id === newStaff.id ? newStaff : s));
      } else {
          setStaff(prev => [...prev, newStaff]);
      }
      setIsStaffModalOpen(false);
      setEditingStaff(undefined);
  };

  const handleSaveRole = (role: Role) => {
      if (editingRole) {
          setRoles(prev => prev.map(r => r.id === role.id ? role : r));
      } else {
          setRoles(prev => [...prev, role]);
      }
      setIsRoleModalOpen(false);
      setEditingRole(undefined);
  };

  const handleDeleteRole = (id: string) => {
      if (window.confirm('Are you sure? This will affect all staff assigned to this role.')) {
          setRoles(prev => prev.filter(r => r.id !== id));
      }
  };

  const handleImportStaff = (importedStaff: StaffMember[]) => {
      setStaff(prev => [...prev, ...importedStaff]);
  };

  // Filter Logic
  const filteredStaff = staff.filter(s => {
      if (staffSearch && !s.name.toLowerCase().includes(staffSearch.toLowerCase())) return false;
      const role = roles.find(r => r.id === s.roleId);
      if (roleFilter !== 'All Roles' && role?.name !== roleFilter) return false;
      if (qualFilter !== 'All Cards' && !s.qualifications?.includes(qualFilter)) return false;
      if (skillFilter !== 'All Skills' && !s.abilities?.some(a => a.includes(skillFilter))) return false;
      return true;
  });

  const activeProjects = MOCK_PROJECTS.filter(p => {
      if (projectStageFilter === 'All Active') return p.stage === ProjectStage.ON_SITE || p.stage === ProjectStage.PRE_START || p.stage === ProjectStage.NEGOTIATION;
      return p.stage === projectStageFilter;
  });

  // Calculate Total Costs per Period
  const periodCosts = useMemo(() => {
      const costs: Record<string, number> = {};
      periods.forEach(p => costs[p.key] = 0);
      
      forecasts.forEach(f => {
          const role = roles.find(r => r.id === f.roleId);
          if (!role) return;
          const cost = f.headcount * f.daysPerWeek * role.defaultDayRateP;

          if (viewMode === 'weekly') {
              if (costs[f.weekStartDate] !== undefined) costs[f.weekStartDate] += cost;
          } else {
              // Map week to month key
              const d = new Date(f.weekStartDate);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              if (costs[key] !== undefined) costs[key] += cost;
          }
      });
      return costs;
  }, [forecasts, roles, periods, viewMode]);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-[#00B5D8]" />
                Staffing & Labour
            </h2>
            <p className="text-sm text-gray-500">Forecast resource requirements and manage labour costs.</p>
        </div>

        <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200 self-start md:self-auto">
            <button
                onClick={() => setActiveTab('forecast')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'forecast' ? 'bg-white text-[#00B5D8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Calendar className="w-4 h-4" /> Forecast
            </button>
            <button
                onClick={() => setActiveTab('rota')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'rota' ? 'bg-white text-[#00B5D8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <LayoutGrid className="w-4 h-4" /> Rota
            </button>
            <button
                onClick={() => setActiveTab('resources')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'resources' ? 'bg-white text-[#00B5D8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Briefcase className="w-4 h-4" /> Resources
            </button>
        </div>
      </div>

      {activeTab === 'forecast' && (
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row justify-between items-start xl:items-center bg-gray-50 gap-4">
                <div className="flex items-center gap-4">
                    {/* View Mode Switch */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
                        <button 
                            onClick={() => setViewMode('weekly')}
                            className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'weekly' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Weekly
                        </button>
                        <button 
                            onClick={() => setViewMode('monthly')}
                            className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'monthly' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Monthly
                        </button>
                    </div>

                    {/* Time Navigation */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                        <button onClick={() => handleTimeShift('prev')} className="p-1 hover:bg-gray-50 rounded text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-xs font-bold text-gray-900 w-48 text-center border-x border-gray-100 px-2">
                            {periods[0]?.label} - {periods[periods.length-1]?.label}
                        </span>
                        <button onClick={() => handleTimeShift('next')} className="p-1 hover:bg-gray-50 rounded text-gray-500"><ChevronRight className="w-4 h-4" /></button>
                    </div>

                    {/* Weekly Range Selector */}
                    {viewMode === 'weekly' && (
                        <select 
                            value={weekRange}
                            onChange={(e) => setWeekRange(parseInt(e.target.value))}
                            className="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg p-2 outline-none cursor-pointer hover:border-[#00B5D8]"
                        >
                            <option value={4}>4 Weeks</option>
                            <option value={8}>8 Weeks</option>
                            <option value={12}>12 Weeks</option>
                        </select>
                    )}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="relative flex-1 xl:w-48">
                        <FilterIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <select 
                            value={projectStageFilter}
                            onChange={(e) => setProjectStageFilter(e.target.value)}
                            className="w-full pl-8 pr-8 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00B5D8] appearance-none cursor-pointer text-gray-700 font-medium"
                        >
                            <option>All Active</option>
                            {STAGE_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="text-xs text-gray-400 italic whitespace-nowrap">
                        Values indicate headcount (FTE)
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 text-left min-w-[250px] border-b border-r border-gray-200 font-semibold text-gray-600 bg-gray-50 z-20 sticky left-0">
                                Project / Role
                            </th>
                            {periods.map(period => (
                                <th key={period.key} className="p-3 text-center min-w-[100px] border-b border-r border-gray-200 font-medium text-gray-600">
                                    <div className="text-gray-900 font-bold mb-0.5">{period.label}</div>
                                    <div className="text-[10px] font-normal text-gray-400">{period.subLabel}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {activeProjects.map(project => {
                            // Filter roles for this project based on visibility state
                            const visibleRoleIds = projectRoles[project.id] || [];
                            const visibleRoles = roles.filter(r => visibleRoleIds.includes(r.id));

                            return (
                            <React.Fragment key={project.id}>
                                <tr className="bg-gray-50/80 border-b border-gray-200">
                                    <td className="p-0 sticky left-0 bg-gray-100 border-r border-gray-200 z-10">
                                        <div className="p-3 pl-4 flex items-center justify-between w-full h-full group relative">
                                            <div 
                                                className="cursor-pointer hover:text-[#00B5D8] transition-colors font-bold text-gray-900 flex-1 flex items-center gap-2"
                                                onClick={() => setSelectedProject(project)}
                                            >
                                                {project.name}
                                                <Info className="w-3 h-3 text-gray-300 group-hover:text-[#00B5D8]" />
                                            </div>
                                            
                                            {/* Role Selector Button */}
                                            <div className="relative">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRoleSelectorOpen(roleSelectorOpen === project.id ? null : project.id);
                                                    }}
                                                    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${roleSelectorOpen === project.id ? 'text-[#00B5D8] bg-blue-50' : 'text-gray-400'}`}
                                                    title="Manage Project Roles"
                                                >
                                                    <Settings2 className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Dropdown */}
                                                {roleSelectorOpen === project.id && (
                                                    <>
                                                        <div 
                                                            className="fixed inset-0 z-30" 
                                                            onClick={() => setRoleSelectorOpen(null)}
                                                        />
                                                        <div className="absolute left-0 top-full mt-2 z-40 bg-white border border-gray-200 rounded-xl shadow-xl w-56 p-2 flex flex-col gap-1 animate-in fade-in zoom-in duration-200">
                                                            <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider border-b border-gray-100 mb-1">Visible Roles</div>
                                                            {roles.map(r => {
                                                                const isSelected = visibleRoleIds.includes(r.id);
                                                                return (
                                                                    <div 
                                                                        key={r.id}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            toggleProjectRole(project.id, r.id);
                                                                        }}
                                                                        className={`
                                                                            flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors
                                                                            ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-600'}
                                                                        `}
                                                                    >
                                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#00B5D8] border-[#00B5D8] text-white' : 'border-gray-300 bg-white'}`}>
                                                                            {isSelected && <Check className="w-3 h-3" />}
                                                                        </div>
                                                                        <span>{r.name}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    {periods.map(p => <td key={p.key} className="bg-gray-50/50 border-r border-gray-200"></td>)}
                                </tr>
                                {visibleRoles.map(role => {
                                    return (
                                        <tr key={`${project.id}-${role.id}`} className="hover:bg-blue-50/30 transition-colors border-b border-gray-100 group">
                                            <td className="p-2 pl-8 sticky left-0 bg-white group-hover:bg-blue-50/30 border-r border-gray-200 flex items-center justify-between z-10">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${role.color}`}>
                                                    {role.name}
                                                </span>
                                            </td>
                                            {periods.map(period => {
                                                return (
                                                    <td key={period.key} className="p-0 border-r border-gray-100 text-center relative">
                                                        <input 
                                                            type="number" min="0"
                                                            className="w-full h-full text-center bg-transparent focus:bg-white outline-none focus:ring-2 focus:ring-[#00B5D8] text-gray-900 font-medium py-3 text-xs"
                                                            placeholder="-"
                                                            value={getForecastValue(project.id, role.id, period)}
                                                            onChange={(e) => handleForecastChange(project.id, role.id, period.key, e.target.value)}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        )})}
                        {/* Footer Costs */}
                        <tr className="bg-[#1A2040] text-white sticky bottom-0 z-20 font-bold shadow-lg">
                            <td className="p-4 sticky left-0 bg-[#1A2040] border-r border-gray-700 border-t border-[#00B5D8]/50">Total Estimated Cost</td>
                            {periods.map(p => (
                                <td key={p.key} className="p-4 text-center border-r border-gray-700 text-xs font-mono border-t border-[#00B5D8]/50">
                                    {FORMAT_CURRENCY(periodCosts[p.key] || 0)}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'rota' && (
          <RotaPlanner 
            projects={MOCK_PROJECTS}
            staff={staff}
            roles={roles}
            forecasts={forecasts}
            assignments={assignments}
            onUpdateAssignments={setAssignments}
          />
      )}

      {activeTab === 'resources' && (
        /* Resources Tab */
        <div className="h-full overflow-hidden flex flex-col gap-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center shrink-0">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search by name..." 
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 text-gray-900"
                    />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <div className="relative min-w-[140px]">
                        <FilterIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <select 
                            value={roleFilter} 
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm appearance-none cursor-pointer text-gray-700"
                        >
                            <option>All Roles</option>
                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                    </div>
                    <div className="relative min-w-[140px]">
                        <FilterIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <select 
                            value={qualFilter}
                            onChange={(e) => setQualFilter(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm appearance-none cursor-pointer text-gray-700"
                        >
                            <option>All Cards</option>
                            {Array.from(new Set(staff.map(s => s.qualifications).filter(Boolean))).map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Roles Card */}
                <Card 
                    title="Labour Roles" 
                    className="flex flex-col h-full overflow-hidden lg:col-span-1"
                    action={
                        <button 
                            onClick={() => { setEditingRole(undefined); setIsRoleModalOpen(true); }}
                            className="p-1 text-[#00B5D8] hover:bg-[#00B5D8]/10 rounded transition-colors"
                            title="Add New Role"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    }
                >
                    <div className="overflow-y-auto h-full -mx-6 px-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-100">
                                    <th className="pb-3 font-semibold">Role Name</th>
                                    <th className="pb-3 font-semibold text-right">Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {roles.map(role => (
                                    <tr key={role.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-3">
                                            <span className={`text-xs font-bold px-2 py-1 rounded border ${role.color}`}>
                                                {role.name}
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="font-mono text-gray-700 group-hover:hidden">
                                                    {FORMAT_CURRENCY(role.defaultDayRateP)}
                                                </span>
                                                <div className="hidden group-hover:flex items-center gap-1">
                                                    <button 
                                                        onClick={() => { setEditingRole(role); setIsRoleModalOpen(true); }} 
                                                        className="p-1 text-gray-400 hover:text-[#00B5D8]"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteRole(role.id)} 
                                                        className="p-1 text-gray-400 hover:text-red-500"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Staff Directory */}
                <Card title="Staff Directory" className="flex flex-col h-full overflow-hidden lg:col-span-2"
                    action={
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center gap-1 text-gray-600 hover:text-[#00B5D8] px-3 py-1.5 bg-gray-50 hover:bg-cyan-50 rounded-lg transition-colors text-xs font-medium border border-gray-200"
                            >
                                <Upload className="w-3.5 h-3.5" /> Import CSV
                            </button>
                            <button 
                                onClick={() => { setEditingStaff(undefined); setIsStaffModalOpen(true); }}
                                className="flex items-center gap-1 text-white bg-[#00B5D8] hover:bg-[#009bb8] px-3 py-1.5 rounded-lg transition-colors text-xs font-medium shadow-sm"
                            >
                                <UserPlus className="w-3.5 h-3.5" /> Add Staff
                            </button>
                        </div>
                    }
                >
                    <div className="overflow-y-auto h-full -mx-6 px-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-100">
                                    <th className="pb-3 font-semibold pl-4">Name / Contact</th>
                                    <th className="pb-3 font-semibold">Role / Rate</th>
                                    <th className="pb-3 font-semibold">Quals & Skills</th>
                                    <th className="pb-3 font-semibold text-right">Rating</th>
                                    <th className="pb-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredStaff.map(s => {
                                    const role = roles.find(r => r.id === s.roleId);
                                    return (
                                        <tr key={s.id} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-4 pl-4">
                                                <div className="font-bold text-gray-900">{s.name}</div>
                                                <div className="text-xs text-gray-400">{s.email || s.phone || 'No contact info'}</div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    {role && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${role.color}`}>
                                                            {role.name}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        {FORMAT_CURRENCY(s.dailyRateP || role?.defaultDayRateP || 0)}/day
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {s.qualifications && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200 font-semibold">
                                                            {s.qualifications}
                                                        </span>
                                                    )}
                                                    {s.abilities?.slice(0, 3).map((a, i) => (
                                                        <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full 
                                                    ${s.rating === 'Very Good' ? 'bg-green-100 text-green-700' : 
                                                      s.rating === 'Good' ? 'bg-blue-100 text-blue-700' : 
                                                      s.rating === 'Not Good' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {s.rating}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right pr-4">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => { setEditingStaff(s); setIsStaffModalOpen(true); }} className="text-gray-400 hover:text-[#00B5D8] p-1">
                                                        <Settings2 className="w-4 h-4" />
                                                    </button>
                                                    <button className="text-gray-400 hover:text-red-500 p-1">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
      )}

      {/* Project Detail Popover Modal */}
      {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px]" onClick={() => setSelectedProject(null)}>
              <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedProject.name}</h3>
                          <p className="text-sm text-gray-500">{selectedProject.client}</p>
                      </div>
                      <button onClick={() => setSelectedProject(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase">Contract Value</p>
                              <p className="text-lg font-bold text-gray-900">{FORMAT_CURRENCY(selectedProject.contractValueP)}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase">Budget</p>
                              <p className="text-lg font-bold text-gray-900">{FORMAT_CURRENCY(selectedProject.forecastBudgetP)}</p>
                          </div>
                      </div>
                      
                      <div className="space-y-2">
                          <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                              <span className="text-gray-500">Start Date:</span>
                              <span className="font-medium text-gray-900">{selectedProject.startDate}</span>
                          </div>
                          <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                              <span className="text-gray-500">End Date:</span>
                              <span className="font-medium text-gray-900">{selectedProject.endDate}</span>
                          </div>
                          <div className="flex justify-between text-sm pb-2">
                              <span className="text-gray-500">Stage:</span>
                              <span className="font-medium text-[#00B5D8]">{selectedProject.stage}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <StaffModal 
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSubmit={handleSaveStaff}
        roles={roles}
        initialData={editingStaff}
      />

      <RoleModal 
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSave={handleSaveRole}
        initialData={editingRole}
      />

      <StaffImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportStaff}
        existingRoles={roles}
      />
    </div>
  );
};
