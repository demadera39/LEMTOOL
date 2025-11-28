import React, { useState, useEffect } from 'react';
import { User, Project, TestSession, Marker } from '../types';
import { getProjects, createProject, getProjectSessions, submitTestSession } from '../services/supabaseService';
import { Plus, Layout, Users, Bot, Share2, Eye, LogOut } from 'lucide-react';
import AnalysisCanvas from './AnalysisCanvas';
import ReportPanel from './ReportPanel';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onNavigateToAnalysis: (project: Project) => void;
  onNavigateToTest: (project: Project) => void;
  onNewAnalysis: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onNavigateToTest, onNewAnalysis }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  
  // Detail View State
  const [activeLayer, setActiveLayer] = useState<'emotions' | 'needs' | 'strategy'>('emotions');
  const [showAI, setShowAI] = useState(true);
  const [showHumans, setShowHumans] = useState(true);

  useEffect(() => {
     loadProjects();
  }, [user]);

  useEffect(() => {
     if (selectedProject) {
         loadSessions(selectedProject.id);
     }
  }, [selectedProject]);

  const loadProjects = async () => {
      const data = await getProjects(user.id);
      setProjects(data);
  };

  const loadSessions = async (pid: string) => {
      const data = await getProjectSessions(pid);
      setSessions(data);
  };

  // Combine markers based on toggles
  const getCombinedMarkers = () => {
      if (!selectedProject) return [];
      let combined: Marker[] = [];
      
      if (showAI && selectedProject.ai_markers) {
          combined = [...combined, ...selectedProject.ai_markers];
      }
      
      if (showHumans) {
          sessions.forEach(s => {
              combined = [...combined, ...s.markers];
          });
      }
      return combined;
  };

  const handleCopyInvite = (project: Project) => {
      const link = `${window.location.origin}?test=${project.id}`;
      navigator.clipboard.writeText(link);
      alert("Test Invite Link copied to clipboard!");
  };

  if (viewMode === 'detail' && selectedProject && selectedProject.ai_report) {
      const markers = getCombinedMarkers();
      
      return (
          <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
              <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-20 shadow-lg">
                  <div className="font-black text-lem-orange mb-8">LEM</div>
                  <button onClick={() => setViewMode('list')} className="p-2 text-gray-400 hover:text-gray-900 mb-4" title="Back to Dashboard"><Layout size={20} /></button>
                  <div className="w-8 h-px bg-gray-200 mb-4"></div>
                  {/* Toggles */}
                  <button 
                    onClick={() => setShowAI(!showAI)} 
                    className={`p-2 rounded-lg mb-2 transition-all ${showAI ? 'bg-lem-orange/10 text-lem-orange ring-2 ring-lem-orange' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Toggle AI Data"
                  >
                      <Bot size={20} />
                  </button>
                  <button 
                    onClick={() => setShowHumans(!showHumans)} 
                    className={`p-2 rounded-lg transition-all ${showHumans ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Toggle Participant Data"
                  >
                      <Users size={20} />
                  </button>
              </div>

              <div className="flex-1 flex flex-col h-full relative">
                  <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
                      <div className="flex items-center gap-4">
                          <h2 className="font-bold text-gray-900">{selectedProject.name}</h2>
                          <div className="h-4 w-px bg-gray-300"></div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1"><Users size={14} /> {sessions.length} Participants</span>
                          </div>
                      </div>
                      <button onClick={() => handleCopyInvite(selectedProject)} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                          <Share2 size={14} /> Invite Testers
                      </button>
                  </header>

                  <div className="flex-1 flex overflow-hidden">
                      <div className="flex-1 relative bg-gray-100">
                          <AnalysisCanvas 
                             imgUrl={selectedProject.url}
                             markers={markers}
                             setMarkers={() => {}} // Read only in dash
                             isAnalyzing={false}
                             activeLayer={activeLayer}
                             setActiveLayer={setActiveLayer}
                             screenshot={selectedProject.ai_report.screenshot}
                             interactionMode="read_only"
                          />
                      </div>
                      <div className="w-96 border-l border-gray-200 bg-white shadow-xl z-10">
                          <ReportPanel 
                             report={selectedProject.ai_report}
                             markers={markers} // Passing combined markers updates stats
                             isAnalyzing={false}
                             currentUrl={selectedProject.url}
                             activeLayer={activeLayer}
                             setActiveLayer={setActiveLayer}
                          />
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="font-black text-lem-orange text-2xl tracking-tighter">LEM</div>
          <span className="text-sm font-bold text-gray-400">DASHBOARD</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
          <div className="flex justify-between items-end mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
              <button onClick={onNewAnalysis} className="bg-lem-orange text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-orange-600 flex items-center gap-2 text-sm transition-colors">
                  <Plus size={16} /> New Analysis
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.length === 0 ? (
                  <div className="col-span-3 text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                      <Layout size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No projects yet. Run an AI analysis on the homepage to start.</p>
                  </div>
              ) : projects.map(p => (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="h-32 bg-gray-100 relative overflow-hidden">
                          {p.ai_report?.screenshot ? (
                              <img src={p.ai_report.screenshot} className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity" alt="preview" />
                          ) : (
                              <div className="flex items-center justify-center h-full text-gray-300"><Layout size={32} /></div>
                          )}
                          <div className="absolute top-2 right-2 flex gap-1">
                              <span className="bg-black/50 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Bot size={10} /> AI Ready</span>
                          </div>
                      </div>
                      <div className="p-4">
                          <h3 className="font-bold text-gray-900 mb-1 truncate">{p.name}</h3>
                          <p className="text-xs text-gray-500 mb-4">{new URL(p.url).host}</p>
                          
                          <div className="flex items-center gap-2 mb-4">
                              <button onClick={() => handleCopyInvite(p)} className="flex-1 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 flex items-center justify-center gap-1">
                                  <Share2 size={12} /> Invite Link
                              </button>
                               <button onClick={() => onNavigateToTest(p)} className="py-1.5 px-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200" title="Preview Test">
                                  <Eye size={12} />
                              </button>
                          </div>
                          
                          <button 
                            onClick={() => { setSelectedProject(p); setViewMode('detail'); }} 
                            className="w-full py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors"
                          >
                              View Insights
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </main>
    </div>
  );
};

export default Dashboard;