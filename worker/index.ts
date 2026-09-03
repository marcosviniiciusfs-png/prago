const MAX_BODY_BYTES = 16 * 1024;
const META_GRAPH_VERSION = "v26.0";

type JsonObject = Record<string, unknown>;

type LeadEvent = {
  event_name: "Lead";
  event_id: string;
  event_source_url: string;
  user_data: {
    ph: string;
    fn: string;
    ct: string;
    fbp?: string;
    fbc?: string;
  };
  custom_data?: {
    content_name?: string;
    lead_type?: string;
  };
};

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "prago-lead-api" }, 200);
    }

    const origin = request.headers.get("Origin");
    const corsHeaders = getCorsHeaders(origin, env.ALLOWED_ORIGINS);

    if (request.method === "OPTIONS" && url.pathname === "/lead") {
      return corsHeaders
        ? new Response(null, { status: 204, headers: corsHeaders })
        : json({ ok: false, error: "origin_not_allowed" }, 403);
    }

    if (request.method !== "POST" || url.pathname !== "/lead") {
      return json({ ok: false, error: "not_found" }, 404);
    }

    if (!corsHeaders) {
      return json({ ok: false, error: "origin_not_allowed" }, 403);
    }

    try {
      requireJsonContentType(request);
      const payload = parseLeadEvent(await readJson(request));
      requireAllowedSource(payload.event_source_url, env.ALLOWED_ORIGINS);

      const metaResponse = await sendToMeta(payload, request, env);
      if (!metaResponse.ok) {
        console.error(JSON.stringify({
          event: "meta_capi_rejected",
          eventId: payload.event_id,
          status: metaResponse.status,
          code: metaResponse.code,
          subcode: metaResponse.subcode,
          traceId: metaResponse.traceId,
        }));
        return json({ ok: false, error: "tracking_unavailable" }, 502, corsHeaders);
      }

      console.log(JSON.stringify({ event: "meta_capi_accepted", eventId: payload.event_id }));
      return json({ ok: true }, 200, corsHeaders);
    } catch (error) {
      if (error instanceof HttpError) {
        return json({ ok: false, error: error.code }, error.status, corsHeaders);
      }

      console.error(JSON.stringify({ event: "meta_capi_error", error: safeErrorName(error) }));
      return json({ ok: false, error: "internal_error" }, 500, corsHeaders);
    }
  },
} satisfies ExportedHandler<Env>;

function getCorsHeaders(origin: string | null, configuredOrigins: string): Headers | null {
  if (!origin || !getAllowedOrigins(configuredOrigins).has(origin)) return null;

  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  });
}

function getAllowedOrigins(configuredOrigins: string): Set<string> {
  return new Set(configuredOrigins.split(",").map((value) => value.trim()).filter(Boolean));
}

function requireAllowedSource(sourceUrl: string, configuredOrigins: string): void {
  let sourceOrigin: string;
  try {
    sourceOrigin = new URL(sourceUrl).origin;
  } catch {
    throw new HttpError(400, "invalid_source_url");
  }

  if (!getAllowedOrigins(configuredOrigins).has(sourceOrigin)) {
    throw new HttpError(400, "invalid_source_url");
  }
}

function requireJsonContentType(request: Request): void {
  const contentType = request.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new HttpError(415, "content_type_not_supported");
  }
}

async function readJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("Content-Length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new HttpError(413, "payload_too_large");
  }

  if (!request.body) throw new HttpError(400, "invalid_json");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new HttpError(413, "payload_too_large");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

