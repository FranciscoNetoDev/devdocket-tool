-- Relax INSERT policy to rely on trigger for created_by and allow authenticated inserts
DROP POLICY IF EXISTS projects_insert_authenticated ON public.projects;
CREATE POLICY projects_insert_authenticated
ON public.projects
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Keep RLS strict for other operations (no changes)
-- Triggers already ensure created_by := auth.uid() and add creator as member