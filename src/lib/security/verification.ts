import "server-only";

import { createHash } from "crypto";

export const ACCOUNT_PASSWORD_VERIFICATION_COOKIE =
  "memories-account-password-verification";

export const SECURITY_VERIFICATION_MINUTES = 10;

export function hashSecurityVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
