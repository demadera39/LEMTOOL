import React, { useState } from 'react';
import { Project, Marker, EmotionType, AppraisalInput } from '../types';
import AnalysisCanvas from './AnalysisCanvas';
import AppraisalModal from './AppraisalModal';
import Toolbar from './Toolbar'; // Reusing Toolbar for emotion selection
import { EMOTIONS } from '../constants';
import { submitTestSession } from '../services/supabaseService';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ParticipantViewProps {
  project: Project;
  onExit: () => void;
}

const MIN_MARKERS = 10;

const ParticipantView: React.FC<ParticipantViewProps> = ({ project, onExit }) => {
  const [step, setStep] = useState<'intro' | 'test' | 'success'>('intro');
  const [participantName, setParticipantName] = useState('');
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [showAppraisal, setShowAppraisal] = useState(false);
  const [pendingMarkerPos, setPendingMarkerPos] = useState<{x: number, y: number} | null>(null);

  const handleStart = (e: React.FormEvent) => {
      e.preventDefault();
      if(participantName.trim()) setStep('test');
  };

  const handleEmotionSelect = (emotion: EmotionType) => {
      setSelectedEmotion(emotion);
  };

  const handleCanvasClick = (x: number, y: number) => {
      if (!selectedEmotion) {
          alert("Please select an emotion from the sidebar first.");
          return;
      }
      setPendingMarkerPos({ x, y });
      setShowAppraisal(true);
  };

  const handleAppraisalSubmit = (appraisal: AppraisalInput) => {
      if (!pendingMarkerPos || !selectedEmotion) return;
      
      const newMarker: Marker = {
          id: Math.random().toString(36).substr(2, 9),
          x: pendingMarkerPos.x,
          y: pendingMarkerPos.y,
          layer: 'emotions', // Participants only do emotions layer for now
          emotion: selectedEmotion,
          source: 'HUMAN',
          comment: `${appraisal.prefix} ${appraisal.content}`,
          appraisal: appraisal
      };
      
      setMarkers(prev => [...prev, newMarker]);
      setShowAppraisal(false);
      setPendingMarkerPos(null);
      setSelectedEmotion(null); // Reset selection
  };

  const handleSubmitSession = async () => {
      await submitTestSession(project.id, participantName, markers);
      setStep('success');
  };

  if (step === 'intro') {
      return (
          <div className="h-screen w-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-8 text-center">
                  <div className="w-16 h-16 bg-lem-orange rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">👋</div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Help improve {project.name}</h1>
                  <p className="text-gray-600 mb-8">
                      We're using the LEMtool to measure emotional responses to this website. 
                      You'll be asked to drag and drop emotions onto the interface.
                  </p>
                  <form onSubmit={handleStart}>
                      <input 
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-lem-orange/50 outline-none"
                        placeholder="What's your name?"
                        value={participantName}
                        onChange={e => setParticipantName(e.target.value)}
                      />
                      <button type="submit" className="w-full bg-lem-orange text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors">Start Evaluation</button>
                  </form>
              </div>
          </div>
      );
  }

  if (step === 'success') {
      return (
          <div className="h-screen w-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={32} />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
                  <p className="text-gray-600 mb-8">
                      Your feedback has been recorded and will help design a better experience.
                  </p>
                  <button onClick={onExit} className="text-lem-orange font-bold hover:underline">Return to Home</button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
        <AppraisalModal 
            isOpen={showAppraisal} 
            onClose={() => setShowAppraisal(false)} 
            onSubmit={handleAppraisalSubmit}
            emotion={selectedEmotion || EmotionType.NEUTRAL}
        />
        
        {/* Simplified Toolbar */}
        <div className="w-24 bg-white border-r border-gray-200 flex flex-col items-center py-6 z-20 shadow-xl relative">
             <div className="mb-4 text-center">
                 <span className="font-black text-lem-orange">LEM</span>
             </div>
             <div className="flex-1 overflow-y-auto w-full">
                 <Toolbar onAddMarker={handleEmotionSelect} />
             </div>
        </div>

        <div className="flex-1 flex flex-col relative">
            {/* Top Bar with Instructions & Progress */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30">
                <div className="flex items-center gap-4">
                    {selectedEmotion ? (
                        <div className="flex items-center gap-2 bg-orange-50 text-lem-orange px-3 py-1.5 rounded-full border border-orange-100 animate-pulse">
                           <span className="text-xs font-bold uppercase">Selected: {EMOTIONS[selectedEmotion].label}</span>
                           <span className="text-xs">Click on screen to place</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                            <AlertCircle size={16} />
                            <span className="text-sm">Select an emotion from the left</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-500 uppercase">Progress</span>
                        <div className="flex items-center gap-2">
                             <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-lem-orange transition-all duration-500" style={{ width: `${Math.min(100, (markers.length / MIN_MARKERS) * 100)}%` }}></div>
                             </div>
                             <span className={`text-sm font-bold ${markers.length >= MIN_MARKERS ? 'text-green-600' : 'text-gray-900'}`}>{markers.length} / {MIN_MARKERS}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleSubmitSession}
                        disabled={markers.length < MIN_MARKERS}
                        className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black transition-all"
                    >
                        Submit Feedback
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-gray-100">
                 <AnalysisCanvas 
                    imgUrl={project.url}
                    markers={markers}
                    setMarkers={setMarkers}
                    isAnalyzing={false}
                    activeLayer="emotions"
                    setActiveLayer={() => {}} // Participants can't switch layers
                    screenshot={project.ai_report?.screenshot}
                    interactionMode="place_marker"
                    onCanvasClick={handleCanvasClick}
                 />
                 
                 {/* Selection Highlight Overlay */}
                 {selectedEmotion && (
                     <div className="absolute inset-0 pointer-events-none border-4 border-lem-orange/30 z-50"></div>
                 )}
            </div>
        </div>
    </div>
  );
};

export default ParticipantView;