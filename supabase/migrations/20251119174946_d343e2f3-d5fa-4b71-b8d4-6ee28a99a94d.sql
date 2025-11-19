-- First, drop all policies that depend on project_id
DROP POLICY IF EXISTS "Users can view sprints" ON public.sprints;
DROP POLICY IF EXISTS "Project members can create sprints" ON public.sprints;
DROP POLICY IF EXISTS "Project members can update sprints" ON public.sprints;
DROP POLICY IF EXISTS "Project creators can delete sprints" ON public.sprints;
DROP POLICY IF EXISTS "Users can view sprint user stories" ON public.sprint_user_stories;
DROP POLICY IF EXISTS "Project members can manage sprint user stories" ON public.sprint_user_stories;

-- Now drop the foreign key constraint and column
ALTER TABLE public.sprints DROP CONSTRAINT IF EXISTS sprints_project_id_fkey;
ALTER TABLE public.sprints DROP COLUMN IF EXISTS project_id CASCADE;

-- Add org_id to sprints for organization separation
ALTER TABLE public.sprints ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create junction table to link sprints with multiple projects
CREATE TABLE IF NOT EXISTS public.sprint_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(sprint_id, project_id)
);

-- Enable RLS on sprint_projects
ALTER TABLE public.sprint_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for sprint_projects
CREATE POLICY "Users can view sprint projects"
  ON public.sprint_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = sprint_projects.project_id
        AND can_access_project(auth.uid(), p.id)
    )
  );

CREATE POLICY "Users can manage sprint projects"
  ON public.sprint_projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = sprint_projects.project_id
        AND can_access_project(auth.uid(), p.id)
    )
  );

-- New RLS policies for sprints (now global by org)
CREATE POLICY "Users can view sprints in their org"
  ON public.sprints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.org_id = sprints.org_id
    )
  );

CREATE POLICY "Users can create sprints in their org"
  ON public.sprints FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.org_id = sprints.org_id
    )
  );

CREATE POLICY "Users can update sprints in their org"
  ON public.sprints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.org_id = sprints.org_id
    )
  );

CREATE POLICY "Users can delete sprints in their org"
  ON public.sprints FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.org_id = sprints.org_id
    )
  );

-- New RLS policies for sprint_user_stories (now references sprint_projects)
CREATE POLICY "Users can view sprint user stories"
  ON public.sprint_user_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sprints s
      INNER JOIN public.user_roles ur ON ur.org_id = s.org_id
      WHERE s.id = sprint_user_stories.sprint_id
        AND ur.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage sprint user stories"
  ON public.sprint_user_stories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.sprints s
      INNER JOIN public.user_roles ur ON ur.org_id = s.org_id
      WHERE s.id = sprint_user_stories.sprint_id
        AND ur.user_id = auth.uid()
    )
  );