import { Metadata } from 'next';
import { searchSongs, Song } from '@/lib/itunes';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';

// Import the client component dynamically to enable hydration in the studio
const LyricSnapClient = dynamic(() => import('@/app/LyricSnapClient'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center font-sans">
      <div className="w-12 h-12 border-2 border-white/10 border-t-pink-500 rounded-full animate-spin mb-4" />
      <p className="text-sm font-bold uppercase tracking-[0.3em] opacity-30 text-center">Opening Studio...</p>
    </div>
  )
});

interface Props {
  params: Promise<{
    artist: string;
    title: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { artist, title } = await params;
  
  if (!artist || !title) return { title: 'LyricSnap' };

  const decodeArtist = decodeURIComponent(artist).replace(/-/g, ' ');
  const decodeTitle = decodeURIComponent(title).replace(/-/g, ' ');
  
  try {
    const results = await searchSongs(`${decodeTitle} ${decodeArtist}`);
    const song = results[0] || null;

    const pageTitle = song 
      ? `Create ${song.title} by ${song.artist} Lyric Snapshot | LyricSnap`
      : `Create ${decodeTitle} by ${decodeArtist} Lyric Snapshot | LyricSnap`;

    const pageDesc = song
      ? `Generate a beautiful Apple Music style screenshot for "${song.title}" by ${song.artist}. Perfect for Instagram, TikTok and Reels.`
      : `Create stunning music player screenshots for any song. Inspired by Apple Music's premium aesthetic.`;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lyricssnap.vercel.app';

    return {
      title: pageTitle,
      description: pageDesc,
      alternates: {
        canonical: `${baseUrl}/song/${artist}/${title}`,
      },
      openGraph: {
        title: pageTitle,
        description: pageDesc,
        images: song ? [{ url: song.artwork }] : ['/og-image.png'],
      }
    };
  } catch (e) {
    return { title: 'LyricSnap' };
  }
}

export default async function SongPage({ params }: Props) {
  const { artist, title } = await params;
  
  if (!artist || !title) notFound();

  const decodeArtist = decodeURIComponent(artist).replace(/-/g, ' ');
  const decodeTitle = decodeURIComponent(title).replace(/-/g, ' ');
  
  try {
    const results = await searchSongs(`${decodeTitle} ${decodeArtist}`);
    const song = results[0] || null;

    return <LyricSnapClient initialSong={song} />;
  } catch (e) {
    console.error('Loader Error:', e);
    notFound();
  }
}
