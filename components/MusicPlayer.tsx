import React from 'react';
import { Play, SkipBack, SkipForward, ListMusic, Share2, Heart } from 'lucide-react';

interface MusicPlayerProps {
  title: string;
  artist: string;
  album: string;
  artwork: string;
  lyrics?: string[]; // Optional lyric lines
  progress?: number; // 0-100
  duration?: string;
  currentTime?: string;
  watermark?: boolean;
  blurAmount?: number;
  vignette?: number;
  template?: 'classic' | 'modern';
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  title,
  artist,
  album,
  artwork,
  lyrics = [],
  progress = 42,
  duration = "3:45",
  currentTime = "1:35",
  watermark = false,
  blurAmount = 80,
  vignette = 40,
  template = 'classic',
}) => {
  const isLyricMode = lyrics.length > 0;

  return (
    <div 
      className={`relative w-[400px] h-[600px] overflow-hidden rounded-[40px] shadow-2xl bg-black flex flex-col items-center p-6 md:p-12 text-white selection:bg-pink-500/30 font-sans`}
      style={{ 
        '--artwork-url': `url(${artwork})`,
        '--blur-amount': `${blurAmount}px`,
        '--vignette-opacity': vignette / 100
      } as React.CSSProperties}
      id="screenshot-target"
    >
      {/* Background Blur */}
      <div 
        className={`absolute inset-0 z-0 scale-110 bg-cover bg-center transition-all duration-1000 ${isLyricMode ? 'opacity-40' : 'opacity-60'} [background-image:var(--artwork-url)] [filter:blur(var(--blur-amount))]`}
      />
      
      {/* Glossy / Vignette Overlay */}
      <div 
        className="absolute inset-0 z-10 [background:radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,rgba(0,0,0,var(--vignette-opacity))_100%)]"
      />

      {/* Watermark */}
      {watermark && (
        <div className="absolute bottom-6 right-8 z-50 opacity-20 pointer-events-none">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] font-heading mix-blend-difference">
            LyricSnap.app
          </p>
        </div>
      )}

      {/* Content */}
      <div className="relative z-20 w-full flex flex-col items-center h-full">
        {/* Top Handle/Indicator */}
        <div className="w-10 h-1 bg-white/20 rounded-full mb-10" />

        {isLyricMode ? (
          /* LYRIC MODE */
          <div className="flex-1 flex flex-col justify-center items-start w-full px-4 gap-6">
            {lyrics.map((line, i) => (
              <p 
                key={i} 
                className="text-4xl font-extrabold leading-tight tracking-tight drop-shadow-lg text-left font-serif"
              >
                {line}
              </p>
            ))}
            
            {/* Bottom Info for Lyric Mode */}
            <div className="mt-12 flex items-center gap-4 opacity-80">
              <img src={artwork} className="w-12 h-12 rounded-lg shadow-lg" alt={`${title} by ${artist} artwork`} />
              <div className="overflow-hidden">
                <p className="font-bold truncate text-sm">{title}</p>
                <p className="text-white/60 truncate text-xs">{artist}</p>
              </div>
            </div>
          </div>
        ) : (
          /* PLAYER MODE */
          <>
            {/* Artwork */}
            <div className={`transition-all duration-700 ${template === 'modern' ? 'w-48 h-48 rounded-[32px] mb-6 mt-4 shadow-2xl skew-y-1' : 'w-full aspect-square rounded-2xl mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]'}`}>
              <img src={artwork} alt={album} className="w-full h-full object-cover rounded-[inherit]" />
            </div>

            {/* Info & Metadata */}
            <div className={`w-full flex flex-col mb-6 px-2 ${template === 'modern' ? 'items-center text-center' : 'items-start'}`}>
              <div className={`flex flex-col gap-1 overflow-hidden w-full ${template === 'modern' ? 'items-center' : ''}`}>
                <h1 className={`font-bold leading-tight tracking-tight font-serif ${template === 'modern' ? 'text-3xl mb-1' : 'text-2xl truncate'}`}>{title}</h1>
                <p className={`text-white/70 tracking-tight ${template === 'modern' ? 'text-xl' : 'text-xl truncate'}`}>{artist}</p>
              </div>
              {template !== 'modern' && (
                <button 
                  aria-label="Add to favorites"
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors mt-4 self-end"
                >
                  <Heart className="w-6 h-6 fill-none stroke-[2px]" />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className={`w-full px-2 mb-8 ${template === 'modern' ? 'mt-auto' : ''}`}>
              <div className="w-full h-1.5 bg-white/20 rounded-full relative overflow-hidden group">
                <div 
                  className="absolute left-0 top-0 h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-3 text-xs font-semibold tracking-widest text-white/40 uppercase">
                <span>{currentTime}</span>
                <span>{duration}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="w-full flex justify-between items-center px-4 mb-auto">
              <SkipBack className="w-10 h-10 fill-white text-white opacity-90" />
              <div className="p-1 bg-white rounded-full">
                <Play className="w-12 h-12 fill-black text-black ml-1 scale-90" />
              </div>
              <SkipForward className="w-10 h-10 fill-white text-white opacity-90" />
            </div>

            {/* Bottom Bar */}
            <div className="w-full flex justify-between items-center px-2 mt-8 opacity-60">
              <Share2 className="w-5 h-5" />
              <div className="flex gap-4">
                <ListMusic className="w-5 h-5" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
