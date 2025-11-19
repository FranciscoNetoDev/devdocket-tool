-- Remove the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.project_invites;
DROP POLICY IF EXISTS "Invite acceptance updates" ON public.project_invites;

-- Keep only the project creator view policy
-- (Project creators can view invites is already created)

-- Create a security definer function to validate and get invite details by token
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_invite json;
BEGIN
  -- Get invite details with project info
  SELECT json_build_object(
    'id', pi.id,
    'token', pi.token,
    'project_id', pi.project_id,
    'expires_at', pi.expires_at,
    'max_uses', pi.max_uses,
    'use_count', pi.use_count,
    'role', pi.role,
    'created_at', pi.created_at,
    'project_name', p.name,
    'project_key', p.key,
    'project_created_by', p.created_by
  )
  INTO v_invite
  FROM public.project_invites pi
  INNER JOIN public.projects p ON pi.project_id = p.id
  WHERE pi.token = _token;
  
  RETURN v_invite;
END;
$$;

-- Create a security definer function to accept an invite
CREATE OR REPLACE FUNCTION public.accept_project_invite(_token text, _user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_invite_id uuid;
  v_project_id uuid;
  v_role text;
  v_expires_at timestamptz;
  v_max_uses int;
  v_use_count int;
  v_result json;
BEGIN
  -- Get invite details
  SELECT id, project_id, role, expires_at, max_uses, use_count
  INTO v_invite_id, v_project_id, v_role, v_expires_at, v_max_uses, v_use_count
  FROM public.project_invites
  WHERE token = _token;
  
  -- Check if invite exists
  IF v_invite_id IS NULL THEN
    RETURN json_build_object('error', 'Convite não encontrado');
  END IF;
  
  -- Check if expired
  IF v_expires_at < now() THEN
    RETURN json_build_object('error', 'Convite expirado');
  END IF;
  
  -- Check if max uses reached
  IF v_max_uses IS NOT NULL AND v_use_count >= v_max_uses THEN
    RETURN json_build_object('error', 'Convite atingiu o limite de usos');
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = v_project_id AND user_id = _user_id
  ) THEN
    RETURN json_build_object('error', 'Você já é membro deste projeto');
  END IF;
  
  -- Add user to project
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (v_project_id, _user_id, v_role);
  
  -- Increment use count
  UPDATE public.project_invites
  SET use_count = use_count + 1
  WHERE id = v_invite_id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'project_id', v_project_id
  );
END;
$$;

-- Update policy: Only allow incrementing use_count through the function
CREATE POLICY "System can update invite use_count" ON public.project_invites
FOR UPDATE
USING (is_project_creator(auth.uid(), project_id))
WITH CHECK (is_project_creator(auth.uid(), project_id));