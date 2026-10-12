import { TaskForm } from "@/components/task-form";
import { createTaskAction } from "@/server/task-actions";

export const metadata = { title: "เพิ่มงาน" };

export default function NewTaskPage() {
  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold">เพิ่มงาน</h1>
        <p className="mt-1 text-sm text-muted">กรอกข้อมูลหนังสือและงานที่ต้องติดตาม</p>
      </div>
      <TaskForm action={createTaskAction} submitLabel="บันทึกงาน" resetAfterSuccess />
    </section>
  );
}
