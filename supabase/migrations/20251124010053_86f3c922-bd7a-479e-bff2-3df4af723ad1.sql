-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view sprints comprehensive" ON public.sprints;

-- Create permissive SELECT policy - all authenticated users can view all sprints
CREATE POLICY "All authenticated users can view sprints"
ON public.sprints
FOR SELECT
TO authenticated
USING (true);

-- Create restrictive UPDATE policy - only users with project/task access can update
CREATE POLICY "Users with access can update sprints"
ON public.sprints
FOR UPDATE
TO authenticated
USING (
  public.is_sprint_project_member(id, auth.uid())
  OR
  public.is_assigned_to_sprint_task(id, auth.uid())
)
WITH CHECK (
  public.is_sprint_project_member(id, auth.uid())
  OR
  public.is_assigned_to_sprint_task(id, auth.uid())
);

-- Create restrictive DELETE policy - only users with project access can delete
CREATE POLICY "Users with access can delete sprints"
ON public.sprints
FOR DELETE
TO authenticated
USING (
  public.is_sprint_project_member(id, auth.uid())
);