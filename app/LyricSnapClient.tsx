'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Music, Shield, Zap, Sparkles, LogOut, History } from 'lucide-react';
import { searchSongs, Song } from '@/lib/itunes';
import { fetchLyrics } from '@/lib/lyrics';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Button } from '@/components/ui/button';
import { JsonLd, webAppSchema, howToSchema } from '@/components/JsonLd';
import { analytics } from '@/lib/analytics';
import { ListMusic, ChevronRight, X, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AuthModal } from '@/components/AuthModal';

import dynamic from 'next/dynamic';

const PaystackButton = dynamic(() => import('@/components/PaystackButton'), { ssr: false });

const ADMIN_EMAILS = ['godwinokro2020@gmail.com'];

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lyrics, setLyrics] = useState<string[] | null>(null);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [fetchingLyrics, setFetchingLyrics] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [pendingProActivation, setPendingProActivation] = useState(false);
  
  // Studio Customization State
  const [blurAmount, setBlurAmount] = useState(80);
  const [vignette, setVignette] = useState(40);
  const [template, setTemplate] = useState<'classic' | 'modern'>('classic');
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Auth & Session management
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        if (ADMIN_EMAILS.includes(currentUser.email!)) {
           setIsPro(true);
        }
        fetchUserProfile(currentUser.id, currentUser.email!);
        // Handle pending activation if user was already logged in but refresh happened
        if (pendingProActivation) updateProStatus(currentUser.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        if (ADMIN_EMAILS.includes(currentUser.email!)) {
           setIsPro(true);
        }
        fetchUserProfile(currentUser.id, currentUser.email!);
        if (pendingProActivation) {
           updateProStatus(currentUser.id);
           setPendingProActivation(false);
        }
      }
      else setIsPro(false);
    });

    return () => subscription.unsubscribe();
  }, [pendingProActivation]);

  const fetchUserProfile = async (userId: string, email: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('usage_count, is_pro')
      .eq('id', userId)
      .single();
    
    if (data) {
      setUsageCount(data.usage_count);
      // Force Pro if admin, otherwise use DB value
      setIsPro(ADMIN_EMAILS.includes(email) ? true : data.is_pro);
    }
    fetchHistory(userId);
  };

  const fetchHistory = async (userId: string) => {
    const { data } = await supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setHistory(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const syncGuestData = async (userId: string) => {
    const guestHistory = JSON.parse(localStorage.getItem('lyric_snap_history') || '[]');
    if (guestHistory.length > 0) {
      const gToInsert = guestHistory.map((item: any) => ({
        user_id: userId,
        title: item.title,
        artist: item.artist,
        artwork: item.artwork,
        lyrics: item.lyrics,
        created_at: item.created_at
      }));
      
      await supabase.from('generations').insert(gToInsert);
      localStorage.removeItem('lyric_snap_history');
      localStorage.removeItem('lyric_snap_usage');
      fetchHistory(userId);
    }
  };

  // Countdown Timer Logic
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number}>({ h: 2, m: 0, s: 0 });
  
  useEffect(() => {
    const timerKey = 'lyric_snap_timer_end';
    let endTime = localStorage.getItem(timerKey);
    
    if (!endTime) {
      endTime = (Date.now() + 2 * 60 * 60 * 1000).toString();
      localStorage.setItem(timerKey, endTime);
    }

    const interval = setInterval(() => {
      const remaining = parseInt(endTime!) - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft({ h: 0, m: 0, s: 0 });
      } else {
        setTimeLeft({
          h: Math.floor((remaining / (1000 * 60 * 60)) % 24),
          m: Math.floor((remaining / 1000 / 60) % 60),
          s: Math.floor((remaining / 1000) % 60)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Paystack Config - 0.49 instead of 0.99
  const paystackAmount = (0.49 * Number(process.env.NEXT_PUBLIC_GHS_CONVERSION_RATE || 15) * 100);

  const onSuccess = (reference: any) => {
    console.log('Payment Success:', reference);
    if (!user) {
      setPendingProActivation(true);
      setShowAuthModal(true);
      setShowUpgradeModal(false);
    } else {
      updateProStatus(user.id);
      setShowUpgradeModal(false);
    }
  };

  const onClose = () => {
    console.log('closed');
  };

  const updateProStatus = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ is_pro: true }).eq('id', userId);
    if (!error) {
      setIsPro(true);
      setPendingProActivation(false);
    }
  };

  // handleUpgradeClick no longer needed as a separate function

  // Load guest usage count on mount if not logged in
  useEffect(() => {
    if (!user) {
      const savedUsage = localStorage.getItem('lyric_snap_usage');
      if (savedUsage) setUsageCount(parseInt(savedUsage, 10));
    }
  }, [user]);

  // Auto-scroll to preview on mobile when a song is selected
  useEffect(() => {
    if (selectedSong && window.innerWidth < 1024) {
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedSong]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResults([]);
    setSelectedSong(null);
    setLyrics(null);
    setSelectedLines([]);
    
    try {
      const data = await searchSongs(query);
      setResults(data);
      analytics.trackSearch(query, data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchLyrics = async () => {
    if (!selectedSong) return;
    setFetchingLyrics(true);
    try {
      const data = await fetchLyrics(selectedSong.title, selectedSong.artist);
      setLyrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingLyrics(false);
    }
  };

  const toggleLine = (line: string) => {
    setSelectedLines(prev => {
      if (prev.includes(line)) {
        return prev.filter(l => l !== line);
      }
      if (prev.length >= 5) return prev; // Max 5 lines
      return [...prev, line];
    });
  };

  const handleDownload = async () => {
    if (!selectedSong) return;

    // BUSINESS LOGIC: 1 Free Screenshot for Guest
    if (!isPro && usageCount >= 1) {
      setShowUpgradeModal(true);
      return;
    }

    setGenerating(true);
    analytics.trackGenerateStart(selectedSong.title, selectedSong.artist);
    try {
      const params = new URLSearchParams({
        title: selectedSong.title,
        artist: selectedSong.artist,
        artwork: selectedSong.artwork,
        watermark: (!isPro).toString(),
        template: template,
        blur: blurAmount.toString(),
        vignette: vignette.toString(),
      });

      if (selectedLines.length > 0) {
        params.set('lyrics', JSON.stringify(selectedLines));
      }
      
      const response = await fetch(`/api/generate?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedSong.title.replace(/\s+/g, '_')}_LyricSnap.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        analytics.trackDownloadComplete(selectedSong.title, selectedSong.artist);
        
        const newCount = usageCount + 1;
        
        // Save to Supabase if logged in
        if (user) {
          await supabase.from('generations').insert({
            user_id: user.id,
            title: selectedSong.title,
            artist: selectedSong.artist,
            artwork: selectedSong.artwork,
            lyrics: selectedLines
          });
          
          await supabase.from('profiles').update({ usage_count: newCount }).eq('id', user.id);
          fetchHistory(user.id);
        } else {
          // Guest usage
          localStorage.setItem('lyric_snap_usage', newCount.toString());
          
          // Store guest history in localStorage as well for later sync
          const guestHistory = JSON.parse(localStorage.getItem('lyric_snap_history') || '[]');
          guestHistory.unshift({
            title: selectedSong.title,
            artist: selectedSong.artist,
            artwork: selectedSong.artwork,
            lyrics: selectedLines,
            created_at: new Date().toISOString()
          });
          localStorage.setItem('lyric_snap_history', JSON.stringify(guestHistory.slice(0, 5)));
        }
        
        setUsageCount(newCount);
      }
    } catch (err: any) {
      console.error(err);
      alert('Generation failed. Please try again.');
      analytics.trackError('generation_failed', err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white selection:bg-pink-500/30 selection:text-white font-sans noise-bg premium-mesh">
      <JsonLd data={webAppSchema} />
      <JsonLd data={howToSchema} />
      
      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-white text-black p-10 rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
               <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-8 right-8 p-2 hover:bg-black/5 rounded-full transition-colors"
                aria-label="Close Upgrade Modal"
               >
                <X className="w-5 h-5" />
               </button>
               <div className="space-y-6 text-center">
                 <div className="w-20 h-20 bg-pink-500 rounded-[28px] flex items-center justify-center mx-auto shadow-xl shadow-pink-500/30">
                    <Sparkles className="w-10 h-10 text-white" />
                 </div>
                 <h3 className="text-3xl font-black tracking-tighter">Limit Reached.</h3>
                 <p className="text-black/60 font-medium leading-relaxed">
                   You've used your 1 free snapshot. Upgrade to **Studio Pro** for unlimited high-res downloads and custom templates.
                 </p>
                 <div className="bg-black/5 rounded-[32px] p-6 space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-black/40">Powered by</p>
                    <p className="text-xl font-black tracking-tight text-indigo-600">Flywheel Technologies</p>
                 </div>
                 <PaystackButton 
                  email={user?.email || ""}
                  amount={paystackAmount}
                  onSuccess={onSuccess}
                  onClose={onClose}
                  className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-full font-black text-xl shadow-2xl transition-all active:scale-[0.98]"
                 >
                    {user ? 'Upgrade to Pro' : 'Pay & Create Account'}
                 </PaystackButton>
                 <p className="text-[10px] font-black uppercase tracking-widest text-black/30">One-time payment • No subscription needed</p>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Sync guest history on first login
          if (user) syncGuestData(user.id);
        }}
        initialMessage="Create an account to unlock Studio Pro and save your history."
      />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="p-2 bg-gradient-to-tr from-pink-500 to-orange-400 rounded-xl group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(236,72,153,0.3)]">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tighter">LyricSnap</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-white/40 text-xs font-bold truncate max-w-[150px]">{user.email}</span>
              <button 
                onClick={handleSignOut}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                aria-label="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Button 
              onClick={() => setShowAuthModal(true)}
              variant="outline" 
              className="border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-full px-6 transition-all active:scale-95 backdrop-blur-sm"
            >
              Sign In
            </Button>
          )}
        </div>
      </nav>

      <main className="relative z-10 w-full">
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-8 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-7xl md:text-9xl font-heading mb-8 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-[0.9]">
              Your Music. <br /> <span className="italic">Perfectly</span> Captured.
            </h1>
            <p className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
              Create stunning, shareable music screenshots for Instagram and TikTok in seconds. Inspired by Apple Music's premium aesthetic.
            </p>

            {/* Main Action Tool */}
            <div id="tool" className="max-w-5xl mx-auto bg-white/[0.05] border border-white/15 rounded-[48px] p-8 md:p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden group/tool">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-blue-500/5 opacity-0 group-hover/tool:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start relative z-10">
                {/* Left: Search & Controls */}
                <div className="space-y-8">
                  <div className="text-left space-y-2">
                    <h2 className="text-3xl font-heading tracking-tight">Create your Snap</h2>
                    <p className="text-white/40">Search for any track to get started.</p>
                  </div>

                  <form onSubmit={handleSearch} className="relative group">
                    <input
                      type="text"
                      placeholder="Enter song name or paste link..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-white/10 border border-white/15 rounded-full py-5 px-8 pr-20 text-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-white/20 backdrop-blur-xl"
                    />
                    <button 
                      type="submit"
                      aria-label="Search"
                      className="absolute right-2 top-2 bottom-2 aspect-square bg-white text-black rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all active:scale-90 shadow-xl"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </form>

                  {/* Results scroll area */}
                  <div className="min-h-[300px] max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="wait">
                      {loading && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                          <p className="text-sm font-bold uppercase tracking-widest">Searching...</p>
                        </div>
                      )}
                      
                      {!loading && results.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
                          {results.map((song) => (
                            <div
                              key={song.id}
                              onClick={() => {
                                setSelectedSong(song);
                                analytics.trackSelectSong(song.title, song.artist);
                              }}
                              className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${selectedSong?.id === song.id ? 'bg-white/15 border-white/25 shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                            >
                              <img src={song.artwork} alt={`${song.title} by ${song.artist}`} className="w-14 h-14 rounded-lg object-cover shadow-lg" />
                              <div className="flex-1 overflow-hidden text-left">
                                <p className="font-bold truncate text-lg">{song.title}</p>
                                <p className="text-white/40 text-xs truncate uppercase tracking-wider">{song.artist}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {!loading && results.length === 0 && !query && (
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-8 rounded-[32px] bg-white/[0.08] border border-white/10 flex gap-6 text-left backdrop-blur-md">
                            <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Zap className="w-6 h-6 text-pink-500" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">Instant Search</p>
                              <p className="text-white/40">Find tracks from Apple Music in milliseconds.</p>
                            </div>
                          </div>
                          <div className="p-8 rounded-[32px] bg-white/[0.08] border border-white/10 flex gap-6 text-left backdrop-blur-md">
                            <div className="w-12 h-12 bg-orange-400/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-6 h-6 text-orange-400" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">Studio Quality</p>
                              <p className="text-white/40">Ultra high-res exports ready for social media.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right: Preview & Download */}
                <div ref={previewRef} className="flex flex-col items-center justify-center pt-8 lg:pt-0">
                  <AnimatePresence mode="wait">
                    {selectedSong ? (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center w-full"
                      >
                        <div className="relative group/player mb-10 transform-gpu hover:rotate-1 transition-transform duration-700">
                          <MusicPlayer 
                            title={selectedSong.title}
                            artist={selectedSong.artist}
                            album={selectedSong.album}
                            artwork={selectedSong.artwork}
                            lyrics={selectedLines}
                            blurAmount={blurAmount}
                            vignette={vignette}
                            template={template}
                            watermark={!isPro}
                          />
                          {selectedLines.length > 0 && (
                            <button 
                              onClick={() => setSelectedLines([])}
                              className="absolute -top-3 -right-3 p-2 bg-white text-black rounded-full shadow-2xl opacity-0 group-hover/player:opacity-100 transition-opacity z-50 hover:scale-110 active:scale-95"
                              aria-label="Clear all selected lyrics"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Lyrics Controls */}
                        <div className="w-full flex flex-col gap-4 mb-8">
                          {!lyrics ? (
                            <Button 
                              onClick={handleFetchLyrics}
                              disabled={fetchingLyrics}
                              className="w-full h-16 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-500 text-white hover:opacity-90 rounded-full font-black text-lg flex gap-3 shadow-[0_15px_40px_rgba(124,58,237,0.3)] border-none transition-all active:scale-[0.98] group/lyrics"
                            >
                              {fetchingLyrics ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                              )}
                              Load & Customize Lyrics
                            </Button>
                          ) : (
                            <div className="bg-white/10 border border-white/20 rounded-[32px] p-6 overflow-hidden backdrop-blur-xl">
                              <div className="flex justify-between items-center mb-4 px-2">
                                <span className="text-xs font-black uppercase tracking-widest text-white/30">Select Lyrics</span>
                                <span className="text-xs font-black text-pink-500">{selectedLines.length}/5</span>
                              </div>
                              <div className="max-h-[120px] overflow-y-auto px-1 flex flex-col gap-1 custom-scrollbar">
                                {lyrics.slice(0, 40).map((line, i) => (
                                  <button
                                    key={i}
                                    onClick={() => toggleLine(line)}
                                    className={`p-3 rounded-xl text-left text-sm transition-all ${selectedLines.includes(line) ? 'bg-pink-500 text-white font-bold shadow-lg shadow-pink-500/20' : 'hover:bg-white/10 text-white/50'}`}
                                  >
                                    {line}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Studio Customization (Pro Only) */}
                        <div className="w-full space-y-6 mb-8 mt-2 p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl">
                          <div className="flex items-center justify-between">
                             <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Studio Controls</h4>
                             {!isPro && (
                               <span className="text-[10px] font-black bg-pink-500 text-white px-2 py-0.5 rounded-full">PRO ONLY</span>
                             )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <button 
                              disabled={!isPro}
                              onClick={() => setTemplate('classic')}
                              type="button"
                              className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${template === 'classic' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                             >
                               Classic
                             </button>
                             <button 
                              disabled={!isPro}
                              type="button"
                              onClick={() => setTemplate('modern')}
                              className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${template === 'modern' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                             >
                               Modern
                             </button>
                          </div>

                          <div className="space-y-4 pt-2">
                             <div className="space-y-2">
                               <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                 <span>Studio Blur</span>
                                 <span>{blurAmount}px</span>
                               </div>
                               <input 
                                 type="range" min="0" max="150" step="10"
                                 value={blurAmount}
                                 disabled={!isPro}
                                 aria-label="Studio Blur Amount"
                                 title="Adjust the background blur intensity"
                                 onChange={(e) => setBlurAmount(parseInt(e.target.value))}
                                 className="w-full accent-pink-500 opacity-60 hover:opacity-100 transition-opacity"
                               />
                             </div>
                             <div className="space-y-2">
                               <div className="flex justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                 <span>Vignette Mood</span>
                                 <span>{vignette}%</span>
                               </div>
                               <input 
                                 type="range" min="0" max="100" step="5"
                                 value={vignette}
                                 disabled={!isPro}
                                 aria-label="Vignette Intensity"
                                 title="Adjust the dark overlay intensity around the edges"
                                 onChange={(e) => setVignette(parseInt(e.target.value))}
                                 className="w-full accent-pink-500 opacity-60 hover:opacity-100 transition-opacity"
                               />
                             </div>
                          </div>
                        </div>

                        <Button 
                          onClick={handleDownload}
                          disabled={generating}
                          className="w-full h-20 bg-gradient-to-r from-pink-600 to-orange-500 text-white hover:opacity-90 rounded-full text-2xl font-black transition-all flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(236,72,153,0.3)] active:scale-[0.98] disabled:opacity-50 group/download"
                        >
                          {generating ? "Crafting your Snap..." : "Generate & Download"}
                          {!generating && <Download className="w-6 h-6 group-hover/download:translate-y-1 transition-transform" />}
                        </Button>
                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                          {usageCount >= 1 ? "Limit Reached • Upgrade to Unlock" : "1 Free Shot remaining"}
                        </p>
                      </motion.div>
                    ) : (
                      <div className="w-[400px] h-[600px] rounded-[48px] border-2 border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center text-center p-12 space-y-6 backdrop-blur-sm">
                        <div className="w-20 h-20 bg-white/5 rounded-[30px] flex items-center justify-center">
                          <Sparkles className="w-10 h-10 opacity-20" />
                        </div>
                        <p className="text-white/20 font-bold text-xl uppercase tracking-tighter">Your Masterpiece <br /> Appears Here</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-32 bg-white/[0.02] border-y border-white/10 backdrop-blur-3xl relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-8 relative z-10">
            <h2 className="text-6xl font-heading text-center mb-24 tracking-tighter">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Search", desc: "Paste a song link or search from 100M+ tracks." },
                { step: "02", title: "Customize", desc: "Select the lyrics that hit different." },
                { step: "03", title: "Render", desc: "Our engine crafts a pixel-perfect image." },
                { step: "04", title: "Share", desc: "Download & flex on IG or TikTok." }
              ].map((item, i) => (
                <div key={i} className="relative p-12 bg-white/[0.08] border border-white/10 rounded-[48px] group transition-all hover:bg-white/15 h-full backdrop-blur-md shadow-xl">
                  <span className="text-7xl font-heading opacity-30 mb-8 block transition-opacity group-hover:opacity-50">{item.step}</span>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-white/40 leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-6xl font-heading tracking-tight">Built for <br /> Perfectionists.</h2>
              <p className="text-xl text-white/50 leading-relaxed">We don't do basic. Every pixel is calculated to match the high-end aesthetic of modern music apps.</p>
              <div className="space-y-8">
                {[
                  { icon: Zap, title: "Blazing Fast", desc: "GPU-accelerated rendering for instant results." },
                  { icon: Shield, title: "Privacy First", desc: "No watermarks on high-res premium exports." },
                  { icon: Sparkles, title: "AI Polishing", desc: "Dynamic color matching based on album art." }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="w-14 h-14 bg-white/[0.08] border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500/20 transition-colors">
                      <f.icon className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{f.title}</p>
                      <p className="text-white/30 text-sm">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
              <motion.div 
                initial={{ y: 0 }}
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-pink-500/20 blur-[120px] rounded-full group-hover:scale-110 transition-transform duration-1000" 
              />
              <motion.div 
                initial={{ y: 0 }}
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative aspect-[3/4] max-w-[400px] mx-auto rounded-[48px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/10 group/showcase hover:scale-[1.03] transition-transform duration-700"
              >
                <img 
                  src="/showcase/ed-sheeran.jpg" 
                  alt="Ed Sheeran LyricSnap Result"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/5 pointer-events-none" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-32 bg-white/[0.02] border-t border-white/10 backdrop-blur-3xl">
          <div className="max-w-5xl mx-auto px-8 text-center">
            <h2 className="text-7xl font-heading mb-6 tracking-tighter">Choose your level.</h2>
            <p className="text-white/40 mb-20 font-medium max-w-xl mx-auto italic uppercase tracking-[0.1em] text-xs">For artists, curators, and those who never settle for basic.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Standard */}
              <div className="p-12 rounded-[56px] bg-white/[0.05] border border-white/10 text-left space-y-8 backdrop-blur-md shadow-xl group/plan">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    Standard
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20 bg-white/5 py-1 px-3 rounded-full">Entry</span>
                  </h3>
                  <p className="text-5xl font-heading mt-2">Free</p>
                </div>
                <ul className="space-y-5 text-white/50 text-sm font-bold">
                  <li className="flex gap-3 items-center">
                    <div className="p-1 bg-white/10 rounded-full"><ChevronRight className="w-4 h-4" /></div>
                    1 High-Res Snapshot
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="p-1 bg-white/10 rounded-full"><ChevronRight className="w-4 h-4" /></div>
                    Standard Studio UI
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="p-1 bg-white/10 rounded-full"><ChevronRight className="w-4 h-4" /></div>
                    Guest History (Local Only)
                  </li>
                  <li className="flex gap-3 items-center opacity-30">
                    <X className="w-4 h-4" />
                    Watermark included
                  </li>
                </ul>
                <Button className="w-full h-16 bg-white/10 border border-white/20 hover:bg-white/20 rounded-full font-black uppercase tracking-widest text-xs">Current Level</Button>
              </div>

              {/* Studio Pro */}
              <div className="p-12 rounded-[56px] bg-white text-black text-left space-y-8 relative overflow-hidden shadow-[0_30px_100px_rgba(255,255,255,0.1)] group/pro border-2 border-pink-500/20">
                <div className="absolute top-8 right-8 bg-pink-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full animate-pulse">FLASH SALE</div>
                <div>
                  <h3 className="text-2xl font-bold">Studio Pro</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-heading text-black/30 line-through tracking-tighter">$0.99</span>
                    <span className="text-5xl font-heading text-pink-600 tracking-tighter">$0.49</span>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 bg-pink-500/10 text-pink-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    Deal ends in: {timeLeft.h}h {timeLeft.m}m {timeLeft.s}s
                  </div>
                </div>

                <div className="py-1 border-y border-black/5">
                   <p className="text-[10px] font-black text-center uppercase tracking-[0.2em] text-black/40">Lifetime Access • One-time Payment</p>
                </div>

                <ul className="space-y-4 text-black/80 text-sm font-black">
                  <li className="flex gap-3 items-center">
                    <div className="p-1 bg-pink-500 rounded-full"><ChevronRight className="w-4 h-4 text-white" /></div>
                    🚫 100% Watermark-Free
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="p-1 bg-pink-500 rounded-full"><ChevronRight className="w-4 h-4 text-white" /></div>
                    ♾️ Unlimited High-Res Exports
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="p-1 bg-pink-500 rounded-full"><ChevronRight className="w-4 h-4 text-white" /></div>
                    ☁️ Cloud Persistence (Save forever)
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="p-1 bg-pink-500 rounded-full"><ChevronRight className="w-4 h-4 text-white" /></div>
                    🎨 Custom Brand Colors & Meshes
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="p-1 bg-pink-500 rounded-full"><ChevronRight className="w-4 h-4 text-white" /></div>
                    🖼️ Access to Multi-Templates
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="p-1 bg-pink-500 rounded-full"><ChevronRight className="w-4 h-4 text-white" /></div>
                    🎤 Lyrics Video Generator (Coming Soon)
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="p-1 bg-pink-500 rounded-full"><ChevronRight className="w-4 h-4 text-white" /></div>
                    ✨ Priority Studio Rendering
                  </li>
                </ul>
                <PaystackButton 
                  email={user?.email || ""}
                  amount={paystackAmount}
                  onSuccess={onSuccess}
                  onClose={onClose}
                  className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-full font-black text-xl shadow-2xl transition-all active:scale-[0.98] group/btn"
                 >
                  <span className="flex items-center justify-center gap-2">
                    {user ? (isPro ? 'Already Pro' : 'Upgrade to Pro') : 'Unlock Studio Pro'}
                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                 </PaystackButton>
              </div>
            </div>
          </div>
        </section>
        {/* MY SNAPS (HISTORY) */}
        {user && history.length > 0 && (
          <section id="history" className="py-24 bg-white/[0.02] border-t border-white/10 backdrop-blur-3xl">
            <div className="max-w-7xl mx-auto px-8">
              <div className="flex items-center gap-4 mb-12">
                <div className="p-3 bg-indigo-500/20 rounded-2xl">
                  <History className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-4xl font-heading tracking-tight">My Snaps</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {/* Coming Soon Teaser */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="group relative aspect-[3/4] rounded-3xl overflow-hidden border-2 border-dashed border-white/10 bg-white/[0.02] p-8 flex flex-col items-center justify-center text-center gap-6 backdrop-blur-md"
                >
                  <div className="w-16 h-16 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-pink-500/20 group-hover:rotate-12 transition-transform">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black bg-pink-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">Studio Exclusive</span>
                    <h3 className="text-xl font-bold tracking-tight mt-2">Lyrics Video <br /> Generator</h3>
                    <p className="text-white/30 text-[10px] font-medium leading-relaxed">Motion-synced lyric videos for TikTok & Reels.</p>
                  </div>
                  
                  <button 
                    onClick={() => setWaitlistJoined(true)}
                    disabled={waitlistJoined}
                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${waitlistJoined ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white text-black hover:bg-pink-500 hover:text-white shadow-xl'}`}
                  >
                    {waitlistJoined ? '✓ Joined Waitlist' : 'Join Waitlist'}
                  </button>
                </motion.div>

                {history.map((item) => (
                  <motion.div 
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer"
                  >
                    <img 
                      src={item.artwork} 
                      alt={item.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                      <p className="font-bold truncate text-sm">{item.title}</p>
                      <p className="text-white/40 text-[10px] truncate uppercase tracking-widest mb-3">{item.artist}</p>
                      
                      {/* Action Overlays */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={() => {
                            setSelectedSong({
                              id: Number(item.id.replace(/\D/g, '').slice(0, 8)) || Date.now(), // Fallback ID
                              title: item.title,
                              artist: item.artist,
                              artwork: item.artwork,
                              album: "Studio Pro Design",
                              previewUrl: "" // No preview for history items
                            });
                            setSelectedLines(item.lyrics || []);
                            previewRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="flex-1 h-8 bg-white text-black rounded-lg text-[10px] font-black uppercase hover:bg-pink-500 hover:text-white transition-colors"
                         >
                            Edit
                         </button>
                         <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('Delete this snap?')) {
                              await supabase.from('generations').delete().eq('id', item.id);
                              fetchHistory(user.id);
                            }
                          }}
                          className="w-8 h-8 bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center hover:bg-red-500/80 transition-colors"
                          aria-label="Delete snap"
                         >
                            <X className="w-3 h-3 text-white" />
                         </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
        {/* SEO SECTION: THE ULTIMATE GUIDE */}
        <section id="guide" className="py-32 border-t border-white/5 bg-black/40">
          <div className="max-w-5xl mx-auto px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
              <div className="space-y-6">
                <h2 className="text-4xl font-heading tracking-tight leading-tight">
                  The Aesthetic Music <br /> <span className="text-pink-500 italic">Screenshot Generator</span> <br /> for Creators.
                </h2>
                <p className="text-white/40 leading-relaxed">
                  In a world of generic social media posts, your music deserves to stand out. LyricSnap is the premium studio tool designed for artists, curators, and music enthusiasts who crave that high-end Apple Music aesthetic.
                </p>
                <div className="pt-4 space-y-4">
                  <div className="flex gap-4">
                    <div className="w-1 h-12 bg-pink-500 rounded-full" />
                    <p className="text-sm font-medium text-white/60 italic">
                      "We don't just generate images; we curate your digital musical identity."
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-8 text-sm text-white/30 leading-relaxed">
                <p>
                  Whether you're looking for an **Apple Music screenshot generator** or a **TikTok music player creator**, LyricSnap provides the most accurate and aesthetically pleasing renders on the web. Our engine matches colors dynamically to your album art, ensuring every "Now Playing" card is a masterpiece.
                </p>
                <p>
                  By upgrading to **Studio Pro**, you unlock the ability to **save your generations** to the cloud. This means you can create your perfect lyric snap on your laptop and access it instantly on your phone for that perfect Instagram Story post. No more manual transfers—just pure, seamless creativity.
                </p>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/5 pt-20">
              <div>
                <h4 className="font-bold text-lg mb-4 text-white">How do I use the Apple Music Story generator?</h4>
                <p className="text-sm text-white/40 leading-relaxed">Simply search for any song from the 100M+ track database, select your favorite lyrics, and click generate. You'll get a pixel-perfect render ready for IG Stories.</p>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-4 text-white">Is there a limit on free screenshots?</h4>
                <p className="text-sm text-white/40 leading-relaxed">Guest users can generate 1 free high-res snap. To unlock unlimited exports and remove the watermark, you can upgrade to Studio Pro for a one-time fee of $0.99.</p>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-4 text-white">Can I save my lyric snaps for later?</h4>
                <p className="text-sm text-white/40 leading-relaxed">Yes! With Studio Pro, all your generations are synced to your account. You can view, re-download, or edit them anytime from your private dashboard.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#080808] py-32 px-8 overflow-hidden noise-bg">
        <div className="absolute top-0 left-1/4 w-[40%] h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white text-black rounded-[20px] shadow-xl">
                <Music className="w-6 h-6" />
              </div>
              <span className="text-3xl font-heading tracking-tighter">LyricSnap</span>
            </div>
            <p className="text-white/30 text-base max-w-sm leading-relaxed font-medium">
              Elevate your music sharing experience. Built for artists, curators, and music lovers who care about aesthetics.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-20 text-base font-bold">
            <div className="space-y-6">
              <p className="text-white/20 uppercase tracking-widest text-[10px] font-black">Product</p>
              <nav className="flex flex-col gap-4">
                <a href="#tool" className="hover:text-pink-500 transition-colors">Generator</a>
                <a href="#how-it-works" className="hover:text-pink-500 transition-colors">Workflow</a>
                <a href="#features" className="hover:text-pink-500 transition-colors">Technology</a>
              </nav>
            </div>
            <div className="space-y-6">
              <p className="text-white/20 uppercase tracking-widest text-[10px] font-black">Legal</p>
              <nav className="flex flex-col gap-4">
                <a href="#" className="hover:text-pink-500 transition-colors">Privacy</a>
                <a href="#" className="hover:text-pink-500 transition-colors">Terms</a>
              </nav>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-40 pt-10 border-t border-white/5 text-center">
          <p className="text-white/20 text-xs uppercase tracking-[0.2em] font-black">
            © {new Date().getFullYear()} LyricSnap Studio. All rights reserved. Crafted by Godwin.
          </p>
        </div>
      </footer>
    </div>
  );
}
