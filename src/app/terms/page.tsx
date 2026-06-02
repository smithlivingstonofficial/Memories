import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "Terms of Service | Memories",
  description: legalPages.terms.description,
};

export default function TermsPage() {
  return <LegalPage pageId="terms" />;
}

