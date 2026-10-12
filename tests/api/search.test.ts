import { existsSync } from "node:fs";
import { afterAll, expect, it } from "vitest";

import { disconnectPrisma } from "../../src/lib/db";
import { escapeLike, prismaTaskStore } from "../../src/lib/tasks/prisma-store";
import type { TaskWrite } from "../../src/lib/tasks/types";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

it("escapes LIKE wildcards in document numbers", () => {
  expect(escapeLike(String.raw`100%_a\b`)).toBe(String.raw`100\%\_a\\b`);
});

const live = process.env.DATABASE_URL ? it : it.skip;

live("searches document numbers as literal text", async () => {
  const token = `Z${Date.now()}`;
  const literalNumber = `${token}%QQ`;
  const otherNumber = `${token}XQQ`;
  const created: string[] = [];
  try {
    const literal = await prismaTaskStore.create(sample(literalNumber, "literal percent"));
    const other = await prismaTaskStore.create(sample(otherNumber, "plain text"));
    created.push(literal.id, other.id);

    const result = await prismaTaskStore.search({
      documentNumber: literalNumber,
      limit: 10,
      offset: 0,
    });

    expect(result.items.map((item) => item.id)).toEqual([literal.id]);
  } finally {
    if (created.length > 0) {
      const { getPrisma } = await import("../../src/lib/db");
      await getPrisma().task.deleteMany({ where: { id: { in: created } } });
    }
  }
});

afterAll(async () => {
  await disconnectPrisma();
});

function sample(documentNumber: string, title: string): TaskWrite {
  return {
    title,
    detail: null,
    status: "waiting",
    dueDate: null,
    remark: null,
    documentNumber,
    documentDate: null,
    documentType: "OTHER",
    source: "paper",
    confidential: false,
    deadlineInferred: false,
    kpiLink: null,
  };
}
