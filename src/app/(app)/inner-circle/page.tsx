import { Users } from "lucide-react";
import { ComingSoonScreen } from "@/components/layout/coming-soon-screen";

export const unstable_instant = {
  prefetch: "static",
};

export default function InnerCirclePage() {
  return (
    <ComingSoonScreen
      eyebrow="Inner Circle"
      title="Trusted sharing is getting its own careful space."
      description="Inner Circle will let people share selected memories with the few people they trust most, without making every private moment social by default."
      icon={<Users size={26} />}
      primaryHref="/discover"
      primaryLabel="Find people"
      points={[
        "Build a private trusted list from accepted followers.",
        "Share memories only with selected close people.",
        "Keep clear controls for who can see each memory.",
      ]}
    />
  );
}
