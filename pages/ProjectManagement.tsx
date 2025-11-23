import React, { useState } from 'react';
import { MOCK_PROJECTS, MOCK_CLIENTS } from '../services/mockData';
import { ProjectGantt } from '../components/ProjectGantt';
import { ProjectMap } from '../components/ProjectMap';
import { ProjectPlanningModal } from '../components/ProjectPlanningModal';
import { Project, Client } from '../types';
import { Calendar, Filter, CalendarClock, Search, Map as MapIcon, Layout } from 'lucide-react';
import { STAGE_ORDER } from '../constants';

export const ProjectManagement: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  
  const [viewMode, setViewMode] = useState<'month' | 'quarter' | 'week' | 'map'>('month');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Week View State
  const [weekStartDate, setWeekStartDate] = useState(() => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
      return new Date(d.setDate(diff));
  });
  const [weekRange, setWeekRange] = useState<number>(12);

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

  // Helper to shift weeks
  const handleWeekChange = (direction: 'prev' | 'next') => {
      const newDate = new Date(weekStartDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? (weekRange * 7) : -(weekRange * 7)));
      setWeekStartDate(newDate);
  };

  const handleEditProject = (project: Project) => {
      setEditingProject(project);
      setIsModalOpen(true);
  };

  const handleSaveProject = (updatedProject: Project) => {
    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
    }
    setIsModalOpen(false);
    setEditingProject(undefined);
  };

  // Filter and Sort Projects
  const filteredProjects = projects
    .filter(p => {
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (stageFilter !== 'All' && p.stage !== stageFilter) return false;
        return true;
    })
    .sort((a, b) => {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarClock className="w-6 h-6 text-[#00B5D8]" />
                Project Management
            </h2>
            <p className="text-sm text-gray-500">Timeline visualization and schedule planning.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
            
            {/* Search & Filter */}
            <div className="flex gap-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] w-32 lg:w-56 shadow-sm"
                    />
                </div>
                <div className="relative">
                    <select 
                        value={stageFilter}
                        onChange={(e) => setStageFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5D8]/20 focus:border-[#00B5D8] appearance-none cursor-pointer shadow-sm text-gray-900"
                    >
                        <option value="All">All Stages</option>
                        {STAGE_ORDER.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* View Toggle */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200">
                <div className="flex items-center">
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'week' ? 'bg-white text-[#00B5D8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Week
                    </button>
                    
                    {/* Week Range Selector (Only visible in week mode) */}
                    {viewMode === 'week' && (
                        <div className="border-l border-gray-300 mx-1 pl-1">
                            <select 
                                value={weekRange}
                                onChange={(e) => setWeekRange(parseInt(e.target.value))}
                                className="bg-transparent text-xs font-medium text-gray-600 py-1 px-1 rounded focus:outline-none cursor-pointer hover:text-[#00B5D8]"
                            >
                                <option value={4}>4 Wks</option>
                                <option value={8}>8 Wks</option>
                                <option value={12}>12 Wks</option>
                            </select>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-white text-[#00B5D8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Month
                </button>
                <button
                    onClick={() => setViewMode('quarter')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'quarter' ? 'bg-white text-[#00B5D8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Quarter
                </button>
                
                <div className="w-[1px] bg-gray-300 h-4 mx-1"></div>

                <button
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${viewMode === 'map' ? 'bg-white text-[#00B5D8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <MapIcon className="w-4 h-4" />
                    Map
                </button>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'map' ? (
            <ProjectMap projects={filteredProjects} />
        ) : (
            <ProjectGantt 
                projects={filteredProjects} 
                viewMode={viewMode}
                currentYear={currentYear}
                onYearChange={setCurrentYear}
                weekStartDate={weekStartDate}
                weekRange={weekRange}
                onWeekChange={handleWeekChange}
                onEditProject={handleEditProject}
            />
        )}
      </div>

      {/* Edit Modal */}
      {editingProject && (
        <ProjectPlanningModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            project={editingProject}
            onSave={handleSaveProject}
        />
      )}
    </div>
  );
};