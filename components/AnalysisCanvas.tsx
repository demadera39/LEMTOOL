import React, { useRef, useState, useEffect } from 'react';
import { Marker, EmotionType, LayerType, LayoutSection } from '../types';
import EmotionToken from './EmotionToken';
import { EMOTIONS } from '../constants';
import { X, MousePointer2, Layers, ExternalLink, Brain, Lightbulb, Heart, Zap, AlertTriangle, Info, ScanEye } from 'lucide-react';

interface AnalysisCanvasProps {
  imgUrl: string;
  markers: Marker[];
  setMarkers: React.Dispatch<React.SetStateAction<Marker[]>>;
  isAnalyzing: boolean;
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;
  layoutStructure?: LayoutSection[];
}

const LOADING_MESSAGES_SEQUENCE = [
    "Step 1/3: Reading Emotions...", 
    "Step 2/3: Analyzing Needs...", 
    "Step 3/3: Strategizing Brief..."
];

const LayerIconRenderer: React.FC<{ layer: LayerType; type?: string }> = ({ layer, type }) => {
    const iconProps = { size: 24, className: "text-white" };
    if (layer === 'needs') {
        if (type === 'Autonomy') return <MousePointer2 {...iconProps} />;
        if (type === 'Competence') return <Zap {...iconProps} />;
        if (type === 'Relatedness') return <Heart {...iconProps} />;
        return <Brain {...iconProps} />;
    }
    if (layer === 'strategy') {
        if (type === 'Opportunity') return <Lightbulb {...iconProps} />;
        if (type === 'Pain Point') return <AlertTriangle {...iconProps} />;
        if (type === 'Insight') return <Info {...iconProps} />;
        return <Lightbulb {...iconProps} />;
    }
    return null; 
};

const SpeechBubble: React.FC<{ marker: Marker; onClose: () => void }> = ({ marker, onClose }) => {
    let title = 'Insight';
    if (marker.layer === 'emotions' && marker.emotion) title = EMOTIONS[marker.emotion].label;
    if (marker.layer === 'needs') title = marker.need || 'Psych Need';
    if (marker.layer === 'strategy') title = marker.brief_type || 'Strategic Point';

    return (
      <div 
        className="absolute bottom-full mb-3 w-80 bg-white rounded-lg shadow-2xl p-4 z-30 transform -translate-x-1/2 left-1/2 flex flex-col"
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-sm text-gray-900">{title}</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="text-sm text-gray-600 flex-grow pr-1 max-h-48 overflow-y-auto custom-scrollbar">
           {marker.comment}
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-2 w-4 h-4 bg-white rotate-45"></div>
      </div>
    );
};

const LoadingOverlay = () => {
    const [currentEmotionIndex, setCurrentEmotionIndex] = useState(0);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const emotionKeys = Object.values(EMOTIONS).map(e => e.id);
  
    useEffect(() => {
      const messageInterval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES_SEQUENCE.length);
      }, 4000); 
  
      const emotionInterval = setInterval(() => {
        setCurrentEmotionIndex(prev => (prev + 1) % emotionKeys.length);
      }, 800); 
  
      return () => {
        clearInterval(messageInterval);
        clearInterval(emotionInterval);
      };
    }, [emotionKeys.length]);
  
    return (
      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative w-32 h-32 flex items-center justify-center">
           <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="40" stroke="#F26522" strokeWidth="6" fill="none" className="animate-progress-ring" style={{ strokeDasharray: 251.2, strokeDashoffset: 251.2 }}/>
          </svg>
          <div className="relative z-20">
              <EmotionToken emotion={emotionKeys[currentEmotionIndex]} size="lg" />
          </div>
        </div>
        <div className="mt-8 bg-white/80 backdrop-blur-md rounded-full px-8 py-4 shadow-lg z-20">
          <p className="font-bold text-gray-800 flex items-center gap-3 text-lg">
            <span className="w-3 h-3 bg-lem-orange rounded-full animate-pulse"></span>
            {LOADING_MESSAGES_SEQUENCE[loadingMessageIndex]}
          </p>
        </div>
      </div>
    );
};

const AdaptiveWireframe = ({ structure }: { structure: LayoutSection[] }) => {
    const totalHeight = structure.reduce((acc, section) => acc + section.estimatedHeight, 0) || 4000;
    
    return (
        <div className="w-full h-full bg-gray-50 border-r border-gray-200 p-4 space-y-4">
            {structure.map((section, i) => {
                const height = (section.estimatedHeight / totalHeight) * 100;
                return (
                    <div key={i} className="border border-dashed border-gray-300 rounded p-2 text-center bg-gray-100" style={{ minHeight: `${Math.max(5, height)}%`, backgroundColor: section.backgroundColorHint === 'dark' ? '#4a4a4a' : '#f0f0f0' }}>
                        <span className="text-xs text-gray-400 font-mono uppercase">{section.type}</span>
                    </div>
                )
            })}
        </div>
    )
};


