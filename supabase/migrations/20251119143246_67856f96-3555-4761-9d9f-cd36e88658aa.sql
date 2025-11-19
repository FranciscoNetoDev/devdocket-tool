-- Corrigir a política RLS com o bug crítico
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;

CREATE POLICY "Project members can create tasks" ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by 
  AND (
    -- Verifica se é criador do projeto
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = tasks.project_id AND p.created_by = auth.uid()
    )
    OR
    -- Verifica se é membro do projeto (CORRIGIDO O BUG AQUI)
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = tasks.project_id AND pm.user_id = auth.uid()
    )
  )
);