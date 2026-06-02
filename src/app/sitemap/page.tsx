import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "Sitemap | Memories",
  description: legalPages.sitemap.description,
};

export default function SitemapPage() {
  return <LegalPage pageId="sitemap" />;
}

