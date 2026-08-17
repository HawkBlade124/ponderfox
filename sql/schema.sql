-- Schema inferred from server.js queries (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  "UserID" SERIAL PRIMARY KEY,
  "Username" VARCHAR(32) NOT NULL UNIQUE,
  "Email" VARCHAR(255) NOT NULL UNIQUE,
  "Password" VARCHAR(255) NOT NULL,
  "Tier" VARCHAR(20) NOT NULL DEFAULT 'Free' CHECK ("Tier" IN ('Free', 'Pro', 'Ultimate')),
  "DateCreated" TIMESTAMP NOT NULL
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "RevisitEnabled" BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "RevisitThresholdDays" INT NOT NULL DEFAULT 14;

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
