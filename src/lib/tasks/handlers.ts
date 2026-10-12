import { z } from "zod";

import { authenticateApiToken } from "@/lib/auth/tokens";
import { jsonError, readJsonObject, singleQueryValue, validationError } from "@/lib/http";
import { documentTypes, taskStatuses } from "@/lib/tasks/labels";
import { createTaskSchema, dateOnlyToUtc, updateTaskSchema } from "@/lib/tasks/schema";
import { serializeTask } from "@/lib/tasks/serialize";
import type { CreateTaskInput, UpdateTaskInput } from "@/lib/tasks/schema";
import type { TaskPatch, TaskStore, TaskWrite, TokenStore } from "@/lib/tasks/types";

export type TaskDeps = {
  tasks: TaskStore;
  tokens: TokenStore;
};

const documentTypeMessage =
  "Document type must be one of PROMOTION_ORDER, APPOINTMENT, TRANSFER, INBOUND_TRANSFER, OUTBOUND_TRANSFER, RESIGNATION, POLICY, SPECIAL_ASSIGNMENT, OTHER.";

function toWrite(input: CreateTaskInput): TaskWrite {
  return {
    title: input.title,
    detail: input.detail ?? null,
    status: input.status ?? "waiting",
    dueDate: input.dueDate ? dateOnlyToUtc(input.dueDate) : null,
    remark: input.remark ?? null,
    documentNumber: input.documentNumber,
    documentDate: input.documentDate ? dateOnlyToUtc(input.documentDate) : null,
    documentType: input.documentType,
    source: input.source,
    confidential: input.confidential ?? false,
    deadlineInferred: input.deadlineInferred ?? false,
    kpiLink: input.kpiLink ?? null,
  };
}

function toPatch(input: UpdateTaskInput): TaskPatch {
  const patch: TaskPatch = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.detail !== undefined) patch.detail = input.detail;
  if (input.status !== undefined) patch.status = input.status;
  if (input.dueDate !== undefined) patch.dueDate = input.dueDate ? dateOnlyToUtc(input.dueDate) : null;
  if (input.remark !== undefined) patch.remark = input.remark;
  if (input.documentNumber !== undefined) patch.documentNumber = input.documentNumber;
  if (input.documentDate !== undefined) {
    patch.documentDate = input.documentDate ? dateOnlyToUtc(input.documentDate) : null;
  }
  if (input.documentType !== undefined) patch.documentType = input.documentType;
  if (input.source !== undefined) patch.source = input.source;
  if (input.confidential !== undefined) patch.confidential = input.confidential;
  if (input.deadlineInferred !== undefined) patch.deadlineInferred = input.deadlineInferred;
  if (input.kpiLink !== undefined) patch.kpiLink = input.kpiLink;
  return patch;
}

export async function createTask(request: Request, deps: TaskDeps): Promise<Response> {
  const auth = await authenticateApiToken(request, deps.tokens);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = createTaskSchema.safeParse(body.value);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const task = await deps.tasks.create(toWrite(parsed.data));
  return Response.json({ data: serializeTask(task) }, { status: 201 });
}

export async function updateTask(request: Request, id: string, deps: TaskDeps): Promise<Response> {
  const auth = await authenticateApiToken(request, deps.tokens);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonObject(request);
  if (!body.ok) {
    return body.response;
  }

  const parsed = updateTaskSchema.safeParse(body.value);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const task = await deps.tasks.update(id, toPatch(parsed.data));
  if (!task) {
    return jsonError(404, "not_found", "Task was not found.");
  }
  return Response.json({ data: serializeTask(task) });
}

export async function getTask(request: Request, id: string, deps: TaskDeps): Promise<Response> {
  const auth = await authenticateApiToken(request, deps.tokens);
  if (!auth.ok) {
    return auth.response;
  }

  const task = await deps.tasks.findById(id);
  if (!task) {
    return jsonError(404, "not_found", "Task was not found.");
  }
  return Response.json({ data: serializeTask(task) });
}

const listQuerySchema = z
  .object({
    documentNumber: z
      .string()
      .trim()
      .min(1, "Document number filter cannot be empty.")
      .max(191, "Document number filter must be 191 characters or fewer.")
      .optional(),
    status: z
      .enum(taskStatuses, { message: "Status must be waiting, in_process, or done." })
      .optional(),
    documentType: z.enum(documentTypes, { message: documentTypeMessage }).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).max(10_000).optional(),
  })
  .strict();

export async function listTasks(request: Request, deps: TaskDeps): Promise<Response> {
  const auth = await authenticateApiToken(request, deps.tokens);
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const fields: Record<string, string[]> = {};
  const raw: Record<string, unknown> = {};

  for (const name of ["documentNumber", "status", "type", "documentType"] as const) {
    const value = singleQueryValue(url.searchParams, name);
    if (!value.ok) {
      fields[name] = ["Provide this filter only once."];
      continue;
    }
    if (value.value !== undefined && name !== "type") {
      raw[name] = value.value;
    }
    if (value.value !== undefined && name === "type") {
      raw.type = value.value;
    }
  }

  for (const name of ["limit", "offset"] as const) {
    const value = singleQueryValue(url.searchParams, name);
    if (!value.ok) {
      fields[name] = ["Provide this filter only once."];
      continue;
    }
    if (value.value === undefined) {
      continue;
    }
    if (!/^\d+$/.test(value.value)) {
      fields[name] = [`${name} must be an integer.`];
      continue;
    }
    raw[name] = Number(value.value);
  }

  if (raw.type !== undefined && raw.documentType !== undefined && raw.type !== raw.documentType) {
    fields.type = ["type and documentType must match when both are provided."];
  }

  if (Object.keys(fields).length > 0) {
    return jsonError(400, "validation_error", "Query parameters failed validation.", { fields });
  }

  const documentType = (raw.documentType ?? raw.type) as string | undefined;
  const parsed = listQuerySchema.safeParse({
    documentNumber: raw.documentNumber,
    status: raw.status,
    documentType,
    limit: raw.limit,
    offset: raw.offset,
  });
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const limit = parsed.data.limit ?? 50;
  const offset = parsed.data.offset ?? 0;
  const result = await deps.tasks.search({
    documentNumber: parsed.data.documentNumber,
    status: parsed.data.status,
    documentType: parsed.data.documentType,
    limit,
    offset,
  });

  return Response.json({
    data: result.items.map(serializeTask),
    page: { limit, offset, total: result.total },
  });
}
