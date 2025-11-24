-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view sprints comprehensive" ON public.sprints;

-- Drop existing function with old signature
DROP FUNCTION IF EXISTS public.is_assigned_to_sprint_task(uuid, uuid);

-- Create security definer functions to check sprint access
CREATE OR REPLACE FUNCTION public.is_sprint_project_member(_sprint_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM sprint_projects sp
    JOIN project_members pm ON pm.project_id = sp.project_id
    WHERE sp.sprint_id = _sprint_id
      AND pm.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_to_sprint_task(_sprint_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM sprint_user_stories sus
    JOIN tasks t ON t.user_story_id = sus.user_story_id
    JOIN task_assignees ta ON ta.task_id = t.id
    WHERE sus.sprint_id = _sprint_id
      AND ta.user_id = _user_id
      AND t.deleted_at IS NULL
  )
$$;

-- Create new policy using security definer functions
CREATE POLICY "Users can view sprints comprehensive"
ON public.sprints
FOR SELECT
TO authenticated
USING (
  public.is_sprint_project_member(id, auth.uid())
  OR
  public.is_assigned_to_sprint_task(id, auth.uid())
);