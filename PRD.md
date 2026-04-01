# 🎧 Music UI Screenshot Generator — PRD

## 1. Overview

A web-based tool that allows users to generate high-quality, shareable music player screenshots inspired by Apple Music UI. it shld have * Social network features

Users can search or paste a song, customize the UI, and export a clean image for social media. for SEO lean heavily on  "Aple music screenshots" teh goal is to allow anyone generate lyric screenshot of song

---

## 2. Objectives

### Primary Goals

* Generate aesthetically accurate music UI screenshots in <10 seconds
* Achieve viral growth via social sharing (Instagram, TikTok)
* Rank on SEO keywords like:

  * "Apple Music screenshot generator"
  * "fake music player generator"
  * "song cover post generator"

### Secondary Goals

* Monetize via premium exports and templates
* Build a reusable content engine for creators

---

## 3. Target Users

### 1. Casual Users

* Want to post songs on WhatsApp/Instagram
* Low friction, no signup initially

### 2. Influencers / Creators

* Need aesthetic, branded posts
* Willing to pay for quality + customization

---

## 4. Core Features

## 4.1 MVP (V1 — Launch Fast)

### Input

* Search song (via iTunes API)
* Paste song link

### UI Generation

* Apple Music–style player card:

  * Album art
  * Song title
  * Artist name
  * Progress bar
  * Background blur

### Export

* Download image (PNG)
* Watermark applied (free users)

---

## 4.2 V2 Features

* Remove watermark (paid)
* Multiple templates (dark mode, minimal, gradient)
* Adjustable progress bar
* Custom background colors

---

## 4.3 V3 Features

* User accounts
* Save past designs
* Batch generation
* Creator presets
* Analytics (views/downloads)

---

## 5. Technical Architecture

## 5.1 Stack

* Frontend: Next.js (App Router)
* Styling: Tailwind CSS
* Backend: Next.js API routes
* Image Engine: Puppeteer (server-side rendering)
* Database: PostgreSQL (Supabase/Neon)
* Auth: Supabase Auth
* Storage: Supabase Storage / S3
* Payments: Paystack

---

## 5.2 System Flow

1. User inputs song
2. Backend fetches metadata (iTunes API)
3. UI component renders HTML
4. Puppeteer loads page and screenshots component
5. Image returned to user
6. Optional: stored in DB + storage

---

## 5.3 Image Generation (Puppeteer)

* Dedicated route:
  `/api/generate`

Flow:

* Render hidden page with UI component
* Inject song data via query params
* Puppeteer loads page
* Capture screenshot
* Return buffer

Performance considerations:

* Use headless Chrome
* Cache fonts + assets
* Optimize image size (target <500KB)

---

## 5.4 Database Schema

### Users

* id
* email
* plan (free / pro)
* created_at

### Generations

* id
* user_id (nullable)
* song_title
* artist
* image_url
* created_at

---

## 6. UX Principles

* 3-step flow:

  1. Search song
  2. Preview UI
  3. Download

* Time to result: <10 seconds

* No login required for first use

* Clean, minimal interface

---

## 7. Branding Direction

### Positioning

* Not a clone — a “music aesthetic tool”

### Tone

* Minimal
* Premium
* Creator-first

### Name Ideas

* Playframe
* SongCard
* Trackly
* NowPlaying Studio
* VibeFrame

---

## 8. Monetization Strategy

### Free Tier

* Watermarked images
* Limited templates

### Paid Tier (₵5–₵15 range)

* No watermark
* HD export
* More templates

### Future

* Subscription for creators
* Bulk generation credits

---

## 9. Growth Strategy

## 9.1 Instagram Strategy

Content types:

* “Guess the song” posts
* Emotional quote + song UI
* Trending songs as visuals
* Before/after aesthetic edits

CTA:

* “Generate yours → link in bio”

---

## 9.2 SEO Strategy

Landing pages:

* /apple-music-screenshot-generator
* /fake-music-player-generator
* /spotify-style-generator (future)

Content:

* Blog posts targeting keywords
* Programmatic SEO (song pages)

---

## 10. Risks

### Legal Risk

* Avoid Apple branding/logos
* Use “inspired UI” not exact replication

### Technical Risk

* Puppeteer cost scaling
* Rendering latency

### Market Risk

* Low differentiation if UI is weak

---

## 11. Success Metrics

### Early (0–30 days)

* 1,000+ users
* 20% share rate
* <10s generation time

### Growth (30–90 days)

* 10k+ monthly users
* 5–10% conversion to paid

---

## 12. Build Plan (Execution)

### Week 1

* UI component
* Song API integration
* Puppeteer endpoint

### Week 2

* Export + download
* Basic landing page
* Launch on Instagram

### Week 3

* Paystack integration
* Remove watermark feature

---

## 13. Non-Goals (for now)

* Mobile app
* Complex editing tools

---

## 14. Key Principle

If the product is not:

* Fast
* Beautiful
* Shareable

It will not grow.

---
Website Structure & Copy
The website (landing/marketing site) should be clear and persuasive. Suggested structure:
Hero Section:
Tagline: e.g. “Create Stunning Music Screenshots for Instagram & TikTok.”
Subtext: “Paste a song link, pick a style, and generate a shareable music player image in seconds.”
Call-to-Action: “Try it Free” or “Get Started”.
Background image or video loop of examples (optional).
How It Works: 3–4 step illustration (Search → Customize → Generate → Share).
Features: Bullet-list or icons (e.g. “Apple-style UI, Light/Dark themes, High-Res Downloads”).
Example Gallery: Mockups of finished cards with various songs.
Pricing Teaser: A summary of plans, linking to the Pricing page.
Testimonials/Press (optional): If available, quotes or logos.
Footer: Links (Pricing, FAQ, Contact, Terms/Privacy).
Sample Copy Fragments:
Headline: “Your Music, Your Style. Generate beautiful Now-Playing cards for any song.”
Benefit line: “Boost engagement by sharing eye-catching music screenshots on social media.”
Feature line: “Works with Apple Music & Spotify links; no app download required.”
CTA: “Paste your song link to try it out!”
Legal/FAQ: e.g. “Are these official? No – [Brand] is an independent tool. No copyrighted content is used without permission.”