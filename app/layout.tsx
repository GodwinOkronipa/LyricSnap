import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "LyricSnap | Apple Music Screenshot Generator",
    template: "%s | LyricSnap",
  },
  description: "Create stunning, shareable music screenshots for Instagram and TikTok in seconds. Inspired by Apple Music's premium aesthetic. Fast, high-res, and free.",
  keywords: ["apple music screenshot generator", "fake music player generator", "song cover post generator", "music UI screenshot", "now playing card maker"],
  authors: [{ name: "LyricSnap Team" }],
  creator: "LyricSnap",
  publisher: "LyricSnap",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "LyricSnap | Apple Music Screenshot Generator",
    description: "Generate beautiful music player screenshots for social media.",
    url: "https://lyricsnap.app",
    siteName: "LyricSnap",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LyricSnap Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LyricSnap | Apple Music Screenshot Generator",
    description: "Generate beautiful music player screenshots for social media.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${instrumentSerif.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
