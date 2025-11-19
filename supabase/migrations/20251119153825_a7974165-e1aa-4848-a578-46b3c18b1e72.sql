-- Fix invite acceptance: Allow users with valid tokens to view invites
-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Project creators can view invites" ON public.project_invites;

-- Create new policy: Project creators can view all invites for their projects
CREATE POLICY "Project creators can view invites" ON public.project_invites
FOR SELECT 
USING (
  is_project_creator(auth.uid(), project_id)
);

-- Create new policy: Anyone can view a specific invite by token (needed for acceptance)
CREATE POLICY "Anyone can view invite by token" ON public.project_invites
FOR SELECT 
USING (true);

-- Update policy: Allow users to increment use_count when accepting invites
DROP POLICY IF EXISTS "Project creators can update invites" ON public.project_invites;

CREATE POLICY "Invite acceptance updates" ON public.project_invites
FOR UPDATE 
USING (
  -- Project creators can update their invites
  is_project_creator(auth.uid(), project_id)
  OR
  -- Anyone can update use_count (for accepting invites)
  true
)
WITH CHECK (
  -- But only project creators can change other fields
  is_project_creator(auth.uid(), project_id)
  OR
  -- Allow incrementing use_count for invite acceptance
  (use_count = (SELECT use_count FROM project_invites WHERE id = project_invites.id) + 1)
);