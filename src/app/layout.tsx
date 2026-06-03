import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { RouteLoadingShell } from "@/components/layout/route-loading-shell";
import { getPublicSiteUrl } from "@/lib/site-url";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getPublicSiteUrl();
const siteDescription =
  "Memories is a privacy-first diary, Vault, and social memory platform for saving private moments and sharing only what you choose.";
const siteKeywords = [
  "Memories",
  "private diary app",
  "privacy-first diary",
  "secure journal",
  "memory vault",
  "digital memories",
  "personal journal",
  "private moments",
  "social memory app",
  "Ellabs",
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Memories",
  title: {
    default: "Memories - Your life, remembered beautifully",
    template: "%s | Memories",
  },
  description: siteDescription,
  keywords: siteKeywords,
  authors: [{ name: "Ellabs", url: "https://ellabs.in" }],
  creator: "Ellabs",
  publisher: "Ellabs",
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/Memories Dark.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
  },
  openGraph: {
    title: "Memories - Your life, remembered beautifully",
    description: siteDescription,
    url: siteUrl,
    siteName: "Memories",
    images: [
      {
        url: "/Memories Dark.png",
        width: 512,
        height: 512,
        alt: "Memories logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Memories - Your life, remembered beautifully",
    description: siteDescription,
    images: ["/Memories Dark.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: "eoB80USkT-nODtKn8n_t2p_Q1TJrbwk7rI1mNr-FaZg",
  },
  other: {
    "theme-color": "#0b0620",
  },
};

const themeScript = `
(function () {
  try {
    var savedTheme = localStorage.getItem("memories-theme");
    var theme = savedTheme === "dark"
      ? "dark"
      : savedTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${sora.variable} antialiased`}>
        <Script
          id="memories-theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />

        <ThemeProvider>
          <Suspense fallback={<RouteLoadingShell />}>{children}</Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
