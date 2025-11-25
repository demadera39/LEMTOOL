import React from 'react';
import { X, History, FileText } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-lem-orange/10 p-2 rounded-lg">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F26522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
               </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">About LEMtool</h2>
              <p className="text-xs text-gray-500 font-medium">Origins & Methodology</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
          
          <section>
            <p className="text-gray-700 leading-relaxed text-lg">
              The <strong>Layered Emotion Measurement (LEM) tool</strong> is a visual instrument designed to measure human emotions in interactive digital environments. Unlike traditional surveys that rely on text, LEM uses a visual language to capture immediate, intuitive emotional responses.
            </p>
          </section>

          <section className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <History size={18} className="text-lem-orange" />
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Origins & Development</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              The LEMtool was originally conceptualized and developed by researchers at <strong>SusaGroup</strong> (notably by Marco van Hout and colleagues) in the Netherlands. It emerged from the need to go beyond standard usability testing and understand the <em>emotional experience</em> of users on the web.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Standard questionnaires often interrupt the user flow and force users to rationalize their feelings into words. The LEMtool was designed to be a "layer" over the interface, allowing users to simply drag and drop expressive cartoon characters onto the screen at the exact moment and place an emotion occurred.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F26522" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm">Scientific Foundation</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 text-sm mb-2">Visual Primitives</h4>
                <p className="text-xs text-gray-500">
                  The tool utilizes caricatured expressions based on universal facial coding research (Ekman). By using a consistent character, it reduces bias related to gender, age, or race, focusing purely on the emotional signal.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-800 text-sm mb-2">Dimensional Model</h4>
                <p className="text-xs text-gray-500">
                  The selected emotions cover key quadrants of the Circumplex Model of Affect (Valence vs. Arousal), ensuring a balanced measurement of both positive/negative and active/passive emotional states relevant to UX (e.g., Fascination vs. Boredom).
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-900 uppercase tracking-wide text-sm mb-3">Evolution to AI</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              This modern iteration, <strong>LEM by METODIC</strong>, combines the validated visual methodology of the original LEMtool with advanced Generative AI. Instead of relying solely on live user panels, we use AI agents configured with deep psychological personas to simulate user reactions, allowing for instant, scalable emotional feedback during the design process.
            </p>
          </section>
          
          <section className="bg-orange-50/50 p-4 rounded-lg">
            <h4 className="text-xs font-bold text-lem-orange uppercase mb-2">Key References</h4>
            <ul className="space-y-2">
              <li className="flex gap-2 items-start">
                 <FileText size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                 <span className="text-xs text-gray-600 italic">Huisman, G., & Van Hout, M. (2010). The development of a graphical emotion measurement instrument using caricatured expressions: the LEMtool.</span>
              </li>
              <li className="flex gap-2 items-start">
                 <FileText size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                 <span className="text-xs text-gray-600 italic">Van Hout, M., et al. Measuring emotions in visual and interaction design. SusaGroup.</span>
              </li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
};

export default AboutModal;