import React, { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { AppraisalInput, EmotionType } from '../types';
import { EMOTIONS } from '../constants';

interface AppraisalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: AppraisalInput) => void;
  emotion: EmotionType;
}

const SENTENCE_STARTERS: { type: AppraisalInput['type']; prefix: string; hint: string }[] = [
    { type: 'Goal', prefix: 'I want to...', hint: 'Describe your goal (e.g., find pricing)' },
    { type: 'Goal', prefix: 'I am trying to...', hint: 'Describe your current task' },
    { type: 'Attitude', prefix: 'I think that...', hint: 'Your opinion on this element' },
    { type: 'Attitude', prefix: 'I feel that...', hint: 'Your emotional reaction' },
    { type: 'Norm', prefix: 'I believe this should...', hint: 'Expectations based on other sites' },
    { type: 'Norm', prefix: 'I expected to see...', hint: 'Missing conventions' },
    { type: 'Standard', prefix: 'This reminds me of...', hint: 'Comparison to standards' },
];

const AppraisalModal: React.FC<AppraisalModalProps> = ({ isOpen, onClose, onSubmit, emotion }) => {
  const [selectedStarter, setSelectedStarter] = useState(0);
  const [content, setContent] = useState('');
  
  if (!isOpen) return null;
  
  const def = EMOTIONS[emotion];

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim()) return;
      
      const starter = SENTENCE_STARTERS[selectedStarter];
      onSubmit({
          type: starter.type,
          prefix: starter.prefix,
          content: content
      });
      setContent('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
             <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100">
                     <def.icon size={20} className={def.category === 'Positive' ? 'text-lem-orange' : def.category === 'Negative' ? 'text-red-500' : 'text-gray-500'} />
                 </div>
                 <div>
                     <h3 className="font-bold text-gray-900 text-sm">Why do you feel <span className="text-lem-orange">{def.label}</span>?</h3>
                     <p className="text-xs text-gray-500">Help us understand the context.</p>
                 </div>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
             <div>
                 <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Choose a starter</label>
                 <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                     {SENTENCE_STARTERS.map((s, idx) => (
                         <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedStarter(idx)}
                            className={`text-left px-3 py-2 rounded-lg text-sm border transition-all ${selectedStarter === idx ? 'bg-orange-50 border-lem-orange text-gray-900 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                         >
                             {s.prefix}
                         </button>
                     ))}
                 </div>
             </div>
             
             <div>
                 <div className="relative">
                     <textarea 
                        className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lem-orange/50 focus:border-lem-orange outline-none min-h-[100px] text-sm resize-none"
                        placeholder={SENTENCE_STARTERS[selectedStarter].hint}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        autoFocus
                     />
                     <MessageSquare size={16} className="absolute top-3 right-3 text-gray-300 pointer-events-none"/>
                 </div>
             </div>
             
             <button 
                type="submit" 
                disabled={!content.trim()}
                className="w-full bg-lem-orange text-white font-bold py-3 rounded-lg shadow hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
                 Save Feedback
             </button>
        </form>
      </div>
    </div>
  );
};

export default AppraisalModal;