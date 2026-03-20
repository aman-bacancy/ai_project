CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id         UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  parent_task_id  UUID REFERENCES tasks(id) ON DELETE CASCADE,
  milestone_id    UUID REFERENCES milestones(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'todo'
                  CHECK (status IN ('todo','in_progress','in_review','done','cancelled')),
  priority        TEXT NOT NULL DEFAULT 'none'
                  CHECK (priority IN ('urgent','high','medium','low','none')),
  position        FLOAT NOT NULL DEFAULT 0,
  assignee_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  due_date        TIMESTAMPTZ,
  start_date      TIMESTAMPTZ,
  estimated_hours NUMERIC(6,2),
  time_tracked    NUMERIC(8,2) NOT NULL DEFAULT 0,
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_list_id ON tasks(list_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_fts ON tasks USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE task_assignees (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, user_id)
);

CREATE TABLE task_dependencies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id   UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocking' CHECK (dependency_type IN ('blocking','waiting_on')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, depends_on_id)
);

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  is_edited   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_task_id ON comments(task_id);

CREATE TABLE attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by  UUID NOT NULL REFERENCES auth.users(id),
  file_name    TEXT NOT NULL,
  file_size    INTEGER NOT NULL,
  mime_type    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID REFERENCES tasks(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  actor_id     UUID NOT NULL REFERENCES auth.users(id),
  action       TEXT NOT NULL,
  old_value    JSONB,
  new_value    JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_task_id ON activity_log(task_id);

-- Time tracking
CREATE TABLE time_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  started_at  TIMESTAMPTZ NOT NULL,
  ended_at    TIMESTAMPTZ,
  duration    INTEGER,
  is_billable BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);

-- Custom fields
CREATE TABLE custom_field_definitions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  field_type   TEXT NOT NULL CHECK (field_type IN ('text','number','date','checkbox','dropdown','url','email')),
  position     INTEGER NOT NULL DEFAULT 0,
  is_required  BOOLEAN NOT NULL DEFAULT false,
  config       JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_field_values (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id     UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  value_text   TEXT,
  value_number NUMERIC,
  value_date   TIMESTAMPTZ,
  value_bool   BOOLEAN,
  value_json   JSONB,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (field_id, task_id)
);

-- Notifications
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type         TEXT NOT NULL,
  entity_type  TEXT NOT NULL DEFAULT 'task',
  entity_id    UUID,
  data         JSONB NOT NULL DEFAULT '{}',
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- RLS for tasks and related tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper for task workspace access
CREATE OR REPLACE FUNCTION can_access_task(p_task_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM tasks t
    JOIN lists l ON l.id = t.list_id
    JOIN projects p ON p.id = l.project_id
    WHERE t.id = p_task_id AND is_workspace_member(p.workspace_id)
  );
$$;

CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM lists l JOIN projects p ON p.id = l.project_id WHERE l.id = list_id AND is_workspace_member(p.workspace_id)));
CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM lists l JOIN projects p ON p.id = l.project_id WHERE l.id = list_id AND is_workspace_member(p.workspace_id)));
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM lists l JOIN projects p ON p.id = l.project_id WHERE l.id = list_id AND is_workspace_member(p.workspace_id)));
CREATE POLICY "tasks_delete" ON tasks FOR DELETE
  USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM lists l JOIN projects p ON p.id = l.project_id WHERE l.id = list_id AND get_workspace_role(p.workspace_id) IN ('owner','admin')));

CREATE POLICY "comments_select" ON comments FOR SELECT USING (can_access_task(task_id));
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (can_access_task(task_id) AND author_id = auth.uid());
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "attachments_select" ON attachments FOR SELECT USING (can_access_task(task_id));
CREATE POLICY "attachments_insert" ON attachments FOR INSERT WITH CHECK (can_access_task(task_id));

CREATE POLICY "time_entries_select" ON time_entries FOR SELECT USING (can_access_task(task_id));
CREATE POLICY "time_entries_insert" ON time_entries FOR INSERT WITH CHECK (can_access_task(task_id) AND user_id = auth.uid());
CREATE POLICY "time_entries_update" ON time_entries FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "cf_defs_select" ON custom_field_definitions FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)));
CREATE POLICY "cf_defs_insert" ON custom_field_definitions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND get_workspace_role(p.workspace_id) IN ('owner','admin','member')));

CREATE POLICY "cf_values_select" ON custom_field_values FOR SELECT USING (can_access_task(task_id));
CREATE POLICY "cf_values_insert" ON custom_field_values FOR INSERT WITH CHECK (can_access_task(task_id));
CREATE POLICY "cf_values_update" ON custom_field_values FOR UPDATE USING (can_access_task(task_id));

CREATE POLICY "activity_select" ON activity_log FOR SELECT USING (task_id IS NULL OR can_access_task(task_id));
CREATE POLICY "activity_insert" ON activity_log FOR INSERT WITH CHECK (actor_id = auth.uid());

CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (recipient_id = auth.uid());

-- Triggers
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Sync time_tracked from time_entries
CREATE OR REPLACE FUNCTION sync_task_time_tracked()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE tasks SET time_tracked = (
    SELECT COALESCE(SUM(duration), 0) / 60.0
    FROM time_entries
    WHERE task_id = COALESCE(NEW.task_id, OLD.task_id) AND duration IS NOT NULL
  ) WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_sync_time_tracked
  AFTER INSERT OR UPDATE OR DELETE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION sync_task_time_tracked();

-- Notify on task assignment
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR NEW.assignee_id != OLD.assignee_id) THEN
    INSERT INTO notifications(recipient_id, actor_id, type, entity_type, entity_id, data)
    VALUES (NEW.assignee_id, auth.uid(), 'task.assigned', 'task', NEW.id, jsonb_build_object('task_title', NEW.title));
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_task_assigned
  AFTER UPDATE OF assignee_id ON tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_assigned();

-- Realtime publications
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE time_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
