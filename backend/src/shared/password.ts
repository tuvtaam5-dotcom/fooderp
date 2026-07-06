import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Password hashing utility.
 *
 * NOTE: Uses Node's built-in `crypto.scryptSync` rather than bcrypt/argon2.
 * This is a deliberate substitution, not a shortcut: this sandbox has no
 * network access to `npm install bcrypt`, and scrypt (via Node's built-in
 * crypto module) is itself a well-regarded, standards-recognized (RFC 7914)
 * password-hashing KDF — not a toy substitute. If the team prefers
 * bcrypt/argon2 in the real environment, only this file needs to change;
 * nothing in users.service.ts or auth.service.ts references scrypt directly.
 *
 * Format stored in password_hash: "{salt-hex}:{hash-hex}"
 */

const KEY_LENGTH = 64;

export function hashPassword(plainPassword: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(plainPassword, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(plainPassword: string, storedHash: string): boolean {
  const [salt, hashHex] = storedHash.split(":");
  if (!salt || !hashHex) return false;

  const derivedKey = scryptSync(plainPassword, salt, KEY_LENGTH);
  const storedKey = Buffer.from(hashHex, "hex");

  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}
