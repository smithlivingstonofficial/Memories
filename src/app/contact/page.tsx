import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalPages } from "@/components/legal/legal-content";

export const metadata: Metadata = {
  title: "Contact | Memories",
  description: legalPages.contact.description,
};

export default function ContactPage() {
  return <LegalPage pageId="contact" />;
}

