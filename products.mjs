import { getStore } from "@netlify/blobs";

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });

export default async (req) => {
  const store = getStore("frip-shop");
  const adminPassword = process.env.ADMIN_PASSWORD;
  const isAdmin = Boolean(adminPassword) && req.headers.get("x-admin-password") === adminPassword;

  if (req.method === "GET") {
    // Un mot de passe envoyé mais incorrect (ou non configuré côté serveur) est refusé.
    if (req.headers.has("x-admin-password") && !isAdmin) return json(401, { error: "unauthorized" });
    const list = (await store.get("products", { type: "json" })) || [];
    // Le prix d'achat est privé : il n'est renvoyé qu'à l'administrateur.
    const publicList = list.map(({ cost, ...rest }) => rest);
    return json(200, isAdmin ? list : publicList);
  }

  if (req.method === "PUT") {
    if (!isAdmin) return json(401, { error: "unauthorized" });
    const body = await req.json();
    if (!Array.isArray(body)) return json(400, { error: "invalid" });
    await store.setJSON("products", body);
    return json(200, { ok: true });
  }

  return json(405, { error: "method not allowed" });
};

export const config = { path: "/api/products" };
