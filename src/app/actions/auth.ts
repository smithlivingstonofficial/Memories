// src/app/actions/auth.ts

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

async function getSiteUrl() {
  const headerStore = await headers();

  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    headerStore.get("origin") ||
    "http://localhost:3000"
  );
}

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

/* -------------------------------------------------------------------------- */
/* GOOGLE AUTH ACTION                                                         */
/* Used for both Signup and Login Google buttons                              */
/* -------------------------------------------------------------------------- */

export async function googleAuthAction() {
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/complete-profile`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google_auth_failed");
  }

  redirect(data.url);
}

/* -------------------------------------------------------------------------- */
/* COMPLETE PROFILE ACTION                                                    */
/* Google-verified users must set password here                               */
/* -------------------------------------------------------------------------- */

export type CompleteProfileState = {
  success?: boolean;
  message?: string;
  errors?: {
    username?: string[];
    fullName?: string[];
    mobileNumber?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

const CompleteProfileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Username must be at least 3 characters.")
      .max(24, "Username must be less than 24 characters.")
      .regex(
        /^[a-z0-9_]+$/,
        "Username can only contain lowercase letters, numbers, and underscore."
      ),

    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(80, "Full name is too long."),

    mobileNumber: z
      .string()
      .trim()
      .min(7, "Enter a valid mobile number.")
      .max(20, "Mobile number is too long.")
      .regex(/^[+0-9 ()-]+$/, "Enter a valid mobile number."),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
      .regex(/[a-z]/, "Password must include at least one lowercase letter.")
      .regex(/[0-9]/, "Password must include at least one number."),

    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export async function completeProfileAction(
  _previousState: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const validatedFields = CompleteProfileSchema.safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    mobileNumber: formData.get("mobileNumber"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return {
      message: "Please check the highlighted fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, fullName, mobileNumber, password } = validatedFields.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      message: "Your session expired. Please login again.",
    };
  }

  if (!hasGoogleIdentity(user)) {
    await supabase.auth.signOut();

    return {
      message:
        "For first-time signup, please verify your account using Google sign in.",
    };
  }

  if (!user.email) {
    return {
      message: "Your Google account does not have a valid email address.",
    };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password,
  });

  if (passwordError) {
    return {
      message: passwordError.message || "Unable to set your password.",
    };
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
      full_name: fullName,
      mobile_number: mobileNumber,
      profile_completed: true,
      password_set: true,
      signup_method: "google",
      avatar_url:
        user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    if (
      profileError.code === "23505" ||
      profileError.message.toLowerCase().includes("duplicate")
    ) {
      return {
        message: "Username is already taken.",
        errors: {
          username: ["This username is already taken."],
        },
      };
    }

    return {
      message: profileError.message || "Unable to complete profile setup.",
    };
  }

  redirect("/home");
}

/* -------------------------------------------------------------------------- */
/* EMAIL + PASSWORD LOGIN ACTION                                              */
/* Available only after Google signup + password setup                        */
/* -------------------------------------------------------------------------- */

export type LoginFormState = {
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
  };
};

const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .toLowerCase(),

  password: z.string().min(1, "Enter your password."),
});

export async function loginAction(
  _previousState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validatedFields = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      message: "Please check the highlighted fields.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      message:
        "Invalid login details. Use the email from your Google account and the password created during profile setup.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      message: "Unable to verify your session. Please try again.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_completed, password_set")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.profile_completed || !profile?.password_set) {
    redirect("/complete-profile");
  }

  redirect("/home");
}

/* -------------------------------------------------------------------------- */
/* LOGOUT ACTION                                                              */
/* -------------------------------------------------------------------------- */

export async function logoutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}
