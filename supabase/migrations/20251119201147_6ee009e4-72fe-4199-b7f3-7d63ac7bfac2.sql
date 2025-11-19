-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view sprints they have access to" ON public.sprints;

-- Create a simpler policy that only checks organization membership
-- This avoids recursion by not checking sprint_user_stories
CREATE POLICY "Users can view sprints in their org"
ON public.sprints
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.org_id = sprints.org_id
  )
);