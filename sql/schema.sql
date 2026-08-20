-- Schema inferred from server.js queries (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  "UserID" SERIAL PRIMARY KEY,
  "Username" VARCHAR(32) NOT NULL UNIQUE,
  "FirstName" VARCHAR(100) NOT NULL DEFAULT '',
  "LastName" VARCHAR(100) NOT NULL DEFAULT '',
  "Email" VARCHAR(255) NOT NULL UNIQUE,
  "Password" VARCHAR(255) NOT NULL,
  "Tier" VARCHAR(20) NOT NULL DEFAULT 'Free' CHECK ("Tier" IN ('Free', 'Pro', 'Ultimate')),
  "DateCreated" TIMESTAMP NOT NULL
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "FirstName" VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "LastName" VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "RevisitEnabled" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "RevisitThresholdDays" INT NOT NULL DEFAULT 14;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "AccentColor" VARCHAR(7) NOT NULL DEFAULT '#438eef';
ALTER TABLE users ADD COLUMN IF NOT EXISTS "NewsletterEnabled" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "WeeklyDigestEnabled" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "DailyDigestEnabled" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  "PasswordResetTokenID" SERIAL PRIMARY KEY,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "TokenHash" CHAR(64) NOT NULL UNIQUE,
  "ExpiresAt" TIMESTAMP NOT NULL,
  "DateCreated" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens ("UserID");
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expiry ON password_reset_tokens ("ExpiresAt");

-- Unlike the flags above, this one needs different values for existing vs.
-- future rows (existing accounts shouldn't see onboarding on their next
-- login), so it can't be a plain ADD COLUMN DEFAULT. The backfill only runs
-- the one time it adds the column — this whole file gets re-run on every
-- deploy, and a bare UPDATE would keep re-marking brand-new signups onboarded.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'HasOnboarded'
  ) THEN
    ALTER TABLE users ADD COLUMN "HasOnboarded" BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE users SET "HasOnboarded" = TRUE;
  END IF;
END $$;

