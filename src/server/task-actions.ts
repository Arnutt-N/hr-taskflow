"use server";

import { notFound, redirect, unstable_rethrow } from "next/navigation";

import { prismaTaskStore } from "@/lib/tasks/prisma-store";
import {
  createTaskSchema,
  dateOnlyToUtc,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/tasks/schema";
import type { TaskPatch, TaskWrite } from "@/lib/tasks/types";

export type FormState = {
  message?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
} | null;

function readField(formData: FormData, name: string): string {
  const values = formData
    .getAll(name)
    .filter((item): item is string => typeof item === "string");
  return values.at(-1)?.trim() ?? "";
}

function readBool(formData: FormData, name: string): boolean {
  return readField(formData, name) === "true";
}

function formPayload(formData: FormData) {
  return {
    title: readField(formData, "title"),
    detail: readField(formData, "detail"),
    status: readField(formData, "status"),
    dueDate: readField(formData, "dueDate"),
    remark: readField(formData, "remark"),
    documentNumber: readField(formData, "documentNumber"),
    documentDate: readField(formData, "documentDate"),
    documentType: readField(formData, "documentType"),
    source: readField(formData, "source"),
    confidential: readBool(formData, "confidential"),
    deadlineInferred: readBool(formData, "deadlineInferred"),
    kpiLink: readField(formData, "kpiLink"),
  };
}

const formMessages: Record<string, string> = {
  "Title is required.": "กรุณาระบุชื่องาน",
  "Title must be 500 characters or fewer.": "ชื่องานต้องไม่เกิน 500 ตัวอักษร",
  "Document number is required.": "กรุณาระบุเลขที่หนังสือ",
  "Document number must be 191 characters or fewer.": "เลขที่หนังสือต้องไม่เกิน 191 ตัวอักษร",
  "Document type must be one of PROMOTION_ORDER, APPOINTMENT, TRANSFER, INBOUND_TRANSFER, OUTBOUND_TRANSFER, RESIGNATION, POLICY, SPECIAL_ASSIGNMENT, OTHER.":
    "กรุณาเลือกประเภทหนังสือ",
  "Source must be edoc or paper.": "กรุณาเลือกแหล่งที่มา",
  "Use a calendar date in YYYY-MM-DD format.": "ใช่วันที่ในรูปแบบ ปี-เดือน-วัน",
  "Use a real calendar date in YYYY-MM-DD format.": "วันที่ไม่ถูกต้อง",
  "Detail must be 20000 characters or fewer.": "รายละเอียดต้องไม่เกิน 20,000 ตัวอักษร",
  "Remark must be 20000 characters or fewer.": "หมายเหตุต้องไม่เกิน 20,000 ตัวอักษร",
  "KPI link must be 2048 characters or fewer.": "ลิงก์หรือรหัส KPI ต้องไม่เกิน 2,048 ตัวอักษร",
  "Status must be waiting, in_process, or done.": "สถานะไม่ถูกต้อง",
  "Confidential must be true or false.": "ค่าเอกสารลับไม่ถูกต้อง",
  "deadlineInferred must be true or false.": "ค่ากำหนดส่งโดยประมาณไม่ถูกต้อง",
  "At least one field is required.": "กรุณาระบุข้อมูลที่ต้องการแก้",
};

function translate(message: string): string {
  return formMessages[message] ?? message;
}

function fieldState(error: { flatten: () => { fieldErrors: unknown; formErrors: string[] } }, message: string): FormState {
  const flat = error.flatten();
  const fieldErrors: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors as Record<string, string[] | undefined>)) {
    if (messages && messages.length > 0) {
      fieldErrors[key] = messages.map(translate);
    }
  }
  return {
    message,
    fieldErrors,
    formErrors: flat.formErrors.map(translate),
  };
}

export async function revealConfidentialTask(id: string): Promise<{
  documentNumber: string;
  detail: string | null;
  remark: string | null;
  kpiLink: string | null;
} | null> {
  const task = await prismaTaskStore.findById(id);
  if (!task?.confidential) {
    return null;
  }
  return {
    documentNumber: task.documentNumber,
    detail: task.detail,
    remark: task.remark,
    kpiLink: task.kpiLink,
  };
}

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

export async function createTaskAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = createTaskSchema.safeParse(formPayload(formData));
  if (!parsed.success) {
    return fieldState(parsed.error, "กรุณาตรวจสอบข้อมูลในแบบฟอร์ม");
  }

  try {
    const task = await prismaTaskStore.create(toWrite(parsed.data));
    redirect(`/tasks/${task.id}`);
  } catch (error) {
    unstable_rethrow(error);
    return { message: "ไม่สามารถบันทึกงานได้ในขณะนี้" };
  }
}

export async function updateTaskAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = updateTaskSchema.safeParse(formPayload(formData));
  if (!parsed.success) {
    return fieldState(parsed.error, "กรุณาตรวจสอบข้อมูลในแบบฟอร์ม");
  }

  try {
    const task = await prismaTaskStore.update(id, toPatch(parsed.data));
    if (!task) {
      notFound();
    }
    redirect(`/tasks/${task.id}`);
  } catch (error) {
    unstable_rethrow(error);
    return { message: "ไม่สามารถบันทึกงานได้ในขณะนี้" };
  }
}
