import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ConfidentialBlock } from "@/components/confidential-block";
import {
  documentSourceLabels,
  documentTypeLabels,
  taskStatusLabels,
} from "@/lib/tasks/labels";
import { displayDate } from "@/lib/tasks/schema";
import { maskDocumentNumber } from "@/lib/tasks/serialize";
import { prismaTaskStore } from "@/lib/tasks/prisma-store";

type PageProps = { params: Promise<{ id: string }> };

export const metadata = { title: "รายละเอียดงาน" };

export default function TaskDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={<p className="text-muted">กำลังโหลดรายละเอียดงาน...</p>}>
      <TaskDetail params={params} />
    </Suspense>
  );
}

async function TaskDetail({ params }: PageProps) {
  const { id } = await params;
  const task = await prismaTaskStore.findById(id);
  if (!task) {
    notFound();
  }

  return (
    <article className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gold">{documentTypeLabels[task.documentType]}</p>
          <h1 className="mt-1 text-2xl font-semibold">{task.title}</h1>
        </div>
        <Link href={`/tasks/${task.id}/edit`} className="rounded-md border border-line px-3 py-2 text-sm">
          แก้ไข
        </Link>
      </div>

      <dl className="grid gap-4 rounded-lg border border-line bg-card p-4 sm:grid-cols-2">
        <Item label="สถานะ" value={taskStatusLabels[task.status]} />
        <Item label="แหล่งที่มา" value={documentSourceLabels[task.source]} />
        <Item label="วันที่หนังสือ" value={displayDate(task.documentDate)} />
        <div>
          <dt className="text-sm text-muted">กำหนดส่ง</dt>
          <dd className="mt-1">
            {displayDate(task.dueDate)}
            {task.deadlineInferred ? (
              <span className="ml-2 rounded bg-gold/20 px-1.5 py-0.5 text-xs text-gold">
                กำหนดส่งโดยประมาณ
              </span>
            ) : null}
          </dd>
        </div>
        {task.confidential ? null : (
          <>
            <Item label="เลขที่หนังสือ" value={task.documentNumber} />
            <Item label="KPI" value={task.kpiLink || "—"} />
          </>
        )}
      </dl>

      {task.confidential ? (
        <ConfidentialBlock taskId={task.id} maskedNumber={maskDocumentNumber(task.documentNumber)} />
      ) : (
        <section className="grid gap-4">
          <div>
            <h2 className="text-sm text-muted">รายละเอียด</h2>
            <p className="mt-1 whitespace-pre-wrap">{task.detail || "—"}</p>
          </div>
          <div>
            <h2 className="text-sm text-muted">หมายเหตุ</h2>
            <p className="mt-1 whitespace-pre-wrap">{task.remark || "—"}</p>
          </div>
        </section>
      )}
    </article>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}
