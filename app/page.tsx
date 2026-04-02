'use client';

import dynamic from 'next/dynamic';

const LyricSnapClient = dynamic(() => import('@/components/LyricSnapClient'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center font-sans font-sans">
      <div className="w-12 h-12 border-2 border-white/10 border-t-pink-500 rounded-full animate-spin mb-4" />
      <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-30 text-center">Opening Studio...</p>
    </div>
  )
});

export default function Home() {
  return <LyricSnapClient />;
}