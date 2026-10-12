export const taskStatuses = ["waiting", "in_process", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const documentTypes = [
  "PROMOTION_ORDER",
  "APPOINTMENT",
  "TRANSFER",
  "INBOUND_TRANSFER",
  "OUTBOUND_TRANSFER",
  "RESIGNATION",
  "POLICY",
  "SPECIAL_ASSIGNMENT",
  "OTHER",
] as const;
export type DocumentType = (typeof documentTypes)[number];

export const documentSources = ["edoc", "paper"] as const;
export type DocumentSource = (typeof documentSources)[number];

export const taskStatusLabels: Record<TaskStatus, string> = {
  waiting: "รอดำเนินการ",
  in_process: "กำลังดำเนินการ",
  done: "เสร็จสิ้น",
};

export const documentTypeLabels: Record<DocumentType, string> = {
  PROMOTION_ORDER: "คำสั่งเลื่อน",
  APPOINTMENT: "แต่งตั้ง",
  TRANSFER: "ย้าย",
  INBOUND_TRANSFER: "รับโอน",
  OUTBOUND_TRANSFER: "ให้โอน",
  RESIGNATION: "ลาออก",
  POLICY: "นโยบาย",
  SPECIAL_ASSIGNMENT: "งานมอบหมายพิเศษ",
  OTHER: "อื่นๆ",
};

export const documentSourceLabels: Record<DocumentSource, string> = {
  edoc: "ระบบสารบรรณ (e-Doc)",
  paper: "เอกสารกระดาษ",
};

export const statusList = taskStatuses.map((value) => ({
  value,
  label: taskStatusLabels[value],
}));

export const documentTypeList = documentTypes.map((value) => ({
  value,
  label: documentTypeLabels[value],
}));

export const documentSourceList = documentSources.map((value) => ({
  value,
  label: documentSourceLabels[value],
}));
