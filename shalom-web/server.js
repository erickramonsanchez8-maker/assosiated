const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: "30kb" }));
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));

const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "ADMIN_KEY"];
const missing = required.filter((key) => !process.env[key]);
let pool;
if (!missing.length) {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    charset: "utf8mb4"
  });
}
const dbReady = () => {
  if (!pool) throw new Error("Faltan variables de configuración de la base de datos.");
  return pool;
};
const text = (v, max = 500) => typeof v === "string" ? v.trim().slice(0, max) : "";
const adminOnly = (req, res, next) => {
  const supplied = req.get("x-admin-key") || "";
  if (!process.env.ADMIN_KEY || supplied.length !== process.env.ADMIN_KEY.length ||
      !require("crypto").timingSafeEqual(Buffer.from(supplied), Buffer.from(process.env.ADMIN_KEY))) {
    return res.status(401).json({ error: "Acceso no autorizado." });
  }
  next();
};
app.get("/api/health", async (_req, res) => {
  if (!pool) return res.status(503).json({ ok: false, message: "Falta configurar la base de datos." });
  try { await pool.query("SELECT 1"); res.json({ ok: true }); }
  catch (_e) { res.status(503).json({ ok: false, message: "No se pudo conectar a la base de datos." }); }
});
app.post("/api/orders", async (req, res) => {
  try {
    const db = dbReady();
    const customerName = text(req.body.customerName, 100);
    const phone = text(req.body.phone, 30);
    const fulfilment = text(req.body.fulfilment, 60);
    const address = text(req.body.address, 180);
    const notes = text(req.body.notes, 500);
    const items = req.body.items;
    if (!customerName || !phone || !Array.isArray(items) || !items.length || items.length > 30) {
      return res.status(400).json({ error: "Revisa tu nombre, teléfono y productos." });
    }
    const cleanItems = [];
    for (const item of items) {
      const productId = text(item.id, 80);
      const name = text(item.name, 120);
      const quantity = Number(item.quantity);
      const unitPrice = item.unitPrice == null ? null : Number(item.unitPrice);
      if (!productId || !name || !Number.isInteger(quantity) || quantity < 1 || quantity > 50 ||
          (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 100000))) {
        return res.status(400).json({ error: "Uno de los productos tiene datos inválidos." });
      }
      cleanItems.push({ id: productId, name, quantity, unitPrice });
    }
    const [result] = await db.execute(
      "INSERT INTO orders (customer_name, phone, fulfilment, address, notes, items_json, status) VALUES (?, ?, ?, ?, ?, ?, 'pendiente')",
      [customerName, phone, fulfilment, address, notes, JSON.stringify(cleanItems)]
    );
    res.status(201).json({ ok: true, orderId: result.insertId, message: "Pedido guardado. SHALOM debe confirmar precio y disponibilidad." });
  } catch (e) {
    console.error("No se pudo guardar pedido:", e.message);
    res.status(503).json({ error: "No se pudo guardar el pedido. Inténtalo más tarde o contacta al restaurante." });
  }
});
app.post("/api/reservations", async (req, res) => {
  try {
    const db = dbReady();
    const name = text(req.body.name, 100);
    const phone = text(req.body.phone, 30);
    const email = text(req.body.email, 150);
    const date = text(req.body.date, 10);
    const time = text(req.body.time, 5);
    const guests = Number(req.body.guests);
    const notes = text(req.body.notes, 500);
    if (!name || !phone || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
        !Number.isInteger(guests) || guests < 1 || guests > 30) {
      return res.status(400).json({ error: "Revisa los datos de tu reservación." });
    }
    const requested = new Date(date + "T" + time + ":00");
    if (!Number.isFinite(requested.getTime()) || requested.getTime() < Date.now() - 60000) {
      return res.status(400).json({ error: "Elige una fecha y hora futura." });
    }
    const [result] = await db.execute(
      "INSERT INTO reservations (customer_name, phone, email, reservation_date, reservation_time, guests, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')",
      [name, phone, email, date, time, guests, notes]
    );
    res.status(201).json({ ok: true, reservationId: result.insertId, message: "Solicitud guardada, pendiente de confirmación por SHALOM." });
  } catch (e) {
    console.error("No se pudo guardar reservación:", e.message);
    res.status(503).json({ error: "No se pudo guardar la reservación. Inténtalo más tarde o llama al restaurante." });
  }
});
app.get("/api/admin/orders", adminOnly, async (_req, res) => {
  try {
    const [rows] = await dbReady().query("SELECT id, customer_name, phone, fulfilment, address, notes, items_json, status, created_at FROM orders ORDER BY created_at DESC LIMIT 300");
    res.json(rows.map(r => ({ ...r, items: JSON.parse(r.items_json), items_json: undefined })));
  } catch (_e) { res.status(503).json({ error: "No se pudieron cargar los pedidos." }); }
});
app.get("/api/admin/reservations", adminOnly, async (_req, res) => {
  try {
    const [rows] = await dbReady().query("SELECT id, customer_name, phone, email, reservation_date, reservation_time, guests, notes, status, created_at FROM reservations ORDER BY reservation_date DESC, reservation_time DESC LIMIT 300");
    res.json(rows);
  } catch (_e) { res.status(503).json({ error: "No se pudieron cargar las reservaciones." }); }
});
app.patch("/api/admin/orders/:id/status", adminOnly, async (req, res) => {
  const status = text(req.body.status, 30);
  if (!["pendiente", "confirmado", "en preparación", "listo", "entregado", "cancelado"].includes(status)) return res.status(400).json({ error: "Estado inválido." });
  try { const [r] = await dbReady().execute("UPDATE orders SET status=? WHERE id=?", [status, Number(req.params.id)]); if (!r.affectedRows) return res.status(404).json({ error: "Pedido no encontrado." }); res.json({ ok: true }); }
  catch (_e) { res.status(503).json({ error: "No se pudo actualizar el pedido." }); }
});
app.patch("/api/admin/reservations/:id/status", adminOnly, async (req, res) => {
  const status = text(req.body.status, 30);
  if (!["pendiente", "confirmada", "rechazada", "cancelada", "atendida"].includes(status)) return res.status(400).json({ error: "Estado inválido." });
  try { const [r] = await dbReady().execute("UPDATE reservations SET status=? WHERE id=?", [status, Number(req.params.id)]); if (!r.affectedRows) return res.status(404).json({ error: "Reservación no encontrada." }); res.json({ ok: true }); }
  catch (_e) { res.status(503).json({ error: "No se pudo actualizar la reservación." }); }
});
app.use(express.static(path.join(__dirname)));
app.use((err, _req, res, _next) => { console.error(err.message); res.status(400).json({ error: "Solicitud no válida." }); });
const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => console.log("SHALOM escuchando en puerto " + port));
