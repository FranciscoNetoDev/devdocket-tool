-- ==========================================
-- CORRIGIR POLÍTICAS DE ORGANIZATIONS
-- ==========================================

-- Remover políticas antigas que exigem admin para criar
DROP POLICY IF EXISTS "Admins can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can delete organizations" ON public.organizations;

-- Permitir que usuários autenticados criem organizações
-- A função create_organization_with_admin garante que eles se tornam admin automaticamente
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Usuários podem ver organizações onde têm qualquer role
CREATE POLICY "Users can view their organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.org_id = id
      AND ur.user_id = auth.uid()
  )
);

-- Apenas admins da organização podem atualizar
CREATE POLICY "Org admins can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.org_id = id
      AND ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

-- Apenas admins da organização podem deletar
CREATE POLICY "Org admins can delete organizations"
ON public.organizations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.org_id = id
      AND ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

-- ==========================================
-- ATUALIZAR FUNÇÃO CREATE_ORGANIZATION_WITH_ADMIN
-- ==========================================

-- Melhorar a função para verificar se usuário já tem org da forma correta
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(org_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  existing_org_id uuid;
BEGIN
  -- Verifica se o usuário já tem uma organização
  SELECT ur.org_id INTO existing_org_id
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1;

  -- Se já tem organização, retorna ela
  IF existing_org_id IS NOT NULL THEN
    RETURN existing_org_id;
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

-- ==========================================
-- CRIAR FUNÇÃO PARA ADICIONAR MEMBRO AO PROJETO AUTOMATICAMENTE
-- ==========================================

-- Trigger para adicionar automaticamente o criador como membro do projeto
CREATE OR REPLACE FUNCTION public.add_project_creator_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Adiciona o criador como membro admin do projeto
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar após inserção de projeto
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.add_project_creator_as_member();

-- ==========================================
-- GARANTIR QUE USER_ROLES PERMITE INSERÇÃO
-- ==========================================

-- Remover política muito restritiva e criar uma melhor
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Permitir que a função create_organization_with_admin insira roles
CREATE POLICY "System can manage roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permite se for pela função SECURITY DEFINER (via create_organization_with_admin)
  -- ou se o usuário é admin da organização
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin')
);

-- Admins podem atualizar roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem deletar roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));