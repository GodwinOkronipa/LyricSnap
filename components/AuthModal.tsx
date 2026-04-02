'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMessage?: string;
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMessage }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isForgotPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage('Check your email for the password reset link!');
      } else if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        
        if (data.session) {
          // If email confirmation is disabled, user is auto-signed in
          onSuccess();
          onClose();
        } else {
          setMessage('Account created! Please check your email to confirm (if applicable).');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="max-w-md w-full bg-white text-black p-10 rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-2 hover:bg-black/5 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter">
                  {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create your account' : 'Welcome back'}
                </h3>
                <p className="text-black/50 font-medium px-4">
                  {isForgotPassword 
                    ? "Enter your email and we'll send you a link to reset your password."
                    : initialMessage || (isSignUp ? 'Join LyricSnap to save your history and upgrade to Studio Pro.' : 'Sign in to access your snaps.')}
                </p>
              </div>

              <div className="space-y-4">
                {/* Social Login */}
                {!isForgotPassword && (
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-14 bg-white border border-black/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-black/5 transition-all font-bold active:scale-[0.98] disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                )}

                {!isForgotPassword && (
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-black/5"></div>
                    <span className="flex-shrink mx-4 text-black/20 text-[10px] font-black uppercase tracking-widest">or</span>
                    <div className="flex-grow border-t border-black/5"></div>
                  </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full h-14 bg-black/5 border-none rounded-2xl px-12 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      />
                    </div>
                    {!isForgotPassword && (
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full h-14 bg-black/5 border-none rounded-2xl px-12 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {!isSignUp && !isForgotPassword && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {error && (
                    <p className="text-red-500 text-sm font-bold text-center px-2">{error}</p>
                  )}

                  {message && (
                    <p className="text-green-600 text-sm font-bold text-center px-2">{message}</p>
                  )}

                  <Button
                    disabled={loading}
                    className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-full font-black text-xl shadow-2xl transition-all active:scale-[0.98] group"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Get Started' : 'Sign In'}
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </form>
              </div>

              <div className="text-center space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setIsForgotPassword(false);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-sm font-bold text-black/40 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
                
                {isForgotPassword && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="text-xs font-bold text-black/40 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                    >
                      Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
