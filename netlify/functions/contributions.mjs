import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);

export default async (req) => {
  const store = getStore({ name: "contributions", consistency: "strong" });

  // List all contributions, newest first, with totals
  if (req.method === "GET") {
    const { blobs } = await store.list({ prefix: "c/" });
    const items = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
    items.sort((a, b) => b.at.localeCompare(a.at));
    const total = items.reduce((s, i) => s + i.amount, 0);
    return json({ total, count: items.length, items });
  }

  // Log a contribution
  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }

    const name = clean(body.name, 40);
    const message = clean(body.message, 140);
    const amount = Math.round(Number(body.amount));

    if (!name) return json({ error: "Add your name, or tick Anonymous." }, 400);
    if (!Number.isFinite(amount) || amount < 100) return json({ error: "Enter the amount you sent (at least ₦100)." }, 400);
    if (amount > 5_000_000) return json({ error: "That amount looks too large. Check the figure and try again." }, 400);

    const at = new Date().toISOString();
    const id = `${at}-${Math.random().toString(36).slice(2, 8)}`;
    const item = { id, name, amount, message, at };
    await store.setJSON(`c/${id}`, item);
    return json(item, 201);
  }

  // Remove a bad entry: DELETE /api/contributions?id=<id> with header x-admin-key
  if (req.method === "DELETE") {
    const key = process.env.ADMIN_KEY;
    if (!key || req.headers.get("x-admin-key") !== key) return json({ error: "Not allowed." }, 401);
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return json({ error: "Missing id." }, 400);
    await store.delete(`c/${id}`);
    return json({ deleted: id });
  }

  return json({ error: "Method not allowed." }, 405);
};

export const config = { path: "/api/contributions" };
