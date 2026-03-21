-- Password for all seed users is: password
-- bcrypt hash for "password" (generated with bcrypt v6)
INSERT INTO users (email, username, name, age, password_hash, role)
VALUES
  ('admin@thisorthat.app', 'admin', 'Admin User', 30, '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'admin'),
  ('alex@thisorthat.app', 'alex', 'Alex Johnson', 25, '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'user'),
  ('jamie@thisorthat.app', 'jamie', 'Jamie Smith', 28, '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'user'),
  ('taylor@thisorthat.app', 'taylor', 'Taylor Lee', 22, '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'user'),
  ('morgan@thisorthat.app', 'morgan', 'Morgan Chen', 31, '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'user')
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════
-- POLLS
-- ═══════════════════════════════════════

INSERT INTO polls (question, type, category, option_a_text, option_b_text, option_a_image_url, option_b_image_url, status, created_by) VALUES
  -- Tech
  ('Which productivity tool wins?', 'text-text', 'Tech', 'Notion', 'Trello', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('Better code editor?', 'text-text', 'Tech', 'VS Code', 'JetBrains', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'alex@thisorthat.app')),
  ('iPhone or Android?', 'image-image', 'Tech', 'iPhone', 'Android',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('Tabs or Spaces?', 'text-text', 'Tech', 'Tabs', 'Spaces', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'jamie@thisorthat.app')),
  ('PC gaming setup?', 'image-image', 'Tech', 'Minimal desk', 'RGB everything',
    'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1616588589676-62b3d4ff6a10?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'taylor@thisorthat.app')),

  -- Food
  ('Which coffee wins?', 'image-image', 'Food', 'Latte art', 'Iced coffee',
    'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('Pizza style?', 'image-image', 'Food', 'New York thin', 'Chicago deep dish',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'alex@thisorthat.app')),
  ('Breakfast pick?', 'image-image', 'Food', 'Pancakes', 'Avocado toast',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'jamie@thisorthat.app')),
  ('Sushi or Tacos?', 'image-image', 'Food', 'Sushi platter', 'Street tacos',
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'morgan@thisorthat.app')),
  ('Better dessert?', 'text-text', 'Food', 'Chocolate cake', 'Crème brûlée', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'taylor@thisorthat.app')),

  -- Travel
  ('Dream destination?', 'image-image', 'Travel', 'Santorini, Greece', 'Kyoto, Japan',
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('Beach or Mountains?', 'image-image', 'Travel', 'Tropical beach', 'Snow mountains',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'alex@thisorthat.app')),
  ('City trip?', 'image-image', 'Travel', 'Paris at night', 'Tokyo neon',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'jamie@thisorthat.app')),
  ('Road trip vibes?', 'image-image', 'Travel', 'Desert highway', 'Coastal road',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'morgan@thisorthat.app')),

  -- Sports
  ('Better sport to watch?', 'text-text', 'Sports', 'Football (Soccer)', 'Basketball', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('Outdoor activity?', 'image-image', 'Sports', 'Surfing', 'Rock climbing',
    'https://images.unsplash.com/photo-1502680390548-bdbac40a5e46?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'taylor@thisorthat.app')),
  ('Morning routine?', 'text-text', 'Sports', 'Yoga & meditation', 'HIIT workout', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'morgan@thisorthat.app')),

  -- Entertainment
  ('Better movie genre?', 'text-text', 'Entertainment', 'Sci-Fi', 'Fantasy', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('Gaming platform?', 'text-text', 'Entertainment', 'PlayStation 5', 'Nintendo Switch', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'alex@thisorthat.app')),
  ('Concert vibe?', 'image-image', 'Entertainment', 'Intimate acoustic', 'Stadium show',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'jamie@thisorthat.app')),
  ('Binge-worthy?', 'text-text', 'Entertainment', 'True crime docs', 'Anime series', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'taylor@thisorthat.app')),

  -- Science
  ('Cooler space photo?', 'image-image', 'Science', 'Nebula', 'Galaxy',
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('More fascinating?', 'text-text', 'Science', 'Deep ocean', 'Outer space', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'morgan@thisorthat.app')),

  -- General / Lifestyle
  ('Morning person or Night owl?', 'text-text', 'General', 'Morning person', 'Night owl', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('Home vibe?', 'image-image', 'General', 'Modern minimalist', 'Cozy cottage',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'alex@thisorthat.app')),
  ('Pet choice?', 'image-image', 'General', 'Golden Retriever', 'British Shorthair',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'jamie@thisorthat.app')),
  ('Season mood?', 'image-image', 'General', 'Autumn leaves', 'Cherry blossom spring',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600&h=400&fit=crop',
    'approved', (SELECT id FROM users WHERE email = 'taylor@thisorthat.app')),

  -- Other
  ('Better superpower?', 'text-text', 'Other', 'Flight', 'Invisibility', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('Time travel direction?', 'text-text', 'Other', 'Visit the past', 'See the future', NULL, NULL, 'approved',
    (SELECT id FROM users WHERE email = 'morgan@thisorthat.app'))
ON CONFLICT DO NOTHING;

-- Seed some votes for variety
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'A' FROM users u JOIN polls p ON p.question = 'Which productivity tool wins?' WHERE u.email = 'alex@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'B' FROM users u JOIN polls p ON p.question = 'Which productivity tool wins?' WHERE u.email = 'jamie@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'A' FROM users u JOIN polls p ON p.question = 'Which coffee wins?' WHERE u.email = 'alex@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'B' FROM users u JOIN polls p ON p.question = 'Which coffee wins?' WHERE u.email = 'taylor@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'A' FROM users u JOIN polls p ON p.question = 'Dream destination?' WHERE u.email = 'morgan@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'B' FROM users u JOIN polls p ON p.question = 'Dream destination?' WHERE u.email = 'jamie@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'A' FROM users u JOIN polls p ON p.question = 'iPhone or Android?' WHERE u.email = 'taylor@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'B' FROM users u JOIN polls p ON p.question = 'iPhone or Android?' WHERE u.email = 'alex@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'A' FROM users u JOIN polls p ON p.question = 'Pet choice?' WHERE u.email = 'admin@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'B' FROM users u JOIN polls p ON p.question = 'Pet choice?' WHERE u.email = 'morgan@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'A' FROM users u JOIN polls p ON p.question = 'Better superpower?' WHERE u.email = 'alex@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'B' FROM users u JOIN polls p ON p.question = 'Better superpower?' WHERE u.email = 'jamie@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'A' FROM users u JOIN polls p ON p.question = 'Better superpower?' WHERE u.email = 'taylor@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'A' FROM users u JOIN polls p ON p.question = 'Cooler space photo?' WHERE u.email = 'morgan@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'B' FROM users u JOIN polls p ON p.question = 'Pizza style?' WHERE u.email = 'admin@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'A' FROM users u JOIN polls p ON p.question = 'Pizza style?' WHERE u.email = 'alex@thisorthat.app' ON CONFLICT DO NOTHING;

-- Seed comments
INSERT INTO comments (user_id, poll_id, body)
SELECT u.id, p.id, 'Notion is just unbeatable for everything!' FROM users u JOIN polls p ON p.question = 'Which productivity tool wins?' WHERE u.email = 'alex@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO comments (user_id, poll_id, body)
SELECT u.id, p.id, 'Trello keeps it simple. Love the kanban boards.' FROM users u JOIN polls p ON p.question = 'Which productivity tool wins?' WHERE u.email = 'jamie@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO comments (user_id, poll_id, body)
SELECT u.id, p.id, 'Deep dish forever! Nothing beats that cheese pull.' FROM users u JOIN polls p ON p.question = 'Pizza style?' WHERE u.email = 'admin@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO comments (user_id, poll_id, body)
SELECT u.id, p.id, 'Santorini sunsets are otherworldly.' FROM users u JOIN polls p ON p.question = 'Dream destination?' WHERE u.email = 'morgan@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO comments (user_id, poll_id, body)
SELECT u.id, p.id, 'Golden retrievers are literally the best dogs ever.' FROM users u JOIN polls p ON p.question = 'Pet choice?' WHERE u.email = 'taylor@thisorthat.app' ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════
-- QUIZZES
-- ═══════════════════════════════════════

INSERT INTO quizzes (title, description, is_timed, time_limit_seconds, created_by) VALUES
  ('Tech Trivia', 'Test your knowledge about technology and programming!', true, 120,
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('Guess the Animal', 'Can you identify these animals from their pictures?', false, NULL,
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('World Landmarks', 'Identify famous landmarks from around the world!', true, 90,
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')),
  ('Food Quiz', 'Test your culinary knowledge with delicious pictures!', false, NULL,
    (SELECT id FROM users WHERE email = 'alex@thisorthat.app')),
  ('Space Explorer', 'How well do you know our universe?', true, 150,
    (SELECT id FROM users WHERE email = 'morgan@thisorthat.app')),
  ('Movie Buff Challenge', 'Classic cinema knowledge test!', false, NULL,
    (SELECT id FROM users WHERE email = 'jamie@thisorthat.app')),
  ('Nature or City?', 'Pick the right answer about places around the world!', true, 120,
    (SELECT id FROM users WHERE email = 'taylor@thisorthat.app')),
  ('Music Legends', 'How well do you know music history?', false, NULL,
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app'))
ON CONFLICT DO NOTHING;

-- Tech Trivia questions
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, v.question, NULL, v.option_a, NULL, v.option_b, NULL, v.correct_option, v.order_num
FROM quizzes q CROSS JOIN (VALUES
  ('What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'A', 0),
  ('Which company created JavaScript?', 'Netscape', 'Microsoft', 'A', 1),
  ('What year was Python first released?', '1991', '1995', 'A', 2),
  ('Which is a NoSQL database?', 'MongoDB', 'PostgreSQL', 'A', 3),
  ('What does CSS stand for?', 'Cascading Style Sheets', 'Computer Style System', 'A', 4),
  ('Who created Linux?', 'Linus Torvalds', 'Bill Gates', 'A', 5),
  ('What does API stand for?', 'Application Programming Interface', 'Advanced Program Integration', 'A', 6)
) AS v(question, option_a, option_b, correct_option, order_num)
WHERE q.title = 'Tech Trivia' ON CONFLICT DO NOTHING;

-- Guess the Animal questions (with images)
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, v.question, v.question_image_url, v.option_a, NULL, v.option_b, NULL, v.correct_option, v.order_num
FROM quizzes q CROSS JOIN (VALUES
  ('What animal is this?', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop', 'Dog', 'Wolf', 'A', 0),
  ('What animal is this?', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop', 'Cat', 'Lynx', 'A', 1),
  ('What animal is this?', 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=400&h=300&fit=crop', 'Elephant', 'Rhino', 'A', 2),
  ('What animal is this?', 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=400&h=300&fit=crop', 'Owl', 'Eagle', 'A', 3),
  ('What animal is this?', 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=400&h=300&fit=crop', 'Sea turtle', 'Tortoise', 'A', 4)
) AS v(question, question_image_url, option_a, option_b, correct_option, order_num)
WHERE q.title = 'Guess the Animal' ON CONFLICT DO NOTHING;

-- World Landmarks questions (with images)
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, v.question, v.question_image_url, v.option_a, NULL, v.option_b, NULL, v.correct_option, v.order_num
FROM quizzes q CROSS JOIN (VALUES
  ('Where is this landmark?', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop', 'Paris, France', 'London, UK', 'A', 0),
  ('Where is this landmark?', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop', 'London, UK', 'Paris, France', 'A', 1),
  ('Where is this landmark?', 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&h=300&fit=crop', 'Tokyo, Japan', 'Beijing, China', 'A', 2),
  ('Where is this?', 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=300&fit=crop', 'New York, USA', 'Chicago, USA', 'A', 3),
  ('Where is this landmark?', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop', 'Rome, Italy', 'Athens, Greece', 'A', 4)
) AS v(question, question_image_url, option_a, option_b, correct_option, order_num)
WHERE q.title = 'World Landmarks' ON CONFLICT DO NOTHING;

-- Food Quiz questions (with option images)
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, v.question, NULL, v.option_a, v.option_a_image_url, v.option_b, v.option_b_image_url, v.correct_option, v.order_num
FROM quizzes q CROSS JOIN (VALUES
  ('Which dish is healthier?', 'Salad', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=320&h=240&fit=crop', 'Pizza', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=320&h=240&fit=crop', 'A', 0),
  ('Which is a Japanese dish?', 'Sushi', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=320&h=240&fit=crop', 'Tacos', 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=320&h=240&fit=crop', 'A', 1),
  ('Which has more protein?', 'Steak', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=320&h=240&fit=crop', 'Bread', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=320&h=240&fit=crop', 'A', 2),
  ('Which is served cold?', 'Ice cream', 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=320&h=240&fit=crop', 'Soup', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=320&h=240&fit=crop', 'A', 3),
  ('Which is Italian?', 'Pasta', 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=320&h=240&fit=crop', 'Curry', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=320&h=240&fit=crop', 'A', 4)
) AS v(question, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
WHERE q.title = 'Food Quiz' ON CONFLICT DO NOTHING;

-- Space Explorer questions (with images)
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, v.question, v.question_image_url, v.option_a, NULL, v.option_b, NULL, v.correct_option, v.order_num
FROM quizzes q CROSS JOIN (VALUES
  ('What planet is this?', 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=300&fit=crop', 'Mars', 'Venus', 'A', 0),
  ('What is this called?', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop', 'Nebula', 'Black hole', 'A', 1),
  ('Largest planet in our solar system?', 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=400&h=300&fit=crop', 'Jupiter', 'Saturn', 'A', 2),
  ('What orbits Earth?', 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400&h=300&fit=crop', 'The Moon', 'Phobos', 'A', 3),
  ('First person on the Moon?', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=300&fit=crop', 'Neil Armstrong', 'Buzz Aldrin', 'A', 4)
) AS v(question, question_image_url, option_a, option_b, correct_option, order_num)
WHERE q.title = 'Space Explorer' ON CONFLICT DO NOTHING;

-- Movie Buff Challenge questions
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, v.question, NULL, v.option_a, NULL, v.option_b, NULL, v.correct_option, v.order_num
FROM quizzes q CROSS JOIN (VALUES
  ('Who directed Inception?', 'Christopher Nolan', 'Steven Spielberg', 'A', 0),
  ('Which movie won Best Picture 2020?', 'Parasite', '1917', 'A', 1),
  ('Who played The Joker in The Dark Knight?', 'Heath Ledger', 'Joaquin Phoenix', 'A', 2),
  ('Which studio made Toy Story?', 'Pixar', 'DreamWorks', 'A', 3),
  ('The Matrix released in which year?', '1999', '2001', 'A', 4),
  ('Who directed Pulp Fiction?', 'Quentin Tarantino', 'Martin Scorsese', 'A', 5)
) AS v(question, option_a, option_b, correct_option, order_num)
WHERE q.title = 'Movie Buff Challenge' ON CONFLICT DO NOTHING;

-- Nature or City? questions (with images)
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, v.question, v.question_image_url, v.option_a, NULL, v.option_b, NULL, v.correct_option, v.order_num
FROM quizzes q CROSS JOIN (VALUES
  ('Is this a national park?', 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=400&h=300&fit=crop', 'Yes', 'No', 'A', 0),
  ('Which continent is this?', 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=300&fit=crop', 'Africa', 'South America', 'A', 1),
  ('Is this in Asia?', 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=300&fit=crop', 'Yes', 'No', 'A', 2),
  ('Is this a European city?', 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=300&fit=crop', 'Yes', 'No', 'A', 3),
  ('Is this in North America?', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', 'Yes', 'No', 'A', 4)
) AS v(question, question_image_url, option_a, option_b, correct_option, order_num)
WHERE q.title = 'Nature or City?' ON CONFLICT DO NOTHING;

-- Music Legends questions
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, v.question, NULL, v.option_a, NULL, v.option_b, NULL, v.correct_option, v.order_num
FROM quizzes q CROSS JOIN (VALUES
  ('Who is the King of Pop?', 'Michael Jackson', 'Elvis Presley', 'A', 0),
  ('Which band wrote Bohemian Rhapsody?', 'Queen', 'The Beatles', 'A', 1),
  ('Who sang "Like a Rolling Stone"?', 'Bob Dylan', 'Bruce Springsteen', 'A', 2),
  ('Thriller was released in which decade?', '1980s', '1970s', 'A', 3),
  ('Who is known as the Queen of Soul?', 'Aretha Franklin', 'Whitney Houston', 'A', 4),
  ('Which band had a drummer named Ringo?', 'The Beatles', 'The Rolling Stones', 'A', 5)
) AS v(question, option_a, option_b, correct_option, order_num)
WHERE q.title = 'Music Legends' ON CONFLICT DO NOTHING;

-- Seed quiz attempts for leaderboard
INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, time_taken_seconds)
SELECT u.id, q.id, 5, 7, 85
FROM users u JOIN quizzes q ON q.title = 'Tech Trivia' WHERE u.email = 'alex@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, time_taken_seconds)
SELECT u.id, q.id, 4, 5, 45
FROM users u JOIN quizzes q ON q.title = 'Guess the Animal' WHERE u.email = 'jamie@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, time_taken_seconds)
SELECT u.id, q.id, 3, 5, 70
FROM users u JOIN quizzes q ON q.title = 'World Landmarks' WHERE u.email = 'taylor@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, time_taken_seconds)
SELECT u.id, q.id, 6, 7, 95
FROM users u JOIN quizzes q ON q.title = 'Tech Trivia' WHERE u.email = 'morgan@thisorthat.app' ON CONFLICT DO NOTHING;
INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, time_taken_seconds)
SELECT u.id, q.id, 5, 5, 55
FROM users u JOIN quizzes q ON q.title = 'Space Explorer' WHERE u.email = 'admin@thisorthat.app' ON CONFLICT DO NOTHING;
