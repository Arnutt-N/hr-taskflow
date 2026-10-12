# HR Taskflow bot API

Authenticated JSON API for a bot client. Staff screens under `/tasks` do not use these tokens. Tokens are random, shown once, and stored only as SHA-256 hashes.

Base URL examples use `http://localhost:3000`. Send `Authorization: Bearer <token>` on every task route. Do not put the token in a query string.

## Issue a token

There are two ways. Neither writes a token into git.

### CLI

Requires `DATABASE_URL`.

```bash
npm run token:create -- --name "hr-bot"
```

The command prints the raw token once. Store it in the bot's secret manager.

### Admin HTTP route

Set `ADMIN_TOKEN` in the server environment. This value is the admin secret, not a bot token. If it is empty, the route returns `503`.

```bash
curl -sS -X POST http://localhost:3000/api/admin/tokens \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"hr-bot"}'
```

`201` response:

```json
{
  "data": {
    "id": "cm...",
    "name": "hr-bot",
    "tokenPrefix": "hrtf_abc123",
    "token": "hrtf_...",
    "createdAt": "2026-10-12T00:00:00.000Z"
  }
}
```

`token` is returned only in this response.

## Errors

Failed responses use this shape:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Request body failed validation.",
    "fields": {
      "documentType": ["Document type must be one of ..."]
    },
    "formErrors": ["Unrecognized key: \"extra\""]
  }
}
```

`fields` and `formErrors` are omitted when empty.

| HTTP | `error.code` | When |
| --- | --- | --- |
| 400 | `validation_error` | Body or query failed validation |
| 400 | `invalid_json` | Body is not a JSON object |
| 401 | `unauthorized` | Missing, malformed, unknown, or revoked token |
| 404 | `not_found` | Task id does not exist |
| 415 | `unsupported_media_type` | `POST` or `PATCH` without `Content-Type: application/json` |
| 503 | `admin_unconfigured` | `ADMIN_TOKEN` is not set |

## Task object

| Field | Type | Create | Update | Notes |
| --- | --- | --- | --- | --- |
| `id` | string | returned | returned | Server-generated |
| `title` | string | required | optional | 1–500 characters |
| `detail` | string or null | optional | optional | Up to 20,000 characters. `null` clears it |
| `status` | enum | optional | optional | `waiting` (default), `in_process`, `done` |
| `dueDate` | date or null | optional | optional | `YYYY-MM-DD`. `null` clears it |
| `remark` | string or null | optional | optional | Up to 20,000 characters |
| `documentNumber` | string | required | optional | เลขที่หนังสือ. 1–191 characters |
| `documentDate` | date or null | optional | optional | วันที่หนังสือ. `YYYY-MM-DD` |
| `documentType` | enum | required | optional | See table below |
| `source` | enum | required | optional | `edoc` or `paper` |
| `confidential` | boolean | optional | optional | Default `false`. UI masks confidential rows; the API returns the real values to an authenticated bot |
| `deadlineInferred` | boolean | optional | optional | Default `false`. `true` means the deadline was guessed, not stated in the document |
| `kpiLink` | string or null | optional | optional | URL or other reference, up to 2,048 characters |
| `createdAt` | date-time | returned | returned | ISO-8601 |
| `updatedAt` | date-time | returned | returned | ISO-8601 |

`documentType` values and Thai labels:

| Value | Label |
| --- | --- |
| `PROMOTION_ORDER` | คำสั่งเลื่อน |
| `APPOINTMENT` | แต่งตั้ง |
| `TRANSFER` | ย้าย |
| `INBOUND_TRANSFER` | รับโอน |
| `OUTBOUND_TRANSFER` | ให้โอน |
| `RESIGNATION` | ลาออก |
| `POLICY` | นโยบาย |
| `SPECIAL_ASSIGNMENT` | งานมอบหมายพิเศษ |
| `OTHER` | อื่นๆ |

`source`: `edoc` is ระบบสารบรรณ, `paper` is เอกสารกระดาษ.

Unknown JSON keys are rejected. An update body must contain at least one field. Omitted update fields stay unchanged. `null` is allowed only for `detail`, `dueDate`, `remark`, `documentDate`, and `kpiLink`.

## Create task

```bash
curl -sS -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $HR_TASKFLOW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ดำเนินการคำสั่งเลื่อน",
    "detail": "ตรวจเอกสารประกอบ",
    "status": "waiting",
    "dueDate": "2026-11-01",
    "documentNumber": "มท 0201/1234",
    "documentDate": "2026-10-01",
    "documentType": "PROMOTION_ORDER",
    "source": "edoc",
    "confidential": false,
    "deadlineInferred": true,
    "kpiLink": "KPI-HR-12"
  }'
```

`201` body: `{ "data": { ...task } }`.

## Update task

Partial update. This example changes status and marks the document confidential.

```bash
curl -sS -X PATCH http://localhost:3000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $HR_TASKFLOW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_process","confidential":true}'
```

`200` body: `{ "data": { ...task } }`.

## Get task

```bash
curl -sS http://localhost:3000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $HR_TASKFLOW_TOKEN"
```

`200` body: `{ "data": { ...task } }`.

## List and search

Filters are combined with AND. `documentNumber` matches a literal substring (`%`, `_`, and `\` are not wildcards). `type` is an alias of `documentType`; if both are sent they must be equal.

| Query | Meaning |
| --- | --- |
| `documentNumber` | Substring of เลขที่หนังสือ |
| `status` | `waiting`, `in_process`, or `done` |
| `documentType` or `type` | Document type enum |
| `limit` | Integer 1–100, default 50 |
| `offset` | Integer 0–10000, default 0 |

```bash
curl -sS "http://localhost:3000/api/tasks?documentNumber=มท%200201&status=waiting&type=PROMOTION_ORDER" \
  -H "Authorization: Bearer $HR_TASKFLOW_TOKEN"
```

`200` body:

```json
{
  "data": [],
  "page": { "limit": 50, "offset": 0, "total": 0 }
}
```

Results are ordered by `createdAt` descending, then `id` descending.
