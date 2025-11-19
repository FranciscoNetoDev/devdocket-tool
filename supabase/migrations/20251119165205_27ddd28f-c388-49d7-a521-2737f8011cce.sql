-- Drop the current policy that allows all members
DROP POLICY IF EXISTS "Project members can create invites" ON public.project_invites;

-- Restore policy that only allows admins to create invites
CREATE POLICY "Project admins can create invites"
ON public.project_invites
FOR INSERT
TO authenticated
WITH CHECK (
  is_project_admin(auth.uid(), project_id) 
  AND auth.uid() = created_by
);