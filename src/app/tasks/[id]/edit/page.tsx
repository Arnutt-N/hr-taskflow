import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TaskForm, type TaskFormValues } from "@/components/task-form";
import { formatDateOnly } from "@/lib/tasks/schema";
import { prismaTaskStore } from "@/lib/tasks/prisma-store";
import { updateTaskAction } from "@/server/task-actions";

type PageProps = { params: Promise<{ id: string }> };

export const metadata = { title: "แก้ไขงาน" };

export default function EditTaskPage({ params }: PageProps) {
  return (
    <Suspense fallback={<p className="text-muted">กำลังโหลดแบบฟอร์ม...</p>}>
      <EditTask params={params} />
    </Suspense>
  );
}

async function EditTask({ params }: PageProps) {
  const { id } = await params;
  const task = await prismaTaskStore.findById(id);
  if (!task) {
    notFound();
  }

  const initial: TaskFormValues = {
    title: task.title,
    detail: task.detail ?? "",
    status: task.status,
    dueDate: formatDateOnly(task.dueDate) ?? "",
    remark: task.remark ?? "",
    documentNumber: task.documentNumber,
    documentDate: formatDateOnly(task.documentDate) ?? "",
    documentType: task.documentType,
    source: task.source,
    confidential: task.confidential,
    deadlineInferred: task.deadlineInferred,
    kpiLink: task.kpiLink ?? "",
  };
  const action = updateTaskAction.bind(null, task.id);

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold">แก้ไขงาน</h1>
        <p className="mt-1 text-sm text-muted">{task.title}</p>
      </div>
      <TaskForm action={action} initial={initial} submitLabel="บันทึกการแก้ไข" />
    </section>
  );
}
