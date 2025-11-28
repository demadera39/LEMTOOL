
import React, { useState } from 'react';
import { X, Lock, Mail, Chrome, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/supabaseService';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        // --- SIGN UP FLOW ---
        const data = await signUpWithEmail(email, password, name);
        
        if (data.user && !data.session) {
           setSuccessMsg("Account created! Please check your email to confirm your account.");
           setLoading(false);
           return;
        } else if (data.user && data.session) {
           // Auto-login successful
           onClose();
        }

      } else {
        // --- SIGN IN FLOW ---
        const data = await signInWithEmail(email, password);
        
        // CHECK FOR BACKDOOR USER (Mock)
        if (data.user.id === 'hardcoded-admin-id') {
          if (onLoginSuccess) {
            onLoginSuccess({
               id: data.user.id,
               email: data.user.email!,
               name: data.user.user_metadata.full_name,
               isAdmin: true
            });
          }
        } 
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {isSignUp ? <UserPlus size={18} className="text-lem-orange" /> : <Lock size={18} className="text-lem-orange" />}
            {isSignUp ? 'Create Account' : 'Welcome Back'}
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

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-100 flex items-start gap-2">
              <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-3">
            {isSignUp && (
               <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required={isSignUp}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lem-orange/50 focus:border-lem-orange outline-none"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email</label>
              <input 
                type="email" 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-lem-orange/50 focus:border-lem-orange outline-none"
                placeholder="you@company.com"
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
                minLength={6}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gray-900 text-white font-bold rounded-lg shadow-md hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
              {loading ? (isSignUp ? 'Creating...' : 'Signing in...') : (isSignUp ? 'Sign Up with Email' : 'Sign in with Email')}
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

          <div className="mt-6 text-center">
            <button onClick={toggleMode} className="text-xs text-lem-orange hover:underline font-bold">
                {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Icon for success message
const CheckCircle = ({ size, className }: { size: number, className?: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

export default LoginModal;
