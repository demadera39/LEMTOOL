import React, { useState, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import AnalysisCanvas from './components/AnalysisCanvas';
import ReportPanel from './components/ReportPanel';
import Dashboard from './components/Dashboard'; // Updated Dashboard import
import ParticipantView from './components/ParticipantView';
import LoginModal from './components/LoginModal';
import AboutModal from './components/AboutModal';
import { Marker, EmotionType, AnalysisReport, User, LayerType, Project } from './types';
import { analyzeWebsite } from './services/geminiService';
import { supabase, signOut, createProject, getProjectById } from './services/supabaseService';
import { Search, MonitorPlay, Lock, Info, AlertCircle, X, Save } from 'lucide-react';

const ADMIN_EMAILS = ['me@marcovanhout.com', 'demadera@marcovanhout.com'];

const App: React.FC = () => {
  // Routing State
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'participant'>('landing');
  const [testProject, setTestProject] = useState<Project | null>(null);

  // App State
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [validUrl, setValidUrl] = useState<string>('');
  
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerType>('emotions');
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
          setUser(null);
          setCurrentView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = (authUser: any) => {
        const email = authUser.email?.toLowerCase();
        const userData: User = {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata.full_name,
          isAdmin: email && ADMIN_EMAILS.some(admin => admin.toLowerCase() === email)
        };
        setUser(userData);
        // If on landing, redirect to dashboard if logged in
        // if (currentView === 'landing') setCurrentView('dashboard');
  };

  // URL Param Handler (For Test Invites)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check for Test ID
    const testId = params.get('test');
    if (testId) {
        // Load project for testing
        getProjectById(testId).then(p => {
            if (p) {
                setTestProject(p);
                setCurrentView('participant');
            }
        });
        return; // Skip normal target check
    }

    // Check for Target URL (Demo Mode)
    const targetParam = params.get('target');
    if (targetParam) {
      setUrl(decodeURIComponent(targetParam));
    }
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = url.trim();
    if (!targetUrl) return;
    if (!targetUrl.match(/^https?:\/\//i)) targetUrl = 'https://' + targetUrl;
    setUrl(targetUrl);
    setValidUrl(targetUrl);
    setHasStarted(true);
    setIsAnalyzing(true);
    setMarkers([]); 
    setReport(null);
    setActiveLayer('emotions');

    try {
      const result = await analyzeWebsite(targetUrl);
      // Mark these as AI source
      const aiMarkers = result.markers.map(m => ({...m, source: 'AI' as const}));
      setMarkers(aiMarkers);
      setReport(result.report);
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddMarker = (emotion: EmotionType) => {
    if (!hasStarted || activeLayer !== 'emotions') return;
    const newMarker: Marker = { 
        id: Math.random().toString(36).substr(2, 9), 
        x: 50, 
        y: 20, 
        layer: 'emotions',
        emotion, 
        source: 'AI', // Treat manual demo markers as AI/System for now
        comment: 'Manually added.' 
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  const handleManualLogin = (manualUser: User) => {
    setUser(manualUser);
    setShowLoginModal(false);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setCurrentView('landing');
  };
  
  const handleSaveProject = async () => {
      if (!user || !report) return;
      if (confirm("Save this analysis to your dashboard?")) {
          await createProject(user.id, validUrl, report, markers);
          setCurrentView('dashboard');
      }
  };

  const handleNewAnalysis = () => {
    setUrl('');
    setValidUrl('');
    setMarkers([]);
    setReport(null);
    setHasStarted(false);
    setIsAnalyzing(false);
    setActiveLayer('emotions');
    setCurrentView('landing');
  };

  // --- VIEWS ---

  if (currentView === 'participant' && testProject) {
      return <ParticipantView project={testProject} onExit={() => { setTestProject(null); setCurrentView('landing'); }} />;
  }

  if (currentView === 'dashboard' && user) {
      return (
        <Dashboard 
            user={user} 
            onLogout={handleLogout} 
            onNavigateToAnalysis={(p) => {}}
            onNavigateToTest={(p) => { setTestProject(p); setCurrentView('participant'); }}
            onNewAnalysis={handleNewAnalysis}
        />
      );
  }

  // --- LANDING VIEW (Tool) ---

  return (
    <div className="flex h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden">
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleManualLogin}
      />

      <AboutModal 
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      <Toolbar onAddMarker={handleAddMarker} />

      <div className="flex-1 flex flex-col h-full relative">
        
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-10 justify-between flex-shrink-0">
          
          <div className="w-32 flex justify-start">
             <button
               onClick={() => setShowAboutModal(true)}
               className="text-xs font-medium text-gray-500 hover:text-lem-orange flex items-center gap-1 transition-colors"
             >
               <Info size={14} />
               About LEMtool
             </button>
          </div>

          <form onSubmit={handleAnalyze} className="flex-1 max-w-2xl mx-auto flex items-center gap-2" noValidate>
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400 group-focus-within:text-lem-orange" />
              </div>
              <input
                type="text" 
                placeholder="Enter website URL (e.g., www.metodic.io)"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-lem-orange/50 focus:border-lem-orange sm:text-sm transition-all"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button 
              type="submit"
              disabled={isAnalyzing || !url}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-white transition-all
                ${isAnalyzing || !url ? 'bg-gray-300 cursor-not-allowed' : 'bg-lem-orange hover:bg-orange-600 shadow-md hover:shadow-lg active:transform active:scale-95'}
              `}
            >
              {isAnalyzing ? 'Thinking...' : (
                <>
                  <MonitorPlay size={16} />
                  Analyze
                </>
              )}
            </button>
          </form>

          <div className="w-32 flex justify-end gap-2">
            {report && user && (
                 <button 
                   onClick={handleSaveProject}
                   className="text-xs font-bold text-gray-500 hover:text-lem-orange flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg"
                 >
                   <Save size={12} /> Save
                 </button>
            )}
            <button 
               onClick={() => user ? setCurrentView('dashboard') : setShowLoginModal(true)}
               className="text-xs font-bold text-gray-400 hover:text-lem-orange flex items-center gap-1"
            >
              <Lock size={12} />
              {user ? 'My Dashboard' : 'Login'}
            </button>
          </div>
        </header>

        {showInfoBanner && (
          <div className="bg-orange-50 border-b border-orange-200 text-orange-900 text-xs px-6 py-2 flex items-center justify-between z-[5]">
             <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-lem-orange"/>
                <span>
                  <strong>Note:</strong> Some websites have security that blocks live previews. Don't worry, the analysis still works perfectly!
                </span>
             </div>
             <button onClick={() => setShowInfoBanner(false)} className="hover:bg-orange-100 p-1 rounded-full"><X size={14} /></button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          
          <div className="flex-1 bg-gray-100 relative flex flex-col overflow-hidden">
             {!hasStarted ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto text-gray-500">
                   <div className="w-24 h-24 bg-gray-200 rounded-full mb-6 flex items-center justify-center text-4xl grayscale opacity-50 border-4 border-gray-200">😑</div>
                   <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Measure Emotion?</h2>
                   <p className="mb-6">Enter a URL above. The live website will load, and AI will overlay emotional markers.</p>
                </div>
             ) : (
               <div className="w-full h-full relative">
                 <AnalysisCanvas 
                    imgUrl={validUrl} 
                    markers={markers} 
                    setMarkers={setMarkers} 
                    isAnalyzing={isAnalyzing} 
                    activeLayer={activeLayer} 
                    setActiveLayer={setActiveLayer}
                    layoutStructure={report?.layoutStructure} 
                    screenshot={report?.screenshot}
                 />
               </div>
             )}
          </div>

          <div className="w-96 h-full shadow-xl z-20 bg-white border-l border-gray-200 flex-shrink-0">
             <ReportPanel 
                report={report} 
                markers={markers} 
                isAnalyzing={isAnalyzing} 
                currentUrl={validUrl} 
                activeLayer={activeLayer} 
                setActiveLayer={setActiveLayer} 
             />
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;