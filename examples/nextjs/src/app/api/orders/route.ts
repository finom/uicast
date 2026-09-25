// Stands in for your API: 23 orders in memory.
const orders = Array.from({ length: 23 }, (_, i) => ({
  id: 1023 - i,
  customer: ["Ada", "Grace", "Alan", "Edsger", "Barbara"][i % 5],
  total: 20 + ((i * 37) % 180),
  status: i % 4 === 0 ? "refunded" : "open",
}));

export function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const page = Number(params.get("page") ?? 1);
  const status = params.get("status") ?? "all";
  const rows = orders.filter((o) => status === "all" || o.status === status);
  return Response.json({
    orders: rows.slice((page - 1) * 10, page * 10),
    pageCount: Math.max(1, Math.ceil(rows.length / 10)),
  });
}
