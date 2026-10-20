BEGIN;
CREATE SCHEMA IF NOT EXISTS leaderboard;
CREATE TABLE IF NOT EXISTS leaderboard.scores (
  submission_id uuid PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 32),
  prestige integer NOT NULL CHECK (prestige BETWEEN 0 AND 1000000000),
  level integer NOT NULL CHECK (level BETWEEN 1 AND 10000),
  status text NOT NULL CHECK (status IN ('won', 'dead', 'quit')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS scores_ranking_idx
  ON leaderboard.scores (prestige DESC, created_at ASC, submission_id ASC);
COMMIT;
