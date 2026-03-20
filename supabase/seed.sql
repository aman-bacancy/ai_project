-- ============================================================
-- SEED DATA for Unified Project Command Center
-- Inserts demo organizations, workspaces, projects, tasks etc.
-- Uses a placeholder user_id that gets replaced with real user on first login
-- ============================================================

-- We'll use a DO block to get the first real user and seed around them
DO $$
DECLARE
  v_user1 UUID;
  v_user2 UUID;
  v_org   UUID := '10000000-0000-0000-0000-000000000001';
  v_ws1   UUID := '20000000-0000-0000-0000-000000000001';
  v_ws2   UUID := '20000000-0000-0000-0000-000000000002';
  v_p1    UUID := '30000000-0000-0000-0000-000000000001';
  v_p2    UUID := '30000000-0000-0000-0000-000000000002';
  v_p3    UUID := '30000000-0000-0000-0000-000000000003';
  v_l1    UUID := '40000000-0000-0000-0000-000000000001';
  v_l2    UUID := '40000000-0000-0000-0000-000000000002';
  v_l3    UUID := '40000000-0000-0000-0000-000000000003';
  v_l4    UUID := '40000000-0000-0000-0000-000000000004';
  v_l5    UUID := '40000000-0000-0000-0000-000000000005';
  v_l6    UUID := '40000000-0000-0000-0000-000000000006';
