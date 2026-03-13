-- Password for all seed users is: password
-- bcrypt hash for "password" (generated with bcrypt v6)
INSERT INTO users (email, username, name, age, password_hash, role)
VALUES
  ('admin@thisorthat.app', 'admin', 'Admin User', 30, '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'admin'),
  ('alex@thisorthat.app', 'alex', 'Alex Johnson', 25, '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'user'),
  ('jamie@thisorthat.app', 'jamie', 'Jamie Smith', 28, '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO polls (
  question,
  type,
  option_a_text,
  option_b_text,
  option_a_image_url,
  option_b_image_url,
  status,
  created_by
) VALUES
  (
    'Which productivity tool wins?',
    'text-text',
    'Notion',
    'Trello',
    NULL,
    NULL,
    'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Pick a travel postcard',
    'image-image',
    NULL,
    NULL,
    'https://picsum.photos/id/1015/600/400',
    'https://picsum.photos/id/1025/600/400',
    'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Best weekend plan?',
    'text-image',
    'Camping in the woods',
    NULL,
    NULL,
    'https://picsum.photos/id/1040/600/400',
    'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Which coffee style wins?',
    'text-text',
    'Latte',
    'Cold brew',
    NULL,
    NULL,
    'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Pick a workspace vibe',
    'image-image',
    NULL,
    NULL,
    'https://picsum.photos/id/1062/600/400',
    'https://picsum.photos/id/1060/600/400',
    'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  )
ON CONFLICT DO NOTHING;

INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'A'
FROM users u
JOIN polls p ON p.question = 'Which productivity tool wins?'
WHERE u.email = 'alex@thisorthat.app'
ON CONFLICT DO NOTHING;

INSERT INTO votes (user_id, poll_id, option)
SELECT u.id, p.id, 'B'
FROM users u
JOIN polls p ON p.question = 'Which productivity tool wins?'
WHERE u.email = 'jamie@thisorthat.app'
ON CONFLICT DO NOTHING;

-- Seed quizzes
INSERT INTO quizzes (title, description, is_timed, time_limit_seconds, created_by)
VALUES
  (
    'Tech Trivia',
    'Test your knowledge about technology and programming!',
    true,
    120,
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Guess the Animal',
    'Can you identify these animals from their pictures?',
    false,
    NULL,
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'World Landmarks',
    'Identify famous landmarks from around the world!',
    true,
    90,
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Food Quiz',
    'Test your culinary knowledge with delicious pictures!',
    false,
    NULL,
    (SELECT id FROM users WHERE email = 'alex@thisorthat.app')
  )
ON CONFLICT DO NOTHING;

-- Tech Trivia questions (text only)
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, questions.question, NULL, questions.option_a, NULL, questions.option_b, NULL, questions.correct_option, questions.order_num
FROM quizzes q
CROSS JOIN (VALUES
  ('What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'A', 0),
  ('Which company created JavaScript?', 'Netscape', 'Microsoft', 'A', 1),
  ('What year was Python first released?', '1991', '1995', 'A', 2),
  ('Which is a NoSQL database?', 'MongoDB', 'PostgreSQL', 'A', 3),
  ('What does CSS stand for?', 'Cascading Style Sheets', 'Computer Style System', 'A', 4)
) AS questions(question, option_a, option_b, correct_option, order_num)
WHERE q.title = 'Tech Trivia'
ON CONFLICT DO NOTHING;

-- Guess the Animal questions (with images)
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, questions.question, questions.question_image_url, questions.option_a, NULL, questions.option_b, NULL, questions.correct_option, questions.order_num
FROM quizzes q
CROSS JOIN (VALUES
  ('What animal is this?', 'https://placedog.net/400/300?random=1', 'Dog', 'Cat', 'A', 0),
  ('What animal is this?', 'https://placekitten.com/400/300', 'Cat', 'Dog', 'A', 1),
  ('What animal is this?', 'https://placedog.net/400/300?random=2', 'Dog', 'Wolf', 'A', 2),
  ('What animal is this?', 'https://placekitten.com/401/300', 'Cat', 'Tiger', 'A', 3)
) AS questions(question, question_image_url, option_a, option_b, correct_option, order_num)
WHERE q.title = 'Guess the Animal'
ON CONFLICT DO NOTHING;

-- World Landmarks questions (with images)
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, questions.question, questions.question_image_url, questions.option_a, NULL, questions.option_b, NULL, questions.correct_option, questions.order_num
FROM quizzes q
CROSS JOIN (VALUES
  ('Where is this landmark?', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/800px-Tour_Eiffel_Wikimedia_Commons.jpg', 'Paris, France', 'London, UK', 'A', 0),
  ('Where is this landmark?', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Big_Ben%2C_London%2C_England%2C_UK_-_Diliff.jpg/440px-Big_Ben%2C_London%2C_England%2C_UK_-_Diliff.jpg', 'London, UK', 'Paris, France', 'A', 1),
  ('Where is this landmark?', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/New_york_times_square-terabanswer.jpg/800px-New_york_times_square-terabass.jpg', 'New York, USA', 'Los Angeles, USA', 'A', 2),
  ('Where is this landmark?', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/800px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg', 'Rome, Italy', 'Athens, Greece', 'A', 3)
) AS questions(question, question_image_url, option_a, option_b, correct_option, order_num)
WHERE q.title = 'World Landmarks'
ON CONFLICT DO NOTHING;

-- Food Quiz questions (with option images)
INSERT INTO quiz_questions (quiz_id, question, question_image_url, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
SELECT q.id, questions.question, NULL, questions.option_a, questions.option_a_image_url, questions.option_b, questions.option_b_image_url, questions.correct_option, questions.order_num
FROM quizzes q
CROSS JOIN (VALUES
  ('Which dish is healthier?', 'Salad', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Salad_garden.jpg/320px-Salad_garden.jpg', 'Pizza', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg/320px-Eq_it-na_pizza-margherita_sep2005_sml.jpg', 'A', 0),
  ('Which is a Japanese dish?', 'Sushi', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Sushi_platter.jpg/320px-Sushi_platter.jpg', 'Tacos', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg/320px-001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg', 'A', 1),
  ('Which contains more protein?', 'Steak', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Sirloin_steak.JPG/320px-Sirloin_steak.JPG', 'Bread', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Fresh_made_bread_05.jpg/320px-Fresh_made_bread_05.jpg', 'A', 2),
  ('Which is typically served cold?', 'Ice Cream', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Ice_cream_cone.jpg/240px-Ice_cream_cone.jpg', 'Soup', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Goulash_soup.jpg/320px-Goulash_soup.jpg', 'A', 3)
) AS questions(question, option_a, option_a_image_url, option_b, option_b_image_url, correct_option, order_num)
WHERE q.title = 'Food Quiz'
ON CONFLICT DO NOTHING;
