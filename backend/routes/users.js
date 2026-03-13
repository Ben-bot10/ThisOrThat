import express from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  const result = await query(
    "SELECT id, email, username, name, age, role, created_at, banned FROM users WHERE id = $1",
    [req.user.id]
  );
  return res.json(result.rows[0]);
});

router.get("/me/history", requireAuth, async (req, res) => {
  const result = await query(
    `
    SELECT polls.id, polls.question, polls.type, votes.option, votes.created_at
    FROM votes
    JOIN polls ON polls.id = votes.poll_id
    WHERE votes.user_id = $1
    ORDER BY votes.created_at DESC
    `,
    [req.user.id]
  );
  return res.json(result.rows);
});

router.get("/me/quiz-history", requireAuth, async (req, res) => {
  const result = await query(
    `
    SELECT
      quiz_attempts.id,
      quiz_attempts.score,
      quiz_attempts.total_questions,
      quiz_attempts.time_taken_seconds,
      quiz_attempts.completed_at,
      quizzes.title AS quiz_title
    FROM quiz_attempts
    JOIN quizzes ON quizzes.id = quiz_attempts.quiz_id
    WHERE quiz_attempts.user_id = $1
    ORDER BY quiz_attempts.completed_at DESC
    `,
    [req.user.id]
  );
  return res.json(result.rows);
});

export default router;
