'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Loader2, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password: password
      });

      if (resetError) throw resetError;
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Magic */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full translate-y-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[48px] p-10 relative z-10 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="text-center space-y-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tighter">New Password</h1>
            <p className="text-white/40 font-medium">Set a secure password for your account.</p>
          </div>

          {success ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-12 space-y-6 flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold">Password Updated!</p>
                <p className="text-white/30 text-xs">Redirecting you back to LyricSnap...</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-12 focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-white outline-none"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm font-bold text-center px-2">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-white text-black hover:bg-white/90 rounded-full font-black text-xl shadow-2xl transition-all active:scale-[0.98] group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Update Password
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          )}

          <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-3 opacity-30 text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              <span>Studio Security</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
