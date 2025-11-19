-- Remover a política problemática
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;

-- Criar nova política usando a função can_access_project que já existe e funciona
CREATE POLICY "Project members can create tasks" ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND can_access_project(auth.uid(), project_id)
);