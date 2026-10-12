import Link from "next/link";

export default function HomePage() {
  return (
    <section className="grid gap-6">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold">ติดตามงานหนังสือบุคลากร</h1>
        <p className="mt-3 text-muted">
          บันทึกเลขที่หนังสือ วันที่หนังสือ ประเภทคำสั่ง และแหล่งที่มา
          ทั้งระบบสารบรรณและเอกสารกระดาษ พร้อมทำเครื่องหมายเอกสารลับและกำหนดส่งที่คาดคะเนไว้
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/tasks"
          className="rounded-md bg-gold px-4 py-2 font-medium text-background"
        >
          เปิดรายการงาน
        </Link>
        <Link href="/tasks/new" className="rounded-md border border-line px-4 py-2">
          บันทึกงานใหม่
        </Link>
      </div>
    </section>
  );
}
