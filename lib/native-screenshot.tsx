import React from 'react';
import satori from 'satori';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Load font for Satori
async function loadFont() {
  const fonts = [
    {
      name: 'sans-serif',
      data: fs.readFileSync(path.join(process.cwd(), 'node_modules', 'satori', 'dist', 'fonts', 'noto-sans-v21-latin-regular.ttf')),
      weight: 400 as any,
      style: 'normal',
    },
    {
      name: 'sans-serif',
      data: fs.readFileSync(path.join(process.cwd(), 'node_modules', 'satori', 'dist', 'fonts', 'noto-sans-v21-latin-700.ttf')),
      weight: 700 as any,
      style: 'normal',
    },
  ];

  return fonts;
}

interface MusicPlayerProps {
  title: string;
  artist: string;
  artwork: string;
  watermark: boolean;
  blur: number;
  vignette: number;
  template: 'classic' | 'modern';
  lyrics?: any[];
}

export async function generateMusicPlayerImage(props: MusicPlayerProps): Promise<Buffer> {
  const { title, artist, artwork, watermark, blur, vignette, template, lyrics } = props;

  // Create JSX for the music player
  const jsx = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '800px',
        height: '800px',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Background with artwork */}
      {artwork && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${artwork})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${blur}px) brightness(0.5)`,
            zIndex: 1,
          }}
        />
      )}

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,${vignette / 100}) 100%)`,
          zIndex: 2,
        }}
      />

      {/* Main content container */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '40px',
          boxSizing: 'border-box',
        }}
      >
        {/* Artwork circle */}
        {artwork && (
          <div
            style={{
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              backgroundImage: `url(${artwork})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              marginBottom: '40px',
              border: '4px solid rgba(255, 255, 255, 0.1)',
            }}
          />
        )}

        {/* Title */}
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            margin: '0 0 16px 0',
            maxWidth: '600px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h1>

        {/* Artist */}
        <p
          style={{
            fontSize: '28px',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            margin: '0 0 30px 0',
            maxWidth: '600px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {artist}
        </p>

        {/* Watermark */}
        {watermark && (
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            LyricSnap.io
          </div>
        )}

        {/* Play button indicator */}
        <div
          style={{
            marginTop: '40px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <div
            style={{
              width: '0',
              height: '0',
              borderLeft: '20px solid rgba(255, 255, 255, 0.6)',
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              marginLeft: '4px',
            }}
          />
        </div>
      </div>
    </div>
  );

  try {
    // Convert JSX to SVG
    const fonts = await loadFont();
    const svg = await satori(jsx, {
      width: 800,
      height: 800,
      fonts: fonts as any,
    });

    // Convert SVG to PNG using Sharp (Vercel-compatible, no native binding issues)
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    
    return pngBuffer;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

