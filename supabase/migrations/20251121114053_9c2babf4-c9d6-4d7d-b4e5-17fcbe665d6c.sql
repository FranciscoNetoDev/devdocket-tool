-- Remove org check from sprint visibility policy
DROP POLICY IF EXISTS "Users can view sprints comprehensive" ON sprints;

-- Create policy without org restriction
CREATE POLICY "Users can view sprints comprehensive"
ON sprints
FOR SELECT
TO authenticated
USING (
  -- Users who are members of projects linked to the sprint
  EXISTS (
    SELECT 1
    FROM sprint_projects sp
    INNER JOIN project_members pm ON pm.project_id = sp.project_id
    WHERE sp.sprint_id = sprints.id
      AND pm.user_id = auth.uid()
  )
  OR
  -- Users assigned to tasks in user stories that are in the sprint
  EXISTS (
    SELECT 1
    FROM sprint_user_stories sus
    INNER JOIN tasks t ON t.user_story_id = sus.user_story_id
    INNER JOIN task_assignees ta ON ta.task_id = t.id
    WHERE sus.sprint_id = sprints.id
      AND ta.user_id = auth.uid()
      AND t.deleted_at IS NULL
  )
);