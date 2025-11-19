-- Fix: Allow project creators to see all profiles when adding members
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view team member profiles" ON public.profiles;

-- Create new policy: Users can see their own profile + profiles of users in shared projects + all profiles if they are creating/managing a project
CREATE POLICY "Users can view profiles for collaboration" ON public.profiles
FOR SELECT
USING (
  -- Users can always see their own profile
  id = auth.uid()
  OR
  -- Users can see profiles of people they share projects with
  EXISTS (
    SELECT 1
    FROM public.project_members pm1
    WHERE pm1.user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.project_members pm2
      WHERE pm2.user_id = profiles.id
      AND pm2.project_id = pm1.project_id
    )
  )
  OR
  -- Project creators can see all profiles (to add new members)
  EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.created_by = auth.uid()
  )
);