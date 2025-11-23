
import React, { useState, useMemo } from 'react';
import { StaffMember, Project, Role, StaffingForecast, StaffAssignment } from '../types';
import { ChevronLeft, ChevronRight, Search, Filter, Wand2, Calendar, User, GripVertical, X, CheckSquare, Star, GraduationCap, AlertCircle } from 'lucide-react';
import { sortStaffByProximity } from '../services/aiService';

interface RotaPlannerProps {
  projects: Project[];
  staff: StaffMember[];
  roles: Role[];
  forecasts: StaffingForecast[];
  assignments: StaffAssignment[];
  onUpdateAssignments: (assignments: StaffAssignment[]) => void;
}

export const RotaPlanner: React.FC<RotaPlannerProps> = ({
  projects,
  staff,
  roles,
  forecasts,
  assignments,
  onUpdateAssignments
}) => {
  // Default to current week's Monday
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
  });

  const [draggedStaffId, setDraggedStaffId] = useState<string | null>(null);
  
  // Filters
  const [staffSearch, setStaffSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [qualFilter, setQualFilter] = useState('All Cards');
  const [skillFilter, setSkillFilter] = useState('All Skills');
  const [trainingFilter, setTrainingFilter] = useState('All Training');
  
  // AI Suggest State
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedStaff, setSuggestedStaff] = useState<StaffMember[]>([]);
  const [suggestionTargetProject, setSuggestionTargetProject] = useState<string | null>(null);

  // Helper to format dates
  const getWeekDays = () => {
      const days = [];
      for (let i = 0; i < 5; i++) { // Mon-Fri
          const d = new Date(currentWeekStart);
          d.setDate(d.getDate() + i);
          days.push({
              date: d,
              label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
              iso: d.toISOString().split('T')[0]
          });
      }
      return days;
  };

  const weekDays = getWeekDays();
  const weekKey = currentWeekStart.toISOString().split('T')[0];

  // Derive unique filter options from staff list
  const uniqueQuals = useMemo(() => Array.from(new Set(staff.map(s => s.qualifications).filter(Boolean))).sort(), [staff]);
  
  const uniqueSkills = useMemo(() => {
      const skills = new Set<string>();
      staff.forEach(s => s.abilities?.forEach(a => skills.add(a)));
      return Array.from(skills).sort();
  }, [staff]);

  const uniqueTraining = useMemo(() => {
      const training = new Set<string>();
      staff.forEach(s => s.training?.forEach(t => training.add(t)));
      return Array.from(training).sort();
  }, [staff]);

  // Filter Active Staff (Pool)
  const filteredStaff = useMemo(() => {
      let source = suggestedStaff.length > 0 ? suggestedStaff : staff;
      
      return source.filter(s => {
          if (staffSearch && !s.name.toLowerCase().includes(staffSearch.toLowerCase())) return false;
          
          if (roleFilter !== 'All Roles') {
              const role = roles.find(r => r.id === s.roleId);
              if (role?.name !== roleFilter) return false;
          }
          
          if (qualFilter !== 'All Cards' && s.qualifications !== qualFilter) return false;
          
          if (skillFilter !== 'All Skills' && !s.abilities?.includes(skillFilter)) return false;

          if (trainingFilter !== 'All Training' && !s.training?.includes(trainingFilter)) return false;
          
          return s.active;
      });
  }, [staff, suggestedStaff, staffSearch, roleFilter, qualFilter, skillFilter, trainingFilter, roles]);

  // Get Active Projects for this week (based on forecasts)
  const activeProjects = useMemo(() => {
      // Find all forecasts for this week that have headcount > 0
      const activeProjectIds = new Set(forecasts.filter(f => f.weekStartDate === weekKey && f.headcount > 0).map(f => f.projectId));
      return projects.filter(p => activeProjectIds.has(p.id));
  }, [projects, forecasts, weekKey]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, staffId: string) => {
      e.dataTransfer.setData('staffId', staffId);
      setDraggedStaffId(staffId);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, projectId: string, roleId: string, date?: string) => {
      e.preventDefault();
      const staffId = e.dataTransfer.getData('staffId');
      if (!staffId) return;

      // Check if staff exists
      const staffMember = staff.find(s => s.id === staffId);
      if (!staffMember) return;

      const newAssignments: StaffAssignment[] = [];
      
      if (date) {
          // Single Day Assignment
          // Check if already assigned to this project/role/date
          const exists = assignments.some(a => a.staffId === staffId && a.date === date && a.projectId === projectId);
          if (!exists) {
              newAssignments.push({
                  id: Math.random().toString(36).substr(2, 9),
                  staffId,
                  projectId,
                  roleId,
                  date,
                  shift: 'Full'
              });
          }
      } else {
          // Whole Week Assignment (Mon-Fri)
          for (let i = 0; i < 5; i++) {
              const d = weekDays[i].iso;
              const exists = assignments.some(a => a.staffId === staffId && a.date === d); // Check global availability?
              // For now, just check project duplicate
              const projectExists = assignments.some(a => a.staffId === staffId && a.date === d && a.projectId === projectId);
              
              if (!projectExists) {
                  newAssignments.push({
                      id: Math.random().toString(36).substr(2, 9),
                      staffId,
                      projectId,
                      roleId,
                      date: d,
                      shift: 'Full'
                  });
              }
          }
      }

      onUpdateAssignments([...assignments, ...newAssignments]);
      setDraggedStaffId(null);
  };

  const handleRemoveAssignment = (assignmentId: string) => {
      onUpdateAssignments(assignments.filter(a => a.id !== assignmentId));
  };

  const handleAiSuggest = async (project: Project) => {
      setIsSuggesting(true);
      setSuggestionTargetProject(project.id);
      
      // Filter staff to only those matching the roles needed for this project this week
      const neededRoles = new Set(forecasts.filter(f => f.projectId === project.id && f.weekStartDate === weekKey).map(f => f.roleId));
      const relevantStaff = staff.filter(s => neededRoles.has(s.roleId));
      
      const sorted = await sortStaffByProximity(project, relevantStaff);
      
      setSuggestedStaff(sorted);
      setIsSuggesting(false);
  };

  const clearSuggestion = () => {
      setSuggestedStaff([]);
      setSuggestionTargetProject(null);
  };

  return (
    <div className="flex h-full gap-6 overflow-hidden">
        
        {/* LEFT SIDEBAR: STAFF POOL */}
        <div className="w-80 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#00B5D8]" />
                    Staff Pool
                </h3>
                
                {/* Search & Filters */}
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search staff..." 
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00B5D8]"
                            value={staffSearch}
                            onChange={(e) => setStaffSearch(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <select 
                                className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:border-[#00B5D8] appearance-none"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option>All Roles</option>
                                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <select 
                                className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:border-[#00B5D8] appearance-none"
                                value={qualFilter}
                                onChange={(e) => setQualFilter(e.target.value)}
                            >
                                <option>All Cards</option>
                                {uniqueQuals.map(q => <option key={q} value={q}>{q}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <select 
                                className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:border-[#00B5D8] appearance-none"
                                value={skillFilter}
                                onChange={(e) => setSkillFilter(e.target.value)}
                            >
                                <option>All Skills</option>
                                {uniqueSkills.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <select 
                                className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:border-[#00B5D8] appearance-none"
                                value={trainingFilter}
                                onChange={(e) => setTrainingFilter(e.target.value)}
                            >
                                <option>All Training</option>
                                {uniqueTraining.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* AI Suggestion Banner */}
                {suggestedStaff.length > 0 && (
                    <div className="mt-2 bg-purple-50 border border-purple-100 text-purple-700 text-xs p-2 rounded flex justify-between items-center animate-in fade-in">
                        <span className="flex items-center gap-1">
                            <Wand2 className="w-3 h-3" /> Sorted by location match
                        </span>
                        <button onClick={clearSuggestion} className="hover:bg-purple-100 rounded p-0.5"><X className="w-3 h-3" /></button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-gray-50/30">
                {filteredStaff.map(s => {
                    const role = roles.find(r => r.id === s.roleId);
                    return (
                        <div 
                            key={s.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, s.id)}
                            className="bg-white border border-gray-100 p-3 rounded-lg shadow-sm hover:shadow-md hover:border-[#00B5D8] cursor-grab active:cursor-grabbing group transition-all"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm text-gray-800">{s.name}</span>
                                <GripVertical className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100" />
                            </div>
                            <div className="flex flex-wrap gap-1 mb-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${role?.color || 'bg-gray-100 border-gray-200'}`}>
                                    {role?.name || 'Unknown'}
                                </span>
                                {s.qualifications && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded border bg-gray-50 text-gray-500 border-gray-200 truncate max-w-[100px]">
                                        {s.qualifications}
                                    </span>
                                )}
                            </div>
                            {/* Tags preview */}
                            {(s.abilities?.length || 0) + (s.training?.length || 0) > 0 && (
                                <div className="flex flex-wrap gap-1 mb-1">
                                    {s.abilities?.slice(0, 2).map((a, i) => (
                                        <span key={`a-${i}`} className="text-[9px] text-blue-600 bg-blue-50 px-1 rounded">{a}</span>
                                    ))}
                                    {s.training?.slice(0, 2).map((t, i) => (
                                        <span key={`t-${i}`} className="text-[9px] text-purple-600 bg-purple-50 px-1 rounded">{t}</span>
                                    ))}
                                </div>
                            )}
                            {s.rating === 'Very Good' && (
                                <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium mt-1">
                                    <Star className="w-3 h-3 fill-current" /> Highly Rated
                                </div>
                            )}
                        </div>
                    );
                })}
                {filteredStaff.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        No staff found matching filters.
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT MAIN: ROTA GRID */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Week Controls */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })} className="p-1 hover:bg-white rounded shadow-sm border border-transparent hover:border-gray-200 text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="flex items-center gap-2 font-bold text-gray-800 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                        <Calendar className="w-4 h-4 text-[#00B5D8]" />
                        {currentWeekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} - 
                        {new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate()+4)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                    </div>
                    <button onClick={() => setCurrentWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })} className="p-1 hover:bg-white rounded shadow-sm border border-transparent hover:border-gray-200 text-gray-600"><ChevronRight className="w-5 h-5" /></button>
                </div>
                <div className="text-xs text-gray-500 italic flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Displaying active requirements only
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar bg-white relative">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-50 text-gray-600 sticky top-0 z-30 shadow-sm">
                        <tr>
                            <th className="p-3 text-left min-w-[250px] border-r border-b border-gray-200 bg-gray-50 sticky left-0 z-40 font-bold">
                                Project / Role
                            </th>
                            <th className="p-3 text-center w-24 border-r border-b border-gray-200 font-bold text-[#00B5D8] bg-blue-50/30">
                                All Week
                            </th>
                            {weekDays.map(day => (
                                <th key={day.iso} className="p-3 text-center min-w-[140px] border-r border-b border-gray-200 bg-gray-50">
                                    <div className="font-bold text-gray-900">{day.label.split(' ')[0]}</div>
                                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">{day.label.split(' ')[1]}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {activeProjects.length === 0 ? (
                            <tr><td colSpan={9} className="p-12 text-center text-gray-400 bg-gray-50/20">No forecasted staffing requirements for this week. Switch to Forecast tab to plan needs.</td></tr>
                        ) : activeProjects.map(project => (
                            <React.Fragment key={project.id}>
                                {/* Project Header Row */}
                                <tr className="bg-gray-100 border-b border-gray-200">
                                    <td className="p-2 pl-4 font-bold text-gray-800 sticky left-0 bg-gray-100 border-r border-gray-200 z-20 flex justify-between items-center h-10">
                                        <span className="truncate">{project.name}</span>
                                        <button 
                                            onClick={() => handleAiSuggest(project)}
                                            className={`p-1 rounded border transition-colors flex items-center gap-1 text-[10px] font-medium
                                                ${suggestionTargetProject === project.id 
                                                    ? 'bg-purple-100 border-purple-200 text-purple-700' 
                                                    : 'bg-white border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-200'}`}
                                            title="AI Staff Suggestion based on Location"
                                        >
                                            <Wand2 className="w-3 h-3" />
                                            {isSuggesting && suggestionTargetProject === project.id ? 'Thinking...' : 'Suggest'}
                                        </button>
                                    </td>
                                    <td colSpan={6} className="bg-gray-100"></td>
                                </tr>

                                {/* Role Rows */}
                                {roles.map(role => {
                                    // Check if this role is needed
                                    const forecast = forecasts.find(f => f.projectId === project.id && f.roleId === role.id && f.weekStartDate === weekKey);
                                    if (!forecast || forecast.headcount === 0) return null;

                                    return (
                                        <tr key={`${project.id}-${role.id}`} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors group">
                                            {/* Row Header */}
                                            <td className="p-2 pl-8 sticky left-0 bg-white group-hover:bg-gray-50/30 border-r border-gray-200 z-20">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${role.color}`}>
                                                        {role.name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 rounded border border-gray-100" title="Required Headcount">
                                                        req: {forecast.headcount}
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            {/* All Week Drop Zone */}
                                            <td 
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, project.id, role.id)}
                                                className="border-r border-gray-200 bg-blue-50/10 hover:bg-blue-50 transition-colors cursor-pointer border-dashed relative group/drop"
                                                title="Drag staff here to assign for Mon-Fri"
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/drop:opacity-100 pointer-events-none transition-opacity">
                                                    <CheckSquare className="w-5 h-5 text-[#00B5D8]" />
                                                </div>
                                            </td>

                                            {/* Daily Cells */}
                                            {weekDays.map(day => {
                                                // Find assignments for this cell
                                                const cellAssignments = assignments.filter(a => 
                                                    a.projectId === project.id && 
                                                    a.roleId === role.id && 
                                                    a.date === day.iso
                                                );
                                                
                                                const currentCount = cellAssignments.length;
                                                const targetCount = forecast.headcount;
                                                const isMet = currentCount === targetCount;
                                                const isOver = currentCount > targetCount;
                                                const isUnder = currentCount < targetCount;

                                                return (
                                                    <td 
                                                        key={day.iso}
                                                        onDragOver={handleDragOver}
                                                        onDrop={(e) => handleDrop(e, project.id, role.id, day.iso)}
                                                        className={`p-1.5 border-r border-gray-100 align-top transition-colors min-h-[70px] relative
                                                            ${draggedStaffId ? 'bg-gray-50' : ''}
                                                            ${currentCount > 0 && isOver ? 'bg-red-50/50' : ''}
                                                            ${currentCount > 0 && isUnder ? 'bg-orange-50/50' : ''}
                                                            ${currentCount > 0 && isMet ? 'bg-green-50/30' : ''}
                                                        `}
                                                    >
                                                        {/* Staff Chips */}
                                                        <div className="flex flex-col gap-1.5 min-h-[40px]">
                                                            {cellAssignments.map(assign => {
                                                                const person = staff.find(s => s.id === assign.staffId);
                                                                return (
                                                                    <div 
                                                                        key={assign.id} 
                                                                        className="bg-white border border-gray-200 rounded shadow-sm px-2 py-1 flex justify-between items-center group/chip hover:border-[#00B5D8] transition-all cursor-grab active:cursor-grabbing"
                                                                        draggable
                                                                        onDragStart={(e) => {
                                                                            handleDragStart(e, assign.staffId);
                                                                        }}
                                                                    >
                                                                        <span className="text-[10px] font-medium text-gray-700 truncate max-w-[85px]" title={person?.name}>
                                                                            {person?.name}
                                                                        </span>
                                                                        <button 
                                                                            onClick={() => handleRemoveAssignment(assign.id)}
                                                                            className="opacity-0 group-hover/chip:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Status Indicator (Only show if requirements exist) */}
                                                        {targetCount > 0 && (
                                                            <div className="mt-auto pt-2 flex justify-center">
                                                                <span className={`
                                                                    text-[9px] font-bold px-1.5 rounded-full border
                                                                    ${isMet ? 'text-green-600 bg-green-50 border-green-100' : 
                                                                      isOver ? 'text-red-600 bg-red-50 border-red-100' : 
                                                                      'text-orange-500 bg-orange-50 border-orange-100'}
                                                                `}>
                                                                    {currentCount} / {targetCount}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