BEGIN
  -- Get first two users from auth.users
  SELECT id INTO v_user1 FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_user2 FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;

  -- Fallback: if only one user, use same for both
  IF v_user2 IS NULL THEN v_user2 := v_user1; END IF;

  -- Exit if no users yet
  IF v_user1 IS NULL THEN
    RAISE NOTICE 'No users found. Sign up first, then re-run seed.';
    RETURN;
  END IF;

  -- Update user profiles with nice names
  UPDATE user_profiles SET full_name = 'Alex Johnson' WHERE id = v_user1 AND full_name IS NULL;
  UPDATE user_profiles SET full_name = 'Sarah Chen'   WHERE id = v_user2 AND full_name IS NULL;

  -- Organization
  INSERT INTO organizations (id, name, slug) VALUES (v_org, 'Acme Corp', 'acme-corp-demo') ON CONFLICT DO NOTHING;
  INSERT INTO organization_members (organization_id, user_id, role) VALUES (v_org, v_user1, 'owner') ON CONFLICT DO NOTHING;
  INSERT INTO organization_members (organization_id, user_id, role) VALUES (v_org, v_user2, 'admin') ON CONFLICT DO NOTHING;

  -- Workspaces
  INSERT INTO workspaces (id, organization_id, name, slug, description, color, created_by)
  VALUES
    (v_ws1, v_org, 'Product Development', 'product-dev-demo', 'Main engineering workspace', '#7C3AED', v_user1),
    (v_ws2, v_org, 'Marketing', 'marketing-demo', 'Campaigns and content', '#EC4899', v_user1)
  ON CONFLICT DO NOTHING;

  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES
    (v_ws1, v_user1, 'owner'), (v_ws1, v_user2, 'member'),
    (v_ws2, v_user1, 'owner'), (v_ws2, v_user2, 'member')
  ON CONFLICT DO NOTHING;

  -- Projects
  INSERT INTO projects (id, workspace_id, name, description, status, color, created_by)
  VALUES
    (v_p1, v_ws1, 'Website Redesign', 'Complete overhaul of the company website', 'active', '#3B82F6', v_user1),
    (v_p2, v_ws1, 'Mobile App v2.0',  'New features and performance improvements', 'active', '#10B981', v_user1),
    (v_p3, v_ws2, 'Q2 Launch Campaign','Product launch marketing campaign for Q2',  'active', '#F97316', v_user2)
  ON CONFLICT DO NOTHING;

  -- Lists
  INSERT INTO lists (id, project_id, name, position)
  VALUES
    (v_l1, v_p1, 'Backlog',   0), (v_l2, v_p1, 'Sprint 1', 1), (v_l3, v_p1, 'Sprint 2', 2),
    (v_l4, v_p2, 'Tasks',     0), (v_l5, v_p2, 'Bug Fixes', 1),
    (v_l6, v_p3, 'Execution', 0)
  ON CONFLICT DO NOTHING;

  -- Tags
  INSERT INTO tags (workspace_id, name, color)
  VALUES
    (v_ws1, 'frontend',    '#3B82F6'),
    (v_ws1, 'backend',     '#8B5CF6'),
    (v_ws1, 'design',      '#EC4899'),
    (v_ws1, 'bug',         '#EF4444'),
    (v_ws1, 'performance', '#F97316')
  ON CONFLICT DO NOTHING;

  -- Tasks — Sprint 1
  INSERT INTO tasks (list_id, title, description, status, priority, position, assignee_id, created_by, due_date, estimated_hours)
  VALUES
    (v_l2, 'Design new homepage hero section',
     'Create mockups for the hero section with updated brand colors. Include mobile and desktop variants.',
     'in_progress', 'high', 1, v_user2, v_user1, now() + interval '3 days', 8),

    (v_l2, 'Set up design system in Figma',
     'Create a comprehensive design system with typography, color palette, and component library.',
     'done', 'high', 2, v_user2, v_user1, now() - interval '2 days', 12),

    (v_l2, 'Implement navigation component',
     'Build responsive navigation with mobile hamburger menu, dropdowns, and active states.',
     'todo', 'medium', 3, v_user1, v_user1, now() + interval '5 days', 6),

    (v_l2, 'Write homepage copy',
     'Draft compelling copy for hero, features section, social proof, and CTA buttons.',
     'in_review', 'medium', 4, v_user1, v_user1, now() + interval '1 days', 4),

    (v_l2, 'Fix mobile layout on pricing page',
     'Current pricing table breaks on screens smaller than 375px. Urgent fix needed.',
     'in_progress', 'urgent', 5, v_user1, v_user1, now() - interval '1 days', 3),

    (v_l1, 'Redesign pricing page',
     'New pricing page with comparison table and FAQ accordion.',
     'todo', 'medium', 1, null, v_user1, null, 8),

    (v_l1, 'Create customer case study pages',
     'Build template and populate 3 customer case studies.',
     'todo', 'low', 2, null, v_user1, null, 16),

    -- Mobile App
    (v_l4, 'Implement push notifications',
     'Add Firebase push notifications for task assignments and due date reminders.',
     'in_progress', 'high', 1, v_user1, v_user1, now() + interval '4 days', 12),

    (v_l4, 'Dark mode support',
     'Implement system-aware dark mode across all screens.',
     'todo', 'medium', 2, v_user2, v_user1, now() + interval '7 days', 16),

    (v_l5, 'Fix crash on profile image upload',
     'App crashes when user selects image > 5MB. Add file size validation.',
     'todo', 'urgent', 1, v_user1, v_user2, now() + interval '1 days', 2),

    (v_l5, 'Login screen flicker on Android',
     'Brief white flash before login screen renders on Android 13.',
     'in_progress', 'medium', 2, v_user1, v_user2, now() + interval '3 days', 4),

    -- Marketing
    (v_l6, 'Launch LinkedIn ad campaign',
     'Set up and launch targeted LinkedIn ads for enterprise decision makers.',
     'in_progress', 'high', 1, v_user2, v_user2, now() + interval '2 days', 8),

    (v_l6, 'Write 4 blog posts for launch',
     'SEO-optimized articles covering product benefits and industry trends.',
     'in_progress', 'medium', 2, v_user1, v_user2, now() + interval '6 days', 10),

    (v_l6, 'Set up email drip campaign',
     '6-email nurture sequence for trial signups.',
     'todo', 'high', 3, v_user2, v_user2, now() + interval '8 days', 6)
  ON CONFLICT DO NOTHING;

  -- Milestones
  INSERT INTO milestones (project_id, name, description, due_date, status)
  VALUES
    (v_p1, 'Design Complete',    'All mockups approved and handed to engineering', (now() + interval '7 days')::date,  'open'),
    (v_p1, 'Beta Launch',        'Internal beta with selected users',               (now() + interval '30 days')::date, 'open'),
    (v_p2, 'v2.0 App Store Release', 'Submit to App Store and Play Store',          (now() + interval '45 days')::date, 'open')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed data inserted successfully for user %', v_user1;
END;
$$;
