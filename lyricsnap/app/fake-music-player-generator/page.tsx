import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Music, ArrowRight, Music2, Share2, Palette, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonLd, webAppSchema } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: "Fake Music Player Generator",
  description: "Create aesthetic fake music player screenshots for your favorite songs. The ultimate tool for music lovers and social media creators.",
  keywords: ["fake music player generator", "aesthetic music cards", "song post maker", "now playing screenshot generator"],
};

export default function FakeMusicPlayerLanding() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <JsonLd data={webAppSchema} />
      
      {/* Header */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-gradient-to-tr from-pink-500 to-orange-400 rounded-xl group-hover:rotate-12 transition-transform">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tighter">LyricSnap</span>
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 leading-tight">
              Create Aesthetic <br /> Fake Music Cards
            </h1>
            <p className="text-xl text-white/50 mb-12 font-medium leading-relaxed max-w-xl">
              Turn any song into a visual masterpiece. Our fake music player generator creates premium, shareable cards for your social media stories and profile.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/">
                <Button className="h-14 px-8 bg-white text-black hover:bg-white/90 rounded-full text-lg font-bold transition-all w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 rounded-[40px] blur-[80px] group-hover:bg-blue-500/30 transition-all duration-500" />
            <div className="relative rounded-[40px] border border-white/10 bg-white/5 p-12 overflow-hidden group-hover:scale-105 transition-transform duration-700">
               <div className="flex flex-col items-center">
                  <div className="w-48 h-48 bg-gradient-to-br from-pink-500/20 to-blue-500/20 rounded-[32px] flex items-center justify-center mb-10 border border-white/5">
                    <Music2 className="w-20 h-20 text-white/20" />
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                    <div className="w-[45%] h-full bg-white/40" />
                  </div>
                  <div className="flex justify-between items-center w-full mb-10 opacity-30">
                    <div className="w-6 h-6 border-2 border-white rounded-md" />
                    <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-1" />
                    </div>
                    <div className="w-6 h-6 border-2 border-white rounded-md" />
                  </div>
                  <p className="text-xl font-bold">Aesthetic Design</p>
                  <p className="text-white/40">Powered by LyricSnap</p>
               </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <section className="mb-32">
          <h2 className="text-4xl font-bold mb-16 text-center">Perfect For ...</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-[32px] bg-white/5 border border-white/10">
              <h4 className="font-bold text-xl mb-2">Instagram Stories</h4>
              <p className="text-white/40">Share what you're listening to with a premium look.</p>
            </div>
            <div className="p-6 rounded-[32px] bg-white/5 border border-white/10">
              <h4 className="font-bold text-xl mb-2">TikTok Backgrounds</h4>
              <p className="text-white/40">Perfect visual for your lyrical videos and playlists.</p>
            </div>
            <div className="p-6 rounded-[32px] bg-white/5 border border-white/10">
              <h4 className="font-bold text-xl mb-2">Creative Portfolios</h4>
              <p className="text-white/40">Add aesthetic song cards to your web designs.</p>
            </div>
            <div className="p-6 rounded-[32px] bg-white/5 border border-white/10">
              <h4 className="font-bold text-xl mb-2">Music Blogs</h4>
              <p className="text-white/40">Modern way to present song reviews and recommendations.</p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-500/20 rounded-[40px] blur-[80px]" />
            <div className="relative grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl h-48 flex items-center justify-center">
                <Palette className="w-12 h-12 text-pink-400" />
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl h-48 flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-blue-400" />
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl h-48 flex items-center justify-center">
                <Music className="w-12 h-12 text-orange-400" />
              </div>
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl h-48 flex items-center justify-center">
                <Share2 className="w-12 h-12 text-green-400" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-8 tracking-tight">The ultimate music <br /> aesthetic toolkit.</h2>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-6 h-6 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                <p className="text-lg text-white/60"><span className="text-white font-bold">100% Free:</span> No subscription required for basic generation.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                <p className="text-lg text-white/60"><span className="text-white font-bold">Light/Dark Mode:</span> Beautiful templates for any aesthetic.</p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">✓</div>
                <p className="text-lg text-white/60"><span className="text-white font-bold">Instant Download:</span> High-speed rendering in under 10 seconds.</p>
              </li>
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center bg-gradient-to-br from-pink-500/20 to-blue-500/20 border border-white/10 rounded-[40px] p-20">
          <h2 className="text-5xl font-black mb-8">Ready to Snap?</h2>
          <p className="text-xl text-white/50 mb-12 max-w-xl mx-auto">Create your first aesthetic music card in just a few seconds.</p>
          <Link href="/">
            <Button className="h-16 px-12 bg-white text-black hover:bg-white/90 rounded-full text-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl">
              Start Generating Free
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/50 py-20 px-8 text-center">
        <p className="text-white/40 text-sm">
          © {new Date().getFullYear()} LyricSnap. All rights reserved. <br />
          <Link href="/" className="hover:text-white transition-colors">Generator</Link> • 
          <Link href="/apple-music-screenshot-generator" className="hover:text-white transition-colors ml-2">Apple Music Theme</Link> • 
          <Link href="/fake-music-player-generator" className="hover:text-white transition-colors ml-2">Music Player Tool</Link>
        </p>
      </footer>
    </div>
  );
}
