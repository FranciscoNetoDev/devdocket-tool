-- Fix SELECT policy causing RLS on INSERT ... RETURNING for projects
-- Make sure creators can read their own projects immediately
DROP POLICY IF EXISTS projects_select_access ON public.projects;
CREATE POLICY projects_select_creator_or_member
ON public.projects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- creator can always read
  created_by = auth.uid()
  OR
  -- members or assignees can also read via helper functions (security definer)
  public.is_project_member(auth.uid(), id)
  OR
  public.is_assigned_to_project_task(auth.uid(), id)
);

-- Keep UPDATE/DELETE policies unchanged