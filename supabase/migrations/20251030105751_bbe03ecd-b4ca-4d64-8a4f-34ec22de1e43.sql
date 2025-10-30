-- Função para criar organização e atribuir role de admin automaticamente
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(org_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Verifica se o usuário já tem uma organização
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  ) THEN
    -- Retorna a organização existente
    SELECT org_id INTO new_org_id
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN new_org_id;
  END IF;

  -- Cria a nova organização
  INSERT INTO public.organizations (name)
  VALUES (org_name)
  RETURNING id INTO new_org_id;

  -- Atribui role de admin ao usuário
  INSERT INTO public.user_roles (user_id, role, org_id)
  VALUES (auth.uid(), 'admin', new_org_id);

  RETURN new_org_id;
END;
$$;

-- Permitir que usuários autenticados executem esta função
GRANT EXECUTE ON FUNCTION public.create_organization_with_admin(text) TO authenticated;