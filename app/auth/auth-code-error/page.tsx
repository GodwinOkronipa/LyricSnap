'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function ErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's an error in the query params
    const error = searchParams.get('error_description') || searchParams.get('error');
    if (error) {
      setErrorMsg(decodeURIComponent(error.replace(/\+/g, ' ')));
    }

    // Check for "code" in fragment (sometimes happens if redirect is weird)
    if (window.location.hash.includes('access_token')) {
        // This is strange—the token exists in the fragment but we hit the error page.
        // It might be an implicit flow fallback or a session persistence issue.
        // Let's redirect home to let the client-side Supabase client pick it up if it can.
        setTimeout(() => router.push('/'), 2000);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-500/10 blur-[120px] rounded-full translate-y-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[48px] p-10 text-center space-y-8 relative z-10"
      >
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tighter">Authentication Issue</h1>
          <p className="text-white/40 leading-relaxed font-medium">
            {errorMsg || "We couldn't verify your login. This usually happens if the link expired or was used already."}
          </p>
        </div>

        <div className="pt-4 space-y-4">
          <Link href="/" className="block">
            <Button className="w-full h-16 bg-white text-black hover:bg-white/90 rounded-full font-black text-lg shadow-2xl transition-all active:scale-[0.98] group">
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </Link>
          
          <button 
            onClick={() => router.refresh()}
            className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-widest"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </button>
        </div>

        <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-3 opacity-30 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>LyricSnap Assistant</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080808] flex items-center justify-center text-white/20">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
