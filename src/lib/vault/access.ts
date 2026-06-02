import "server-only";

import { pbkdf2Sync, randomBytes, timingSafeEqual, createHash } from "crypto";
import { cookies } from "next/headers";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export const VAULT_UNLOCK_COOKIE = "memories-vault-unlock";

const PIN_HASH_ITERATIONS = 120_000;
const PIN_HASH_BYTES = 32;
const UNLOCK_SESSION_HOURS = 12;

type VaultPasscodeRow = {
  user_id: string;
  pin_salt: string;
  pin_hash: string;
  hash_iterations: number | null;
};

export type VaultAccessState = {
  hasPasscode: boolean;
  isUnlocked: boolean;
};

export function createPinHash(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = hashPin(pin, salt, PIN_HASH_ITERATIONS);

  return {
    salt,
    hash,
    iterations: PIN_HASH_ITERATIONS,
  };
}

export function verifyPin(pin: string, row: VaultPasscodeRow) {
  const expected = Buffer.from(row.pin_hash, "hex");
  const actual = Buffer.from(
    hashPin(pin, row.pin_salt, row.hash_iterations ?? PIN_HASH_ITERATIONS),
    "hex"
  );

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function getVaultAccessState(
  supabase: SupabaseClient,
  userId: string
): Promise<VaultAccessState> {
  const { data: passcode } = await supabase
    .from("vault_passcodes")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  const hasPasscode = Boolean(passcode);

  return {
    hasPasscode,
    isUnlocked: hasPasscode ? await isVaultUnlocked(supabase, userId) : false,
  };
}

export async function isVaultUnlocked(
  supabase: SupabaseClient,
  userId: string
) {
  const token = await getVaultUnlockToken();
  if (!token) return false;

  const tokenHash = hashToken(token);
  const { data: session } = await supabase
    .from("vault_unlock_sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return Boolean(session);
}

export async function requireVaultUnlocked(
  supabase: SupabaseClient,
  userId: string
) {
  return isVaultUnlocked(supabase, userId);
}

export async function createVaultUnlockSession(
  supabase: SupabaseClient,
  userId: string
) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + UNLOCK_SESSION_HOURS * 60 * 60 * 1000
  ).toISOString();

  await supabase.from("vault_unlock_sessions").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(VAULT_UNLOCK_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearVaultUnlockSession(
  supabase: SupabaseClient,
  userId: string
) {
  const token = await getVaultUnlockToken();
  const cookieStore = await cookies();

  if (token) {
    await supabase
      .from("vault_unlock_sessions")
      .delete()
      .eq("user_id", userId)
      .eq("token_hash", hashToken(token));
  }

  cookieStore.delete(VAULT_UNLOCK_COOKIE);
}

export async function getVaultPasscode(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("vault_passcodes")
    .select("user_id, pin_salt, pin_hash, hash_iterations")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as VaultPasscodeRow | null;
}

async function getVaultUnlockToken() {
  const cookieStore = await cookies();
  return cookieStore.get(VAULT_UNLOCK_COOKIE)?.value ?? null;
}

function hashPin(pin: string, salt: string, iterations: number) {
  return pbkdf2Sync(pin, salt, iterations, PIN_HASH_BYTES, "sha256").toString(
    "hex"
  );
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
