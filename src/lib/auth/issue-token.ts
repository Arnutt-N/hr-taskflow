import { authenticateAdmin, generateApiToken } from "@/lib/auth/tokens";
import { readJsonObject, validationError } from "@/lib/http";
import { issueTokenSchema } from "@/lib/tasks/schema";
import type { TokenStore } from "@/lib/tasks/types";

export async function issueApiToken(request: Request, tokens: TokenStore): Promise<Response> {
  const auth = authenticateAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = issueTokenSchema.safeParse(body.value);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const generated = generateApiToken();
  const record = await tokens.create({
    name: parsed.data.name,
    tokenHash: generated.tokenHash,
    tokenPrefix: generated.tokenPrefix,
  });

  return Response.json(
    {
      data: {
        id: record.id,
        name: record.name,
        tokenPrefix: record.tokenPrefix,
        token: generated.token,
        createdAt: record.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
