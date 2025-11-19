-- Remover a política atual
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;

-- Criar política simplificada usando verificações diretas (sem funções compostas)
CREATE POLICY "Project members can create tasks" ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  -- Usuário deve ser o criador da task
  auth.uid() = created_by
  AND
  (
    -- É membro do projeto (verificação direta)
    EXISTS (
      SELECT 1 
      FROM public.project_members pm 
      WHERE pm.user_id = auth.uid() 
        AND pm.project_id = tasks.project_id
    )
    OR
    -- É criador do projeto (verificação direta)
    EXISTS (
      SELECT 1 
      FROM public.projects p 
      WHERE p.id = tasks.project_id 
        AND p.created_by = auth.uid()
    )
  )
);