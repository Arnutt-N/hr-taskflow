import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { jsonError } from "@/lib/http";
import type { TokenStore } from "@/lib/tasks/types";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateApiToken(): { token: string; tokenHash: string; tokenPrefix: string } {
  const token = `hrtf_${randomBytes(32).toString("base64url")}`;
  return {
    token,
    tokenHash: hashToken(token),
    tokenPrefix: token.slice(0, 12),
  };
}

export function secretsMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function authenticateApiToken(
  request: Request,
  tokens: TokenStore,
): Promise<{ ok: true; tokenId: string } | { ok: false; response: Response }> {
  const header = request.headers.get("authorization");
  if (!header) {
    return {
      ok: false,
      response: jsonError(401, "unauthorized", "A valid Bearer API token is required."),
    };
  }

  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) {
    return {
      ok: false,
      response: jsonError(
        401,
        "unauthorized",
        "Authorization header must use the Bearer scheme.",
      ),
    };
  }

  const record = await tokens.findByHash(hashToken(match[1]));
  if (!record || record.revokedAt) {
    return {
      ok: false,
      response: jsonError(401, "unauthorized", "Invalid API token."),
    };
  }

  await tokens.touch(record.id, new Date());
  return { ok: true, tokenId: record.id };
}

export function authenticateAdmin(
  request: Request,
): { ok: true } | { ok: false; response: Response } {
  const configured = process.env.ADMIN_TOKEN?.trim() ?? "";
  if (!configured) {
    return {
      ok: false,
      response: jsonError(
        503,
        "admin_unconfigured",
        "Token issuing is disabled until ADMIN_TOKEN is set. Use npm run token:create instead.",
      ),
    };
  }

  const header = request.headers.get("authorization");
  const match = header ? /^Bearer\s+(\S+)$/i.exec(header.trim()) : null;
  if (!match || !secretsMatch(match[1], configured)) {
    return {
      ok: false,
      response: jsonError(401, "unauthorized", "A valid admin Bearer token is required."),
    };
  }

  return { ok: true };
}
