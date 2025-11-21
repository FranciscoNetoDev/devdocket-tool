-- Drop the restrictive profile policy and add a more permissive one for users in the same org
DROP POLICY IF EXISTS "Users can view profiles of project members" ON profiles;

-- Allow users to view all profiles in their organization
CREATE POLICY "Users can view profiles in their org"
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
);

-- Also ensure the sprint policy is working correctly
-- This policy allows users to view sprints if they are members of ANY project linked to that sprint
DROP POLICY IF EXISTS "Users can view sprints through project membership" ON sprints;

CREATE POLICY "Users can view sprints through project membership"
ON sprints
FOR SELECT
TO authenticated
USING (
  -- Users in the org can view the sprint
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.org_id = sprints.org_id
  )
  OR
  -- Users who are members of projects linked to the sprint can view it
  EXISTS (
    SELECT 1
    FROM sprint_projects sp
    INNER JOIN project_members pm ON pm.project_id = sp.project_id
    WHERE sp.sprint_id = sprints.id
      AND pm.user_id = auth.uid()
  )
);