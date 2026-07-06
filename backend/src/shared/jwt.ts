import { createHmac, timingSafeEqual } from "crypto";

/**
 * Minimal JWT implementation (HS256) using only Node's built-in `crypto`.
 *
 * NOTE: This is a real substitution for the `jsonwebtoken` npm package,
 * not a toy. It produces and verifies standards-compliant JWTs
 * (base64url(header).base64url(payload).base64url(HMAC-SHA256 signature)).
 * Substituted because this sandbox has no network access to `npm install
 * jsonwebtoken`. If the team prefers that package in the real environment,
 * only this file changes — auth.service.ts and the RBAC middleware only
 * call `signToken`/`verifyToken`, never touch the encoding directly.
 */

const SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export interface TokenPayload {
  userId: number;
  roleIds: number[];
  exp: number; // unix seconds
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

export function signToken(payload: Omit<TokenPayload, "exp">, expiresInSeconds: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload: TokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const signature = createHmac("sha256", SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const encodedSignature = base64url(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const expectedSignature = createHmac("sha256", SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const actualSignature = base64urlDecode(encodedSignature);

  if (expectedSignature.length !== actualSignature.length) return null;
  if (!timingSafeEqual(expectedSignature, actualSignature)) return null;

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload).toString("utf-8")) as TokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired
    return payload;
  } catch {
    return null;
  }
}
