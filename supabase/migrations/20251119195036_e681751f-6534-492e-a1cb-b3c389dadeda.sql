-- Add CASCADE DELETE to project-related foreign keys

-- Drop and recreate foreign keys with CASCADE DELETE

-- project_members
ALTER TABLE public.project_members
  DROP CONSTRAINT IF EXISTS project_members_project_id_fkey,
  ADD CONSTRAINT project_members_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- project_invites
ALTER TABLE public.project_invites
  DROP CONSTRAINT IF EXISTS project_invites_project_id_fkey,
  ADD CONSTRAINT project_invites_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- labels
ALTER TABLE public.labels
  DROP CONSTRAINT IF EXISTS labels_project_id_fkey,
  ADD CONSTRAINT labels_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- user_stories
ALTER TABLE public.user_stories
  DROP CONSTRAINT IF EXISTS user_stories_project_id_fkey,
  ADD CONSTRAINT user_stories_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- tasks
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_project_id_fkey,
  ADD CONSTRAINT tasks_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- retrospectives
ALTER TABLE public.retrospectives
  DROP CONSTRAINT IF EXISTS retrospectives_project_id_fkey,
  ADD CONSTRAINT retrospectives_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- sprint_projects
ALTER TABLE public.sprint_projects
  DROP CONSTRAINT IF EXISTS sprint_projects_project_id_fkey,
  ADD CONSTRAINT sprint_projects_project_id_fkey 
    FOREIGN KEY (project_id) 
    REFERENCES public.projects(id) 
    ON DELETE CASCADE;

-- Also add CASCADE to related child tables

-- task_assignees (depends on tasks)
ALTER TABLE public.task_assignees
  DROP CONSTRAINT IF EXISTS task_assignees_task_id_fkey,
  ADD CONSTRAINT task_assignees_task_id_fkey 
    FOREIGN KEY (task_id) 
    REFERENCES public.tasks(id) 
    ON DELETE CASCADE;

-- task_labels (depends on tasks and labels)
ALTER TABLE public.task_labels
  DROP CONSTRAINT IF EXISTS task_labels_task_id_fkey,
  ADD CONSTRAINT task_labels_task_id_fkey 
    FOREIGN KEY (task_id) 
    REFERENCES public.tasks(id) 
    ON DELETE CASCADE;

ALTER TABLE public.task_labels
  DROP CONSTRAINT IF EXISTS task_labels_label_id_fkey,
  ADD CONSTRAINT task_labels_label_id_fkey 
    FOREIGN KEY (label_id) 
    REFERENCES public.labels(id) 
    ON DELETE CASCADE;

-- task_audit_log (depends on tasks)
ALTER TABLE public.task_audit_log
  DROP CONSTRAINT IF EXISTS task_audit_log_task_id_fkey,
  ADD CONSTRAINT task_audit_log_task_id_fkey 
    FOREIGN KEY (task_id) 
    REFERENCES public.tasks(id) 
    ON DELETE CASCADE;

-- comments (depends on tasks)
ALTER TABLE public.comments
  DROP CONSTRAINT IF EXISTS comments_task_id_fkey,
  ADD CONSTRAINT comments_task_id_fkey 
    FOREIGN KEY (task_id) 
    REFERENCES public.tasks(id) 
    ON DELETE CASCADE;

-- user_story_comments (depends on user_stories)
ALTER TABLE public.user_story_comments
  DROP CONSTRAINT IF EXISTS user_story_comments_user_story_id_fkey,
  ADD CONSTRAINT user_story_comments_user_story_id_fkey 
    FOREIGN KEY (user_story_id) 
    REFERENCES public.user_stories(id) 
    ON DELETE CASCADE;

-- user_story_attachments (depends on user_stories)
ALTER TABLE public.user_story_attachments
  DROP CONSTRAINT IF EXISTS user_story_attachments_user_story_id_fkey,
  ADD CONSTRAINT user_story_attachments_user_story_id_fkey 
    FOREIGN KEY (user_story_id) 
    REFERENCES public.user_stories(id) 
    ON DELETE CASCADE;

-- sprint_user_stories (depends on user_stories)
ALTER TABLE public.sprint_user_stories
  DROP CONSTRAINT IF EXISTS sprint_user_stories_user_story_id_fkey,
  ADD CONSTRAINT sprint_user_stories_user_story_id_fkey 
    FOREIGN KEY (user_story_id) 
    REFERENCES public.user_stories(id) 
    ON DELETE CASCADE;

-- retrospective_items (depends on retrospectives)
ALTER TABLE public.retrospective_items
  DROP CONSTRAINT IF EXISTS retrospective_items_retrospective_id_fkey,
  ADD CONSTRAINT retrospective_items_retrospective_id_fkey 
    FOREIGN KEY (retrospective_id) 
    REFERENCES public.retrospectives(id) 
    ON DELETE CASCADE;