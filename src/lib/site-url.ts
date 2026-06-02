const FALLBACK_SITE_URL = "https://memories.ellabs.in";

export function getPublicSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL;

  return value.replace(/\/+$/, "");
}
