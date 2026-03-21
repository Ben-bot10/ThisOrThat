import express from "express";
import { query } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const [voters, quizzers] = await Promise.all([
    query(`
      SELECT
        users.id AS user_id,
        users.username,
        users.name,
        COUNT(votes.id)::int AS vote_count
      FROM users
      JOIN votes ON votes.user_id = users.id
      WHERE users.banned = false
      GROUP BY users.id
      ORDER BY vote_count DESC
      LIMIT 10
    `),
    query(`
      SELECT
        users.id AS user_id,
        users.username,
        users.name,
        ROUND(AVG(quiz_attempts.score::float / quiz_attempts.total_questions * 100))::int AS avg_score,
        COUNT(quiz_attempts.id)::int AS attempt_count
      FROM users
      JOIN quiz_attempts ON quiz_attempts.user_id = users.id
      WHERE users.banned = false
      GROUP BY users.id
      HAVING COUNT(quiz_attempts.id) >= 1
      ORDER BY avg_score DESC
      LIMIT 10
    `)
  ]);

  return res.json({
    topVoters: voters.rows,
    topQuizzers: quizzers.rows
  });
});

export default router;
