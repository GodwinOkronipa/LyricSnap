import React from 'react';
import { Shuffle, SkipBack, Play, SkipForward, Repeat, Airplay, Heart, Ellipsis, ChevronDown } from 'lucide-react';

interface MusicPlayerProps {
  title: string;
  artist: string;
  album: string;
  artwork: string;
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
 * All styles are explicit inline — no inheritance from page CSS.
 */
export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  title,
  artist,
  album,
  artwork,
  lyrics = [],
  progress = 32,
  duration = '3:45',
  currentTime = '1:12',
  watermark = false,
  blurAmount = 60,
  vignette = 55,
}) => {
  const isLyricMode = lyrics.length > 0;

  // Shared root styles — MUST include textAlign: left so page CSS can't bleed in
  const rootStyle: React.CSSProperties = {
    position: 'relative',
    width: 390,
    height: 844,
    overflow: 'hidden',
    background: '#000',
    fontFamily: '-apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased',
    textAlign: 'left',   // ← explicit: prevents page-level centering from bleeding in
    color: '#fff',
    boxSizing: 'border-box',
  };

  // Blurred background — inlined directly (not a sub-component) so html-to-image
  // captures it in the same render pass
  const bgBlur: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${artwork})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: `blur(${blurAmount}px) saturate(2) brightness(0.5)`,
    transform: 'scale(1.2)',   // overshoot to hide blur edges
    zIndex: 0,
  };

  const bgVignette: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(to bottom,
      rgba(0,0,0,${(vignette * 0.4) / 100}) 0%,
      rgba(0,0,0,${(vignette * 0.3) / 100}) 40%,
      rgba(0,0,0,${(vignette * 0.6) / 100}) 100%)`,
    zIndex: 1,
  };

  // ─── LYRIC MODE ──────────────────────────────────────────────────────────
  if (isLyricMode) {
    return (
      <div id="screenshot-target" style={rootStyle}>
        <div style={bgBlur} />
        <div style={bgVignette} />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '60px 32px 48px',
            boxSizing: 'border-box',
          }}
        >
          {/* Mini header: artwork + song name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 56,
            }}
          >
            <img
              src={artwork}
              alt={album}
              style={{
                width: 52,
                height: 52,
                borderRadius: 8,
                objectFit: 'cover',
                flexShrink: 0,
                display: 'block',
              }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p
                style={{
                  textAlign: 'left',
                  color: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  fontWeight: 600,
                  margin: 0,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.2px',
                }}
              >
                {title}
              </p>
              <p
                style={{
                  textAlign: 'left',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                  fontWeight: 400,
                  margin: '3px 0 0',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {artist}
              </p>
            </div>
          </div>

          {/* Lyric lines */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            {lyrics.map((line, i) => (
              <p
                key={i}
                style={{
                  textAlign: 'left',
                  color: i === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
                  fontSize: i === 0 ? 34 : 28,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  margin: 0,
                  letterSpacing: '-0.5px',
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {watermark && (
            <p
              style={{
                textAlign: 'right',
                color: 'rgba(255,255,255,0.2)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                margin: '24px 0 0',
              }}
            >
              LyricSnap.app
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── PLAYER MODE ─────────────────────────────────────────────────────────
  return (
    <div id="screenshot-target" style={rootStyle}>
      <div style={bgBlur} />
      <div style={bgVignette} />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '56px 28px 44px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Header bar ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <ChevronDown size={28} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />

          <p
            style={{
              textAlign: 'center',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Now Playing
          </p>

          <Ellipsis size={28} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
        </div>

        {/* ── Album artwork ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 320,
              height: 320,
              borderRadius: 18,
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <img
              src={artwork}
              alt={album}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>

        {/* ── Song title + artist + heart ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <div style={{ flex: 1, overflow: 'hidden', paddingRight: 16 }}>
            <p
              style={{
                textAlign: 'left',
                color: 'rgba(255,255,255,0.95)',
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.4px',
              }}
            >
              {title}
            </p>
            <p
              style={{
                textAlign: 'left',
                color: 'rgba(255,255,255,0.48)',
                fontSize: 18,
                fontWeight: 500,
                margin: '4px 0 0',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.2px',
              }}
            >
              {artist}
            </p>
          </div>
          <Heart size={26} color="rgba(255,255,255,0.4)" strokeWidth={2} fill="none" />
        </div>

        {/* ── Progress bar ── */}
        <div style={{ marginBottom: 6 }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 4,
              background: 'rgba(255,255,255,0.22)',
              borderRadius: 2,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${progress}%`,
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 2,
              }}
            />
            {/* Scrubber dot */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${progress}%`,
                transform: 'translate(-50%, -50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#fff',
              }}
            />
          </div>

          {/* Timestamps */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 10,
            }}
          >
            <span
              style={{
                textAlign: 'left',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 12,
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {currentTime}
            </span>
            <span
              style={{
                textAlign: 'right',
                color: 'rgba(255,255,255,0.45)',
                fontSize: 12,
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              -{duration}
            </span>
          </div>
        </div>

        {/* ── Playback controls ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            marginBottom: 24,
          }}
        >
          <SkipBack
            size={42}
            color="rgba(255,255,255,0.9)"
            fill="rgba(255,255,255,0.9)"
            strokeWidth={0}
          />
          <Play
            size={68}
            color="rgba(255,255,255,0.95)"
            fill="rgba(255,255,255,0.95)"
            strokeWidth={0}
            style={{ marginLeft: 4 }}
          />
          <SkipForward
            size={42}
            color="rgba(255,255,255,0.9)"
            fill="rgba(255,255,255,0.9)"
            strokeWidth={0}
          />
        </div>

        {/* ── Bottom bar: shuffle / airplay / repeat ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
          }}
        >
          <Shuffle size={22} color="rgba(255,255,255,0.4)" strokeWidth={2} />
          <Airplay size={22} color="rgba(255,255,255,0.4)" strokeWidth={2} />
          <Repeat size={22} color="rgba(255,255,255,0.4)" strokeWidth={2} />
        </div>

        {watermark && (
          <p
            style={{
              position: 'absolute',
              bottom: 20,
              right: 28,
              textAlign: 'right',
              color: 'rgba(255,255,255,0.18)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            LyricSnap.app
          </p>
        )}
      </div>
    </div>
  );
};
