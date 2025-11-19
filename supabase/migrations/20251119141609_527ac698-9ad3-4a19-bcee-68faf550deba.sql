-- Atualizar can_access_task com search_path correto
CREATE OR REPLACE FUNCTION public.can_access_task(_user_id uuid, _task_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task_created_by uuid;
  v_project_id uuid;
BEGIN
  -- Buscar informações da task
  SELECT t.created_by, t.project_id
  INTO v_task_created_by, v_project_id
  FROM public.tasks t
  WHERE t.id = _task_id;
  
  -- Se a task não existe, retornar false
  IF v_project_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se é o criador ou tem acesso ao projeto ou está atribuído
  RETURN (
    v_task_created_by = _user_id OR
    public.can_access_project(_user_id, v_project_id) OR
    EXISTS (
      SELECT 1
      FROM public.task_assignees ta
      WHERE ta.task_id = _task_id
        AND ta.user_id = _user_id
    )
  );
END;
$$;