import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/login",
        "/signup",
        "/privacy",
        "/terms",
        "/disclaimer",
        "/copyright",
        "/contact",
        "/sitemap",
      ],
      disallow: [
        "/api/",
        "/auth/",
        "/calendar/",
        "/complete-profile/",
        "/create/",
        "/dashboard/",
        "/diary/",
        "/discover/",
        "/home/",
        "/inner-circle/",
        "/keepsakes/",
        "/memory/",
        "/messages/",
        "/moments/",
        "/on-this-day/",
        "/profile/",
        "/requests/",
        "/settings/",
        "/timeline/",
        "/u/",
        "/vault/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

