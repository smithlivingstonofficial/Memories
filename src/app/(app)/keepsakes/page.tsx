import { Bookmark } from "lucide-react";
import { ComingSoonScreen } from "@/components/layout/coming-soon-screen";

export const unstable_instant = {
  prefetch: "static",
};

export default function KeepsakesPage() {
  return (
    <ComingSoonScreen
      eyebrow="Keepsakes"
      title="Saved memories will have a calmer home here."
      description="Keepsakes will collect the memories you intentionally save, so favorite moments do not get lost inside the feed, diary, or Vault."
      icon={<Bookmark size={26} />}
      primaryHref="/home"
      primaryLabel="Browse memories"
      points={[
        "Save important memories from cards and detail pages.",
        "Review personal highlights without changing privacy.",
        "Organize meaningful moments separately from daily writing.",
      ]}
    />
  );
}
