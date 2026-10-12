import Link from "next/link";

export default function TaskNotFound() {
  return (
    <section className="grid gap-3">
      <h1 className="text-2xl font-semibold">ไม่พบงาน</h1>
      <p className="text-muted">ไม่มีงานตามรหัสที่เปิดอยู่</p>
      <Link href="/tasks" className="w-fit underline-offset-4 hover:underline">
        กลับไปรายการงาน
      </Link>
    </section>
  );
}
