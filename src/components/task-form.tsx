"use client";

import { useActionState, useEffect, useId, useLayoutEffect, useRef } from "react";

import {
  documentSourceList,
  documentTypeList,
  statusList,
} from "@/lib/tasks/labels";
import type { FormState } from "@/server/task-actions";

export type TaskFormValues = {
  title: string;
  detail: string;
  status: string;
  dueDate: string;
  remark: string;
  documentNumber: string;
  documentDate: string;
  documentType: string;
  source: string;
  confidential: boolean;
  deadlineInferred: boolean;
  kpiLink: string;
};

export const emptyTaskForm: TaskFormValues = {
  title: "",
  detail: "",
  status: "waiting",
  dueDate: "",
  remark: "",
  documentNumber: "",
  documentDate: "",
  documentType: "",
  source: "",
  confidential: false,
  deadlineInferred: false,
  kpiLink: "",
};

type TaskFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial?: TaskFormValues;
  submitLabel: string;
  resetAfterSuccess?: boolean;
};

function fieldError(state: FormState, name: string): string | undefined {
  return state?.fieldErrors?.[name]?.[0];
}

function controlId(formId: string, name: string): string {
  return `${formId}-${name}`;
}

function errorId(formId: string, name: string): string {
  return `${formId}-${name}-error`;
}

export function TaskForm({
  action,
  initial = emptyTaskForm,
  submitLabel,
  resetAfterSuccess = false,
}: TaskFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef(false);

  useEffect(() => {
    if (state) {
      submitted.current = false;
    }
  }, [state]);

  useLayoutEffect(() => {
    const form = formRef.current;
    return () => {
      if (resetAfterSuccess && submitted.current) {
        form?.reset();
      }
    };
  }, [resetAfterSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-5"
      noValidate
      onSubmit={() => {
        submitted.current = true;
      }}
    >
      {state?.message ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-danger">
          {state.message}
        </p>
      ) : null}
      {state?.formErrors?.map((message) => (
        <p key={message} role="alert" className="text-sm text-danger">
          {message}
        </p>
      ))}

      <Field formId={formId} label="ชื่องาน" name="title" error={fieldError(state, "title")} required>
        <input
          id={controlId(formId, "title")}
          name="title"
          required
          defaultValue={initial.title}
          className={inputClass}
          aria-invalid={Boolean(fieldError(state, "title"))}
          aria-describedby={fieldError(state, "title") ? errorId(formId, "title") : undefined}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field formId={formId} label="เลขที่หนังสือ" name="documentNumber" error={fieldError(state, "documentNumber")} required>
          <input
            id={controlId(formId, "documentNumber")}
            name="documentNumber"
            required
            defaultValue={initial.documentNumber}
            className={inputClass}
            aria-invalid={Boolean(fieldError(state, "documentNumber"))}
            aria-describedby={describedBy(formId, "documentNumber", state)}
          />
        </Field>
        <Field formId={formId} label="วันที่หนังสือ" name="documentDate" error={fieldError(state, "documentDate")}>
          <input
            id={controlId(formId, "documentDate")}
            name="documentDate"
            type="date"
            defaultValue={initial.documentDate}
            className={inputClass}
            aria-invalid={Boolean(fieldError(state, "documentDate"))}
            aria-describedby={describedBy(formId, "documentDate", state)}
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field formId={formId} label="ประเภทหนังสือ" name="documentType" error={fieldError(state, "documentType")} required>
          <select
            id={controlId(formId, "documentType")}
            name="documentType"
            required
            defaultValue={initial.documentType}
            className={inputClass}
            aria-invalid={Boolean(fieldError(state, "documentType"))}
            aria-describedby={describedBy(formId, "documentType", state)}
          >
            <option value="">เลือกประเภท</option>
            {documentTypeList.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field formId={formId} label="แหล่งที่มา" name="source" error={fieldError(state, "source")} required>
          <select
            id={controlId(formId, "source")}
            name="source"
            required
            defaultValue={initial.source}
            className={inputClass}
            aria-invalid={Boolean(fieldError(state, "source"))}
            aria-describedby={describedBy(formId, "source", state)}
          >
            <option value="">เลือกแหล่งที่มา</option>
            {documentSourceList.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field formId={formId} label="สถานะ" name="status" error={fieldError(state, "status")}>
          <select
            id={controlId(formId, "status")}
            name="status"
            defaultValue={initial.status}
            className={inputClass}
            aria-invalid={Boolean(fieldError(state, "status"))}
            aria-describedby={describedBy(formId, "status", state)}
          >
            {statusList.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field formId={formId} label="กำหนดส่ง" name="dueDate" error={fieldError(state, "dueDate")}>
          <input
            id={controlId(formId, "dueDate")}
            name="dueDate"
            type="date"
            defaultValue={initial.dueDate}
            className={inputClass}
            aria-invalid={Boolean(fieldError(state, "dueDate"))}
            aria-describedby={describedBy(formId, "dueDate", state)}
          />
        </Field>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="hidden" name="deadlineInferred" value="false" />
        <input
          type="checkbox"
          name="deadlineInferred"
          value="true"
          defaultChecked={initial.deadlineInferred}
          className="mt-1"
        />
        <span>กำหนดส่งเป็นการคาดคะเน ไม่ได้ระบุไว้ในหนังสือ</span>
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input type="hidden" name="confidential" value="false" />
        <input
          type="checkbox"
          name="confidential"
          value="true"
          defaultChecked={initial.confidential}
          className="mt-1"
        />
        <span>เอกสารลับ — ซ่อนเลขที่หนังสือและเนื้อหาในหน้ารายการ จนกว่าจะเปิดดูในหน้ารายละเอียด</span>
      </label>

      <Field formId={formId} label="ลิงก์หรือรหัสอ้างอิง KPI" name="kpiLink" error={fieldError(state, "kpiLink")}>
        <input
          id={controlId(formId, "kpiLink")}
          name="kpiLink"
          defaultValue={initial.kpiLink}
          className={inputClass}
          aria-invalid={Boolean(fieldError(state, "kpiLink"))}
          aria-describedby={describedBy(formId, "kpiLink", state)}
        />
      </Field>

      <Field formId={formId} label="รายละเอียด" name="detail" error={fieldError(state, "detail")}>
        <textarea
          id={controlId(formId, "detail")}
          name="detail"
          rows={4}
          defaultValue={initial.detail}
          className={inputClass}
          aria-invalid={Boolean(fieldError(state, "detail"))}
          aria-describedby={describedBy(formId, "detail", state)}
        />
      </Field>

      <Field formId={formId} label="หมายเหตุ" name="remark" error={fieldError(state, "remark")}>
        <textarea
          id={controlId(formId, "remark")}
          name="remark"
          rows={3}
          defaultValue={initial.remark}
          className={inputClass}
          aria-invalid={Boolean(fieldError(state, "remark"))}
          aria-describedby={describedBy(formId, "remark", state)}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-gold px-4 py-2 font-medium text-background disabled:opacity-60"
      >
        {pending ? "กำลังบันทึก..." : submitLabel}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-background px-3 py-2 text-foreground";

function describedBy(formId: string, name: string, state: FormState): string | undefined {
  return fieldError(state, name) ? errorId(formId, name) : undefined;
}

function Field({
  formId,
  label,
  name,
  error,
  required,
  children,
}: {
  formId: string;
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={controlId(formId, name)} className="text-sm font-medium">
        {label}
        {required ? <span className="text-gold"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={errorId(formId, name)} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
