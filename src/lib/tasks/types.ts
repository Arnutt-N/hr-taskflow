import type { DocumentSource, DocumentType, TaskStatus } from "@/lib/tasks/labels";

export type TaskRecord = {
  id: string;
  title: string;
  detail: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  remark: string | null;
  documentNumber: string;
  documentDate: Date | null;
  documentType: DocumentType;
  source: DocumentSource;
  confidential: boolean;
  deadlineInferred: boolean;
  kpiLink: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskWrite = {
  title: string;
  detail: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  remark: string | null;
  documentNumber: string;
  documentDate: Date | null;
  documentType: DocumentType;
  source: DocumentSource;
  confidential: boolean;
  deadlineInferred: boolean;
  kpiLink: string | null;
};

export type TaskPatch = Partial<TaskWrite>;

export type TaskSearch = {
  documentNumber?: string;
  status?: TaskStatus;
  documentType?: DocumentType;
  limit: number;
  offset: number;
};

export type TaskStore = {
  create(input: TaskWrite): Promise<TaskRecord>;
  update(id: string, patch: TaskPatch): Promise<TaskRecord | null>;
  findById(id: string): Promise<TaskRecord | null>;
  search(query: TaskSearch): Promise<{ items: TaskRecord[]; total: number }>;
};

export type ApiTokenRecord = {
  id: string;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

export type TokenStore = {
  findByHash(tokenHash: string): Promise<ApiTokenRecord | null>;
  touch(id: string, at: Date): Promise<void>;
  create(input: { name: string; tokenHash: string; tokenPrefix: string }): Promise<ApiTokenRecord>;
};
