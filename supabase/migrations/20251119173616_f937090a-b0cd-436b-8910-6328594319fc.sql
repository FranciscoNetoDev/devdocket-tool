-- Add user_story_id to tasks table
ALTER TABLE public.tasks ADD COLUMN user_story_id uuid REFERENCES public.user_stories(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_tasks_user_story_id ON public.tasks(user_story_id);

-- Create user_story_attachments table
CREATE TABLE public.user_story_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_story_id uuid NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  file_type text,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on user_story_attachments
ALTER TABLE public.user_story_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_story_attachments
CREATE POLICY "Users can view attachments of accessible user stories"
  ON public.user_story_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_stories us
      WHERE us.id = user_story_attachments.user_story_id
        AND can_access_project(auth.uid(), us.project_id)
    )
  );

CREATE POLICY "Project members can upload attachments"
  ON public.user_story_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_stories us
      WHERE us.id = user_story_attachments.user_story_id
        AND can_access_project(auth.uid(), us.project_id)
    )
    AND auth.uid() = uploaded_by
  );

CREATE POLICY "Uploaders can delete their attachments"
  ON public.user_story_attachments FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Create user_story_comments table
CREATE TABLE public.user_story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_story_id uuid NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  content text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on user_story_comments
ALTER TABLE public.user_story_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_story_comments
CREATE POLICY "Users can view comments of accessible user stories"
  ON public.user_story_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_stories us
      WHERE us.id = user_story_comments.user_story_id
        AND can_access_project(auth.uid(), us.project_id)
    )
  );

CREATE POLICY "Project members can create comments"
  ON public.user_story_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_stories us
      WHERE us.id = user_story_comments.user_story_id
        AND can_access_project(auth.uid(), us.project_id)
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Comment creators can update their comments"
  ON public.user_story_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Comment creators can delete their comments"
  ON public.user_story_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updating user_story_comments updated_at
CREATE TRIGGER update_user_story_comments_updated_at
  BEFORE UPDATE ON public.user_story_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create sprint_user_stories junction table
CREATE TABLE public.sprint_user_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_story_id uuid NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(sprint_id, user_story_id)
);

-- Enable RLS on sprint_user_stories
ALTER TABLE public.sprint_user_stories ENABLE ROW LEVEL SECURITY;

-- RLS policies for sprint_user_stories
CREATE POLICY "Users can view sprint user stories"
  ON public.sprint_user_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sprints s
      WHERE s.id = sprint_user_stories.sprint_id
        AND can_access_project(auth.uid(), s.project_id)
    )
  );

CREATE POLICY "Project members can manage sprint user stories"
  ON public.sprint_user_stories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sprints s
      WHERE s.id = sprint_user_stories.sprint_id
        AND can_access_project(auth.uid(), s.project_id)
    )
  );

-- Create retrospectives table
CREATE TABLE public.retrospectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL,
  title text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on retrospectives
ALTER TABLE public.retrospectives ENABLE ROW LEVEL SECURITY;

-- RLS policies for retrospectives
CREATE POLICY "Users can view retrospectives"
  ON public.retrospectives FOR SELECT
  USING (can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can create retrospectives"
  ON public.retrospectives FOR INSERT
  WITH CHECK (
    can_access_project(auth.uid(), project_id)
    AND auth.uid() = created_by
  );

CREATE POLICY "Project members can update retrospectives"
  ON public.retrospectives FOR UPDATE
  USING (can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can delete retrospectives"
  ON public.retrospectives FOR DELETE
  USING (can_access_project(auth.uid(), project_id));

-- Create trigger for retrospectives updated_at
CREATE TRIGGER update_retrospectives_updated_at
  BEFORE UPDATE ON public.retrospectives
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create retrospective_items table
CREATE TABLE public.retrospective_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retrospective_id uuid NOT NULL REFERENCES public.retrospectives(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('good', 'bad', 'risk', 'opportunity')),
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on retrospective_items
ALTER TABLE public.retrospective_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for retrospective_items
CREATE POLICY "Users can view retrospective items"
  ON public.retrospective_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.retrospectives r
      WHERE r.id = retrospective_items.retrospective_id
        AND can_access_project(auth.uid(), r.project_id)
    )
  );

CREATE POLICY "Project members can create retrospective items"
  ON public.retrospective_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.retrospectives r
      WHERE r.id = retrospective_items.retrospective_id
        AND can_access_project(auth.uid(), r.project_id)
    )
    AND auth.uid() = created_by
  );

CREATE POLICY "Item creators can update their items"
  ON public.retrospective_items FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Item creators can delete their items"
  ON public.retrospective_items FOR DELETE
  USING (auth.uid() = created_by);

-- Create trigger for retrospective_items updated_at
CREATE TRIGGER update_retrospective_items_updated_at
  BEFORE UPDATE ON public.retrospective_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();