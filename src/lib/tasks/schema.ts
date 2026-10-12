import { z } from "zod";

import {
  documentSources,
  documentTypes,
  taskStatuses,
} from "@/lib/tasks/labels";

const statusMessage = "Status must be waiting, in_process, or done.";
const documentTypeMessage =
  "Document type must be one of PROMOTION_ORDER, APPOINTMENT, TRANSFER, INBOUND_TRANSFER, OUTBOUND_TRANSFER, RESIGNATION, POLICY, SPECIAL_ASSIGNMENT, OTHER.";
const sourceMessage = "Source must be edoc or paper.";

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a calendar date in YYYY-MM-DD format.")
  .refine(isIsoDate, "Use a real calendar date in YYYY-MM-DD format.");

function emptyStringToNull(value: unknown): unknown {
  return value === "" ? null : value;
}

const optionalText = (max: number, label: string) =>
  z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(max, `${label} must be ${max} characters or fewer.`)
      .nullable()
      .optional(),
  );

const optionalDate = z.preprocess(emptyStringToNull, dateOnly.nullable().optional());

export const createTaskSchema = z
  .object({
    title: z
      .string({ error: "Title is required." })
      .trim()
      .min(1, "Title is required.")
      .max(500, "Title must be 500 characters or fewer."),
    detail: optionalText(20000, "Detail"),
    status: z.enum(taskStatuses, { message: statusMessage }).optional(),
    dueDate: optionalDate,
    remark: optionalText(20000, "Remark"),
    documentNumber: z
      .string({ error: "Document number is required." })
      .trim()
      .min(1, "Document number is required.")
      .max(191, "Document number must be 191 characters or fewer."),
    documentDate: optionalDate,
    documentType: z.enum(documentTypes, { message: documentTypeMessage }),
    source: z.enum(documentSources, { message: sourceMessage }),
    confidential: z.boolean({ message: "Confidential must be true or false." }).optional(),
    deadlineInferred: z
      .boolean({ message: "deadlineInferred must be true or false." })
      .optional(),
    kpiLink: optionalText(2048, "KPI link"),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z
      .string({ error: "Title is required." })
      .trim()
      .min(1, "Title is required.")
      .max(500, "Title must be 500 characters or fewer.")
      .optional(),
    detail: optionalText(20000, "Detail"),
    status: z.enum(taskStatuses, { message: statusMessage }).optional(),
    dueDate: optionalDate,
    remark: optionalText(20000, "Remark"),
    documentNumber: z
      .string({ error: "Document number is required." })
      .trim()
      .min(1, "Document number is required.")
      .max(191, "Document number must be 191 characters or fewer.")
      .optional(),
    documentDate: optionalDate,
    documentType: z.enum(documentTypes, { message: documentTypeMessage }).optional(),
    source: z.enum(documentSources, { message: sourceMessage }).optional(),
    confidential: z.boolean({ message: "Confidential must be true or false." }).optional(),
    deadlineInferred: z
      .boolean({ message: "deadlineInferred must be true or false." })
      .optional(),
    kpiLink: optionalText(2048, "KPI link"),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });

export const issueTokenSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .max(100, "Name must be 100 characters or fewer."),
  })
  .strict();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export function dateOnlyToUtc(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function displayDate(value: Date | null): string {
  const formatted = formatDateOnly(value);
  if (!formatted) {
    return "—";
  }
  const [year, month, day] = formatted.split("-");
  return `${day}/${month}/${year}`;
}
