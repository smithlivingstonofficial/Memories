import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy | Memories",
  description: legalPages.privacy.description,
};

export default function PrivacyPage() {
  return <LegalPage pageId="privacy" />;
}

