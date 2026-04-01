import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/render/"],
    },
    sitemap: "https://lyricsnap.app/sitemap.xml",
  };
}
