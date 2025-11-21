-- Add RLS policy to allow users to view sprints through project membership
-- This allows users who are members of projects linked to a sprint to view that sprint
CREATE POLICY "Users can view sprints through project membership"
ON sprints
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM sprint_projects sp
    INNER JOIN project_members pm ON pm.project_id = sp.project_id
    WHERE sp.sprint_id = sprints.id
      AND pm.user_id = auth.uid()
  )
);