CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  color           TEXT DEFAULT '#7C3AED',
  icon            TEXT,
  is_private      BOOLEAN NOT NULL DEFAULT false,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

CREATE TABLE workspace_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member'
               CHECK (role IN ('owner','admin','member','viewer')),
  added_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = p_workspace_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION get_workspace_role(p_workspace_id UUID)
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM workspace_members WHERE workspace_id = p_workspace_id AND user_id = auth.uid() LIMIT 1;
$$;

CREATE POLICY "workspaces_select" ON workspaces FOR SELECT USING (is_workspace_member(id));
CREATE POLICY "workspaces_insert" ON workspaces FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "workspaces_update" ON workspaces FOR UPDATE USING (get_workspace_role(id) IN ('owner','admin'));

CREATE POLICY "ws_members_select" ON workspace_members FOR SELECT USING (is_workspace_member(workspace_id));
CREATE POLICY "ws_members_insert" ON workspace_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ws_members_update" ON workspace_members FOR UPDATE USING (get_workspace_role(workspace_id) IN ('owner','admin'));
