
-- 1. Remover a coluna project_id da tabela retrospectives
ALTER TABLE public.retrospectives DROP COLUMN IF EXISTS project_id;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "Sprint members can create retrospectives" ON public.retrospectives;
DROP POLICY IF EXISTS "Sprint members can view retrospectives" ON public.retrospectives;
DROP POLICY IF EXISTS "Sprint members can update retrospectives" ON public.retrospectives;
DROP POLICY IF EXISTS "Sprint members can delete retrospectives" ON public.retrospectives;

-- 3. Criar novas políticas RLS

-- Todos vinculados à Sprint podem criar retrospectivas
CREATE POLICY "Sprint members can create their own retrospectives"
ON public.retrospectives
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by 
  AND EXISTS (
    SELECT 1
    FROM sprints s
    JOIN user_roles ur ON ur.org_id = s.org_id
    WHERE s.id = retrospectives.sprint_id
      AND ur.user_id = auth.uid()
  )
);

-- Criador pode ver sua própria retrospectiva
CREATE POLICY "Users can view their own retrospectives"
ON public.retrospectives
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Admins da org podem ver todas as retrospectivas da sprint
CREATE POLICY "Org admins can view all retrospectives"
ON public.retrospectives
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM sprints s
    JOIN user_roles ur ON ur.org_id = s.org_id
    WHERE s.id = retrospectives.sprint_id
      AND ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);

-- Criador pode atualizar sua própria retrospectiva
CREATE POLICY "Users can update their own retrospectives"
ON public.retrospectives
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Criador pode deletar sua própria retrospectiva
CREATE POLICY "Users can delete their own retrospectives"
ON public.retrospectives
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- 4. Atualizar políticas dos itens de retrospectiva
DROP POLICY IF EXISTS "Sprint members can create retrospective items" ON public.retrospective_items;
DROP POLICY IF EXISTS "Sprint members can view retrospective items" ON public.retrospective_items;

-- Criar novas políticas para retrospective_items
CREATE POLICY "Users can create items in their retrospectives"
ON public.retrospective_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by 
  AND EXISTS (
    SELECT 1
    FROM retrospectives r
    WHERE r.id = retrospective_items.retrospective_id
      AND r.created_by = auth.uid()
  )
);

-- Usuário pode ver itens de sua própria retrospectiva
CREATE POLICY "Users can view items from their retrospectives"
ON public.retrospective_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM retrospectives r
    WHERE r.id = retrospective_items.retrospective_id
      AND r.created_by = auth.uid()
  )
);

-- Admins podem ver todos os itens
CREATE POLICY "Org admins can view all retrospective items"
ON public.retrospective_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM retrospectives r
    JOIN sprints s ON s.id = r.sprint_id
    JOIN user_roles ur ON ur.org_id = s.org_id
    WHERE r.id = retrospective_items.retrospective_id
      AND ur.user_id = auth.uid()
      AND ur.role = 'admin'
  )
);
