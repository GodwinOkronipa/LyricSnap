export interface LyricsResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string;
  syncedLyrics: string;
}

export async function fetchLyrics(title: string, artist: string, duration?: number): Promise<string[] | null> {
  // Clean title and artist for better matching
  const cleanTitle = title.replace(/\(feat\..*?\)|-.*?(Remaster|Single|Edit|Version).*$/gi, '').trim();
  const cleanArtist = artist.replace(/\(feat\..*?\)/gi, '').trim();

  const url = new URL('https://lrclib.net/api/get');
  url.searchParams.set('artist_name', cleanArtist);
  url.searchParams.set('track_name', cleanTitle);
  if (duration) url.searchParams.set('duration', Math.round(duration).toString());

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      // Direct get failed (common for newer or less popular tracks), try search now
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}`;
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) return null;
      
      const searchData = await searchResponse.json();
      if (searchData && Array.isArray(searchData) && searchData.length > 0) {
        // Try to find the first one with lyrics
        const bestMatch = searchData.find(item => item.plainLyrics);
        if (bestMatch) {
          return bestMatch.plainLyrics.split('\n').filter((l: string) => l.trim().length > 0);
        }
      }
      return null;
    }

    const data: LyricsResponse = await response.json();
    return data.plainLyrics?.split('\n').filter((l: string) => l.trim().length > 0) || null;
  } catch (error) {
    console.error('Failed to fetch lyrics:', error);
    return null;
  }
}

