import React, { useMemo, useRef, useState } from 'react';
import { Project, ProjectStage } from '../types';
import { Badge } from './Badge';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

interface ProjectGanttProps {
  projects: Project[];
  viewMode: 'month' | 'quarter' | 'week';
  currentYear: number;
  onYearChange: (year: number) => void;
  weekStartDate?: Date;
  weekRange?: number;
  onWeekChange?: (direction: 'prev' | 'next') => void;
  onEditProject?: (project: Project) => void;
}

export const ProjectGantt: React.FC<ProjectGanttProps> = ({ 
  projects, 
  viewMode, 
  currentYear,
  onYearChange,
  weekStartDate = new Date(),
  weekRange = 12,
  onWeekChange,
  onEditProject
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
      setExpandedProjectIds(prev => 
          prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
      );
  };

  // --- Timeline Boundaries ---
  const timelineStart = useMemo(() => {
      if (viewMode === 'week') {
          return new Date(weekStartDate);
      }
      return new Date(currentYear, 0, 1);
  }, [viewMode, currentYear, weekStartDate]);

  const timelineEnd = useMemo(() => {
      if (viewMode === 'week') {
          const end = new Date(weekStartDate);
          end.setDate(end.getDate() + (weekRange * 7));
          return end;
      }
      return new Date(currentYear, 11, 31, 23, 59, 59);
  }, [viewMode, currentYear, weekStartDate, weekRange]);

  // --- Grid Generation ---
  const getMonths = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(currentYear, i, 1);
      return {
        name: d.toLocaleString('default', { month: 'short' }),
        label: d.toLocaleString('default', { month: 'short' })
      };
    });
  };

  const getQuarters = () => [
      { label: 'Q1' }, { label: 'Q2' }, { label: 'Q3' }, { label: 'Q4' }
  ];

  const getWeeks = () => {
    const weeks = [];
    let currentDate = new Date(timelineStart);
    
    for (let i = 0; i < weekRange; i++) {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const day = currentDate.getDate();
      const month = currentDate.toLocaleString('default', { month: 'short' });
      
      weeks.push({
        label: `${day} ${month}`,
        subLabel: `W${i + 1}`
      });
      currentDate.setDate(currentDate.getDate() + 7);
    }
    return weeks;
  };

  const timelineData = useMemo(() => {
    if (viewMode === 'month') return getMonths();
    if (viewMode === 'quarter') return getQuarters();
    return getWeeks();
  }, [viewMode, currentYear, weekStartDate, weekRange]);

  // --- Calculations ---
  const calculateBar = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const viewStart = timelineStart;
    const viewEnd = timelineEnd;

    // If project is completely outside view
    if (endDate < viewStart || startDate > viewEnd) return null;

    // Clamp dates to visible range
    const effectiveStart = startDate < viewStart ? viewStart : startDate;
    const effectiveEnd = endDate > viewEnd ? viewEnd : endDate;

    const totalDuration = viewEnd.getTime() - viewStart.getTime();
    const startOffset = effectiveStart.getTime() - viewStart.getTime();
    const duration = effectiveEnd.getTime() - effectiveStart.getTime();

    if (duration <= 0) return null;

    const leftPercent = (startOffset / totalDuration) * 100;
    const widthPercent = (duration / totalDuration) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`
    };
  };

  const getBarColor = (stage: ProjectStage | string) => {
    switch(stage) {
        case ProjectStage.ON_SITE: return 'bg-green-500';
        case ProjectStage.PRE_START: return 'bg-purple-500';
        case ProjectStage.NEGOTIATION: return 'bg-yellow-500';
        case ProjectStage.CLOSING_OUT: return 'bg-cyan-500';
        case ProjectStage.FINAL_ACCOUNT: return 'bg-orange-500';
        case ProjectStage.FINALISED: return 'bg-gray-400';
        // Phases
        case 'Phase': return 'bg-[#00B5D8]';
        case 'Zone': return 'bg-blue-400';
        case 'Block': return 'bg-orange-400';
        case 'Stage': return 'bg-green-400';
        default: return 'bg-blue-500';
    }
  };

  const getTodayPosition = () => {
    const today = new Date();
    const viewStart = timelineStart;
    const viewEnd = timelineEnd;

    if (today < viewStart || today > viewEnd) return null;
    
    const totalDuration = viewEnd.getTime() - viewStart.getTime();
    const todayOffset = today.getTime() - viewStart.getTime();
    
    return (todayOffset / totalDuration) * 100;
  };

  const todayPos = getTodayPosition();

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      
      {/* Gantt Header */}
      <div className="flex border-b border-gray-200">
        {/* Sidebar Header */}
        <div className="w-72 shrink-0 p-4 bg-gray-50 border-r border-gray-200 font-semibold text-gray-700 flex items-center text-sm">
            Project Name
        </div>
        
        {/* Timeline Header */}
        <div className="flex-1 overflow-hidden relative bg-gray-50">
            <div className="absolute inset-0 flex items-center">
                {timelineData.map((item: any, i) => (
                    <div 
                        key={i} 
                        className="h-full flex flex-col items-center justify-center border-r border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide"
                        style={{ width: `${100 / timelineData.length}%` }}
                    >
                        <span>{item.label}</span>
                        {item.subLabel && <span className="text-[10px] text-gray-400 mt-0.5">{item.subLabel}</span>}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Gantt Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex">
         
         {/* Sidebar Column */}
         <div className="w-72 shrink-0 border-r border-gray-200 bg-white z-10">
            {projects.map((project) => {
                const isExpanded = expandedProjectIds.includes(project.id);
                const hasPhases = project.phases && project.phases.length > 0;

                return (
                    <div key={project.id}>
                        {/* Project Row */}
                        <div 
                            className="h-14 px-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                        >
                            <div className="flex-1 cursor-pointer" onClick={() => onEditProject?.(project)}>
                                <div className="font-medium text-gray-900 text-sm truncate group-hover:text-[#00B5D8] transition-colors" title={project.name}>{project.name}</div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] text-gray-500 truncate max-w-[100px]">{project.client}</span>
                                    <Badge status={project.stage} size="sm" />
                                </div>
                            </div>
                            {hasPhases && (
                                <button 
                                    onClick={() => toggleExpand(project.id)}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded ml-2"
                                >
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            )}
                        </div>

                        {/* Phase Rows (Sidebar) */}
                        {isExpanded && project.phases?.map(phase => (
                            <div key={phase.id} className="h-10 px-4 pl-8 border-b border-gray-50 flex items-center bg-gray-50/50">
                                <div className="text-xs font-medium text-gray-600 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getBarColor(phase.type)}`}></div>
                                    {phase.name}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}
         </div>

         {/* Timeline Grid */}
         <div className="flex-1 relative overflow-x-auto custom-scrollbar" ref={scrollContainerRef}>
            <div className="absolute inset-0 w-full h-full min-w-[600px]">
                {/* Vertical Grid Lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                    {timelineData.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-full border-r border-gray-100`}
                            style={{ width: `${100 / timelineData.length}%` }}
                        />
                    ))}
                </div>

                {/* Today Marker */}
                {todayPos !== null && (
                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                        style={{ left: `${todayPos}%` }}
                    >
                        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                    </div>
                )}

                {/* Project Bars */}
                <div className="relative w-full pt-[1px]">
                    {projects.map((project) => {
                        const isExpanded = expandedProjectIds.includes(project.id);
                        const bar = calculateBar(project.startDate, project.endDate);
                        
                        return (
                            <div key={`group-${project.id}`}>
                                {/* Main Project Bar */}
                                <div className="h-14 border-b border-gray-100 flex items-center relative w-full group">
                                    {bar ? (
                                        <div 
                                            onClick={() => onEditProject?.(project)}
                                            className={`h-6 rounded-full relative shadow-sm transition-all hover:h-7 hover:shadow-md cursor-pointer ${getBarColor(project.stage)}`}
                                            style={{ 
                                                left: bar.left, 
                                                width: bar.width,
                                                minWidth: '4px'
                                            }}
                                        >
                                            {/* Tooltip */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded py-1.5 px-3 whitespace-nowrap z-30 pointer-events-none transition-all shadow-lg transform translate-y-1 group-hover:translate-y-0">
                                                <p className="font-bold mb-0.5">{project.name}</p>
                                                <p className="text-gray-300">{project.startDate} → {project.endDate}</p>
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Phase Bars */}
                                {isExpanded && project.phases?.map(phase => {
                                    const phaseBar = calculateBar(phase.startDate, phase.endDate);
                                    return (
                                        <div key={phase.id} className="h-10 border-b border-gray-50 flex items-center relative w-full bg-gray-50/30 group">
                                            {phaseBar ? (
                                                <div 
                                                    className={`h-4 rounded-full relative opacity-80 hover:opacity-100 transition-opacity ${getBarColor(phase.type)}`}
                                                    style={{ 
                                                        left: phaseBar.left, 
                                                        width: phaseBar.width,
                                                        minWidth: '4px'
                                                    }}
                                                >
                                                    {/* Tooltip */}
                                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-[10px] rounded py-1 px-2 whitespace-nowrap z-30 pointer-events-none">
                                                        {phase.name}: {phase.startDate} → {phase.endDate}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
         </div>
      </div>
      
      {/* Footer Controls */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
         <div className="flex items-center gap-2">
            {viewMode === 'week' ? (
                <>
                    <button 
                        onClick={() => onWeekChange?.('prev')}
                        className="p-1.5 hover:bg-white rounded-lg text-gray-500 transition-colors border border-transparent hover:border-gray-200"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-gray-900 text-sm w-32 text-center">
                        {timelineStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {timelineEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <button 
                        onClick={() => onWeekChange?.('next')}
                        className="p-1.5 hover:bg-white rounded-lg text-gray-500 transition-colors border border-transparent hover:border-gray-200"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            ) : (
                <>
                    <button 
                        onClick={() => onYearChange(currentYear - 1)}
                        className="p-1.5 hover:bg-white rounded-lg text-gray-500 transition-colors border border-transparent hover:border-gray-200"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-gray-900 text-lg w-20 text-center">{currentYear}</span>
                    <button 
                        onClick={() => onYearChange(currentYear + 1)}
                        className="p-1.5 hover:bg-white rounded-lg text-gray-500 transition-colors border border-transparent hover:border-gray-200"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}
         </div>
         
         <div className="flex gap-4 text-xs hidden md:flex">
            {Object.values(ProjectStage).map(stage => (
                <div key={stage} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${getBarColor(stage)}`}></div>
                    <span className="text-gray-600">{stage}</span>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};