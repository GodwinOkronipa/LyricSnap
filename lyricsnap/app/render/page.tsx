'use client';

import { useSearchParams } from 'next/navigation';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Suspense } from 'react';

function RenderContent() {
  const searchParams = useSearchParams();
  const title = searchParams.get('title') || 'Song Title';
  const artist = searchParams.get('artist') || 'Artist Name';
  const album = searchParams.get('album') || 'Album';
  const artwork = searchParams.get('artwork') || '';
  const lyricsParam = searchParams.get('lyrics');
  const watermark = searchParams.get('watermark') === 'true';
  const lyrics = lyricsParam ? JSON.parse(decodeURIComponent(lyricsParam)) : [];

  return (
    <div className="flex justify-center items-center h-screen bg-black overflow-hidden">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <MusicPlayer 
        title={title}
        artist={artist}
        album={album}
        artwork={artwork}
        lyrics={lyrics}
        watermark={watermark}
      />
    </div>
  );
}

export default function RenderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RenderContent />
    </Suspense>
  );
}
