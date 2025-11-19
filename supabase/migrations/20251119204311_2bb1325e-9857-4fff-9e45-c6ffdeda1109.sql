-- Create security definer function to check if user is assigned to sprint tasks
CREATE OR REPLACE FUNCTION public.is_assigned_to_sprint_task(_user_id uuid, _sprint_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.sprint_user_stories sus
    INNER JOIN public.tasks t ON t.user_story_id = sus.user_story_id
    INNER JOIN public.task_assignees ta ON ta.task_id = t.id
    WHERE sus.sprint_id = _sprint_id
      AND ta.user_id = _user_id
      AND t.deleted_at IS NULL
  );
END;
$$;

-- Create new policy to allow users to view sprints they have tasks in
CREATE POLICY "Users can view sprints with assigned tasks"
ON public.sprints
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.org_id = sprints.org_id
  )
  OR
  public.is_assigned_to_sprint_task(auth.uid(), id)
);