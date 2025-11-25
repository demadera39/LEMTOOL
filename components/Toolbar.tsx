import React from 'react';
import { EMOTIONS } from '../constants';
import EmotionToken from './EmotionToken';
import { EmotionType } from '../types';

interface ToolbarProps {
  onAddMarker: (emotion: EmotionType) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddMarker }) => {
  return (
    <div className="w-24 bg-white border-r border-gray-200 flex flex-col items-center py-6 overflow-y-auto z-20 shadow-xl scrollbar-thin scrollbar-thumb-gray-200">
      <div className="mb-6 text-center flex-shrink-0 flex flex-col items-center">
        {/* Spiral Logo SVG */}
        <div className="mb-2">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10C27.9086 10 10 27.9086 10 50C10 72.0914 27.9086 90 50 90C72.0914 90 90 72.0914 90 50" stroke="#F26522" strokeWidth="12" strokeLinecap="round"/>
                <path d="M50 25C36.1929 25 25 36.1929 25 50C25 63.8071 36.1929 75 50 75C63.8071 75 75 63.8071 75 50" stroke="#555555" strokeWidth="10" strokeLinecap="round"/>
                <path d="M50 40C44.4772 40 40 44.4772 40 50C40 55.5228 44.4772 60 50 60" stroke="#F26522" strokeWidth="8" strokeLinecap="round"/>
            </svg>
        </div>
        <h1 className="font-black text-lem-orange text-xl tracking-tighter leading-none">LEM</h1>
        <span className="text-[9px] font-bold text-gray-500 tracking-wider mt-1">by METODIC</span>
      </div>

      <div className="flex-1 w-full flex flex-col items-center gap-4">
        
        {/* Positive Group */}
        <div className="space-y-3 text-center w-full">
          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Positive</span>
          {Object.values(EMOTIONS).filter(e => e.category === 'Positive').map((def) => (
            <div key={def.id} className="flex flex-col items-center group relative">
               <div className="absolute left-full ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {def.label}
              </div>
              <EmotionToken 
                emotion={def.id} 
                size="sm" 
                onClick={() => onAddMarker(def.id)}
              />
            </div>
          ))}
        </div>

        <div className="w-12 h-px bg-gray-200 my-1"></div>

        {/* Neutral Group */}
        <div className="space-y-3 text-center w-full">
          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Neutral</span>
          {Object.values(EMOTIONS).filter(e => e.category === 'Neutral').map((def) => (
            <div key={def.id} className="flex flex-col items-center group relative">
               <div className="absolute left-full ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {def.label}
              </div>
              <EmotionToken 
                emotion={def.id} 
                size="sm" 
                onClick={() => onAddMarker(def.id)}
              />
            </div>
          ))}
        </div>

        <div className="w-12 h-px bg-gray-200 my-1"></div>

        {/* Negative Group */}
        <div className="space-y-3 text-center w-full">
          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Negative</span>
          {Object.values(EMOTIONS).filter(e => e.category === 'Negative').map((def) => (
            <div key={def.id} className="flex flex-col items-center group relative">
               <div className="absolute left-full ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {def.label}
              </div>
              <EmotionToken 
                emotion={def.id} 
                size="sm" 
                onClick={() => onAddMarker(def.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;