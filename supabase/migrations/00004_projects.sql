CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','on_hold')),
  color           TEXT DEFAULT '#3B82F6',
  icon            TEXT,
  is_private      BOOLEAN NOT NULL DEFAULT false,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE TABLE lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  color        TEXT DEFAULT '#6B7280',
  UNIQUE (workspace_id, name)
);

CREATE TABLE milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  due_date    DATE,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id) AND get_workspace_role(workspace_id) IN ('owner','admin','member'));
CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (is_workspace_member(workspace_id) AND get_workspace_role(workspace_id) IN ('owner','admin','member'));

CREATE POLICY "lists_select" ON lists FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)));
CREATE POLICY "lists_insert" ON lists FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)));
CREATE POLICY "lists_update" ON lists FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)));

CREATE POLICY "tags_select" ON tags FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "tags_insert" ON tags FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "milestones_select" ON milestones FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)));
CREATE POLICY "milestones_insert" ON milestones FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lists_updated_at BEFORE UPDATE ON lists FOR EACH ROW EXECUTE FUNCTION set_updated_at();
