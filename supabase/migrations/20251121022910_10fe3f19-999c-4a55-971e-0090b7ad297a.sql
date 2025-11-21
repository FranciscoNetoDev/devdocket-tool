-- Fix critical security issues

-- 1. Fix profiles table RLS policies to prevent email harvesting
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Only allow users to view profiles of members in their projects
CREATE POLICY "Users can view profiles of project members"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.project_members pm1
    WHERE pm1.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.project_members pm2
      WHERE pm2.user_id = profiles.id
      AND pm2.project_id = pm1.project_id
    )
  )
);

-- 2. Fix organizations DELETE policy bug
DROP POLICY IF EXISTS "Organization admins can delete their org" ON public.organizations;

CREATE POLICY "Organization admins can delete their org"
ON public.organizations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.org_id = organizations.id
    AND ur.role = 'admin'
  )
);

-- 3. Fix organizations UPDATE policy bug
DROP POLICY IF EXISTS "Organization admins can update their org" ON public.organizations;

CREATE POLICY "Organization admins can update their org"
ON public.organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.org_id = organizations.id
    AND ur.role = 'admin'
  )
);

-- 4. Restrict task_audit_log to project admins only
DROP POLICY IF EXISTS "Users can view audit logs for tasks they have access to" ON public.task_audit_log;

CREATE POLICY "Project admins can view task audit logs"
ON public.task_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    INNER JOIN public.project_members pm ON pm.project_id = t.project_id
    WHERE t.id = task_audit_log.task_id
    AND pm.user_id = auth.uid()
    AND pm.role = 'admin'
  )
);

-- 5. Add policy to prevent direct token reading from project_invites
DROP POLICY IF EXISTS "Project creators can view their invites" ON public.project_invites;

CREATE POLICY "Project creators can manage invites without token exposure"
ON public.project_invites FOR SELECT
USING (
  created_by = auth.uid()
  -- Token column should be excluded from SELECT in application code
  -- Use RPC function get_invite_by_token for validation instead
);