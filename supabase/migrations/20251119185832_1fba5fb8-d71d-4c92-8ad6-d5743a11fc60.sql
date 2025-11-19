-- Atualizar função create_task para aceitar user_story_id
CREATE OR REPLACE FUNCTION public.create_task(
  p_title text,
  p_description text,
  p_priority task_priority,
  p_status task_status,
  p_project_id uuid,
  p_user_story_id uuid,
  p_estimated_hours numeric DEFAULT NULL,
  p_due_date date DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_is_member boolean;
  v_is_creator boolean;
  v_task_id uuid;
  v_result json;
BEGIN
  -- Obter o usuário autenticado
  v_user_id := auth.uid();
  
  -- Verificar se o usuário está autenticado
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se é membro do projeto
  SELECT EXISTS (
    SELECT 1 
    FROM public.project_members pm 
    WHERE pm.user_id = v_user_id
      AND pm.project_id = p_project_id
  ) INTO v_is_member;
  
  -- Verificar se é criador do projeto
  SELECT EXISTS (
    SELECT 1 
    FROM public.projects p 
    WHERE p.id = p_project_id
      AND p.created_by = v_user_id
  ) INTO v_is_creator;
  
  -- Validar permissão
  IF NOT (v_is_member OR v_is_creator) THEN
    RAISE EXCEPTION 'Você não tem permissão para criar tasks neste projeto';
  END IF;
  
  -- Criar a task
  INSERT INTO public.tasks (
    title,
    description,
    priority,
    status,
    project_id,
    user_story_id,
    created_by,
    estimated_hours,
    due_date
  ) VALUES (
    p_title,
    p_description,
    p_priority,
    p_status,
    p_project_id,
    p_user_story_id,
    v_user_id,
    p_estimated_hours,
    p_due_date
  )
  RETURNING id INTO v_task_id;
  
  -- Retornar a task criada como JSON
  SELECT json_build_object(
    'id', t.id,
    'title', t.title,
    'description', t.description,
    'priority', t.priority,
    'status', t.status,
    'project_id', t.project_id,
    'user_story_id', t.user_story_id,
    'created_by', t.created_by,
    'estimated_hours', t.estimated_hours,
    'due_date', t.due_date,
    'created_at', t.created_at,
    'updated_at', t.updated_at
  )
  FROM public.tasks t
  WHERE t.id = v_task_id
  INTO v_result;
  
  RETURN v_result;
END;
$$;