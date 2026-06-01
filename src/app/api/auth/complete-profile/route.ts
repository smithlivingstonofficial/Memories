import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
      .max(15, "Mobile number is too long.")
      .regex(/^[0-9]+$/, "Enter numbers only."),
    mobileCountryCode: z
      .string()
      .trim()
      .min(2, "Select a country code.")
      .max(8, "Country code is too long.")
      .regex(/^\+[0-9]{1,6}$/, "Select a valid country code."),
    dateOfBirth: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Select your date of birth.")
      .refine((value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return Number.isFinite(date.getTime()) && date <= new Date();
      }, "Date of birth cannot be in the future."),
    bio: z
      .string()
      .trim()
      .max(180, "Bio must be 180 characters or less.")
      .optional()
      .transform((value) => (value && value.length > 0 ? value : null)),
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedFields = CompleteProfileSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please check the highlighted fields.",
          errors: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      username,
      fullName,
      mobileCountryCode,
      mobileNumber,
      dateOfBirth,
      bio,
      password,
    } = validatedFields.data;

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Your session expired. Please login again.",
        },
        { status: 401 }
      );
    }

    if (!hasGoogleIdentity(user)) {
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,
          message:
            "For first-time signup, please verify your account using Google sign in.",
        },
        { status: 403 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          message: "Your Google account does not have a valid email address.",
        },
        { status: 400 }
      );
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password,
    });

    if (passwordError) {
      return NextResponse.json(
        {
          success: false,
          message: passwordError.message || "Unable to set your password.",
        },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        username,
        full_name: fullName,
        bio,
        mobile_country_code: mobileCountryCode,
        mobile_number: mobileNumber,
        date_of_birth: dateOfBirth,
        profile_completed: true,
        password_set: true,
        signup_method: "google",
        account_visibility: "public",
        is_searchable: true,
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
        return NextResponse.json(
          {
            success: false,
            message: "Username is already taken.",
            errors: {
              username: ["This username is already taken."],
            },
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: profileError.message || "Unable to complete profile setup.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectTo: "/home",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to complete profile setup. Please try again.",
      },
      { status: 500 }
    );
  }
}
