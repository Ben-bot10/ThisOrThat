-- Password for all seed users is: password
-- bcrypt hash for "password" (generated with bcrypt v6)
INSERT INTO users (email, password_hash, role)
VALUES
  ('admin@thisorthat.app', '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'admin'),
  ('alex@thisorthat.app', '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'user'),
  ('jamie@thisorthat.app', '$2b$10$v39VpXrsBXSime00rj8HOuXuSndePrt4JS52RJZrLlsAYYVAC1WCS', 'user')
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
  ),
  (
    'Morning routine?',
    'text-text',
    'Workout first',
    'Coffee first',
    NULL,
    NULL,
    'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Choose a trip',
    'text-image',
    'City skyline',
    NULL,
    NULL,
    'https://picsum.photos/id/1031/600/400',
    'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Studio playlist?',
    'text-text',
    'Lo-fi beats',
    'Pop hits',
    NULL,
    NULL,
    'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Pick a snack',
    'text-text',
    'Chips',
    'Popcorn',
    NULL,
    NULL,
    'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Mountain or beach?',
    'text-image',
    'Mountains',
    NULL,
    NULL,
    'https://picsum.photos/id/1003/600/400',
    'approved',
    (SELECT id FROM users WHERE email = 'admin@thisorthat.app')
  ),
  (
    'Choose your desk setup',
    'image-image',
    NULL,
    NULL,
    'https://picsum.photos/id/1076/600/400',
    'https://picsum.photos/id/1080/600/400',
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
