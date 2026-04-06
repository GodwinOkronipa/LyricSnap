import React from 'react';
import { Shuffle, SkipBack, Play, SkipForward, Repeat, Airplay, Heart, Ellipsis, ChevronDown } from 'lucide-react';

interface MusicPlayerProps {
  title: string;
  artist: string;
  album: string;
  artwork: string;
  cachedArtworkDataUri?: string; // ← New prop for pre-fetched base64
  lyrics?: string[];
  progress?: number;
  duration?: string;
  currentTime?: string;
  watermark?: boolean;
  blurAmount?: number;
  vignette?: number;
  template?: 'classic' | 'modern';
}

/**
 * Pixel-accurate Apple Music "Now Playing" recreation.
 * 390×844px — iPhone 15 logical resolution.
 * All styles are explicit inline to prevent CSS bleeding.
 */
export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  title,
  artist,
  album,
  artwork,
  cachedArtworkDataUri,
  lyrics = [],
  progress = 32,
  duration = '3:45',
  currentTime = '1:12',
  watermark = false,
  blurAmount = 60,
  vignette = 55,
}) => {
  const isLyricMode = lyrics.length > 0;
  const activeArtwork = cachedArtworkDataUri || artwork;

  // Shared root styles — MUST include textAlign: left !important
  const rootStyle: React.CSSProperties = {
    position: 'relative',
    width: '390px',
    height: '844px',
    overflow: 'hidden',
    background: '#000',
    fontFamily: '-apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    textAlign: 'left',
    color: '#fff',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  };

  const commonText: React.CSSProperties = {
    textAlign: 'left',
    margin: 0,
    padding: 0,
    lineHeight: 1.2,
    width: '100%',
  };

  // ─── BACKGROUND LAYERS ──────────────────────────────────────────────────
  const bgBlurStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${activeArtwork})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: `blur(${blurAmount}px) saturate(2) brightness(0.6)`,
    transform: 'scale(1.25)',
    zIndex: 0,
    pointerEvents: 'none',
  };

  const bgVignetteStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(to bottom, 
      rgba(0,0,0,${(vignette * 0.3) / 100}) 0%, 
      rgba(0,0,0,${(vignette * 0.2) / 100}) 40%, 
      rgba(0,0,0,${(vignette * 0.6) / 100}) 100%)`,
    zIndex: 1,
    pointerEvents: 'none',
  };

  // ─── CONTENT ────────────────────────────────────────────────────────────
  return (
    <div id="screenshot-target" style={rootStyle}>
      <style>{`
        #screenshot-target,
        #screenshot-target p, 
        #screenshot-target h1, 
        #screenshot-target span,
        #screenshot-target div {
          text-align: left !important;
        }
        #screenshot-target .centered-label {
          text-align: center !important;
          width: 100% !important;
        }
      `}</style>
      {/* Background */}
      <div style={bgBlurStyle} />
      <div style={bgVignetteStyle} />

      {isLyricMode ? (
        /* ─── LYRIC MODE ─── */
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '64px 32px 48px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 54 }}>
            <img src={activeArtwork} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', display: 'block', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ ...commonText, fontSize: 16, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
              <p style={{ ...commonText, fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</p>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
            {lyrics.map((line, i) => (
              <p key={i} style={{ ...commonText, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: i === 0 ? 34 : 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{line}</p>
            ))}
          </div>
          {watermark && <p style={{ ...commonText, textAlign: 'right', color: 'rgba(255,255,255,0.15)', fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 32 }}>LyricSnap.app</p>}
        </div>
      ) : (
        /* ─── PLAYER MODE ─── */
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '56px 32px 44px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <ChevronDown size={28} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
            <p style={{ ...commonText, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Now Playing</p>
            <Ellipsis size={28} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 42 }}>
            <div style={{ width: 326, height: 326, borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}>
              <img src={activeArtwork} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <h1 style={{ ...commonText, fontSize: 24, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
              <p style={{ ...commonText, fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artist}</p>
            </div>
            <Heart size={26} color="rgba(255,255,255,0.4)" fill="none" />
          </div>
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, position: 'relative', marginBottom: 10 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progress}%`, background: '#fff', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>{currentTime}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>-{duration}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <SkipBack size={42} fill="#fff" strokeWidth={0} />
            <Play size={68} fill="#fff" strokeWidth={0} />
            <SkipForward size={42} fill="#fff" strokeWidth={0} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <Shuffle size={20} color="rgba(255,255,255,0.3)" />
            <Airplay size={20} color="rgba(255,255,255,0.3)" />
            <Repeat size={20} color="rgba(255,255,255,0.3)" />
          </div>
          {watermark && <p style={{ ...commonText, textAlign: 'right', color: 'rgba(255,255,255,0.15)', fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', position: 'absolute', bottom: 20, right: 32 }}>LyricSnap.app</p>}
        </div>
      )}
    </div>
  );
};
