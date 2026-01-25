import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required." });
  }

  try {
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
      [email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user });
  } catch (error) {
    console.error("Register failed:", error);
    return res.status(503).json({ error: "Database unavailable. Try again soon." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required." });
  }

  try {
    const result = await query(
      "SELECT id, email, role, password_hash, banned FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const user = result.rows[0];
    if (user.banned) {
      return res.status(403).json({ error: "User is banned." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(503).json({ error: "Database unavailable. Try again soon." });
  }
});

export default router;
