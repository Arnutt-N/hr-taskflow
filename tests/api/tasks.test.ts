import { afterEach, describe, expect, it } from "vitest";

import { issueApiToken } from "../../src/lib/auth/issue-token";
import { hashToken } from "../../src/lib/auth/tokens";
import { createTask, getTask, listTasks, updateTask } from "../../src/lib/tasks/handlers";
import type {
  ApiTokenRecord,
  TaskPatch,
  TaskRecord,
  TaskSearch,
  TaskStore,
  TaskWrite,
  TokenStore,
} from "../../src/lib/tasks/types";

class MemoryTokens implements TokenStore {
  records: ApiTokenRecord[] = [];

  async findByHash(tokenHash: string) {
    return this.records.find((record) => record.tokenHash === tokenHash) ?? null;
  }

  async touch(id: string, at: Date) {
    const record = this.records.find((item) => item.id === id);
    if (record) {
      record.lastUsedAt = at;
    }
  }

  async create(input: { name: string; tokenHash: string; tokenPrefix: string }) {
    const record: ApiTokenRecord = {
      id: `tok_${this.records.length + 1}`,
      name: input.name,
      tokenHash: input.tokenHash,
      tokenPrefix: input.tokenPrefix,
      createdAt: new Date("2026-10-12T00:00:00.000Z"),
      lastUsedAt: null,
      revokedAt: null,
    };
    this.records.push(record);
    return record;
  }
}

class MemoryTasks implements TaskStore {
  records: TaskRecord[] = [];

