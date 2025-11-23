import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Plus, Trash2, Layout, Layers, ArrowRight, Upload, Sparkles, Loader2, FileText } from 'lucide-react';
import { Project, ProjectPhase } from '../types';
import { analyzeProjectProgramme } from '../services/aiService';

interface ProjectPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSave: (updatedProject: Project) => void;
}

export const ProjectPlanningModal: React.FC<ProjectPlanningModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave
}) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
  });
  
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  
  // New phase form state
  const [newPhase, setNewPhase] = useState<Partial<ProjectPhase>>({
      name: '',
      type: 'Phase',
      startDate: '',
      endDate: ''
  });

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && project) {
        setFormData({
            startDate: project.startDate,
            endDate: project.endDate
        });
        setPhases(project.phases || []);
        setAnalysisSuccess(false);
        setIsAnalyzing(false);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleSave = () => {
      const updatedProject = {
          ...project,
          startDate: formData.startDate,
          endDate: formData.endDate,
          phases: phases
      };
      onSave(updatedProject);
      onClose();
  };

  const handleAddPhase = () => {
      if (newPhase.name && newPhase.startDate && newPhase.endDate) {
          const phase: ProjectPhase = {
              id: Math.random().toString(36).substr(2, 9),
              name: newPhase.name,
              type: newPhase.type as any,
              startDate: newPhase.startDate,
              endDate: newPhase.endDate
          };
          setPhases([...phases, phase]);
          setNewPhase({ name: '', type: 'Phase', startDate: '', endDate: '' });
      }
  };

  const handleRemovePhase = (id: string) => {
      setPhases(phases.filter(p => p.id !== id));
  };

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
      
      try {
          // Call mock AI service
          const extractedPhases = await analyzeProjectProgramme(file);
          
          if (extractedPhases.length > 0) {
              // Map extracted data to full Phase objects with IDs
              const newPhases: ProjectPhase[] = extractedPhases.map(p => ({
                  id: Math.random().toString(36).substr(2, 9),
                  name: p.name || 'Unnamed Task',
                  startDate: p.startDate || '',
                  endDate: p.endDate || '',
                  type: p.type || 'Stage'
              }));
              
              setPhases(prev => [...prev, ...newPhases]);
              setAnalysisSuccess(true);
          }
      } catch (error) {
          console.error("AI Analysis failed", error);
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Project Plan: {project.name}</h2>
            <p className="text-sm text-gray-500">Manage timeline and breakdown structure</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
            
            {/* Project Timeline */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                    <Calendar className="w-4 h-4 text-[#00B5D8]" /> 
                    Main Project Timeline
                </h3>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Start Date</label>
                        <input 
                            type="date" 
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B5D8] text-gray-900 text-sm font-medium"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase">End Date</label>
                        <input 
                            type="date" 
                            value={formData.endDate}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B5D8] text-gray-900 text-sm font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Breakdown / Phases */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                    <Layers className="w-4 h-4 text-[#7C6FF6]" /> 
                    Project Breakdown
                </h3>

                {/* AI Import Drop Zone */}
                <div 
                    className={`
                        relative border-2 border-dashed rounded-xl p-4 text-center transition-all group cursor-pointer
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
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                    />
                    
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 className="w-6 h-6 text-[#00B5D8] animate-spin mb-2" />
                            <h3 className="text-sm font-bold text-gray-900">AI Scanning...</h3>
                            <p className="text-xs text-gray-500">Filtering for Painting & Decorating tasks</p>
                        </div>
                    ) : analysisSuccess ? (
                        <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">Tasks Extracted!</h3>
                            <p className="text-xs text-gray-500">Relevant items added to the breakdown below.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">AI Programme Import</h3>
                            <p className="text-xs text-gray-500 max-w-xs mx-auto">
                                Drag & drop the full Client Programme here. We'll extract only the relevant tasks.
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Add New Phase Manually */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/60">
                    <p className="text-xs font-semibold text-gray-500 mb-3 uppercase">Add Sub-Dependency Manually</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-1">
                            <input 
                                type="text" 
                                placeholder="Name (e.g. Zone A)" 
                                value={newPhase.name}
                                onChange={(e) => setNewPhase({...newPhase, name: e.target.value})}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#7C6FF6] text-gray-900"
                            />
                        </div>
                        <div>
                            <select 
                                value={newPhase.type}
                                onChange={(e) => setNewPhase({...newPhase, type: e.target.value as any})}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#7C6FF6] text-gray-900"
                            >
                                <option value="Phase">Phase</option>
                                <option value="Zone">Zone</option>
                                <option value="Block">Block</option>
                                <option value="Stage">Stage</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input 
                                type="date" 
                                value={newPhase.startDate}
                                onChange={(e) => setNewPhase({...newPhase, startDate: e.target.value})}
                                className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#7C6FF6] text-gray-900"
                            />
                            <input 
                                type="date" 
                                value={newPhase.endDate}
                                onChange={(e) => setNewPhase({...newPhase, endDate: e.target.value})}
                                className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#7C6FF6] text-gray-900"
                            />
                        </div>
                        <button 
                            onClick={handleAddPhase}
                            className="bg-[#7C6FF6] text-white rounded-lg hover:bg-[#6b5ce6] transition-colors flex items-center justify-center"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* List Phases */}
                {phases.length > 0 ? (
                    <div className="space-y-2">
                        {phases.map(phase => (
                            <div key={phase.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-all group animate-in fade-in slide-in-from-bottom-1">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                                        ${phase.type === 'Zone' ? 'bg-blue-50 text-blue-600' : 
                                          phase.type === 'Block' ? 'bg-orange-50 text-orange-600' :
                                          phase.type === 'Stage' ? 'bg-green-50 text-green-600' : 
                                          'bg-gray-100 text-gray-600'
                                        }`}>
                                        {phase.type}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">{phase.name}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>{phase.startDate} <ArrowRight className="w-3 h-3 inline mx-1 text-gray-300" /> {phase.endDate}</span>
                                    <button 
                                        onClick={() => handleRemovePhase(phase.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 bg-gray-50 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs">
                        No sub-dependencies added. Use the AI import or add manually.
                    </div>
                )}
            </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-[#00B5D8] hover:bg-[#009bb8] rounded-lg shadow-sm transition-colors">
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};