import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_PASSWORD_VERIFICATION_COOKIE,
  SECURITY_VERIFICATION_MINUTES,
  hashSecurityVerificationToken,
} from "@/lib/security/verification";

type SecurityVerificationRow = {
  id: string;
  user_id: string;
  email: string;
  purpose: "account_password";
  expires_at: string;
  consumed_at: string | null;
};

function hasGoogleIdentity(user: {
  app_metadata?: Record<string, unknown>;
  identities?: Array<{ provider?: string }>;
}) {
  const provider = user.app_metadata?.provider;
  const identityHasGoogle = user.identities?.some(
    (identity) => identity.provider === "google"
  );

  return provider === "google" || identityHasGoogle === true;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/settings/security?error=verification_missing", requestUrl.origin)
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const { data: verificationData } = await supabase
    .from("security_verifications")
    .select("id, user_id, email, purpose, expires_at, consumed_at")
    .eq("purpose", "account_password")
    .eq("token_hash", hashSecurityVerificationToken(token))
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  const verification = verificationData as SecurityVerificationRow | null;

  if (!verification) {
    return NextResponse.redirect(
      new URL("/settings/security?error=verification_expired", requestUrl.origin)
    );
  }

  const sameUser = verification.user_id === user.id;
  const sameEmail = verification.email.toLowerCase() === user.email.toLowerCase();

  if (!sameUser || !sameEmail || !hasGoogleIdentity(user)) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL("/login?error=google_account_mismatch", requestUrl.origin)
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ACCOUNT_PASSWORD_VERIFICATION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SECURITY_VERIFICATION_MINUTES * 60,
  });

  return NextResponse.redirect(
    new URL("/settings/security?verified=google", requestUrl.origin)
  );
}
