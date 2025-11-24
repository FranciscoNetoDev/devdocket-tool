-- Drop the problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Users can view sprints comprehensive" ON public.sprints;

-- Create a simpler policy without the org_id check to avoid recursion
CREATE POLICY "Users can view sprints comprehensive"
ON public.sprints
FOR SELECT
TO authenticated
USING (
  -- User is member of a project linked to this sprint
  EXISTS (
    SELECT 1
    FROM sprint_projects sp
    JOIN project_members pm ON pm.project_id = sp.project_id
    WHERE sp.sprint_id = sprints.id
      AND pm.user_id = auth.uid()
  )
  OR
  -- User is assigned to tasks in user stories within this sprint
  EXISTS (
    SELECT 1
    FROM sprint_user_stories sus
    JOIN tasks t ON t.user_story_id = sus.user_story_id
    JOIN task_assignees ta ON ta.task_id = t.id
    WHERE sus.sprint_id = sprints.id
      AND ta.user_id = auth.uid()
      AND t.deleted_at IS NULL
  )
);