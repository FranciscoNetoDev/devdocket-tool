-- Tornar project_id nullable já que retrospectiva agora é ligada apenas à sprint
ALTER TABLE public.retrospectives ALTER COLUMN project_id DROP NOT NULL;

-- Adicionar constraint para garantir que sprint_id não seja null
ALTER TABLE public.retrospectives ALTER COLUMN sprint_id SET NOT NULL;

-- Atualizar RLS policies para retrospectives
DROP POLICY IF EXISTS "Project members can create retrospectives" ON public.retrospectives;
DROP POLICY IF EXISTS "Project members can update retrospectives" ON public.retrospectives;
DROP POLICY IF EXISTS "Project members can delete retrospectives" ON public.retrospectives;
DROP POLICY IF EXISTS "Users can view retrospectives" ON public.retrospectives;

-- Policies baseadas em sprint ao invés de projeto
CREATE POLICY "Sprint members can create retrospectives"
ON public.retrospectives
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM sprints s
    JOIN user_roles ur ON ur.org_id = s.org_id
    WHERE s.id = sprint_id AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Sprint members can view retrospectives"
ON public.retrospectives
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sprints s
    JOIN user_roles ur ON ur.org_id = s.org_id
    WHERE s.id = sprint_id AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Sprint members can update retrospectives"
ON public.retrospectives
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sprints s
    JOIN user_roles ur ON ur.org_id = s.org_id
    WHERE s.id = sprint_id AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Sprint members can delete retrospectives"
ON public.retrospectives
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sprints s
    JOIN user_roles ur ON ur.org_id = s.org_id
    WHERE s.id = sprint_id AND ur.user_id = auth.uid()
  )
);

-- Atualizar policies de retrospective_items também
DROP POLICY IF EXISTS "Project members can create retrospective items" ON public.retrospective_items;
DROP POLICY IF EXISTS "Users can view retrospective items" ON public.retrospective_items;

CREATE POLICY "Sprint members can create retrospective items"
ON public.retrospective_items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM retrospectives r
    JOIN sprints s ON s.id = r.sprint_id
    JOIN user_roles ur ON ur.org_id = s.org_id
    WHERE r.id = retrospective_id AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Sprint members can view retrospective items"
ON public.retrospective_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM retrospectives r
    JOIN sprints s ON s.id = r.sprint_id
    JOIN user_roles ur ON ur.org_id = s.org_id
    WHERE r.id = retrospective_id AND ur.user_id = auth.uid()
  )
);