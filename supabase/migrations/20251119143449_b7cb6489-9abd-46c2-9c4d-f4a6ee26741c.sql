-- Vou tentar uma abordagem mais simples e direta
-- Remover a política atual
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;

-- Criar política nova com subquery inline mais simples
CREATE POLICY "Project members can create tasks" ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  -- Usuário deve ser o criador da task
  auth.uid() = created_by
  AND
  -- E deve ser membro do projeto OU criador do projeto
  (
    -- Membro do projeto
    project_id IN (
      SELECT pm.project_id 
      FROM public.project_members pm 
      WHERE pm.user_id = auth.uid()
    )
    OR
    -- Criador do projeto
    project_id IN (
      SELECT p.id 
      FROM public.projects p 
      WHERE p.created_by = auth.uid()
    )
  )
);