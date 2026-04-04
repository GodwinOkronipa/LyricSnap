import React from 'react';
import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Airplay, Heart, Ellipsis, ChevronDown } from 'lucide-react';

interface MusicPlayerProps {
  title: string;
  artist: string;
  album: string;
  artwork: string;
  lyrics?: string[];
  progress?: number; // 0-100
  duration?: string;
  currentTime?: string;
  watermark?: boolean;
  blurAmount?: number;
  vignette?: number;
  template?: 'classic' | 'modern';
}

/**
 * Pixel-accurate Apple Music "Now Playing" screen recreation.
 *
 * Dimensions: 390 × 844 px — matches iPhone 15 logical resolution.
 * All sizing uses fixed px values (not Tailwind responsive) so that
 * html-to-image at 3× pixel-ratio produces a crisp 1170×2532px export.
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
  template = 'classic',
}) => {
  const isLyricMode = lyrics.length > 0;

  // ─── Shared background blur layer ───────────────────────────────────────
  const Background = () => (
    <>
      {/* Deeply blurred artwork fill */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${artwork})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: `blur(${blurAmount}px) saturate(1.8) brightness(0.55)`,
          transform: 'scale(1.15)',
          zIndex: 0,
        }}
      />
      {/* Dark vignette overlay for readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            to bottom,
            rgba(0,0,0,${vignette * 0.004}) 0%,
            rgba(0,0,0,${vignette * 0.003}) 40%,
            rgba(0,0,0,${vignette * 0.006}) 100%
          )`,
          zIndex: 1,
        }}
      />
    </>
  );

  // ─── LYRIC MODE ──────────────────────────────────────────────────────────
  if (isLyricMode) {
    return (
      <div
        id="screenshot-target"
        style={{
          position: 'relative',
          width: 390,
          height: 844,
          overflow: 'hidden',
          background: '#000',
          fontFamily:
            '-apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <Background />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '60px 32px 48px',
          }}
        >
          {/* Top: mini artwork + song info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 48,
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
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p
                style={{
                  color: 'rgba(255,255,255,0.95)',
                  fontSize: 15,
                  fontWeight: 600,
                  margin: 0,
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
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 14,
                  fontWeight: 400,
                  margin: '2px 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {artist}
              </p>
            </div>
          </div>

          {/* Lyrics */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            {lyrics.map((line, i) => (
              <p
                key={i}
                style={{
                  color: i === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.38)',
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

          {/* LyricSnap branding at bottom */}
          {watermark && (
            <p
              style={{
                color: 'rgba(255,255,255,0.25)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                textAlign: 'right',
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

  // ─── PLAYER MODE (Apple Music Now Playing) ───────────────────────────────
  return (
    <div
      id="screenshot-target"
      style={{
        position: 'relative',
        width: 390,
        height: 844,
        overflow: 'hidden',
        background: '#000',
        fontFamily:
          '-apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <Background />

      {/* Safe area + content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '56px 28px 44px',
        }}
      >
        {/* ── Top bar: mini player header ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 36,
          }}
        >
          <ChevronDown
            size={28}
            color="rgba(255,255,255,0.9)"
            strokeWidth={2.5}
          />
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Playing Next
            </p>
          </div>
          <Ellipsis
            size={28}
            color="rgba(255,255,255,0.9)"
            strokeWidth={2.5}
          />
        </div>

        {/* ── Album Artwork ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 320,
              height: 320,
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 28px 72px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.4)',
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

        {/* ── Song info + heart ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div style={{ flex: 1, overflow: 'hidden', paddingRight: 16 }}>
            <p
              style={{
                color: 'rgba(255,255,255,0.95)',
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
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
                color: 'rgba(255,255,255,0.5)',
                fontSize: 18,
                fontWeight: 500,
                margin: '3px 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.2px',
              }}
            >
              {artist}
            </p>
          </div>
          <Heart
            size={26}
            color="rgba(255,255,255,0.45)"
            strokeWidth={2}
            fill="none"
          />
        </div>

        {/* ── Progress Bar ── */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 4,
              background: 'rgba(255,255,255,0.25)',
              borderRadius: 2,
            }}
          >
            {/* Filled portion */}
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
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
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
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {currentTime}
            </span>
            <span
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              -{duration}
            </span>
          </div>
        </div>

        {/* ── Playback Controls ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 12,
            marginBottom: 28,
            paddingLeft: 4,
            paddingRight: 4,
          }}
        >
          <SkipBack
            size={40}
            color="rgba(255,255,255,0.9)"
            fill="rgba(255,255,255,0.9)"
            strokeWidth={0}
          />
          <div
            style={{
              width: 78,
              height: 78,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.0)',
            }}
          >
            <Play
              size={62}
              color="rgba(255,255,255,0.95)"
              fill="rgba(255,255,255,0.95)"
              strokeWidth={0}
              style={{ marginLeft: 5 }}
            />
          </div>
          <SkipForward
            size={40}
            color="rgba(255,255,255,0.9)"
            fill="rgba(255,255,255,0.9)"
            strokeWidth={0}
          />
        </div>

        {/* ── Bottom controls: volume / airplay / shuffle / repeat ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            paddingLeft: 2,
            paddingRight: 2,
          }}
        >
          <Shuffle
            size={22}
            color="rgba(255,255,255,0.45)"
            strokeWidth={2}
          />
          <Airplay
            size={22}
            color="rgba(255,255,255,0.45)"
            strokeWidth={2}
          />
          <Repeat
            size={22}
            color="rgba(255,255,255,0.45)"
            strokeWidth={2}
          />
        </div>

        {/* Watermark */}
        {watermark && (
          <p
            style={{
              position: 'absolute',
              bottom: 20,
              right: 28,
              color: 'rgba(255,255,255,0.2)',
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
