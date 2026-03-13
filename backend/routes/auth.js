import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  const { email, username, name, age, password } = req.body;

  if (!email || !username || !name || !password) {
    return res.status(400).json({ error: "Email, username, name, and password are required." });
  }

  if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: "Username must be at least 3 characters (letters, numbers, underscores)." });
  }

  try {
    const existingEmail = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingEmail.rowCount > 0) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const existingUsername = await query("SELECT id FROM users WHERE username = $1", [username.toLowerCase()]);
    if (existingUsername.rowCount > 0) {
      return res.status(409).json({ error: "Username already taken." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, username, name, age, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, 'user')
       RETURNING id, email, username, name, role`,
      [email, username.toLowerCase(), name, age || null, passwordHash]
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
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Username/email and password required." });
  }

  try {
    const result = await query(
      `SELECT id, email, username, name, role, password_hash, banned
       FROM users
       WHERE email = $1 OR username = $1`,
      [identifier.toLowerCase()]
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
    return res.json({
      token,
      user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(503).json({ error: "Database unavailable. Try again soon." });
  }
});

export default router;
