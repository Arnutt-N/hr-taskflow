import { getPrisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type {
  ApiTokenRecord,
  TaskPatch,
  TaskRecord,
  TaskSearch,
  TaskStore,
  TaskWrite,
  TokenStore,
} from "@/lib/tasks/types";

function toTaskRecord(task: {
  id: string;
  title: string;
  detail: string | null;
  status: TaskRecord["status"];
  dueDate: Date | null;
  remark: string | null;
  documentNumber: string;
  documentDate: Date | null;
  documentType: TaskRecord["documentType"];
  source: TaskRecord["source"];
  confidential: boolean;
  deadlineInferred: boolean;
  kpiLink: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TaskRecord {
  return task;
}

export const prismaTaskStore: TaskStore = {
  async create(input: TaskWrite) {
    const task = await getPrisma().task.create({ data: input });
    return toTaskRecord(task);
  },

  async update(id: string, patch: TaskPatch) {
    try {
      const task = await getPrisma().task.update({ where: { id }, data: patch });
      return toTaskRecord(task);
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  },

  async findById(id: string) {
    const task = await getPrisma().task.findUnique({ where: { id } });
    return task ? toTaskRecord(task) : null;
  },

  async search(query: TaskSearch) {
    const where: Prisma.TaskWhereInput = {};
    if (query.documentNumber) {
      where.documentNumber = { contains: escapeLike(query.documentNumber) };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.documentType) {
      where.documentType = query.documentType;
    }

    const [items, total] = await Promise.all([
      getPrisma().task.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: query.limit,
        skip: query.offset,
      }),
      getPrisma().task.count({ where }),
    ]);

    return { items: items.map(toTaskRecord), total };
  },
};

export const prismaTokenStore: TokenStore = {
  async findByHash(tokenHash: string) {
    return getPrisma().apiToken.findUnique({ where: { tokenHash } });
  },

  async touch(id: string, at: Date) {
    await getPrisma().apiToken.update({ where: { id }, data: { lastUsedAt: at } });
  },

  async create(input: { name: string; tokenHash: string; tokenPrefix: string }): Promise<ApiTokenRecord> {
    return getPrisma().apiToken.create({ data: input });
  },
};

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}
