-- Create function to check if user is project admin (creator or has admin role)
CREATE OR REPLACE FUNCTION public.is_project_admin(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  RETURN (
    -- Check if user is the project creator
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE id = _project_id
        AND created_by = _user_id
    )
    OR
    -- Check if user has admin role in project_members
    EXISTS (
      SELECT 1
      FROM public.project_members
      WHERE project_id = _project_id
        AND user_id = _user_id
        AND role = 'admin'
    )
  );
END;
$$;

-- Update projects table policies
DROP POLICY IF EXISTS "projects_update_access" ON public.projects;
CREATE POLICY "projects_update_admin_only"
ON public.projects
FOR UPDATE
USING (is_project_admin(auth.uid(), id));

-- Update project_members policies for adding members
DROP POLICY IF EXISTS "Project creators can add members" ON public.project_members;
CREATE POLICY "Project admins can add members"
ON public.project_members
FOR INSERT
WITH CHECK (is_project_admin(auth.uid(), project_id));

-- Update project_members policies for removing members
DROP POLICY IF EXISTS "Project creators can remove members" ON public.project_members;
CREATE POLICY "Project admins can remove members"
ON public.project_members
FOR DELETE
USING (is_project_admin(auth.uid(), project_id));

-- Update project_members policies for updating members
DROP POLICY IF EXISTS "Project creators can update members" ON public.project_members;
CREATE POLICY "Project admins can update members"
ON public.project_members
FOR UPDATE
USING (is_project_admin(auth.uid(), project_id));