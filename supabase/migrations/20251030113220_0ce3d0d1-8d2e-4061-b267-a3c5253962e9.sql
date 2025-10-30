-- Corrigir política RLS para criação de projetos
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;

-- Nova política mais permissiva para criação de projetos
CREATE POLICY "Authenticated users can create projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Garantir que a política de visualização também está correta
DROP POLICY IF EXISTS "Users can view projects they have access to" ON public.projects;

CREATE POLICY "Users can view projects they have access to"
ON public.projects
FOR SELECT
TO authenticated
USING (can_access_project(auth.uid(), id));