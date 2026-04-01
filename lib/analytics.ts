import { track } from '@vercel/analytics';

/**
 * Custom analytics events for LyricSnap
 */
export const analytics = {
  /**
   * Track when a user searches for a song
   */
  trackSearch: (query: string, resultsCount: number) => {
    track('search_song', {
      query,
      results_count: resultsCount,
    });
  },

  /**
   * Track when a user selects a song from the results
   */
  trackSelectSong: (title: string, artist: string) => {
    track('select_song', {
      title,
      artist,
    });
  },

  /**
   * Track when a user clicks the generate button
   */
  trackGenerateStart: (title: string, artist: string) => {
    track('generate_screenshot_start', {
      title,
      artist,
    });
  },

  /**
   * Track when a screenshot is successfully downloaded
   */
  trackDownloadComplete: (title: string, artist: string) => {
    track('download_complete', {
      title,
      artist,
    });
  },

  /**
   * Track errors in generation
   */
  trackError: (errorType: string, message: string) => {
    track('error', {
      type: errorType,
      message,
    });
  },
};
