"use client";

import { useId, useState } from "react";

import { revealConfidentialTask } from "@/server/task-actions";

type Revealed = {
  documentNumber: string;
  detail: string | null;
  remark: string | null;
  kpiLink: string | null;
};

type ConfidentialBlockProps = {
  taskId: string;
  maskedNumber: string;
};

export function ConfidentialBlock({ taskId, maskedNumber }: ConfidentialBlockProps) {
  const panelId = useId();
  const [revealed, setRevealed] = useState<Revealed | null>(null);
  const [failed, setFailed] = useState(false);
  const open = revealed !== null;

  async function toggle() {
    if (open) {
      setRevealed(null);
      setFailed(false);
      return;
    }
    const result = await revealConfidentialTask(taskId);
    if (!result) {
      setFailed(true);
      return;
    }
    setFailed(false);
    setRevealed(result);
  }

  return (
    <section className="rounded-lg border border-gold/50 bg-gold/10 p-4" aria-label="เอกสารลับ">
      <p className="font-medium text-gold">เอกสารลับ</p>
      <p className="mt-1 text-sm text-muted">
        เลขที่หนังสือ รายละเอียด หมายเหตุ และลิงก์ KPI ถูกซ่อนไว้ในหน้ารายการ
      </p>
      <p className="mt-3 text-sm">เลขที่หนังสือ: {open ? revealed.documentNumber : maskedNumber}</p>
      <button
        type="button"
        className="mt-3 rounded-md border border-gold px-3 py-1.5 text-sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        {open ? "ซ่อนเนื้อหาลับ" : "แสดงเนื้อหาลับ"}
      </button>
      {failed ? <p className="mt-2 text-sm text-danger">ไม่สามารถแสดงเนื้อหาลับได้</p> : null}
      <div id={panelId} hidden={!open} className="mt-4">
        {revealed ? (
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted">รายละเอียด</dt>
              <dd className="whitespace-pre-wrap">{revealed.detail || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">หมายเหตุ</dt>
              <dd className="whitespace-pre-wrap">{revealed.remark || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">KPI</dt>
              <dd className="break-words">{revealed.kpiLink || "—"}</dd>
            </div>
          </dl>
        ) : null}
      </div>
    </section>
  );
}