function parseLeadEvent(value: unknown): LeadEvent {
  if (!isObject(value)) throw new HttpError(400, "invalid_payload");
  if (value.event_name !== "Lead") throw new HttpError(400, "invalid_event_name");

  const eventId = getRequiredString(value, "event_id", 8, 128);
  const eventSourceUrl = getRequiredString(value, "event_source_url", 8, 2048);
  if (!isObject(value.user_data)) throw new HttpError(400, "invalid_user_data");

  const userData = {
    ph: getRequiredString(value.user_data, "ph", 10, 20),
    fn: getRequiredString(value.user_data, "fn", 1, 100),
    ct: getRequiredString(value.user_data, "ct", 2, 120),
    fbp: getOptionalString(value.user_data, "fbp", 512),
    fbc: getOptionalString(value.user_data, "fbc", 512),
  };

  const customData = isObject(value.custom_data)
    ? {
        content_name: getOptionalString(value.custom_data, "content_name", 200),
        lead_type: getOptionalString(value.custom_data, "lead_type", 100),
      }
    : undefined;

  return {
    event_name: "Lead",
    event_id: eventId,
    event_source_url: eventSourceUrl,
    user_data: userData,
    custom_data: customData,
  };
}

async function sendToMeta(
  payload: LeadEvent,
  request: Request,
  env: Env,
): Promise<{ ok: boolean; status: number; code?: number; subcode?: number; traceId?: string }> {
  const phone = normalizePhone(payload.user_data.ph);
  if (!phone) throw new HttpError(400, "invalid_phone");

  const userData: JsonObject = {
    ph: await sha256(phone),
    fn: await sha256(normalizeText(payload.user_data.fn)),
    ct: await sha256(normalizeText(payload.user_data.ct)),
    client_ip_address: request.headers.get("CF-Connecting-IP"),
    client_user_agent: request.headers.get("User-Agent"),
  };

  if (payload.user_data.fbp) userData.fbp = payload.user_data.fbp;
  if (payload.user_data.fbc) userData.fbc = payload.user_data.fbc;

  const response = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(env.META_PIXEL_ID)}/events`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.META_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [{
          event_name: payload.event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: payload.event_id,
          event_source_url: payload.event_source_url,
          action_source: "website",
          user_data: removeNullValues(userData),
          custom_data: removeNullValues(payload.custom_data ?? {}),
        }],
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );

  const result = await parseMetaResponse(response);
  return {
    ok: response.ok && result.eventsReceived > 0,
    status: response.status,
    code: result.code,
    subcode: result.subcode,
    traceId: result.traceId,
  };
}

async function parseMetaResponse(response: Response): Promise<{
  eventsReceived: number;
  code?: number;
  subcode?: number;
  traceId?: string;
}> {
  try {
    const value: unknown = await response.json();
    if (!isObject(value)) return { eventsReceived: 0 };

    const error = isObject(value.error) ? value.error : undefined;
    return {
      eventsReceived: typeof value.events_received === "number" ? value.events_received : 0,
      code: error && typeof error.code === "number" ? error.code : undefined,
      subcode: error && typeof error.error_subcode === "number" ? error.error_subcode : undefined,
      traceId: error && typeof error.fbtrace_id === "string" ? error.fbtrace_id : undefined,
    };
  } catch {
    return { eventsReceived: 0 };
  }
}

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const withCountryCode = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return withCountryCode.length >= 12 && withCountryCode.length <= 15 ? withCountryCode : null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function removeNullValues(value: JsonObject): JsonObject {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry != null && entry !== ""));
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRequiredString(value: JsonObject, key: string, min: number, max: number): string {
  const entry = value[key];
  if (typeof entry !== "string") throw new HttpError(400, "invalid_payload");
  const trimmed = entry.trim();
  if (trimmed.length < min || trimmed.length > max) throw new HttpError(400, "invalid_payload");
  return trimmed;
}

function getOptionalString(value: JsonObject, key: string, max: number): string | undefined {
  const entry = value[key];
  if (entry == null || entry === "") return undefined;
  if (typeof entry !== "string") throw new HttpError(400, "invalid_payload");
  const trimmed = entry.trim();
  if (trimmed.length > max) throw new HttpError(400, "invalid_payload");
  return trimmed || undefined;
}

function json(
  body: JsonObject,
  status: number,
  extraHeaders?: Headers,
): Response {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { status, headers });
}

function safeErrorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}
