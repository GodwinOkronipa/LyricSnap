export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  previewUrl: string;
}

export async function searchSongs(query: string): Promise<Song[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`;
  const response = await fetch(url);
  const data = await response.json();

  return data.results.map((item: any) => ({
    id: item.trackId,
    title: item.trackName,
    artist: item.artistName,
    album: item.collectionName,
    artwork: item.artworkUrl100.replace('100x100bb.jpg', '1024x1024bb.jpg'), // High-res
    previewUrl: item.previewUrl,
  }));
}
