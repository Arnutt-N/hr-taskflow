import Link from "next/link";
import { Suspense } from "react";

import {
  documentSourceLabels,
  documentTypeLabels,
  documentTypeList,
  statusList,
  taskStatusLabels,
} from "@/lib/tasks/labels";
import { displayDate } from "@/lib/tasks/schema";
import { maskDocumentNumber } from "@/lib/tasks/serialize";
import { prismaTaskStore } from "@/lib/tasks/prisma-store";
import type { DocumentType, TaskStatus } from "@/lib/tasks/labels";

export const metadata = { title: "รายการงาน" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function TasksPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">รายการงาน</h1>
          <p className="mt-1 text-sm text-muted">กรองตามเลขที่หนังสือ สถานะ และประเภทหนังสือ</p>
        </div>
        <Link href="/tasks/new" className="rounded-md bg-gold px-3 py-2 text-sm font-medium text-background">
          เพิ่มงาน
        </Link>
      </div>
      <Suspense fallback={<p className="text-muted">กำลังโหลดตัวกรอง...</p>}>
        <TaskFilters searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p className="text-muted">กำลังโหลดรายการงาน...</p>}>
        <TaskTable searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

const pageSize = 20;

async function TaskFilters({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readFilters(searchParams);
  return (
      <form
        key={`${filters.documentNumber}|${filters.statusFilter ?? ""}|${filters.typeFilter ?? ""}`}
        method="get"
        className="grid gap-3 rounded-lg border border-line bg-card p-4 md:grid-cols-4"
      >
        <label className="grid gap-1 text-sm">
          เลขที่หนังสือ
          <input
            name="documentNumber"
            defaultValue={filters.documentNumber}
            className="rounded-md border border-line bg-background px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          สถานะ
          <select
            name="status"
            defaultValue={filters.statusFilter ?? ""}
            className="rounded-md border border-line bg-background px-3 py-2"
          >
            <option value="">ทั้งหมด</option>
            {statusList.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          ประเภทหนังสือ
          <select
            name="documentType"
            defaultValue={filters.typeFilter ?? ""}
            className="rounded-md border border-line bg-background px-3 py-2"
          >
            <option value="">ทั้งหมด</option>
            {documentTypeList.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className="rounded-md border border-line px-3 py-2 text-sm">
            กรอง
          </button>
        </div>
      </form>
  );
}

async function TaskTable({ searchParams }: { searchParams: SearchParams }) {
  const filters = await readFilters(searchParams);
  const result = await prismaTaskStore.search({
    documentNumber: filters.documentNumber || undefined,
    status: filters.statusFilter,
    documentType: filters.typeFilter,
    limit: pageSize,
    offset: filters.offset,
  });
  const shownFrom = result.total === 0 ? 0 : filters.offset + 1;
  const shownTo = filters.offset + result.items.length;

  return (
    <>
      {result.total === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-muted">
          ยังไม่มีงานที่ตรงกับเงื่อนไข
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <caption className="sr-only">รายการงานหนังสือบุคลากร</caption>
            <thead className="bg-card text-left">
              <tr>
                <th className="px-3 py-2 font-medium">เลขที่หนังสือ</th>
                <th className="px-3 py-2 font-medium">ชื่องาน</th>
                <th className="px-3 py-2 font-medium">ประเภท</th>
                <th className="px-3 py-2 font-medium">สถานะ</th>
                <th className="px-3 py-2 font-medium">กำหนดส่ง</th>
                <th className="px-3 py-2 font-medium">แหล่งที่มา</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((task) => (
                <tr key={task.id} className="border-t border-line">
                  <td className="px-3 py-3">
                    {task.confidential ? (
                      <span>
                        <span className="mr-2 rounded bg-gold/20 px-1.5 py-0.5 text-xs text-gold">ลับ</span>
                        {maskDocumentNumber(task.documentNumber)}
                      </span>
                    ) : (
                      task.documentNumber
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/tasks/${task.id}`} className="underline-offset-4 hover:underline">
                      {task.title}
                    </Link>
                    {task.confidential ? (
                      <p className="text-xs text-muted">ซ่อนรายละเอียดเพราะเป็นเอกสารลับ</p>
                    ) : task.detail ? (
                      <p className="line-clamp-2 text-xs text-muted">{task.detail}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">{documentTypeLabels[task.documentType]}</td>
                  <td className="px-3 py-3">{taskStatusLabels[task.status]}</td>
                  <td className="px-3 py-3">
                    {displayDate(task.dueDate)}
                    {task.deadlineInferred ? (
                      <span className="mt-1 block text-xs text-gold">โดยประมาณ</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">{documentSourceLabels[task.source]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result.total > pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted">
            แสดง {shownFrom}–{shownTo} จาก {result.total} งาน
          </p>
          <div className="flex gap-3">
            {filters.offset > 0 ? (
              <Link href={filterHref(filters, Math.max(0, filters.offset - pageSize))}>ก่อนหน้า</Link>
            ) : null}
            {shownTo < result.total ? (
              <Link href={filterHref(filters, filters.offset + pageSize)}>ถัดไป</Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

async function readFilters(searchParams: SearchParams) {
  const params = await searchParams;
  const documentNumber = first(params.documentNumber);
  const status = first(params.status);
  const documentType = first(params.type) || first(params.documentType);
  const offsetValue = Number(first(params.offset) || "0");
  return {
    documentNumber,
    statusFilter: statusList.some((item) => item.value === status) ? (status as TaskStatus) : undefined,
    typeFilter: documentTypeList.some((item) => item.value === documentType)
      ? (documentType as DocumentType)
      : undefined,
    offset: Number.isInteger(offsetValue) && offsetValue > 0 ? offsetValue : 0,
  };
}

function filterHref(
  filters: {
    documentNumber: string;
    statusFilter?: TaskStatus;
    typeFilter?: DocumentType;
  },
  offset: number,
): string {
  const params = new URLSearchParams();
  if (filters.documentNumber) params.set("documentNumber", filters.documentNumber);
  if (filters.statusFilter) params.set("status", filters.statusFilter);
  if (filters.typeFilter) params.set("documentType", filters.typeFilter);
  if (offset > 0) params.set("offset", String(offset));
  const query = params.toString();
  return query ? `/tasks?${query}` : "/tasks";
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return value?.trim() ?? "";
}
