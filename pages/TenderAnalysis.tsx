
import React, { useState, useRef, useEffect } from 'react';
import { MOCK_PROJECTS } from '../services/mockData';
import { Project, TenderDoc, ChatMessage, CribSheet } from '../types';
import { classifyTenderDocument, generateCribSheet, queryTenderAgent } from '../services/aiService';
import { 
  BrainCircuit, Upload, FileText, Search, Send, Paperclip, Globe, Sparkles, 
  AlertTriangle, CheckCircle, File, Clock, ChevronRight, ChevronDown, Bot, MessageSquare 
} from 'lucide-react';

export const TenderAnalysis: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<TenderDoc[]>([]);
  const [cribSheet, setCribSheet] = useState<CribSheet | null>(null);
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'docs' | 'chat' | 'crib'>('chat');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'init', 
      role: 'assistant', 
      content: "Hello. I am your Tender AI Agent. I combine expertise in Quantity Surveying, Project Management, and Construction Law. Upload your tender documents to begin, or ask me to search for client financial data.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mobileTab]);

  const handleProjectSelect = (projectId: string) => {
    const project = MOCK_PROJECTS.find(p => p.id === projectId) || null;
    setSelectedProject(project);
    setDocuments([]);
    setCribSheet(null);
    if (project) {
        // Simulate fetching existing data
        loadMockDataForProject(project);
    }
  };

  const loadMockDataForProject = async (project: Project) => {
      // Simulate crib sheet generation
      const sheet = await generateCribSheet(project.code);
      setCribSheet(sheet);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const newDocs: TenderDoc[] = Array.from(e.target.files).map((file: File) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            category: classifyTenderDocument(file),
            status: 'ready',
            uploadDate: new Date().toLocaleDateString()
        }));
        setDocuments(prev => [...prev, ...newDocs]);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
        const response = await queryTenderAgent(userMsg.content, documents);
        setMessages(prev => [...prev, response]);
    } catch (err) {
        console.error(err);
    } finally {
        setIsTyping(false);
    }
  };

  // Group docs by category
  const docsByCategory = documents.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
  }, {} as Record<string, TenderDoc[]>);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7C6FF6]/10 rounded-xl">
                <BrainCircuit className="w-6 h-6 text-[#7C6FF6]" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">Tender AI Analyst</h2>
                <p className="text-sm text-gray-500">Commercial Intelligence & Risk Assessment</p>
            </div>
        </div>
        <div className="w-full md:w-64">
            <select 
                className="w-full p-2 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:border-[#7C6FF6]"
                onChange={(e) => handleProjectSelect(e.target.value)}
                defaultValue=""
            >
                <option value="" disabled>Select Project Context...</option>
                {MOCK_PROJECTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
        </div>
      </div>

      {/* Mobile Tab Bar (Hidden on Desktop) */}
      {selectedProject && (
        <div className="flex md:hidden bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
            <button 
                onClick={() => setMobileTab('docs')}
                className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${mobileTab === 'docs' ? 'bg-white text-[#7C6FF6] shadow-sm' : 'text-gray-500'}`}
            >
                <File className="w-3 h-3" /> Docs
            </button>
            <button 
                onClick={() => setMobileTab('chat')}
                className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${mobileTab === 'chat' ? 'bg-white text-[#7C6FF6] shadow-sm' : 'text-gray-500'}`}
            >
                <MessageSquare className="w-3 h-3" /> Chat
            </button>
            <button 
                onClick={() => setMobileTab('crib')}
                className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${mobileTab === 'crib' ? 'bg-white text-[#7C6FF6] shadow-sm' : 'text-gray-500'}`}
            >
                <FileText className="w-3 h-3" /> Crib Sheet
            </button>
        </div>
      )}

      {/* Main Workspace */}
      {selectedProject ? (
        <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
            
            {/* LEFT PANEL: Documents */}
            <div className={`
                w-full md:w-1/4 bg-white rounded-2xl shadow-sm border border-gray-200 flex-col overflow-hidden
                ${mobileTab === 'docs' ? 'flex' : 'hidden md:flex'}
            `}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-sm">Project Documents</h3>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {documents.length === 0 && (
                        <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            Drag & Drop Contracts, Drawings, Specs, and Programs here.
                        </div>
                    )}

                    {Object.entries(docsByCategory).map(([category, docs]) => (
                        <div key={category}>
                            <div className="text-xs font-bold text-gray-400 uppercase mb-2 px-1">{category}s</div>
                            <div className="space-y-1">
                                {docs.map(doc => (
                                    <div key={doc.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm group cursor-pointer">
                                        <File className="w-4 h-4 text-gray-400" />
                                        <span className="truncate flex-1 text-gray-700 font-medium">{doc.name}</span>
                                        <span className="text-[10px] text-gray-400">{doc.uploadDate}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CENTER PANEL: Chat */}
            <div className={`
                w-full md:flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex-col overflow-hidden relative
                ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}
            `}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#F6F8FB]/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 bg-[#7C6FF6] rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            )}
                            
                            <div className={`max-w-[80%] space-y-2`}>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                                    ${msg.role === 'user' 
                                        ? 'bg-white border border-gray-200 text-gray-800 rounded-tr-none' 
                                        : 'bg-white border border-purple-100 text-gray-800 rounded-tl-none'
                                    }`}>
                                    
                                    {msg.isWebSearch && (
                                        <div className="flex items-center gap-1.5 text-xs text-[#00B5D8] font-semibold mb-2 bg-cyan-50 px-2 py-1 rounded-md w-fit">
                                            <Globe className="w-3 h-3" />
                                            Searching live web data...
                                        </div>
                                    )}
                                    
                                    <div className="markdown-body whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                </div>
                                
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="flex gap-2 pl-1 flex-wrap">
                                        {msg.sources.map((source, i) => (
                                            <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 flex items-center gap-1">
                                                <Paperclip className="w-3 h-3" /> {source}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-gray-600">ME</span>
                                </div>
                            )}
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 bg-[#7C6FF6] rounded-full flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="bg-white border border-purple-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                                <div className="w-2 h-2 bg-[#7C6FF6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-[#7C6FF6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-[#7C6FF6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={handleSendMessage} className="relative">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about risks, scope gaps, or client credit check..."
                            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C6FF6]/20 focus:border-[#7C6FF6] text-sm text-gray-900 transition-all"
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#7C6FF6] text-white rounded-lg hover:bg-[#6b5ce6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    {/* Suggestions - Scrollable on mobile */}
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-scrollbar">
                        <button onClick={() => setInput("Check Project Location")} className="whitespace-nowrap text-[10px] px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-gray-500 hover:text-[#7C6FF6] hover:border-[#7C6FF6]/30 transition-colors">
                            Check Project Location
                        </button>
                        <button onClick={() => setInput("Search client financial health")} className="whitespace-nowrap text-[10px] px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-gray-500 hover:text-[#7C6FF6] hover:border-[#7C6FF6]/30 transition-colors">
                            Search client financial health
                        </button>
                        <button onClick={() => setInput("Compare Spec vs Drawings for discrepancies")} className="whitespace-nowrap text-[10px] px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100 text-gray-500 hover:text-[#7C6FF6] hover:border-[#7C6FF6]/30 transition-colors">
                            Compare Spec vs Drawings
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Crib Sheet */}
            <div className={`
                w-full md:w-1/4 bg-white rounded-2xl shadow-sm border border-gray-200 flex-col overflow-hidden
                ${mobileTab === 'crib' ? 'flex' : 'hidden md:flex'}
            `}>
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#00B5D8]" /> Project Crib Sheet
                    </h3>
                </div>
                
                {cribSheet ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        
                        {/* Key Commercials */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Commercial Terms</h4>
                            <div className="space-y-2">
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-[10px] text-blue-600 font-bold uppercase">Contract Sum</p>
                                    <p className="text-sm font-bold text-gray-900">{cribSheet.contractSum}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Payment Terms</p>
                                    <p className="text-sm font-medium text-gray-800">{cribSheet.paymentTerms}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Retention</p>
                                    <p className="text-sm font-medium text-gray-800">{cribSheet.retention}</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                    <p className="text-[10px] text-red-600 font-bold uppercase flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> LADs
                                    </p>
                                    <p className="text-sm font-medium text-red-900">{cribSheet.lads}</p>
                                </div>
                            </div>
                        </div>

                        {/* Risks */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Identified Risks</h4>
                            {cribSheet.risks.map(risk => (
                                <div key={risk.id} className={`p-3 rounded-xl border ${
                                    risk.severity === 'High' ? 'bg-red-50 border-red-200' :
                                    risk.severity === 'Medium' ? 'bg-orange-50 border-orange-200' :
                                    'bg-yellow-50 border-yellow-200'
                                }`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                            risk.severity === 'High' ? 'bg-red-200 text-red-800' :
                                            risk.severity === 'Medium' ? 'bg-orange-200 text-orange-800' :
                                            'bg-yellow-200 text-yellow-800'
                                        }`}>{risk.category}</span>
                                        <span className="text-[10px] text-gray-500">{risk.clauseRef}</span>
                                    </div>
                                    <p className="text-xs text-gray-800 font-medium leading-relaxed">
                                        {risk.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Timeline */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Timeline</h4>
                            <div className="flex items-center justify-between text-xs text-gray-600 border-b border-gray-100 pb-2">
                                <span>Start Date:</span>
                                <span className="font-bold">{cribSheet.startDate}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600 border-b border-gray-100 pb-2">
                                <span>Duration:</span>
                                <span className="font-bold">{cribSheet.duration}</span>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                        <Sparkles className="w-12 h-12 mb-3 text-gray-200" />
                        <p className="text-sm">Upload documents to generate the Project Crib Sheet</p>
                    </div>
                )}
            </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="w-16 h-16 bg-[#7C6FF6]/10 rounded-2xl flex items-center justify-center mb-6">
                <BrainCircuit className="w-8 h-8 text-[#7C6FF6]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome to Tender AI</h2>
            <p className="text-gray-500 max-w-md text-center mb-8 text-sm">
                Select a project from the dropdown above to start analyzing contracts, drawings, and specifications with our expert agent.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left w-full max-w-3xl">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <Search className="w-5 h-5 text-[#00B5D8] mb-2" />
                    <h4 className="font-bold text-sm text-gray-900">Client Intel</h4>
                    <p className="text-xs text-gray-500 mt-1">Live credit checks & financial news.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mb-2" />
                    <h4 className="font-bold text-sm text-gray-900">Risk Detection</h4>
                    <p className="text-xs text-gray-500 mt-1">Finds LADs, conflicts & scope gaps.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <FileText className="w-5 h-5 text-[#7C6FF6] mb-2" />
                    <h4 className="font-bold text-sm text-gray-900">Crib Sheets</h4>
                    <p className="text-xs text-gray-500 mt-1">Auto-generated project summaries.</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
