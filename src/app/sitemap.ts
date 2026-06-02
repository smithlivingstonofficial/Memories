import type { MetadataRoute } from "next";
import { publicSiteLinks } from "@/components/legal/legal-content";
import { getPublicSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getPublicSiteUrl();
  const lastModified = new Date("2026-06-02T00:00:00.000Z");

  return publicSiteLinks.map((link) => ({
    url: `${siteUrl}${link.href}`,
    lastModified,
    changeFrequency: "monthly",
    priority: link.href === "/" ? 1 : 0.7,
  }));
}

