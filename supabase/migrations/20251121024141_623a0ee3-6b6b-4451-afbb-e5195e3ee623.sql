-- Add input validation to create_task SECURITY DEFINER function
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
SET search_path = 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_is_member boolean;
  v_is_creator boolean;
  v_task_id uuid;
  v_result json;
BEGIN
  -- Input validation
  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'Title is required';
  END IF;
  
  IF length(p_title) > 200 THEN
    RAISE EXCEPTION 'Title too long (max 200 characters)';
  END IF;
  
  IF p_description IS NOT NULL AND length(p_description) > 5000 THEN
    RAISE EXCEPTION 'Description too long (max 5000 characters)';
  END IF;
  
  IF p_estimated_hours IS NOT NULL AND (p_estimated_hours < 0 OR p_estimated_hours > 1000) THEN
    RAISE EXCEPTION 'Estimated hours must be between 0 and 1000';
  END IF;

  -- Get authenticated user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is project member
  SELECT EXISTS (
    SELECT 1 
    FROM public.project_members pm 
    WHERE pm.user_id = v_user_id
      AND pm.project_id = p_project_id
  ) INTO v_is_member;
  
  -- Check if user is project creator
  SELECT EXISTS (
    SELECT 1 
    FROM public.projects p 
    WHERE p.id = p_project_id
      AND p.created_by = v_user_id
  ) INTO v_is_creator;
  
  -- Validate permission
  IF NOT (v_is_member OR v_is_creator) THEN
    RAISE EXCEPTION 'You do not have permission to create tasks in this project';
  END IF;
  
  -- Create task
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
    trim(p_title),
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
  
  -- Return created task as JSON
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
$function$;

-- Add input validation to create_organization_with_admin function
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(org_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_org_id uuid;
  existing_org_id uuid;
BEGIN
  -- Input validation
  IF org_name IS NULL OR length(trim(org_name)) = 0 THEN
    RAISE EXCEPTION 'Organization name is required';
  END IF;
  
  IF length(org_name) > 100 THEN
    RAISE EXCEPTION 'Organization name too long (max 100 characters)';
  END IF;

  -- Check if user already has an organization
  SELECT ur.org_id INTO existing_org_id
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;

  -- If already has organization, return it
  IF existing_org_id IS NOT NULL THEN
    RETURN existing_org_id;
  END IF;

  -- Create new organization
  INSERT INTO public.organizations (name)
  VALUES (trim(org_name))
  RETURNING id INTO new_org_id;

  -- Assign admin role to user
  INSERT INTO public.user_roles (user_id, role, org_id)
  VALUES (auth.uid(), 'admin', new_org_id);

  RETURN new_org_id;
END;
$function$;