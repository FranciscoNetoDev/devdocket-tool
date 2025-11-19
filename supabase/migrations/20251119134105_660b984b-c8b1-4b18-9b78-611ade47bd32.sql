-- Create table for project invites
CREATE TABLE IF NOT EXISTS public.project_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  role TEXT DEFAULT 'member',
  CONSTRAINT project_invites_max_uses_check CHECK (max_uses IS NULL OR max_uses > 0)
);

-- Enable RLS
ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;

-- Project members can view invites
CREATE POLICY "Project members can view invites"
ON public.project_invites
FOR SELECT
USING (can_access_project(auth.uid(), project_id));

-- Project creators can create invites
CREATE POLICY "Project creators can create invites"
ON public.project_invites
FOR INSERT
WITH CHECK (
  is_project_creator(auth.uid(), project_id) AND
  auth.uid() = created_by
);

-- Project creators can delete invites
CREATE POLICY "Project creators can delete invites"
ON public.project_invites
FOR DELETE
USING (is_project_creator(auth.uid(), project_id));

-- Project creators can update invites
CREATE POLICY "Project creators can update invites"
ON public.project_invites
FOR UPDATE
USING (is_project_creator(auth.uid(), project_id));

-- Create index for faster lookups
CREATE INDEX idx_project_invites_token ON public.project_invites(token);
CREATE INDEX idx_project_invites_project_id ON public.project_invites(project_id);