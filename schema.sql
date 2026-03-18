-- Online Lotto Room D1 Schema
CREATE TABLE IF NOT EXISTS tickets (
  ticket_id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  numbers TEXT NOT NULL,
  mode TEXT NOT NULL,
  pick_tag TEXT,
  user_id TEXT NOT NULL,
  rotation REAL NOT NULL,
  position_x REAL NOT NULL,
  position_y REAL NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tickets_round ON tickets(round_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_user_round ON tickets(user_id, round_id);

CREATE TABLE IF NOT EXISTS votes (
  vote_id TEXT PRIMARY KEY,
  round_id TEXT NOT NULL,
  numbers TEXT NOT NULL,
  bonus_number INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, round_id)
);
CREATE INDEX IF NOT EXISTS idx_votes_round ON votes(round_id);

CREATE TABLE IF NOT EXISTS rounds (
  round_id TEXT PRIMARY KEY,
  draw_time TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'pre-draw',
  winning_numbers TEXT,
  bonus_number INTEGER,
  ticket_count INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  confirmed_at TEXT
);
