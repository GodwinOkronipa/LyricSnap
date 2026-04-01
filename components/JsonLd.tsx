import React from 'react';

interface JsonLdProps {
  data: any;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

export const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "LyricSnap",
  "url": "https://lyricsnap.app",
  "description": "Create stunning, shareable music screenshots for Instagram and TikTok in seconds.",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "featureList": [
    "Apple Music style player cards",
    "High-resolution PNG exports",
    "Customizable song and artist metadata",
    "Social media optimized layouts"
  ]
};

export const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to generate a music player screenshot",
  "description": "Create a beautiful music player screenshot for your favorite song in 3 easy steps.",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Search for a song",
      "text": "Use the search bar on LyricSnap to find your favorite song or artist via the iTunes API."
    },
    {
      "@type": "HowToStep",
      "name": "Preview the UI",
      "text": "Select the song from the search results to see a live preview of the Apple Music style player card."
    },
    {
      "@type": "HowToStep",
      "name": "Generate and Download",
      "text": "Click the 'Generate Screenshot' button to create a high-quality PNG image ready for social sharing."
    }
  ]
};
