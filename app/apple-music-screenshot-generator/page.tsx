import { Metadata } from 'next';
import Home from '../page';

export const metadata: Metadata = {
  title: 'Apple Music Screenshot Generator - Create Lyric Snaps Online',
  description: 'Generate aesthetically accurate Apple Music style screenshots for Instagram, TikTok, and WhatsApp. No sign-up required for your first snap.',
  keywords: [
    'apple music screenshot generator',
    'lyric snap creator',
    'fake apple music player',
    'music post generator',
    'now playing screenshot'
  ],
  openGraph: {
    title: 'Apple Music Screenshot Generator',
    description: 'Transform any song into a beautiful Apple Music style post.',
    type: 'website',
  }
};

export default function AppleMusicSEO() {
  return <Home />;
}
