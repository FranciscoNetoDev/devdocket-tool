-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Project creators can create invites" ON public.project_invites;

-- Create new policy allowing both creators and admins to create invites
CREATE POLICY "Project admins can create invites"
ON public.project_invites
FOR INSERT
TO authenticated
WITH CHECK (
  is_project_admin(auth.uid(), project_id) 
  AND auth.uid() = created_by
);