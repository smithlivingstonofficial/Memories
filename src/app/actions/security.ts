"use server";

import { randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createPinHash,
  createVaultUnlockSession,
} from "@/lib/vault/access";
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
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
};

export type PasswordChangeState = {
  message?: string;
  success?: boolean;
  errors?: {
    password?: string[];
    confirmPassword?: string[];
  };
};

export type VaultPinResetState = {
  message?: string;
  success?: boolean;
  errors?: {
    accountPassword?: string[];
    pin?: string[];
    confirmPin?: string[];
  };
};

const PasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
      .regex(/[a-z]/, "Password must include at least one lowercase letter.")
      .regex(/[0-9]/, "Password must include at least one number."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const VaultPinResetSchema = z
  .object({
    accountPassword: z.string().min(1, "Enter your account password."),
    pin: z.string().regex(/^\d{6}$/, "Enter a 6 digit PIN."),
    confirmPin: z.string().regex(/^\d{6}$/, "Confirm your 6 digit PIN."),
  })
  .refine((value) => value.pin === value.confirmPin, {
    path: ["confirmPin"],
    message: "PINs do not match.",
  });

async function getSiteUrl() {
  const headerStore = await headers();

  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    headerStore.get("origin") ||
    "http://localhost:3000"
  );
}

export async function startAccountPasswordGoogleVerificationAction() {
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.email) {
    redirect("/settings/security?error=missing_email");
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + SECURITY_VERIFICATION_MINUTES * 60 * 1000
  ).toISOString();

  await supabase
    .from("security_verifications")
    .delete()
    .eq("user_id", user.id)
    .eq("purpose", "account_password");

  const { error: insertError } = await supabase
    .from("security_verifications")
    .insert({
      user_id: user.id,
      email: user.email.toLowerCase(),
      purpose: "account_password",
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

  if (insertError) {
    redirect("/settings/security?error=verification_failed");
  }

  const next = `/auth/security/google-callback?token=${encodeURIComponent(
    token
  )}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    redirect("/settings/security?error=google_auth_failed");
  }

  redirect(data.url);
}

export async function changeAccountPasswordAction(
  _previousState: PasswordChangeState,
  formData: FormData
): Promise<PasswordChangeState> {
  const validatedFields = PasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return {
      message: "Please check the highlighted fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Your session expired. Please login again." };
  }

  const verification = await getAccountPasswordVerification(supabase, user.id);
  if (!verification) {
    return {
      message: "Verify your Google account before changing your password.",
    };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password: validatedFields.data.password,
  });

  if (passwordError) {
    return {
      message: passwordError.message || "Unable to update your password.",
    };
  }

  await supabase
    .from("security_verifications")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", verification.id)
    .eq("user_id", user.id);

  const cookieStore = await cookies();
  cookieStore.delete(ACCOUNT_PASSWORD_VERIFICATION_COOKIE);

  await supabase
    .from("profiles")
    .update({ password_set: true })
    .eq("id", user.id);

  revalidatePath("/settings");
  revalidatePath("/settings/security");

  return {
    success: true,
    message: "Account password updated.",
  };
}

export async function resetVaultPinWithAccountPasswordAction(
  _previousState: VaultPinResetState,
  formData: FormData
): Promise<VaultPinResetState> {
  const validatedFields = VaultPinResetSchema.safeParse({
    accountPassword: formData.get("accountPassword"),
    pin: formData.get("pin"),
    confirmPin: formData.get("confirmPin"),
  });

  if (!validatedFields.success) {
    return {
      message: "Please check the highlighted fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { message: "Your session expired. Please login again." };
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: validatedFields.data.accountPassword,
  });

  if (passwordError) {
    return { message: "Incorrect account password." };
  }

  const pinHash = createPinHash(validatedFields.data.pin);
  const { error: upsertError } = await supabase.from("vault_passcodes").upsert(
    {
      user_id: user.id,
      pin_salt: pinHash.salt,
      pin_hash: pinHash.hash,
      hash_iterations: pinHash.iterations,
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    return {
      message: upsertError.message || "Unable to reset Vault PIN.",
    };
  }

  await supabase.from("vault_unlock_sessions").delete().eq("user_id", user.id);
  await createVaultUnlockSession(supabase, user.id);

  revalidatePath("/vault");
  revalidatePath("/create/vault");
  revalidatePath("/settings/security");

  return {
    success: true,
    message: "Vault PIN reset. Your Vault is unlocked for this session.",
  };
}

export async function getAccountPasswordVerificationState(userId: string) {
  const supabase = await createClient();
  const verification = await getAccountPasswordVerification(supabase, userId);

  return {
    isVerified: Boolean(verification),
    expiresAt: verification?.expires_at ?? null,
  };
}

async function getAccountPasswordVerification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCOUNT_PASSWORD_VERIFICATION_COOKIE)?.value;
  if (!token) return null;

  const { data } = await supabase
    .from("security_verifications")
    .select("id, user_id, email, purpose, token_hash, expires_at, consumed_at")
    .eq("user_id", userId)
    .eq("purpose", "account_password")
    .eq("token_hash", hashToken(token))
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return data as SecurityVerificationRow | null;
}

function hashToken(token: string) {
  return hashSecurityVerificationToken(token);
}
