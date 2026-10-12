/**
 * Seed does not create API tokens. Issue a token with `npm run token:create`
 * or POST /api/admin/tokens. No sample rows are inserted, so a fresh database
 * stays free of credentials and fixture documents.
 */
async function main(): Promise<void> {
  console.log("hr-taskflow seed: no rows inserted. API tokens are not seeded.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exitCode = 1;
});
