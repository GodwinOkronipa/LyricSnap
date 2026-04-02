import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/render/"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://lyricsnap.app'}/sitemap.xml`,
  };
}
