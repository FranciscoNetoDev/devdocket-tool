-- Create user_stories table
CREATE TABLE public.user_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  story_points INTEGER,
  priority task_priority NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view user stories"
ON public.user_stories
FOR SELECT
USING (can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can create user stories"
ON public.user_stories
FOR INSERT
WITH CHECK (
  can_access_project(auth.uid(), project_id) AND
  auth.uid() = created_by
);

CREATE POLICY "Project members can update user stories"
ON public.user_stories
FOR UPDATE
USING (can_access_project(auth.uid(), project_id));

CREATE POLICY "Project members can delete user stories"
ON public.user_stories
FOR DELETE
USING (can_access_project(auth.uid(), project_id));

-- Create trigger for updated_at
CREATE TRIGGER update_user_stories_updated_at
BEFORE UPDATE ON public.user_stories
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();