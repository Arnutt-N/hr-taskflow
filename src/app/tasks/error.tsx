"use client";

export default function TasksError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="grid gap-3">
      <h1 className="text-2xl font-semibold">ไม่สามารถโหลดข้อมูลได้</h1>
      <p className="text-muted">ระบบเชื่อมต่อฐานข้อมูลไม่สำเร็จ หรือเกิดข้อผิดพลาดระหว่างอ่านงาน</p>
      <button type="button" onClick={reset} className="w-fit rounded-md border border-line px-3 py-2">
        ลองอีกครั้ง
      </button>
    </section>
  );
}