const AnalysisCanvas: React.FC<AnalysisCanvasProps> = ({ imgUrl, markers, setMarkers, isAnalyzing, activeLayer, setActiveLayer, layoutStructure }) => {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [showSchematic, setShowSchematic] = useState(false);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const stationaryFramesRef = useRef<number>(0);
  
  useEffect(() => {
    if (isAnalyzing && scrollWrapperRef.current) {
        const el = scrollWrapperRef.current;
        el.scrollTop = 0;
        lastScrollTopRef.current = 0;
        stationaryFramesRef.current = 0;

        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);

        scrollIntervalRef.current = setInterval(() => {
            if (!el) {
                if(scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
                return;
            }

            const scrollAmount = 15; // CALIBRATED SLOW SPEED
            const scrollHeight = el.scrollHeight;
            const clientHeight = el.clientHeight;

            if (el.scrollTop >= scrollHeight - clientHeight - scrollAmount) {
                el.scrollTop = scrollHeight - clientHeight;
                if(scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
                return;
            }
            
            if (Math.abs(el.scrollTop - lastScrollTopRef.current) < 1) { 
                stationaryFramesRef.current += 1;
            } else {
                stationaryFramesRef.current = 0;
            }
            lastScrollTopRef.current = el.scrollTop;
            
            if (stationaryFramesRef.current > 10) {
                 el.scrollTop = scrollHeight - clientHeight;
                 if(scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
                 return;
            }

            el.scrollTop += scrollAmount;
        }, 20);

        return () => { if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current); };
    } else {
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
  }, [isAnalyzing]);


  const handleBackgroundClick = () => setActiveMarkerId(null);
  const handleMarkerClick = (e: React.MouseEvent, markerId: string) => { 
      e.stopPropagation(); 
      setActiveMarkerId(markerId); 
  };
  
  const filteredMarkers = markers.filter(m => m.layer === activeLayer);
  
  const LayerToggleButton = ({ layer, label, icon }: { layer: LayerType, label: string, icon: React.ReactNode }) => (
    <button onClick={() => setActiveLayer(layer)} className={`flex-grow flex items-center justify-center gap-2 px-3 py-1 text-xs font-bold rounded-md transition-all ${activeLayer === layer ? 'bg-white text-lem-orange shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>{icon}{label}</button>
  );

  return (
    <div className="w-full h-full flex flex-col relative bg-gray-200">
      {isAnalyzing && <LoadingOverlay />}

      <div className="h-12 bg-white/70 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-4 z-30 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <LayerToggleButton layer="emotions" label="Emotions" icon={<Heart size={14} />} />
          <LayerToggleButton layer="needs" label="Psych Needs" icon={<Brain size={14} />} />
          <LayerToggleButton layer="strategy" label="Strategy" icon={<Lightbulb size={14} />} />
        </div>
        
        <div className="flex items-center gap-4">
             <button onClick={() => setShowSchematic(!showSchematic)} className={`px-3 py-1 text-xs rounded-md font-bold flex items-center gap-1 ${showSchematic ? 'bg-lem-orange text-white' : 'bg-gray-200 text-gray-600'}`}><Layers size={14}/> Schematic View</button>
             <a href={imgUrl} target="_blank" rel="noreferrer" className="px-3 py-1 text-xs rounded-md font-bold bg-gray-200 text-gray-600 flex items-center gap-1"><ExternalLink size={14}/> Open in New Tab</a>
        </div>
      </div>
      
      {isAnalyzing && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 text-sm font-bold px-4 py-2 rounded-lg shadow-lg z-30 flex items-center gap-2 cursor-pointer" onClick={() => setShowSchematic(true)}> 
            <AlertTriangle size={16} />
            <span>Website preview might be blocked. Click here to switch to Schematic View if it's blank.</span>
        </div>
      )}

      <div ref={scrollWrapperRef} className="flex-1 overflow-auto relative">
        <div className="relative w-full min-h-[400vh] bg-gray-50 shadow-2xl mx-auto" onClick={handleBackgroundClick} style={{ pointerEvents: isAnalyzing ? 'none' : 'auto'}}>
          <div className="absolute inset-0 z-0">
            {showSchematic ? (
              <AdaptiveWireframe structure={layoutStructure || []} />
            ) : (
              <iframe 
                src={imgUrl} 
                className={`w-full h-full border-none transition-opacity duration-300 ${isAnalyzing ? 'opacity-50 blur-sm' : 'opacity-100'}`} 
                title="Live Website" 
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
          <div className="absolute inset-0 z-10" style={{ pointerEvents: 'auto' }}>
            {filteredMarkers.map((marker) => (
              <div 
                key={marker.id} 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              >
                {activeMarkerId === marker.id && <SpeechBubble marker={marker} onClose={() => setActiveMarkerId(null)} />}
                <div onClick={(e) => handleMarkerClick(e, marker.id)} className="relative animate-float">
                  {marker.layer === 'emotions' ? (
                     <EmotionToken emotion={marker.emotion || EmotionType.NEUTRAL} selected={activeMarkerId === marker.id} size="lg" />
                  ) : (
                    <div className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer ${activeMarkerId === marker.id ? 'ring-4 ring-white ring-opacity-50 scale-110 z-10' : 'hover:scale-105'}`}>
                        {marker.layer === 'needs' && (
                            <div className={`absolute inset-0 rounded-full opacity-70 ${marker.need === 'Autonomy' ? 'bg-blue-400' : marker.need === 'Competence' ? 'bg-green-400' : marker.need === 'Relatedness' ? 'bg-pink-400' : 'bg-purple-400'}`}></div>
                        )}
                        {marker.layer === 'strategy' && (
                            <div className={`absolute inset-0 rounded-full opacity-80 ${marker.brief_type === 'Opportunity' ? 'bg-green-500 animate-pulse-strong' : marker.brief_type === 'Pain Point' ? 'bg-red-500 animate-pulse-strong' : marker.brief_type === 'Insight' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                        )}
                        <div className="relative z-10 text-white">
                           <LayerIconRenderer layer={marker.layer} type={marker.need || marker.brief_type} />
                        </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisCanvas;