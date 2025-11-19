-- Atualizar funções sem dropar (usando CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_project_creator(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = _project_id
      AND created_by = _user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_to_project_task(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.task_assignees ta
    INNER JOIN public.tasks t ON ta.task_id = t.id
    WHERE ta.user_id = _user_id
      AND t.project_id = _project_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    public.is_project_creator(_user_id, _project_id) OR
    public.is_project_member(_user_id, _project_id) OR
    public.is_assigned_to_project_task(_user_id, _project_id)
  );
END;
$$;