-- Tier names: Free Thinker (free), Thinker, Deep Thinker (paid, Stripe-backed).
ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_Tier_check";
UPDATE users SET "Tier" = 'Free Thinker' WHERE "Tier" = 'Free';
UPDATE users SET "Tier" = 'Thinker' WHERE "Tier" = 'Pro';
UPDATE users SET "Tier" = 'Deep Thinker' WHERE "Tier" = 'Ultimate';
ALTER TABLE users ALTER COLUMN "Tier" SET DEFAULT 'Free Thinker';
ALTER TABLE users ADD CONSTRAINT "users_Tier_check" CHECK ("Tier" IN ('Free Thinker', 'Thinker', 'Deep Thinker'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS "StripeCustomerId" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "StripeSubscriptionId" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "StripeSubscriptionStatus" VARCHAR(50);

CREATE TABLE IF NOT EXISTS thoughts (
  "ThoughtID" SERIAL PRIMARY KEY,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "ThoughtName" VARCHAR(255) NOT NULL,
  "ThoughtDescr" TEXT NOT NULL,
  "Favorite" BOOLEAN NOT NULL DEFAULT FALSE,
  "Pinned" BOOLEAN NOT NULL DEFAULT FALSE,
  "DateCreated" TIMESTAMP NOT NULL
);
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS "Pinned" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS "LastViewed" TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS "LastReminded" TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_thoughts_user ON thoughts ("UserID");

CREATE TABLE IF NOT EXISTS messages (
  "MessageID" SERIAL PRIMARY KEY,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "ThoughtID" INT NOT NULL REFERENCES thoughts("ThoughtID") ON DELETE CASCADE,
  "Message" TEXT NOT NULL,
  "Attachments" TEXT[] NOT NULL DEFAULT '{}',
  "DateSent" TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_thought ON messages ("ThoughtID");
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages ("UserID");

-- The chat composer now writes sanitized HTML (rich text) instead of plain
-- text, so rendering needs to know which messages are HTML vs. old plain
-- text (raw "<"/"&" in old messages must not be interpreted as markup).
-- Same backfill-once pattern as "HasOnboarded" above: existing rows are
-- tagged 'plain' a single time; the DEFAULT 'html' covers every row from
-- here on, including ones inserted between deploys.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'ContentFormat'
  ) THEN
    ALTER TABLE messages ADD COLUMN "ContentFormat" VARCHAR(10) NOT NULL DEFAULT 'html';
    UPDATE messages SET "ContentFormat" = 'plain';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS categories (
  "CategoryID" SERIAL PRIMARY KEY,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "ThoughtID" INT NOT NULL REFERENCES thoughts("ThoughtID") ON DELETE CASCADE,
  "CategoryName" VARCHAR(100) NOT NULL,
  "DateCreated" TIMESTAMP NOT NULL
);
ALTER TABLE categories ALTER COLUMN "ThoughtID" DROP NOT NULL;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS "Pinned" BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_categories_thought ON categories ("ThoughtID");

CREATE TABLE IF NOT EXISTS tags (
  "TagID" SERIAL PRIMARY KEY,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "ThoughtID" INT NOT NULL REFERENCES thoughts("ThoughtID") ON DELETE CASCADE,
  "TagName" VARCHAR(100) NOT NULL,
  "DateCreated" TIMESTAMP NOT NULL
);
ALTER TABLE tags ALTER COLUMN "ThoughtID" DROP NOT NULL;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS "Pinned" BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_tags_thought ON tags ("ThoughtID");

CREATE TABLE IF NOT EXISTS lists (
  "ListID" SERIAL PRIMARY KEY,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "ThoughtID" INT REFERENCES thoughts("ThoughtID") ON DELETE CASCADE,
  "ListName" VARCHAR(100) NOT NULL,
  "DateCreated" TIMESTAMP NOT NULL
);
ALTER TABLE lists ALTER COLUMN "ThoughtID" DROP NOT NULL;
ALTER TABLE lists ADD COLUMN IF NOT EXISTS "Pinned" BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_lists_thought ON lists ("ThoughtID");

-- Schedules feature (day-timeline builder) was removed in favor of Revisit reminders.
DROP TABLE IF EXISTS schedule_tasks;
DROP TABLE IF EXISTS schedules;

CREATE TABLE IF NOT EXISTS mood_boards (
  "MoodBoardID" SERIAL PRIMARY KEY,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "BoardName" VARCHAR(100) NOT NULL,
  "DateCreated" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mood_boards_user ON mood_boards ("UserID");

CREATE TABLE IF NOT EXISTS mood_board_sections (
  "SectionID" SERIAL PRIMARY KEY,
  "MoodBoardID" INT NOT NULL REFERENCES mood_boards("MoodBoardID") ON DELETE CASCADE,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "SectionName" VARCHAR(100) NOT NULL,
  "BackgroundColor" VARCHAR(7) NOT NULL DEFAULT '#151a2b',
  "SortOrder" INT NOT NULL DEFAULT 0,
  "DateCreated" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mood_board_sections_board ON mood_board_sections ("MoodBoardID");

CREATE TABLE IF NOT EXISTS mood_board_blocks (
  "BlockID" SERIAL PRIMARY KEY,
  "SectionID" INT NOT NULL REFERENCES mood_board_sections("SectionID") ON DELETE CASCADE,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "BlockType" VARCHAR(20) NOT NULL CHECK ("BlockType" IN ('image','link','text','thought')),
  "SortOrder" INT NOT NULL DEFAULT 0,
  "ImageUrl" TEXT,
  "Caption" VARCHAR(255),
  "LinkUrl" TEXT,
  "LinkLabel" VARCHAR(255),
  "TextContent" TEXT,
  "ThoughtID" INT REFERENCES thoughts("ThoughtID") ON DELETE CASCADE,
  "DateCreated" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mood_board_blocks_section ON mood_board_blocks ("SectionID");

CREATE TABLE IF NOT EXISTS mood_board_messages (
  "MessageID" SERIAL PRIMARY KEY,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "MoodBoardID" INT NOT NULL REFERENCES mood_boards("MoodBoardID") ON DELETE CASCADE,
  "Message" TEXT NOT NULL,
  "Attachments" TEXT[] NOT NULL DEFAULT '{}',
  "DateSent" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mood_board_messages_board ON mood_board_messages ("MoodBoardID");

-- Countdown timers ("Do" > Timers). RemainingSeconds is the frozen count
-- while paused; while running, the live countdown is DurationSeconds/
-- RemainingSeconds minus elapsed time since StartedAt, computed by the
-- client so ticking doesn't require a request every second.
-- StartedAt is TIMESTAMPTZ (not the plain TIMESTAMP used elsewhere in this
-- file) because it's the one timestamp in this app actually used for time
-- arithmetic (now - StartedAt) rather than just display: node-postgres
-- parses a naive "timestamp without time zone" using the server process's
-- local OS timezone instead of UTC, which silently corrupts that math
-- whenever the process isn't running in UTC — TIMESTAMPTZ avoids the
-- ambiguity entirely.
CREATE TABLE IF NOT EXISTS timers (
  "TimerID" SERIAL PRIMARY KEY,
  "UserID" INT NOT NULL REFERENCES users("UserID") ON DELETE CASCADE,
  "TimerName" VARCHAR(100) NOT NULL,
  "DurationSeconds" INT NOT NULL CHECK ("DurationSeconds" > 0),
  "RemainingSeconds" INT NOT NULL,
  "Status" VARCHAR(10) NOT NULL DEFAULT 'paused' CHECK ("Status" IN ('running', 'paused')),
  "StartedAt" TIMESTAMPTZ,
  "DateCreated" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_timers_user ON timers ("UserID");

-- One-time upgrade in case the table above was already created (by an
-- earlier deploy of this file) with the naive TIMESTAMP column. The stored
-- digits are correct UTC wall-clock values (the DB session timezone is
-- UTC), so re-tagging them "AT TIME ZONE 'UTC'" recovers the true instant
-- without shifting anything. Guarded so it only ever runs the one time the
-- column is still the old type.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timers' AND column_name = 'StartedAt' AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE timers ALTER COLUMN "StartedAt" TYPE TIMESTAMPTZ USING "StartedAt" AT TIME ZONE 'UTC';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS email_logs (
  "EmailLogID" SERIAL PRIMARY KEY,
  "TriggerAction" VARCHAR(100),
  "Type" VARCHAR(100),
  "ToAddress" VARCHAR(255),
  "FromAddress" VARCHAR(255),
  "Subject" VARCHAR(255),
  "Body" TEXT,
  "Status" VARCHAR(50),
  "ErrorMessage" TEXT,
  "DateSent" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
