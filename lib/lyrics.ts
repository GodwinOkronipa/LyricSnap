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
  const url = new URL('https://lrclib.net/api/get');
  url.searchParams.set('artist_name', artist);
  url.searchParams.set('track_name', title);
  if (duration) url.searchParams.set('duration', Math.round(duration).toString());

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      // Try search if direct get fails
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${artist}`)}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      if (searchData && searchData.length > 0) {
        return searchData[0].plainLyrics?.split('\n').filter((l: string) => l.trim().length > 0) || null;
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
