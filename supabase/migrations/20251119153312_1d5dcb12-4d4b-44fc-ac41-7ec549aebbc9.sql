-- Fix critical security issue: Restrict profile visibility to project team members only
-- Drop the overly permissive policy that allows any authenticated user to see all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new policy: Users can only see their own profile + profiles of users in shared projects
CREATE POLICY "Users can view team member profiles" ON public.profiles
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
);

-- Fix critical security issue: Restrict invite token visibility to project creators only
-- Drop the policy that allows all project members to see invite tokens
DROP POLICY IF EXISTS "Project members can view invites" ON public.project_invites;

-- Create new policy: Only project creators can view invite tokens
CREATE POLICY "Project creators can view invites" ON public.project_invites
FOR SELECT 
USING (
  is_project_creator(auth.uid(), project_id)
);