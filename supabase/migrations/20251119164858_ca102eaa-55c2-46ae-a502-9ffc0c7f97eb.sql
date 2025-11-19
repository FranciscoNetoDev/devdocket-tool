-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Project admins can create invites" ON public.project_invites;

-- Create new policy allowing all project members to create invites
CREATE POLICY "Project members can create invites"
ON public.project_invites
FOR INSERT
TO authenticated
WITH CHECK (
  can_access_project(auth.uid(), project_id) 
  AND auth.uid() = created_by
);