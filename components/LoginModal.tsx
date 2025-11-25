import React, { useState } from 'react';
import { X, Lock, Mail, Chrome, AlertCircle } from 'lucide-react';
import { signInWithGoogle, signInWithEmail } from '../services/supabaseService';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await signInWithEmail(email, password);
      
      // CHECK FOR BACKDOOR USER
      if (data.user.id === 'hardcoded-admin-id') {
        // This is our backdoor. Supabase onAuthStateChange won't fire.
        // We must manually tell App.tsx we are logged in.
        if (onLoginSuccess) {
          onLoginSuccess({
             id: data.user.id,
             email: data.user.email!,
             name: data.user.user_metadata.full_name,
             isAdmin: true
          });
        }
      } 
      // Normal Supabase flow is handled by App.tsx's useEffect listener usually,
      // but for consistency we can close the modal here.
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Redirect happens automatically
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('provider is not enabled')) {
         setError('Google Login is DISABLED in your Supabase Dashboard. Go to Authentication > Providers and enable Google.');
      } else {
         setError(msg || 'Google login failed');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Lock size={18} className="text-lem-orange" />
            Admin Access
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lem-orange/50 focus:border-lem-orange outline-none"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lem-orange/50 focus:border-lem-orange outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gray-900 text-white font-bold rounded-lg shadow-md hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              <Mail size={16} />
              {loading ? 'Signing in...' : 'Sign in with Email'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <Chrome size={16} />
            Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;