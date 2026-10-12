import type { ZodError } from "zod";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    formErrors?: string[];
  };
};

export function jsonError(
  status: number,
  code: string,
  message: string,
  extra?: { fields?: Record<string, string[]>; formErrors?: string[] },
): Response {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(extra?.fields && Object.keys(extra.fields).length > 0 ? { fields: extra.fields } : {}),
      ...(extra?.formErrors && extra.formErrors.length > 0 ? { formErrors: extra.formErrors } : {}),
    },
  };
  return Response.json(body, { status });
}

export function validationError(error: ZodError): Response {
  const flat = error.flatten();
  return jsonError(400, "validation_error", "Request body failed validation.", {
    fields: flat.fieldErrors as Record<string, string[]>,
    formErrors: flat.formErrors,
  });
}

export async function readJsonObject(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: jsonError(
        415,
        "unsupported_media_type",
        "Content-Type must be application/json.",
      ),
    };
  }

  try {
    const value = await request.json();
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return {
        ok: false,
        response: jsonError(400, "invalid_json", "JSON body must be an object."),
      };
    }
    return { ok: true, value };
  } catch {
    return {
      ok: false,
      response: jsonError(400, "invalid_json", "Request body is not valid JSON."),
    };
  }
}

export function singleQueryValue(
  params: URLSearchParams,
  name: string,
): { ok: true; value?: string } | { ok: false } {
  const values = params.getAll(name).map((value) => value.trim()).filter((value) => value.length > 0);
  if (values.length > 1) {
    return { ok: false };
  }
  return { ok: true, value: values[0] };
}
