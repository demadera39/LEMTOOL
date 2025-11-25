import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, email: string) => void;
  websiteUrl: string;
}

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onSubmit, websiteUrl }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // onSubmit handles logic, we just await it to keep button disabled
    await onSubmit(name, email);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Lock size={18} className="text-lem-orange" />
            Unlock Full Report
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            To download the detailed PDF analysis for <span className="font-semibold text-gray-900">{websiteUrl}</span>, please verify your details.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lem-orange/50 focus:border-lem-orange outline-none"
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lem-orange/50 focus:border-lem-orange outline-none"
                placeholder="e.g. jane@metodic.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-lem-orange text-white font-bold rounded-lg shadow-md hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Download Report'}
            </button>
          </form>
          
          <p className="text-[10px] text-gray-400 mt-4 text-center">
            Your data is secure. By continuing, you agree to receive insights from LEM by METODIC.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;