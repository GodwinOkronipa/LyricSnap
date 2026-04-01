import { Metadata } from 'next';
import Home from '../page';

export const metadata: Metadata = {
  title: 'TikTok Music Player Generator - Aesthetic Song Posts',
  description: 'Create viral music player posts for TikTok. Trending song UI, customizable background blur, and high-res exports.',
  keywords: [
    'tiktok music player generator',
    'instagram music story creator',
    'trending song card',
    'tiktok lyrics generator'
  ]
};

export default function TikTokSEO() {
  return <Home />;
}
