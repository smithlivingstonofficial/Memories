export const LEGAL_LAST_UPDATED = "June 2, 2026";

export type LegalPageId =
  | "privacy"
  | "terms"
  | "disclaimer"
  | "copyright"
  | "contact"
  | "sitemap";

export type LegalSection = {
  heading: string;
  body?: string[];
  bullets?: string[];
};

export type LegalPageContent = {
  id: LegalPageId;
  title: string;
  description: string;
  eyebrow: string;
  sections: LegalSection[];
};

export const publicSiteLinks = [
  { label: "Home", href: "/" },
  { label: "Login", href: "/login" },
  { label: "Sign up", href: "/signup" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
  { label: "Copyright", href: "/copyright" },
  { label: "Contact", href: "/contact" },
  { label: "Sitemap", href: "/sitemap" },
] as const;

export const legalNavLinks = [
  { id: "privacy", label: "Privacy", href: "/privacy" },
  { id: "terms", label: "Terms", href: "/terms" },
  { id: "disclaimer", label: "Disclaimer", href: "/disclaimer" },
  { id: "copyright", label: "Copyright", href: "/copyright" },
  { id: "contact", label: "Contact", href: "/contact" },
  { id: "sitemap", label: "Sitemap", href: "/sitemap" },
] as const;

export const legalPages: Record<LegalPageId, LegalPageContent> = {
  privacy: {
    id: "privacy",
    title: "Privacy Policy",
    description:
      "How Memories collects, uses, protects, and shares information in a private-first diary and social memory app.",
    eyebrow: "Private-first by default",
    sections: [
      {
        heading: "Who we are",
        body: [
          "Memories is operated by [Legal Entity Name], located at [Business Address]. This policy explains how Memories handles information when you create an account, write diary entries, save memories, upload media, message other users, or use social features.",
          "This policy is a launch-ready draft and should be reviewed by a qualified legal professional before public release.",
        ],
      },
      {
        heading: "Information we collect",
        body: [
          "We collect information you provide directly and information needed to operate the service.",
        ],
        bullets: [
          "Account information, including Google authentication details, email address, username, full name, password status, signup method, and profile completion status.",
          "Profile information, including mobile country code, mobile number, date of birth, bio, avatar, cover image, account visibility, and search visibility settings.",
          "User content, including diary entries, memories, Vault entries, moments, captions, moods, locations you choose to save, tags, uploaded media, messages, reflections, likes, follows, requests, inner-circle relationships, and moment views.",
          "Technical and operational information, including authentication/session data, upload metadata, storage object keys, timestamps, security logs, error records, device/browser information, and other records needed to keep the service reliable and secure.",
        ],
      },
      {
        heading: "Private by default",
        body: [
          "Memories is designed so diary, memory, and Vault content is private by default unless you choose a different visibility setting. Public sharing, friends visibility, inner-circle visibility, and profile discoverability are user-controlled choices.",
          "If you choose to make content public or visible to another audience, that content may be viewed by people in the selected audience and may be copied or reshared outside Memories by those viewers.",
        ],
      },
      {
        heading: "How we use information",
        bullets: [
          "To create and secure your account.",
          "To save, display, organize, sync, and retrieve your memories, diary entries, media, messages, and settings.",
          "To provide privacy controls, social features, follow requests, inner-circle sharing, and notifications or status indicators.",
          "To prevent abuse, debug issues, maintain service reliability, and enforce our Terms.",
          "To respond to support, privacy, security, or legal requests.",
        ],
      },
      {
        heading: "How we protect information",
        body: [
          "We use Supabase authentication, database row-level security policies, access controls, and private storage or signed access patterns where applicable. These measures are intended to limit access based on the privacy choices you make and the permissions attached to your account.",
          "No online service can guarantee absolute security. You are responsible for keeping your login credentials secure and for choosing sharing settings carefully.",
        ],
      },
      {
        heading: "Sharing and disclosure",
        body: [
          "We do not sell personal data and we do not use private diary, memory, Vault, or message content for advertising.",
        ],
        bullets: [
          "We share content with other users only according to the visibility settings and social features you choose.",
          "We use service providers such as authentication, database, storage, hosting, and infrastructure providers to operate Memories.",
          "We may disclose information if required by law, to protect rights and safety, or to investigate abuse or security issues.",
        ],
      },
      {
        heading: "Your choices",
        bullets: [
          "You can choose privacy settings for memories and moments.",
          "You can update profile visibility and searchability where the app provides those controls.",
          "You can delete memories, moments, reflections, media, and account-related content where available in the app.",
          "You can contact [Privacy Email] for privacy requests, questions, or account data concerns.",
        ],
      },
      {
        heading: "Children and eligibility",
        body: [
          "Memories is not intended for children under the minimum age required by applicable law. If you believe a child has provided information without proper consent, contact [Privacy Email].",
        ],
      },
      {
        heading: "Changes to this policy",
        body: [
          "We may update this policy as Memories changes. If changes are material, we will take reasonable steps to notify users or make the updated policy visible in the app.",
        ],
      },
    ],
  },
  terms: {
    id: "terms",
    title: "Terms of Service",
    description:
      "The rules for creating an account and using Memories responsibly.",
    eyebrow: "Using Memories",
    sections: [
      {
        heading: "Agreement",
        body: [
          "These Terms govern your use of Memories, operated by [Legal Entity Name]. By creating an account or using the service, you agree to these Terms and our Privacy Policy.",
        ],
      },
      {
        heading: "Accounts",
        bullets: [
          "You must provide accurate account and profile information.",
          "Signup uses Google verification, and email/password login is available after completing profile setup.",
          "You are responsible for maintaining the confidentiality of your account and password.",
          "You must not access another person's account or use Memories to impersonate someone else.",
        ],
      },
      {
        heading: "Your content and privacy choices",
        body: [
          "You are responsible for the diary entries, memories, media, moments, messages, and other content you create or share. Memories provides privacy controls, but you decide what to save and what to share.",
          "By making content public or visible to friends or your inner circle, you allow Memories to display that content to the selected audience.",
        ],
      },
      {
        heading: "Acceptable use",
        bullets: [
          "Do not upload or share illegal, abusive, harassing, exploitative, or infringing content.",
          "Do not attempt to bypass security, privacy controls, rate limits, or access restrictions.",
          "Do not scrape, reverse engineer, overload, or interfere with the service.",
          "Do not use Memories to spam, threaten, defraud, or harm others.",
        ],
      },
      {
        heading: "Service availability",
        body: [
          "We work to keep Memories reliable, but the service may change, pause, or become unavailable due to maintenance, outages, security needs, provider issues, or product changes.",
        ],
      },
      {
        heading: "Suspension and termination",
        body: [
          "We may restrict or terminate access if we believe you violated these Terms, created risk for other users, infringed rights, or used the service unlawfully.",
        ],
      },
      {
        heading: "Disclaimers and limits",
        body: [
          "Memories is provided as-is and as-available. To the maximum extent allowed by law, [Legal Entity Name] disclaims implied warranties and will not be liable for indirect, incidental, special, consequential, or punitive damages.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "Questions about these Terms can be sent to [Support Email].",
        ],
      },
    ],
  },
  disclaimer: {
    id: "disclaimer",
    title: "Disclaimer",
    description:
      "Important limits on Memories as a personal diary and social memory tool.",
    eyebrow: "Important notice",
    sections: [
      {
        heading: "Personal diary and social memory tool",
        body: [
          "Memories helps users save, organize, and share personal memories. It is not a medical, legal, financial, therapeutic, emergency, or professional advice service.",
        ],
      },
      {
        heading: "No professional advice",
        body: [
          "Content in Memories, including prompts, labels, summaries, interface text, or user-created entries, should not be treated as professional advice. You should consult a qualified professional for medical, legal, financial, mental health, or safety concerns.",
        ],
      },
      {
        heading: "User sharing decisions",
        body: [
          "By default, content is private where the app is designed to keep it private. If you change visibility settings, publish content, message another user, or add someone to an audience, you are responsible for that sharing decision.",
        ],
      },
      {
        heading: "No absolute security guarantee",
        body: [
          "Memories uses security controls intended to protect private content, but no digital service can guarantee perfect security, permanent availability, or error-free operation.",
        ],
      },
    ],
  },
  copyright: {
    id: "copyright",
    title: "Copyright and IP Policy",
    description:
      "How Memories treats user content ownership, platform rights, and takedown requests.",
    eyebrow: "Ownership and rights",
    sections: [
      {
        heading: "Your content remains yours",
        body: [
          "You keep ownership of the diary entries, memories, media, moments, messages, reflections, and other content you create in Memories.",
        ],
      },
      {
        heading: "Limited license to operate Memories",
        body: [
          "By uploading or creating content, you give [Legal Entity Name] a limited, worldwide, non-exclusive license to host, store, process, display, transmit, and back up that content only as needed to provide, secure, maintain, and improve Memories.",
        ],
      },
      {
        heading: "Respect for others' rights",
        bullets: [
          "Only upload content you own or have permission to use.",
          "Do not use Memories to infringe copyright, trademark, privacy, publicity, or other rights.",
          "If you believe content on Memories infringes your rights, contact [Copyright Email] with enough detail for us to review the request.",
        ],
      },
      {
        heading: "Takedown contact",
        body: [
          "Copyright or intellectual property concerns can be sent to [Copyright Email]. Include your name, contact information, the content location, the rights you believe were infringed, and a statement that your report is accurate.",
        ],
      },
    ],
  },
  contact: {
    id: "contact",
    title: "Contact",
    description:
      "How to contact Memories for support, privacy, copyright, and legal questions.",
    eyebrow: "Get in touch",
    sections: [
      {
        heading: "Operator",
        bullets: [
          "Legal entity: [Legal Entity Name]",
          "Business address: [Business Address]",
        ],
      },
      {
        heading: "Support",
        body: [
          "For account, login, bug, or product support, contact [Support Email].",
        ],
      },
      {
        heading: "Privacy",
        body: [
          "For privacy questions, account data requests, or security concerns involving your personal information, contact [Privacy Email].",
        ],
      },
      {
        heading: "Copyright",
        body: [
          "For copyright or intellectual property concerns, contact [Copyright Email].",
        ],
      },
      {
        heading: "Response times",
        body: [
          "We aim to review legitimate requests promptly, but response times may vary based on request complexity and applicable law.",
        ],
      },
    ],
  },
  sitemap: {
    id: "sitemap",
    title: "Sitemap",
    description:
      "A human-readable list of public Memories pages.",
    eyebrow: "Public pages",
    sections: [
      {
        heading: "Public pages",
        body: [
          "This sitemap lists public pages only. Private app areas, user dashboards, messages, Vault content, diary entries, and API routes are intentionally excluded.",
        ],
        bullets: publicSiteLinks.map((link) => `${link.label}: ${link.href}`),
      },
    ],
  },
};

