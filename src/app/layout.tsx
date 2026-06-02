import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
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

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  title: "Memories — Your life, remembered beautifully",
  description:
    "A premium, privacy-first diary and social memory platform to save your moments, protect your Vault, and share only what you choose.",
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

        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
