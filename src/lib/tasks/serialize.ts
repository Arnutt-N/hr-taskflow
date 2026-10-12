import { formatDateOnly } from "@/lib/tasks/schema";
import type { TaskRecord } from "@/lib/tasks/types";

export type TaskJson = {
  id: string;
  title: string;
  detail: string | null;
  status: TaskRecord["status"];
  dueDate: string | null;
  remark: string | null;
  documentNumber: string;
  documentDate: string | null;
  documentType: TaskRecord["documentType"];
  source: TaskRecord["source"];
  confidential: boolean;
  deadlineInferred: boolean;
  kpiLink: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeTask(task: TaskRecord): TaskJson {
  return {
    id: task.id,
    title: task.title,
    detail: task.detail,
    status: task.status,
    dueDate: formatDateOnly(task.dueDate),
    remark: task.remark,
    documentNumber: task.documentNumber,
    documentDate: formatDateOnly(task.documentDate),
    documentType: task.documentType,
    source: task.source,
    confidential: task.confidential,
    deadlineInferred: task.deadlineInferred,
    kpiLink: task.kpiLink,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function maskDocumentNumber(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "••••";
  }
  return `••••${trimmed.slice(-4)}`;
}
