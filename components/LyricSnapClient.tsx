'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Music, Shield, Zap, Sparkles, LogOut, History, Share2, Link } from 'lucide-react';
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
import { useDebounce } from '@/hooks/useDebounce';

const PaystackButton = dynamic<any>(() => import('@/components/PaystackButton'), { ssr: false });

export default function LyricSnapClient({ initialSong }: { initialSong?: Song | null }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lyrics, setLyrics] = useState<string[] | null>(null);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [fetchingLyrics, setFetchingLyrics] = useState(false);
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [usageCount, setUsageCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [pendingProActivation, setPendingProActivation] = useState(false);
  const [searchMode, setSearchMode] = useState<'tracks' | 'lyrics'>('tracks');
  
  // Load pending activation on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pending = localStorage.getItem('pending_pro_activation');
      if (pending === 'true') setPendingProActivation(true);
    }
  }, []);

  // Check auth status on mount and after auth changes (server-side authority)
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        setIsPro(data.is_pro);
      } catch (err) {
        console.error('Failed to check auth status:', err);
      }
    };

    checkStatus();
  }, [user]);
  
  // Studio Customization State
  const [blurAmount, setBlurAmount] = useState(80);
  const [vignette, setVignette] = useState(40);
  const [template, setTemplate] = useState<'classic' | 'modern'>('classic');
  const [waitlistJoined, setWaitlistJoined] = useState(false);

  const scrollToPro = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  const previewRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(false);

  // Initial song load
  useEffect(() => {
    if (initialSong && !initialLoadRef.current) {
      setSelectedSong(initialSong);
      setQuery(`${initialSong.title} ${initialSong.artist}`);
      initialLoadRef.current = true;
      // Optionally fetch lyrics automatically for the SEO page
      const fetchInitialLyrics = async () => {
        setFetchingLyrics(true);
        try {
          const data = await fetchLyrics(initialSong.title, initialSong.artist);
          setLyrics(data);
        } catch (err) {
          console.error('Failed to fetch initial lyrics:', err);
        } finally {
          setFetchingLyrics(false);
        }
      };
      fetchInitialLyrics();
    }
  }, [initialSong]);

  // Auth & Session management
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        // ✅ Server-side authority check instead of client-side
        checkProsStatus();
        fetchUserProfile(currentUser.id, currentUser.email!);
        // Handle pending activation if user was already logged in but refresh happened
        if (pendingProActivation) {
          verifyPendingPayment();
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        // ✅ Server-side authority check instead of client-side
        checkProsStatus();
        fetchUserProfile(currentUser.id, currentUser.email!);
        if (pendingProActivation) {
           verifyPendingPayment();
           setPendingProActivation(false);
        }
      }
      else setIsPro(false);
    });

    return () => subscription.unsubscribe();
  }, [pendingProActivation]);

  // 🛡️ Check pro status from server (source of truth)
  const checkProsStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      console.log('[Auth Status]', data); // Debug logging
      console.log('[Pro Status] Setting isPro to:', data.is_pro);
      setIsPro(data.is_pro);
      if (data.is_admin) {
        console.log('✅ Admin user detected - Pro status FORCED to true');
        setIsPro(true); // Force true for admins
      }
    } catch (err) {
      console.error('Failed to check pro status:', err);
    }
  };

  // 🛡️ Verify pending payment reference after signup
  const verifyPendingPayment = async () => {
    const reference = localStorage.getItem('pending_payment_reference');
    if (!reference) return;

    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsPro(true);
          localStorage.removeItem('pending_payment_reference');
        }
      }
    } catch (err) {
      console.error('Failed to verify pending payment:', err);
    }
  };

  const fetchUserProfile = async (userId: string, email: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('usage_count')
      .eq('id', userId)
      .single();
    
    if (data) {
      setUsageCount(data.usage_count);
      // 🛡️ Pro status is determined server-side only via /api/auth/status
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

  const onSuccess = async (reference: any) => {
    console.log('[Payment] Verifying payment:', reference);
    
    if (!reference) {
      console.error('[Payment] No reference received from Paystack');
      alert('Payment verification failed. Please contact support.');
      return;
    }

    try {
      if (!user) {
        // Guest user - store reference for verification after signup
        setPendingProActivation(true);
        localStorage.setItem('pending_pro_activation', 'true');
        localStorage.setItem('pending_payment_reference', reference);
        setShowAuthModal(true);
        setShowUpgradeModal(false);
      } else {
        // Authenticated user - verify payment server-side
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Payment verification failed');
        }

        const result = await response.json();
        
        if (result.success) {
          console.log('[Payment] ✅ Pro status activated');
          setIsPro(true);
          setPendingProActivation(false);
          localStorage.removeItem('pending_pro_activation');
          localStorage.removeItem('pending_payment_reference');
          setShowUpgradeModal(false);
        } else {
          throw new Error('Payment verification was not successful');
        }
      }
    } catch (err: any) {
      console.error('[Payment] Verification error:', err);
      alert(`Payment verification failed: ${err.message}`);
    }
  };

  const onClose = () => {
    console.log('[Payment] Payment modal closed');
  };

  const updateProStatus = async (userId: string) => {
    // 🛡️ This function is now only called after server-side verification
    // For backward compatibility, verify again on the server
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    
    if (data.is_pro) {
      setIsPro(true);
      setPendingProActivation(false);
      localStorage.removeItem('pending_pro_activation');
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
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${searchMode}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
      analytics.trackSearch(query, data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [query]);

  useEffect(() => {
    let active = true;

    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        setSelectedIndex(-1);
        return;
      }
      
      // Don't search if the query exactly matches the selected song (already selected)
      if (selectedSong && `${selectedSong.title} ${selectedSong.artist}`.toLowerCase() === debouncedQuery.toLowerCase()) {
        return;
      }

      setIsSearchingSuggestions(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${searchMode}`);
        if (!response.ok) throw new Error('Suggestions failed');
        const data = await response.json();
        if (active) {
          setSuggestions(data.slice(0, 6)); // Top 6 suggestions
          setSelectedIndex(-1); // Reset selection
        }
      } catch (err) {
        if (active) console.error('Failed to fetch suggestions:', err);
      } finally {
        if (active) setIsSearchingSuggestions(false);
      }
    };

    fetchSuggestions();

    return () => {
      active = false;
    };
  }, [debouncedQuery, selectedSong, searchMode]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (song: Song) => {
    setSelectedSong(song);
    setQuery(`${song.title} ${song.artist}`);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedLines([]);   // ← clear previous song's selected lyrics
    setLyrics(null);        // ← clear previous song's lyrics list
    analytics.trackSelectSong(song.title, song.artist);
    // Automatically fetch lyrics for a snappy experience
    handleFetchLyricsForSong(song);
  };

  const handleFetchLyricsForSong = async (song: Song) => {
    setFetchingLyrics(true);
    try {
      const data = await fetchLyrics(song.title, song.artist);
      setLyrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingLyrics(false);
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

    // Re-check pro status right before download
    const statusResponse = await fetch('/api/auth/status');
    const statusData = await statusResponse.json();
    const currentlyPro = statusData.is_pro;

    if (!currentlyPro && usageCount >= 3) {
      setShowUpgradeModal(true);
      return;
    }

    setGenerating(true);
    analytics.trackGenerateStart(selectedSong.title, selectedSong.artist);

    try {
      // ── 1. Find the DOM element to capture ──────────────────────────────
      const target = document.getElementById('screenshot-target');
      if (!target) throw new Error('Preview element not found. Select a song first.');

      // ── 2. Proxy all external image URLs so canvas isn't CORS-tainted ───
      //    MusicPlayer now uses inline styles for both <img> and background-image divs.
      const proxyUrl = (url: string) =>
        `/api/proxy-image?url=${encodeURIComponent(url)}`;

      // Patch <img> src attributes
      const images = Array.from(target.querySelectorAll<HTMLImageElement>('img'));
      const origSrcs = images.map((img) => img.src);
      images.forEach((img) => {
        if (img.src && img.src.startsWith('http')) {
          img.crossOrigin = 'anonymous';
          img.src = proxyUrl(img.src);
        }
      });

      // Patch inline backgroundImage on divs (the blurred bg layer)
      const bgDivs = Array.from(target.querySelectorAll<HTMLElement>('div'));
      const origBgImages = bgDivs.map((el) => el.style.backgroundImage);
      bgDivs.forEach((el) => {
        const bg = el.style.backgroundImage;
        if (bg && bg.includes('http')) {
          const match = bg.match(/url\(["']?(https?[^"')]+)["']?\)/);
          if (match) {
            el.style.backgroundImage = `url(${proxyUrl(match[1])})`;
          }
        }
      });

      // Wait for browser to load proxied images before capture
      await new Promise((res) => setTimeout(res, 800));

      // ── 3. Capture with html-to-image at 3× resolution ─────────────────
      const { toPng } = await import('html-to-image');

      const dataUrl = await toPng(target, {
        pixelRatio: 3, // 390×844 → 1170×2532px (full retina quality)
        cacheBust: true,
        skipFonts: false,
      });

      // ── 4. Restore original values ──────────────────────────────────────
      images.forEach((img, i) => { img.src = origSrcs[i]; });
      bgDivs.forEach((el, i) => { el.style.backgroundImage = origBgImages[i]; });


      // ── 5. Trigger download ─────────────────────────────────────────────
      const filename = `${selectedSong.title.replace(/[^a-z0-9]/gi, '_')}_LyricSnap.png`;
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      analytics.trackDownloadComplete(selectedSong.title, selectedSong.artist);

      // ── 6. Log the generation server-side ──────────────────────────────
      const logRes = await fetch('/api/log-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedSong.title,
          artist: selectedSong.artist,
          artwork: selectedSong.artwork,
          lyrics: selectedLines,
        }),
      });

      const logData = await logRes.json();

      if (logRes.status === 403) {
        // Edge case: server says limit hit (e.g. race condition)
        setShowUpgradeModal(true);
        return;
      }

      // ── 7. Update local state ───────────────────────────────────────────
      const newCount = usageCount + 1;

      if (user) {
        // Server handled the DB write; just refresh local profile state
        if (logData.usage_count !== undefined) {
          setUsageCount(logData.usage_count);
        } else {
          setUsageCount(newCount);
          fetchUserProfile(user.id, user.email!);
        }
      } else {
        // Guest — manage state in localStorage
        localStorage.setItem('lyric_snap_usage', newCount.toString());
        const guestHistory = JSON.parse(localStorage.getItem('lyric_snap_history') || '[]');
        guestHistory.unshift({
          title: selectedSong.title,
          artist: selectedSong.artist,
          artwork: selectedSong.artwork,
          lyrics: selectedLines,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('lyric_snap_history', JSON.stringify(guestHistory.slice(0, 5)));
        setUsageCount(newCount);
      }
    } catch (err: any) {
      console.error('[Download] Error:', err);
      analytics.trackError('generation_failed', err.message);
      alert(`Export failed: ${err.message || 'Please try again.'}`);
    } finally {
      setGenerating(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText('https://lyricsnap.app');
    alert('Link copied to clipboard! Share it with your friends.');
  };

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LyricSnap',
          text: `Check out my lyric snap for ${selectedSong?.title}!`,
          url: 'https://lyricsnap.app',
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      copyToClipboard();
    }
  };


  return (
    <div className="min-h-screen bg-background text-white selection:bg-pink-500/30 selection:text-white font-sans noise-bg premium-mesh">
      <JsonLd data={webAppSchema} />
      <JsonLd data={howToSchema} />
      
      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full bg-[#0a0a0a] text-white p-10 rounded-[56px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative overflow-hidden ring-1 ring-white/10"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -ml-16 -mb-16" />

               <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white"
                aria-label="Close Upgrade Modal"
               >
                <X className="w-5 h-5" />
               </button>

               <div className="space-y-8 text-center relative z-10">
                 <div className="relative inline-block">
                   <div className="w-24 h-24 bg-gradient-to-tr from-pink-600 via-pink-500 to-orange-400 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/40 transform -rotate-3 overflow-hidden">
                      <Sparkles className="w-12 h-12 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]" />
                   </div>
                   <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg ring-1 ring-white/10"
                   >
                     🚀
                   </motion.div>
                 </div>

                 <div className="space-y-3">
                   <h3 className="text-4xl font-heading tracking-tighter leading-tight">Elevate Your <br /> <span className="text-pink-500 italic">Musical Brand.</span></h3>
                   <p className="text-white/40 font-medium leading-relaxed max-w-[280px] mx-auto text-sm">
                     {user ? "Upgrade now to unlock all professional studio features forever." : "Guests: You'll create your account after checkout to secure your Studio Pro status."}
                   </p>
                 </div>

                 <div className="grid grid-cols-1 gap-4 text-left py-4">
                   {[
                     { icon: Zap, text: "Unlimited High-Res Generations" },
                     { icon: Music, text: "All Premium Design Templates" },
                     { icon: Shield, text: "Cloud Sync & History Access" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl ring-1 ring-white/5 group hover:bg-white/[0.08] transition-colors">
                       <div className="p-2 bg-pink-500/10 text-pink-500 rounded-lg group-hover:scale-110 transition-transform">
                          <item.icon className="w-4 h-4" />
                       </div>
                       <span className="text-xs font-bold tracking-tight">{item.text}</span>
                     </div>
                   ))}
                 </div>

                 <div className="space-y-4">
                    <PaystackButton 
                      email={user?.email || ""}
                      amount={paystackAmount}
                      onSuccess={onSuccess}
                      onClose={onClose}
                      className="w-full h-16 bg-white text-black hover:bg-pink-50 rounded-full font-black text-xl shadow-[0_15px_40px_-5px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] group/pay"
                    >
                      <span className="flex items-center justify-center gap-3">
                        Upgrade for $0.49
                        <ChevronRight className="w-5 h-5 group-hover/pay:translate-x-1 transition-transform" />
                      </span>
                    </PaystackButton>
                    
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">One-time payment • Lifetime Access</p>
                 </div>
                 
                 {/* Better Trust Badges */}
                 <div className="flex flex-col items-center gap-4 pt-6 mt-8 border-t border-white/5">
                   <div className="flex items-center gap-6 opacity-20 grayscale hover:opacity-100 transition-all duration-700">
                     <div className="flex items-center border border-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Apple Pay</div>
                     <div className="flex items-center border border-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Visa</div>
                     <div className="flex items-center border border-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Mastercard</div>
                   </div>
                   <div className="flex items-center gap-2 text-indigo-400/40 text-[8px] font-black uppercase tracking-widest leading-none">
                     <Shield className="w-3 h-3" />
                     Bank-Level SSL Security
                   </div>
                 </div>
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

        {/* Mobile Sign In/Out Button (Option 1) */}
        <div className="md:hidden flex items-center gap-2">
          {user ? (
            <button 
              onClick={handleSignOut}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 transition-colors active:scale-95"
            >
              Sign In
            </button>
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
              Stop using Spotify's basic screenshot UI. Create stunning, premium music cards for Instagram and TikTok in seconds.
            </p>

            {/* MY SNAPS (HISTORY) - MOVED TO TOP FOR LOGGED IN USERS */}
            {user && (
              <section id="history" className="mt-16 mb-24 py-12 bg-white/[0.02] border border-white/10 rounded-[48px] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/20 rounded-2xl">
                        <History className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="space-y-1 text-left">
                        <h2 className="text-3xl font-heading tracking-tight">Your Gallery</h2>
                        <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
                          Welcome back, {user.email?.split('@')[0]}
                        </p>
                      </div>
                    </div>
                    
                    {isPro && (
                      <div className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center gap-2 shadow-xl shadow-indigo-500/20 h-fit">
                        <Sparkles className="w-4 h-4 text-white" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Studio Pro</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {/* Coming Soon Teaser */}
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="group relative aspect-[3/4] rounded-3xl overflow-hidden border-2 border-dashed border-white/10 bg-white/[0.02] p-8 flex flex-col items-center justify-center text-center gap-6 backdrop-blur-md order-last md:order-first"
                    >
                      <div className="w-16 h-16 bg-gradient-to-tr from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-pink-500/20 group-hover:rotate-12 transition-transform">
                        <Music className="w-8 h-8 text-white" />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black bg-pink-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">Studio Exclusive</span>
                        <h3 className="text-lg font-bold tracking-tight mt-2 leading-tight">Lyrics Video <br /> Generator</h3>
                        <p className="text-white/30 text-[10px] font-medium leading-relaxed">Coming soon to Pro.</p>
                      </div>
                      
                      <button 
                        onClick={() => setWaitlistJoined(true)}
                        disabled={waitlistJoined}
                        className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${waitlistJoined ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white text-black hover:bg-pink-500 hover:text-white shadow-xl'}`}
                      >
                        {waitlistJoined ? '✓ Joined' : 'Join'}
                      </button>
                    </motion.div>

                    {history.length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-1 md:col-span-3 lg:col-span-4 min-h-[300px] flex flex-col items-center justify-center border border-white/5 bg-white/[0.01] rounded-[48px] text-center p-12 space-y-4"
                      >
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center opacity-30">
                          <History className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-bold opacity-30 tracking-tight">Gallery Empty</p>
                          <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Capture your first lyric snap!</p>
                        </div>
                      </motion.div>
                    )}

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
                          <p className="font-bold truncate text-[12px]">{item.title}</p>
                          <p className="text-white/40 text-[9px] truncate uppercase tracking-widest mb-3">{item.artist}</p>
                          
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setSelectedSong({
                                  id: Number(item.id.replace(/\D/g, '').slice(0, 8)) || Date.now(),
                                  title: item.title,
                                  artist: item.artist,
                                  artwork: item.artwork,
                                  album: "Studio Pro Design",
                                  previewUrl: ""
                                });
                                setSelectedLines(item.lyrics || []);
                                previewRef.current?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="flex-1 h-8 bg-white text-black rounded-lg text-[9px] font-black uppercase hover:bg-pink-500 hover:text-white transition-colors"
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

            {/* Main Action Tool */}

            <div id="tool" className="max-w-5xl mx-auto bg-white/[0.05] border border-white/15 rounded-[48px] p-4 md:p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden group/tool">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-blue-500/5 opacity-0 group-hover/tool:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start relative z-10">
                {/* Left: Search & Controls */}
                <div className="space-y-8">
                  <div className="text-left space-y-2">
                    <h2 className="text-3xl font-heading tracking-tight">Create your Snap</h2>
                    <p className="text-white/40">Search for any track to get started.</p>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit backdrop-blur-md">
                    <button
                      onClick={() => setSearchMode('tracks')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${searchMode === 'tracks' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-white/40 hover:text-white/60'}`}
                    >
                      Search Tracks
                    </button>
                    <button
                      onClick={() => setSearchMode('lyrics')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${searchMode === 'lyrics' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-white/40 hover:text-white/60'}`}
                    >
                      Search Lyrics
                    </button>
                  </div>

                  <form onSubmit={handleSearch} className="relative group/search">
                    <input
                      type="text"
                      placeholder={searchMode === 'tracks' ? "Enter song name or paste link..." : "Enter lyrics (e.g. Just a small town girl...)"}
                      value={query}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-white/10 border border-white/15 rounded-full py-5 px-8 pr-20 text-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all placeholder:text-white/20 backdrop-blur-xl"
                    />
                    <button 
                      type="submit"
                      aria-label="Search"
                      className="absolute right-2 top-2 bottom-2 aspect-square bg-white text-black rounded-full flex items-center justify-center hover:bg-pink-500 hover:text-white transition-all active:scale-90 shadow-xl"
                    >
                      <Search className="w-5 h-5" />
                    </button>

                    {/* Suggestions Dropdown */}
                    <AnimatePresence>
                      {showSuggestions && query.length >= 2 && (suggestions.length > 0 || isSearchingSuggestions) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-3 z-[100] bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/15 rounded-[32px] overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]"
                        >
                          {isSearchingSuggestions && (
                            <div className="p-4 flex items-center gap-3 border-b border-white/10 opacity-40">
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Finding tracks...</span>
                            </div>
                          )}
                          <div className="p-2 flex flex-col gap-1">
                            {suggestions.map((song, index) => (
                              <button
                                key={song.id}
                                type="button"
                                onMouseEnter={() => setSelectedIndex(index)}
                                onClick={() => selectSuggestion(song)}
                                className={`flex items-center gap-4 p-3 rounded-2xl transition-all text-left group/sugg ${selectedIndex === index ? 'bg-white/15' : 'hover:bg-white/10'}`}
                              >
                                <img src={song.artwork} alt="" className="w-12 h-12 rounded-xl object-cover shadow-2xl group-hover/sugg:scale-105 transition-transform" />
                                <div className="flex-1 overflow-hidden">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold truncate text-sm group-hover/sugg:text-pink-500 transition-colors">{song.title}</p>
                                    {song.source === 'genius' && (
                                      <span className="text-[7px] font-black bg-pink-500/20 text-pink-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">Genius</span>
                                    )}
                                  </div>
                                  <p className="text-white/30 text-[10px] truncate uppercase tracking-widest font-medium">{song.artist}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/10 group-hover/sugg:text-white/40 group-hover/sugg:translate-x-1 transition-all" />
                              </button>
                            ))}
                          </div>
                          {suggestions.length === 0 && !isSearchingSuggestions && (
                            <div className="p-8 text-center opacity-30">
                              <p className="text-xs font-bold uppercase tracking-widest">No tracks found</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>

                  {/* Results scroll area */}
                  {(results.length > 0 || (!query && !selectedSong) || loading) && (
                    <div className={`transition-all duration-500 overflow-y-auto pr-2 custom-scrollbar ${(results.length > 0 || (!query && !selectedSong)) ? 'min-h-[300px] max-h-[450px]' : 'max-h-[450px] min-h-[50px]'}`}>
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
                                  setSelectedLines([]);   // ← clear previous song's selected lyrics
                                  setLyrics(null);        // ← clear previous song's lyrics list
                                  analytics.trackSelectSong(song.title, song.artist);
                                }}
                                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${selectedSong?.id === song.id ? 'bg-white/15 border-white/25 shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                              >
                                <img src={song.artwork} alt={`${song.title} by ${song.artist}`} className="w-14 h-14 rounded-lg object-cover shadow-lg" />
                                <div className="flex-1 overflow-hidden text-left">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold truncate text-lg">{song.title}</p>
                                    {song.source === 'genius' && (
                                      <span className="text-[8px] font-black bg-pink-500/20 text-pink-500 px-2 py-0.5 rounded-lg uppercase tracking-widest">Lyric Match</span>
                                    )}
                                  </div>
                                  <p className="text-white/40 text-xs truncate uppercase tracking-wider">{song.artist}</p>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}

                        {!loading && results.length === 0 && !query && !selectedSong && (
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
                  )}

                </div>

                {/* Right: Preview & Download */}
                <div ref={previewRef} className={`flex flex-col items-center justify-center lg:pt-0 ${selectedSong ? 'pt-0' : 'pt-8'}`}>
                  <AnimatePresence mode="wait">
                    {selectedSong ? (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center w-full"
                      >
                        <div className="relative group/player mb-6 transform-gpu hover:rotate-1 transition-transform duration-700 w-full max-w-[390px] flex justify-center scale-75 xs:scale-[0.82] sm:scale-90 origin-top mx-auto">

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
                              className="w-full h-14 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-500 text-white hover:brightness-110 rounded-2xl font-black text-sm md:text-base flex gap-3 shadow-[0_15px_30px_-5px_rgba(124,58,237,0.4)] border border-white/20 transition-all active:scale-[0.98] group/lyrics relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/lyrics:opacity-100 transition-opacity" />
                              {fetchingLyrics ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Sparkles className="w-5 h-5 group-hover/lyrics:rotate-12 transition-transform" />
                              )}
                              Load & Customize Lyrics
                            </Button>
                          ) : (
                            <div className="bg-white/10 border border-white/20 rounded-[24px] p-5 overflow-hidden backdrop-blur-xl">
                              <div className="flex justify-between items-center mb-3 px-1">
                                <div className="flex flex-col"><span className="text-[9px] font-black uppercase tracking-widest text-white/30 leading-none mb-1">Lyric Selection</span><span className="text-[9px] text-white/40">Choose up to 5 lines</span></div>
                                <span className="text-[10px] font-black text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">{selectedLines.length}/5</span>
                              </div>
                              <div className="max-h-[300px] shadow-inner group/lyrics-window overflow-y-auto px-1 flex flex-col gap-1 custom-scrollbar">
                                {lyrics.slice(0, 40).map((line, i) => (
                                  <button
                                    key={i}
                                    onClick={() => toggleLine(line)}
                                    className={`p-3.5 rounded-xl text-left text-xs transition-all duration-300 relative overflow-hidden group/line ${selectedLines.includes(line) ? 'bg-white text-black font-bold shadow-lg scale-[1.01]' : 'hover:bg-white/10 text-white/50'}`}
                                  >
                                    {line}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>


                        <Button 
                          onClick={handleDownload}
                          disabled={generating}
                          className="w-full h-16 bg-gradient-to-br from-[#ff3366] via-[#ff5e3a] to-[#ff9500] text-white hover:brightness-110 rounded-[24px] transition-all flex flex-col items-center justify-center shadow-[0_20px_40px_-10px_rgba(255,51,102,0.4)] active:scale-[0.98] disabled:opacity-50 group/download mt-4 border border-white/30 relative overflow-hidden"
                        >
                           <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/download:opacity-100 transition-opacity" />
                           <div className="flex items-center gap-2.5 relative z-10 px-4 w-full justify-center">
                             <span className="text-base xs:text-lg font-black tracking-tight truncate">
                               {generating ? "Crafting..." : "Generate & Download"}
                             </span>
                             {!generating && (
                               <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover/download:bg-white group-hover/download:text-pink-500 transition-all border border-white/30 shadow-lg flex-shrink-0">
                                 <Download className="w-4 h-4 group-hover/download:translate-y-0.5 transition-transform" />
                               </div>
                             )}
                           </div>
                           {!generating && (
                             <span className="text-[9px] font-black uppercase tracking-[0.25em] opacity-60 mt-0.5 relative z-10">Studio Export</span>
                           )}
                        </Button>
                        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-8">
                           {usageCount >= 3 ? "Limit Reached • Upgrade to Unlock" : `${3 - usageCount} free ${3 - usageCount === 1 ? 'snap' : 'snaps'} remaining`}
                        </p>



                         {/* SHARE BUTTONS */}
                         <div className="flex items-center gap-2 mb-8 w-full">
                           <button
                             onClick={copyToClipboard}
                             title="Copy App Link"
                             className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all group/share"
                           >
                             <Link className="transition-all group-hover/share:text-pink-500 w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover/share:text-white">Copy Link</span>
                           </button>
                           <button
                             onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this lyric snap I made for ${selectedSong?.title} by ${selectedSong?.artist} on @LyricSnap!`)}&url=https://lyricsnap.app`, '_blank')}
                             title="Share on X"
                             className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all group/share"
                           >
                             <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-white/40 group-hover/share:fill-white transition-colors">
                               <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644z"></path>
                             </svg>
                           </button>
                           <button
                             onClick={handleSystemShare}
                             title="Share"
                             className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all group/share"
                           >
                             <Share2 className="w-4 h-4 text-white/40 group-hover/share:text-pink-500" />
                           </button>
                         </div>

                         {/* Studio Customization (Moved here for better mobile UX) */}
                        <div 
                          onClick={() => !isPro && scrollToPro()}
                          className={`w-full space-y-6 p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl transition-all ${!isPro ? 'cursor-pointer hover:border-pink-500/30' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                             <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Studio Controls</h4>
                             {!isPro ? (
                               <span className="text-[10px] font-black bg-pink-500 text-white px-2 py-0.5 rounded-full animate-pulse">PRO ONLY</span>
                             ) : (
                               <span className="text-[10px] font-black text-pink-500 px-2 py-0.5 border border-pink-500/30 rounded-full">UNLOCKED</span>
                             )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <button 
                               disabled={!isPro}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setTemplate('classic');
                               }}
                               type="button"
                               className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${template === 'classic' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                             >
                               Classic
                             </button>
                             <button 
                               disabled={!isPro}
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setTemplate('modern');
                               }}
                               type="button"
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
                      </motion.div>
                    ) : (
                      <div className="w-full max-w-[400px] aspect-[400/600] rounded-[48px] border-2 border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center text-center p-6 md:p-12 space-y-6 backdrop-blur-sm mx-auto scale-90 xs:scale-100 sm:scale-100 origin-center">
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

        {/* HOW IT WORKS (Only for Guests) */}
        {!user && (
          <section id="how-it-works" className="py-24 bg-white/[0.02] border-y border-white/10 backdrop-blur-3xl relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
              <h2 className="text-5xl md:text-6xl font-heading text-center mb-16 md:mb-24 tracking-tighter">How it Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                {[
                  { step: "01", title: "Search", desc: "Paste a song link or search from 100M+ tracks." },
                  { step: "02", title: "Customize", desc: "Select the lyrics that hit different." },
                  { step: "03", title: "Render", desc: "Our engine crafts a pixel-perfect image." },
                  { step: "04", title: "Share", desc: "Download & flex on IG or TikTok." }
                ].map((item, i) => (
                  <div key={i} className="relative p-6 bg-white/[0.08] border border-white/10 rounded-[40px] md:rounded-[48px] group transition-all hover:bg-white/15 h-full backdrop-blur-md shadow-xl flex flex-col justify-center text-center md:text-left md:p-12">
                    <span className="text-4xl md:text-7xl font-heading opacity-30 mb-2 md:mb-8 block transition-opacity group-hover:opacity-50">{item.step}</span>
                    <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-4 tracking-tight">{item.title}</h3>
                    <p className="text-white/40 leading-relaxed text-[12px] md:text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}


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
                  className="w-full h-20 bg-black text-white hover:bg-black/90 rounded-full font-black text-xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] transition-all active:scale-[0.98] group/btn border border-white/10"
                 >
                  <span className="flex items-center justify-center gap-2">
                    {user ? (isPro ? 'Already Pro' : 'Upgrade to Pro') : 'Unlock Studio Pro'}
                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                 </PaystackButton>

                 
                 {/* Trust Badges */}
                 <div className="flex flex-col items-center gap-3 pt-2">
                   <div className="flex items-center gap-4 opacity-30 grayscale hover:opacity-50 transition-opacity">
                     <div className="flex items-center border border-black/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter text-black/60">Apple Pay</div>
                     <div className="flex items-center border border-black/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter text-black/60">Visa</div>
                     <div className="flex items-center border border-black/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter text-black/60">Mastercard</div>
                   </div>
                   <div className="flex items-center gap-1.5 opacity-20 text-[8px] font-black uppercase tracking-widest text-black">
                     <Shield className="w-2.5 h-2.5" />
                     Secure International Payment
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

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
                      "Because music is art, and your screenshots should be too. Stop settling for Spotify's basic, pixelated lyric sharing."
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-8 text-sm text-white/30 leading-relaxed">
                <p>
                  If you've ever felt that **Spotify's lyric screenshots are ugly**, you're not alone. LyricSnap was built as a premium **Spotify UI alternative**, providing high-resolution, aesthetically balanced music cards. Our tool is the most advanced **Apple Music screenshot generator** and **TikTok music player creator** currently available.
                </p>
                <p>
                  Unlike the default sharing options, LyricSnap gives you full control over blur intensity, vignette levels, and templates. It's the ultimate **fake music player generator** for creators who care about their brand's visual identity on Instagram and TikTok.
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

