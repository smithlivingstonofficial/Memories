import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "Disclaimer | Memories",
  description: legalPages.disclaimer.description,
};

export default function DisclaimerPage() {
  return <LegalPage pageId="disclaimer" />;
}

