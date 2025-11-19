-- Drop existing policy
DROP POLICY IF EXISTS "Users can view sprints in their org" ON public.sprints;

-- Create new policy that allows viewing sprints if:
-- 1. User is in the sprint's organization, OR
-- 2. User is a member of a project that has user stories in the sprint
CREATE POLICY "Users can view sprints they have access to"
ON public.sprints
FOR SELECT
TO authenticated
USING (
  -- User is in the sprint's organization
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.org_id = sprints.org_id
  )
  OR
  -- User is a member of a project that has user stories in this sprint
  EXISTS (
    SELECT 1
    FROM public.sprint_user_stories sus
    INNER JOIN public.user_stories us ON sus.user_story_id = us.id
    INNER JOIN public.project_members pm ON pm.project_id = us.project_id
    WHERE sus.sprint_id = sprints.id
      AND pm.user_id = auth.uid()
  )
);