import express from "express";
import { query } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/polls/pending", async (req, res) => {
  const result = await query(
    `
    SELECT polls.*, users.email AS submitter_email
    FROM polls
    LEFT JOIN users ON users.id = polls.created_by
    WHERE polls.status = 'pending'
    ORDER BY polls.created_at DESC
    `
  );
  return res.json(result.rows);
});

router.post("/polls/:pollId/approve", async (req, res) => {
  const { pollId } = req.params;
  const { status } = req.body;
  const nextStatus = status === "rejected" ? "rejected" : "approved";

  const result = await query(
    `
    UPDATE polls
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, status
    `,
    [nextStatus, pollId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Poll not found." });
  }

  return res.json(result.rows[0]);
});

router.delete("/polls/:pollId", async (req, res) => {
  const { pollId } = req.params;
  await query("DELETE FROM polls WHERE id = $1", [pollId]);
  return res.status(204).send();
});

router.post("/users/:userId/ban", async (req, res) => {
  const { userId } = req.params;
  const { banned } = req.body;

  const result = await query(
    `
    UPDATE users
    SET banned = $1
    WHERE id = $2
    RETURNING id, email, banned
    `,
    [Boolean(banned), userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "User not found." });
  }

  return res.json(result.rows[0]);
});

router.get("/users", async (req, res) => {
  const result = await query(
    `
    SELECT id, email, role, banned, created_at
    FROM users
    ORDER BY created_at DESC
    `
  );
  return res.json(result.rows);
});

router.get("/analytics", async (req, res) => {
  const [users, polls, votes] = await Promise.all([
    query("SELECT COUNT(*)::int AS count FROM users"),
    query("SELECT COUNT(*)::int AS count FROM polls"),
    query("SELECT COUNT(*)::int AS count FROM votes")
  ]);

  const activePolls = await query(
    `
    SELECT COUNT(*)::int AS count
    FROM polls
    WHERE status = 'approved'
      AND (ends_at IS NULL OR ends_at > NOW())
    `
  );

  return res.json({
    users: users.rows[0].count,
    polls: polls.rows[0].count,
    votes: votes.rows[0].count,
    activePolls: activePolls.rows[0].count
  });
});

export default router;
