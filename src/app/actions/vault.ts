"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  clearVaultUnlockSession,
  createPinHash,
  createVaultUnlockSession,
  getVaultPasscode,
  verifyPin,
} from "@/lib/vault/access";

export type VaultPinState = {
  message?: string;
  success?: boolean;
  errors?: {
    pin?: string[];
    confirmPin?: string[];
  };
};

const PinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "Enter a 6 digit PIN."),
});

const SetPinSchema = PinSchema.extend({
  confirmPin: z.string().regex(/^\d{6}$/, "Confirm your 6 digit PIN."),
}).refine((value) => value.pin === value.confirmPin, {
  path: ["confirmPin"],
  message: "PINs do not match.",
});

export async function setVaultPinAction(
  _previousState: VaultPinState,
  formData: FormData
): Promise<VaultPinState> {
  const validatedFields = SetPinSchema.safeParse({
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

  if (!user) {
    return { message: "Your session expired. Please login again." };
  }

  const existing = await getVaultPasscode(supabase, user.id);
  if (existing) {
    return { message: "Vault PIN is already set. Unlock with your PIN." };
  }

  const pinHash = createPinHash(validatedFields.data.pin);
  const { error } = await supabase.from("vault_passcodes").insert({
    user_id: user.id,
    pin_salt: pinHash.salt,
    pin_hash: pinHash.hash,
    hash_iterations: pinHash.iterations,
  });

  if (error) {
    return { message: error.message || "Unable to set Vault PIN." };
  }

  await createVaultUnlockSession(supabase, user.id);
  revalidateVaultPaths();

  return {
    success: true,
    message: "Vault PIN set. Your Vault is unlocked for this session.",
  };
}

export async function verifyVaultPinAction(
  _previousState: VaultPinState,
  formData: FormData
): Promise<VaultPinState> {
  const validatedFields = PinSchema.safeParse({
    pin: formData.get("pin"),
  });

  if (!validatedFields.success) {
    return {
      message: "Please check the highlighted field.",
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

  const passcode = await getVaultPasscode(supabase, user.id);
  if (!passcode) {
    return { message: "Set a Vault PIN first." };
  }

  if (!verifyPin(validatedFields.data.pin, passcode)) {
    return { message: "Incorrect Vault PIN." };
  }

  await createVaultUnlockSession(supabase, user.id);
  revalidateVaultPaths();

  return {
    success: true,
    message: "Vault unlocked for this session.",
  };
}

export async function lockVaultAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await clearVaultUnlockSession(supabase, user.id);
  }

  revalidateVaultPaths();
  redirect("/vault");
}

function revalidateVaultPaths() {
  revalidatePath("/vault");
  revalidatePath("/create/memory");
  revalidatePath("/create/vault");
  revalidatePath("/timeline");
  revalidatePath("/calendar");
}
