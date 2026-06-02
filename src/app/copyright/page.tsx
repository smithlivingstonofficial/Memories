import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "Copyright and IP Policy | Memories",
  description: legalPages.copyright.description,
};

export default function CopyrightPage() {
  return <LegalPage pageId="copyright" />;
}

