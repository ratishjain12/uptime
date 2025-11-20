import { randomBytes } from "crypto";

/**
 * Generates a secure service token for APP_LOG monitors
 * Format: upt_<64-character-hex>
 * @returns A unique service token prefixed with "upt_"
 */
export function generateServiceToken(): string {
  // Generate 32 random bytes (256 bits) and convert to hex (64 characters)
  const randomHex = randomBytes(32).toString("hex");
  return `upt_${randomHex}`;
}

