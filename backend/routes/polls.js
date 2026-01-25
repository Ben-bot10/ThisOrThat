import express from "express";
import { query, withTransaction } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const MAX_DATA_URL_LENGTH = 1_500_000;

function normalizeImageUrl(value) {
  if (!value) {
    return null;
  }
  if (typeof value !== "string") {
    throw new Error("Invalid image URL.");
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("data:image/")) {
    if (trimmed.length > MAX_DATA_URL_LENGTH) {
      throw new Error("Image data is too large.");
    }
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid image URL.");
    }
    return trimmed;
  } catch (error) {
    throw new Error("Invalid image URL.");
  }
}

function mapPollRow(row) {
  const totalVotes = Number(row.total_votes || 0);
  const votesA = Number(row.votes_a || 0);
  const votesB = Number(row.votes_b || 0);
  const percentA = totalVotes ? Math.round((votesA / totalVotes) * 100) : 0;
  const percentB = totalVotes ? Math.round((votesB / totalVotes) * 100) : 0;

  return {
    id: row.id,
    question: row.question,
    type: row.type,
    optionA: {
      text: row.option_a_text,
      imageUrl: row.option_a_image_url
    },
    optionB: {
      text: row.option_b_text,
      imageUrl: row.option_b_image_url
    },
    status: row.status,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    totalVotes,
    votes: { a: votesA, b: votesB },
    percents: { a: percentA, b: percentB },
    userVote: row.user_vote
  };
}

router.get("/", async (req, res) => {
  const userId = req.headers["x-user-id"];
  const result = await query(
    `
    SELECT
      polls.*,
      COALESCE(SUM(CASE WHEN votes.option = 'A' THEN 1 ELSE 0 END), 0) AS votes_a,
      COALESCE(SUM(CASE WHEN votes.option = 'B' THEN 1 ELSE 0 END), 0) AS votes_b,
      COALESCE(COUNT(votes.id), 0) AS total_votes,
      MAX(CASE WHEN votes.user_id = $1 THEN votes.option ELSE NULL END) AS user_vote
    FROM polls
    LEFT JOIN votes ON votes.poll_id = polls.id
    WHERE polls.status = 'approved'
      AND (polls.ends_at IS NULL OR polls.ends_at > NOW())
    GROUP BY polls.id
    ORDER BY polls.created_at DESC
    `,
    [userId || null]
  );

  return res.json(result.rows.map(mapPollRow));
});

router.get("/:pollId", async (req, res) => {
  const { pollId } = req.params;
  const userId = req.headers["x-user-id"];

  const pollResult = await query(
    `
    SELECT
      polls.*,
      COALESCE(SUM(CASE WHEN votes.option = 'A' THEN 1 ELSE 0 END), 0) AS votes_a,
      COALESCE(SUM(CASE WHEN votes.option = 'B' THEN 1 ELSE 0 END), 0) AS votes_b,
      COALESCE(COUNT(votes.id), 0) AS total_votes,
      MAX(CASE WHEN votes.user_id = $1 THEN votes.option ELSE NULL END) AS user_vote
    FROM polls
    LEFT JOIN votes ON votes.poll_id = polls.id
    WHERE polls.id = $2
    GROUP BY polls.id
    `,
    [userId || null, pollId]
  );

  if (pollResult.rowCount === 0) {
    return res.status(404).json({ error: "Poll not found." });
  }

  const comments = await query(
    `
    SELECT comments.id, comments.body, comments.created_at, users.email
    FROM comments
    JOIN users ON users.id = comments.user_id
    WHERE comments.poll_id = $1
    ORDER BY comments.created_at DESC
    `,
    [pollId]
  );

  return res.json({ poll: mapPollRow(pollResult.rows[0]), comments: comments.rows });
});

router.post("/", requireAuth, async (req, res) => {
  const {
    question,
    type,
    optionAText,
    optionBText,
    optionAImageUrl,
    optionBImageUrl,
    endsAt
  } = req.body;

  if (!question || !type) {
    return res.status(400).json({ error: "Question and type are required." });
  }

  let normalizedA;
  let normalizedB;
  try {
    normalizedA = normalizeImageUrl(optionAImageUrl);
    normalizedB = normalizeImageUrl(optionBImageUrl);
  } catch (error) {
    const message = error.message || "Invalid image URL.";
    const statusCode = message.includes("too large") ? 413 : 400;
    return res.status(statusCode).json({ error: message });
  }

  const status = "approved";
  const result = await query(
    `
    INSERT INTO polls
      (question, type, option_a_text, option_b_text, option_a_image_url, option_b_image_url, status, created_by, ends_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
    `,
    [
      question,
      type,
      optionAText || null,
      optionBText || null,
      normalizedA,
      normalizedB,
      status,
      req.user.id,
      endsAt || null
    ]
  );

  return res.status(201).json({ id: result.rows[0].id, status });
});

router.post("/:pollId/vote", requireAuth, async (req, res) => {
  const { pollId } = req.params;
  const { option } = req.body;

  if (!["A", "B"].includes(option)) {
    return res.status(400).json({ error: "Option must be 'A' or 'B'." });
  }

  try {
    await withTransaction(async (client) => {
      await client.query(
        `
        INSERT INTO votes (user_id, poll_id, option)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, poll_id) DO NOTHING
        `,
        [req.user.id, pollId, option]
      );
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to submit vote." });
  }

  const results = await query(
    `
    SELECT
      polls.*,
      COALESCE(SUM(CASE WHEN votes.option = 'A' THEN 1 ELSE 0 END), 0) AS votes_a,
      COALESCE(SUM(CASE WHEN votes.option = 'B' THEN 1 ELSE 0 END), 0) AS votes_b,
      COALESCE(COUNT(votes.id), 0) AS total_votes
    FROM polls
    LEFT JOIN votes ON votes.poll_id = polls.id
    WHERE polls.id = $1
    GROUP BY polls.id
    `,
    [pollId]
  );

  if (req.app.get("io")) {
    req.app.get("io").emit("poll:update", mapPollRow(results.rows[0]));
  }

  return res.json(mapPollRow(results.rows[0]));
});

router.post("/:pollId/comments", requireAuth, async (req, res) => {
  const { pollId } = req.params;
  const { body } = req.body;

  if (!body || body.trim().length < 2) {
    return res.status(400).json({ error: "Comment is too short." });
  }

  const result = await query(
    `
    INSERT INTO comments (poll_id, user_id, body)
    VALUES ($1, $2, $3)
    RETURNING id, body, created_at
    `,
    [pollId, req.user.id, body.trim()]
  );

  return res.status(201).json(result.rows[0]);
});

export default router;
