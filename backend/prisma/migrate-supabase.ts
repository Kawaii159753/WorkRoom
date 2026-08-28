import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to run the database migration');
}

const schemaSql = `
-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE "WorkspaceRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkflowStatus" AS ENUM ('REVIEW', 'REVISION', 'APPROVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ArtifactType" AS ENUM ('POSTIT_BLOCK', 'IDEA', 'FILE', 'CUSTOM_TASK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tables
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT UNIQUE NOT NULL,
  "password_hash" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "avatar_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "workspace_members" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "WorkspaceRole" NOT NULL DEFAULT 'VIEWER',
  "allowed_room_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "joined_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("workspace_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "sections" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "rooms" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "section_id" UUID REFERENCES "sections"("id") ON DELETE SET NULL,
  "name" TEXT NOT NULL,
  "icon" TEXT,
  "is_private" BOOLEAN NOT NULL DEFAULT FALSE,
  "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "room_permissions" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "room_id" UUID NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "can_edit" BOOLEAN NOT NULL DEFAULT FALSE,
  "can_view" BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE ("room_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "pages" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "room_id" UUID NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL DEFAULT 'Untitled Page',
  "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "version" INT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "blocks" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "page_id" UUID NOT NULL REFERENCES "pages"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL DEFAULT 'paragraph',
  "content" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "version" INT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "postits" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "room_id" UUID NOT NULL REFERENCES "rooms"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "content" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "color" TEXT NOT NULL DEFAULT 'yellow',
  "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "version" INT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "workflows" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "artifact_type" "ArtifactType" NOT NULL,
  "artifact_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "WorkflowStatus" NOT NULL DEFAULT 'REVIEW',
  "due_date" TIMESTAMPTZ,
  "version" INT NOT NULL DEFAULT 1,
  "created_by_id" UUID NOT NULL REFERENCES "users"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "workflow_assignees" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workflow_id" UUID NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("workflow_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "comments" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "workflow_id" UUID NOT NULL REFERENCES "workflows"("id") ON DELETE CASCADE,
  "author_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "parent_comment_id" UUID REFERENCES "comments"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "is_resolved" BOOLEAN NOT NULL DEFAULT FALSE,
  "resolved_at" TIMESTAMPTZ,
  "resolved_by_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "actor_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}'::JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "recipient_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "actor_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "read_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "files" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "workspace_id" UUID NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "uploader_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "original_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" INT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON "workspace_members"("workspace_id");
CREATE INDEX IF NOT EXISTS idx_sections_workspace ON "sections"("workspace_id");
CREATE INDEX IF NOT EXISTS idx_rooms_workspace ON "rooms"("workspace_id");
CREATE INDEX IF NOT EXISTS idx_pages_workspace ON "pages"("workspace_id");
CREATE INDEX IF NOT EXISTS idx_pages_room ON "pages"("room_id");
CREATE INDEX IF NOT EXISTS idx_blocks_page ON "blocks"("page_id");
CREATE INDEX IF NOT EXISTS idx_postits_workspace ON "postits"("workspace_id");
CREATE INDEX IF NOT EXISTS idx_postits_room ON "postits"("room_id");
CREATE INDEX IF NOT EXISTS idx_workflows_workspace ON "workflows"("workspace_id");
CREATE INDEX IF NOT EXISTS idx_workflows_status ON "workflows"("status");
CREATE INDEX IF NOT EXISTS idx_comments_workflow ON "comments"("workflow_id");
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON "notifications"("recipient_id");
`;

async function main() {
  console.log('🚀 Connecting to Supabase PostgreSQL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log(' Connected! Creating database tables and indexes on Supabase...');

  await client.query(schemaSql);
  console.log('🎉 All 14 tables, Enums, and Indexes created successfully on Supabase!');

  await client.end();
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
