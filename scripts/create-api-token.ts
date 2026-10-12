import { existsSync } from "node:fs";

import { generateApiToken } from "../src/lib/auth/tokens";
import { disconnectPrisma } from "../src/lib/db";
import { prismaTokenStore } from "../src/lib/tasks/prisma-store";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

function readName(argv: string[]): string | null {
  const nameFlag = argv.indexOf("--name");
  if (nameFlag >= 0) {
    const value = argv[nameFlag + 1];
    return value && !value.startsWith("--") ? value.trim() : null;
  }
  const positional = argv.filter((arg) => !arg.startsWith("--"));
  return positional[0]?.trim() || null;
}

async function main(): Promise<void> {
  const name = readName(process.argv.slice(2));
  if (!name || name.length > 100) {
    console.error('Usage: npm run token:create -- --name "hr-bot"');
    process.exitCode = 1;
    return;
  }

  const generated = generateApiToken();
  const record = await prismaTokenStore.create({
    name,
    tokenHash: generated.tokenHash,
    tokenPrefix: generated.tokenPrefix,
  });

  console.log(`Created API token ${record.id} (${record.tokenPrefix}…)`);
  console.log("Copy this token now. It is stored only as a SHA-256 hash and will not be shown again.");
  console.log(generated.token);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Failed to create API token.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
