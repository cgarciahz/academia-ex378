import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

interface ProgressPayload {
  state: Record<string, unknown>;
  updatedAt: string;
}

function sanitizeCode(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (cleaned.length < 3 || cleaned.length > 64) return null;
  return cleaned;
}

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const store = getStore("ex378-progress");

  if (req.method === "GET" && url.searchParams.get("list") === "1") {
    const { blobs } = await store.list({ prefix: "profile/" });
    const profiles = await Promise.all(
      blobs.slice(0, 50).map(async (b) => {
        const code = b.key.replace(/^profile\//, "");
        const data = (await store.get(b.key, { type: "json" })) as ProgressPayload | null;
        if (!data || !data.state) {
          return { code, updatedAt: null, state: null };
        }
        return { code, updatedAt: data.updatedAt, state: data.state };
      })
    );
    return Response.json({ profiles });
  }

  const code = sanitizeCode(url.searchParams.get("code"));

  if (!code) {
    return Response.json(
      { error: "Código de sincronización inválido (mínimo 3 caracteres alfanuméricos, guiones o _)." },
      { status: 400 }
    );
  }

  const key = `profile/${code}`;

  if (req.method === "GET") {
    const data = (await store.get(key, { type: "json" })) as ProgressPayload | null;
    if (!data) {
      return Response.json({ found: false }, { status: 404 });
    }
    return Response.json({ found: true, state: data.state, updatedAt: data.updatedAt });
  }

  if (req.method === "PUT" || req.method === "POST") {
    let body: { state?: Record<string, unknown> };
    try {
      body = (await req.json()) as { state?: Record<string, unknown> };
    } catch {
      return Response.json({ error: "JSON inválido" }, { status: 400 });
    }

    if (!body || typeof body.state !== "object" || body.state === null) {
      return Response.json({ error: "Falta el objeto state" }, { status: 400 });
    }

    const payload: ProgressPayload = {
      state: body.state,
      updatedAt: new Date().toISOString(),
    };

    await store.setJSON(key, payload);
    return Response.json({ ok: true, updatedAt: payload.updatedAt });
  }

  return Response.json({ error: "Método no permitido" }, { status: 405 });
};

export const config: Config = {
  path: "/api/progress",
  method: ["GET", "PUT", "POST"],
};
