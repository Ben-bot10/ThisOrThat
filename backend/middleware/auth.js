import jwt from "jsonwebtoken";
import { query } from "../db.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing auth token." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      "SELECT id, email, role, banned FROM users WHERE id = $1",
      [payload.id]
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid auth token." });
    }
    const user = result.rows[0];
    if (user.banned) {
      return res.status(403).json({ error: "User is banned." });
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid auth token." });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  return next();
}
