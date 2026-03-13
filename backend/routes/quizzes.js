import express from "express";
import { query, withTransaction } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const result = await query(
    `
    SELECT
      quizzes.*,
      users.username AS creator_username,
      users.name AS creator_name,
      (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = quizzes.id) AS question_count
    FROM quizzes
    LEFT JOIN users ON users.id = quizzes.created_by
    ORDER BY quizzes.created_at DESC
    `
  );
  return res.json(result.rows);
});

router.get("/:quizId", async (req, res) => {
  const { quizId } = req.params;

  const quizResult = await query(
    `
    SELECT
      quizzes.*,
      users.username AS creator_username,
      users.name AS creator_name
    FROM quizzes
    LEFT JOIN users ON users.id = quizzes.created_by
    WHERE quizzes.id = $1
    `,
    [quizId]
  );

  if (quizResult.rowCount === 0) {
    return res.status(404).json({ error: "Quiz not found." });
  }

  const questions = await query(
    `
    SELECT id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, order_num
    FROM quiz_questions
    WHERE quiz_id = $1
    ORDER BY order_num ASC
    `,
    [quizId]
  );

  return res.json({
    quiz: quizResult.rows[0],
    questions: questions.rows
  });
});

router.post("/", requireAuth, async (req, res) => {
  const { title, description, isTimed, timeLimitSeconds, questions } = req.body;

  if (!title || !questions || !Array.isArray(questions) || questions.length < 1) {
    return res.status(400).json({ error: "Title and at least one question required." });
  }

  for (const q of questions) {
    if (!q.question || !q.optionA || !q.optionB || !["A", "B"].includes(q.correctOption)) {
      return res.status(400).json({ error: "Each question needs question text, two options, and correct answer." });
    }
  }

  try {
    const result = await withTransaction(async (client) => {
      const quizResult = await client.query(
        `
        INSERT INTO quizzes (title, description, is_timed, time_limit_seconds, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        `,
        [title, description || null, Boolean(isTimed), isTimed ? timeLimitSeconds : null, req.user.id]
      );

      const quizId = quizResult.rows[0].id;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await client.query(
          `
          INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, correct_option, order_num)
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [quizId, q.question, q.optionA, q.optionB, q.correctOption, i]
        );
      }

      return quizId;
    });

    return res.status(201).json({ id: result });
  } catch (error) {
    console.error("Create quiz failed:", error);
    return res.status(500).json({ error: "Failed to create quiz." });
  }
});

router.post("/:quizId/submit", requireAuth, async (req, res) => {
  const { quizId } = req.params;
  const { answers, timeTakenSeconds } = req.body;

  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "Answers required." });
  }

  try {
    const questions = await query(
      `SELECT id, correct_option FROM quiz_questions WHERE quiz_id = $1`,
      [quizId]
    );

    if (questions.rowCount === 0) {
      return res.status(404).json({ error: "Quiz not found." });
    }

    let score = 0;
    const results = [];

    for (const q of questions.rows) {
      const userAnswer = answers[q.id] || answers[String(q.id)];
      const isCorrect = userAnswer === q.correct_option;
      if (isCorrect) {
        score += 1;
      }
      results.push({
        questionId: q.id,
        userAnswer: userAnswer || null,
        correctAnswer: q.correct_option,
        isCorrect
      });
    }

    await query(
      `
      INSERT INTO quiz_attempts (quiz_id, user_id, score, total_questions, time_taken_seconds)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [quizId, req.user.id, score, questions.rowCount, timeTakenSeconds || null]
    );

    return res.json({
      score,
      totalQuestions: questions.rowCount,
      percentage: Math.round((score / questions.rowCount) * 100),
      results
    });
  } catch (error) {
    console.error("Submit quiz failed:", error);
    return res.status(500).json({ error: "Failed to submit quiz." });
  }
});

export default router;