  async create(input: TaskWrite) {
    const now = new Date("2026-10-12T01:00:00.000Z");
    const record: TaskRecord = {
      id: `task_${this.records.length + 1}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.records.push(record);
    return record;
  }

  async update(id: string, patch: TaskPatch) {
    const record = this.records.find((item) => item.id === id);
    if (!record) {
      return null;
    }
    Object.assign(record, patch, { updatedAt: new Date("2026-10-12T02:00:00.000Z") });
    return record;
  }

  async findById(id: string) {
    return this.records.find((item) => item.id === id) ?? null;
  }

  async search(query: TaskSearch) {
    const needle = query.documentNumber?.toLowerCase();
    const matched = this.records.filter((task) => {
      if (needle && !task.documentNumber.toLowerCase().includes(needle)) {
        return false;
      }
      if (query.status && task.status !== query.status) {
        return false;
      }
      if (query.documentType && task.documentType !== query.documentType) {
        return false;
      }
      return true;
    });
    matched.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    return {
      items: matched.slice(query.offset, query.offset + query.limit),
      total: matched.length,
    };
  }
}

const validBody = {
  title: "ดำเนินการคำสั่งเลื่อน",
  documentNumber: "มท 0201/1234",
  documentDate: "2026-10-01",
  documentType: "PROMOTION_ORDER",
  source: "edoc",
  dueDate: "2026-11-01",
  deadlineInferred: true,
  confidential: false,
  kpiLink: "KPI-HR-12",
  detail: "ตรวจเอกสารประกอบ",
};

function jsonRequest(url: string, method: string, token: string | null, body?: unknown): Request {
  const headers = new Headers();
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  if (body !== undefined) {
    headers.set("content-type", "application/json");
  }
  return new Request(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("task API", () => {
  const originalAdmin = process.env.ADMIN_TOKEN;

  afterEach(() => {
    if (originalAdmin === undefined) {
      delete process.env.ADMIN_TOKEN;
    } else {
      process.env.ADMIN_TOKEN = originalAdmin;
    }
  });

  it("requires a bearer token", async () => {
    const deps = { tasks: new MemoryTasks(), tokens: new MemoryTokens() };
    const response = await createTask(jsonRequest("http://localhost/api/tasks", "POST", null, validBody), deps);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "unauthorized" },
    });
  });

  it("rejects an unknown or revoked token", async () => {
    const tokens = new MemoryTokens();
    const created = await tokens.create({
      name: "revoked",
      tokenHash: hashToken("hrtf_revoked"),
      tokenPrefix: "hrtf_revoke",
    });
    created.revokedAt = new Date();
    const deps = { tasks: new MemoryTasks(), tokens };

    const unknown = await getTask(
      jsonRequest("http://localhost/api/tasks/task_1", "GET", "hrtf_missing"),
      "task_1",
      deps,
    );
    expect(unknown.status).toBe(401);

    const revoked = await getTask(
      jsonRequest("http://localhost/api/tasks/task_1", "GET", "hrtf_revoked"),
      "task_1",
      deps,
    );
    expect(revoked.status).toBe(401);
  });

  it("creates a task and returns the saved document fields", async () => {
    const deps = await authedDeps();
    const response = await createTask(
      jsonRequest("http://localhost/api/tasks", "POST", deps.rawToken, validBody),
      deps,
    );
    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.data).toMatchObject({
      title: "ดำเนินการคำสั่งเลื่อน",
      documentNumber: "มท 0201/1234",
      documentDate: "2026-10-01",
      documentType: "PROMOTION_ORDER",
      source: "edoc",
      deadlineInferred: true,
      kpiLink: "KPI-HR-12",
      status: "waiting",
    });
    expect(deps.tokens.records[0]?.tokenHash).toBe(hashToken(deps.rawToken));
    expect(deps.tokens.records[0]?.tokenHash).not.toBe(deps.rawToken);
    expect(deps.tokens.records[0]?.lastUsedAt).toBeInstanceOf(Date);
  });

  it("returns field errors for missing and invalid input", async () => {
    const deps = await authedDeps();
    const response = await createTask(
      jsonRequest("http://localhost/api/tasks", "POST", deps.rawToken, {
        title: "",
        documentType: "ลาออก",
        source: "fax",
        documentDate: "2026-02-31",
        extra: true,
      }),
      deps,
    );
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error.code).toBe("validation_error");
    expect(payload.error.fields.title?.[0]).toMatch(/required/i);
    expect(payload.error.fields.documentNumber?.[0]).toMatch(/required/i);
    expect(payload.error.fields.documentType?.[0]).toMatch(/PROMOTION_ORDER/);
    expect(payload.error.fields.source?.[0]).toMatch(/edoc or paper/);
    expect(payload.error.fields.documentDate?.[0]).toMatch(/calendar date/i);
    expect(payload.error.formErrors.join(" ")).toMatch(/Unrecognized key/);
  });

  it("rejects a non-JSON body", async () => {
    const deps = await authedDeps();
    const response = await createTask(
      new Request("http://localhost/api/tasks", {
        method: "POST",
        headers: {
          authorization: `Bearer ${deps.rawToken}`,
          "content-type": "text/plain",
        },
        body: "nope",
      }),
      deps,
    );
    expect(response.status).toBe(415);
  });

  it("updates only the fields that were sent", async () => {
    const deps = await authedDeps();
    const created = await createTask(
      jsonRequest("http://localhost/api/tasks", "POST", deps.rawToken, validBody),
      deps,
    );
    const id = (await created.json()).data.id as string;

    const response = await updateTask(
      jsonRequest(`http://localhost/api/tasks/${id}`, "PATCH", deps.rawToken, {
        status: "in_process",
        confidential: true,
      }),
      id,
      deps,
    );
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.status).toBe("in_process");
    expect(payload.data.confidential).toBe(true);
    expect(payload.data.documentNumber).toBe("มท 0201/1234");
    expect(payload.data.title).toBe("ดำเนินการคำสั่งเลื่อน");
  });

  it("rejects an empty update and a missing task", async () => {
    const deps = await authedDeps();
    const empty = await updateTask(
      jsonRequest("http://localhost/api/tasks/missing", "PATCH", deps.rawToken, {}),
      "missing",
      deps,
    );
    expect(empty.status).toBe(400);
    await expect(empty.json()).resolves.toMatchObject({
      error: { code: "validation_error" },
    });

    const missing = await updateTask(
      jsonRequest("http://localhost/api/tasks/missing", "PATCH", deps.rawToken, {
        remark: "ติดตามเพิ่ม",
      }),
      "missing",
      deps,
    );
    expect(missing.status).toBe(404);

    const lookup = await getTask(
      jsonRequest("http://localhost/api/tasks/missing", "GET", deps.rawToken),
      "missing",
      deps,
    );
    expect(lookup.status).toBe(404);
  });

  it("filters by document number, status, and type", async () => {
    const deps = await authedDeps();
    await createTask(
      jsonRequest("http://localhost/api/tasks", "POST", deps.rawToken, validBody),
      deps,
    );
    await createTask(
      jsonRequest("http://localhost/api/tasks", "POST", deps.rawToken, {
        ...validBody,
        title: "รับโอนพนักงาน",
        documentNumber: "กข 100/9",
        documentType: "INBOUND_TRANSFER",
        source: "paper",
        status: "done",
        confidential: true,
      }),
      deps,
    );

    const byNumber = await listTasks(
      jsonRequest("http://localhost/api/tasks?documentNumber=กข%20100", "GET", deps.rawToken),
      deps,
    );
    const numberPayload = await byNumber.json();
    expect(byNumber.status).toBe(200);
    expect(numberPayload.page.total).toBe(1);
    expect(numberPayload.data[0].documentType).toBe("INBOUND_TRANSFER");
    expect(numberPayload.data[0].confidential).toBe(true);

    const byStatus = await listTasks(
      jsonRequest("http://localhost/api/tasks?status=waiting&type=PROMOTION_ORDER", "GET", deps.rawToken),
      deps,
    );
    const statusPayload = await byStatus.json();
    expect(statusPayload.page.total).toBe(1);
    expect(statusPayload.data[0].documentNumber).toBe("มท 0201/1234");

    const badStatus = await listTasks(
      jsonRequest("http://localhost/api/tasks?status=archived", "GET", deps.rawToken),
      deps,
    );
    expect(badStatus.status).toBe(400);
  });

  it("issues a token only for the admin secret and never returns the hash", async () => {
    process.env.ADMIN_TOKEN = "admin-secret";
    const tokens = new MemoryTokens();
    const denied = await issueApiToken(
      jsonRequest("http://localhost/api/admin/tokens", "POST", "wrong", { name: "hr-bot" }),
      tokens,
    );
    expect(denied.status).toBe(401);

    const created = await issueApiToken(
      jsonRequest("http://localhost/api/admin/tokens", "POST", "admin-secret", { name: "hr-bot" }),
      tokens,
    );
    expect(created.status).toBe(201);
    const payload = await created.json();
    expect(payload.data.token.startsWith("hrtf_")).toBe(true);
    expect(payload.data.tokenHash).toBeUndefined();
    expect(tokens.records[0]?.tokenHash).toBe(hashToken(payload.data.token));
    expect(JSON.stringify(payload)).not.toContain(tokens.records[0]?.tokenHash ?? "missing-hash");
  });
});

async function authedDeps() {
  process.env.ADMIN_TOKEN = "admin-secret";
  const tokens = new MemoryTokens();
  const tasks = new MemoryTasks();
  const issued = await issueApiToken(
    jsonRequest("http://localhost/api/admin/tokens", "POST", "admin-secret", { name: "hr-bot" }),
    tokens,
  );
  const payload = await issued.json();
  return { tasks, tokens, rawToken: payload.data.token as string };
}
