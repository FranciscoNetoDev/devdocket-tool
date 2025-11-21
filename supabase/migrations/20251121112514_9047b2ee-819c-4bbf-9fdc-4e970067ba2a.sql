-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Users can view profiles in their org" ON profiles;

-- Create a more permissive policy that allows users to see profiles of:
-- 1. Themselves
-- 2. Users in the same org
-- 3. Users who are members of projects they share
CREATE POLICY "Users can view accessible profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- Users can view their own profile
  id = auth.uid() 
  OR 
  -- Users can view profiles of others in the same organization
  EXISTS (
    SELECT 1
    FROM user_roles ur1
    INNER JOIN user_roles ur2 ON ur1.org_id = ur2.org_id
    WHERE ur1.user_id = auth.uid()
      AND ur2.user_id = profiles.id
  )
  OR
  -- Users can view profiles of others who share projects with them
  EXISTS (
    SELECT 1
    FROM project_members pm1
    INNER JOIN project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid()
      AND pm2.user_id = profiles.id
  )
  OR
  -- Users can view profiles of task assignees in their projects
  EXISTS (
    SELECT 1
    FROM tasks t
    INNER JOIN task_assignees ta ON ta.task_id = t.id
    WHERE ta.user_id = profiles.id
      AND can_access_project(auth.uid(), t.project_id)
  )
);