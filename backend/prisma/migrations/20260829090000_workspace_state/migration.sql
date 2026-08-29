CREATE TABLE "workspace_states" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "updated_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workspace_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "workspace_states_workspace_id_key" ON "workspace_states"("workspace_id");
CREATE INDEX "workspace_states_updated_by_id_idx" ON "workspace_states"("updated_by_id");
ALTER TABLE "workspace_states" ADD CONSTRAINT "workspace_states_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workspace_states" ADD CONSTRAINT "workspace_states_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
