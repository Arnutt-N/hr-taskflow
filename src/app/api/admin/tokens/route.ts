import { issueApiToken } from "@/lib/auth/issue-token";
import { prismaTokenStore } from "@/lib/tasks/prisma-store";

export function POST(request: Request): Promise<Response> {
  return issueApiToken(request, prismaTokenStore);
}
