-- Resetar políticas de RLS da tabela projects e criar políticas permissivas e claras
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes conhecidas
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects they have access to" ON public.projects;
DROP POLICY IF EXISTS "Project creators and members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project creators can delete projects" ON public.projects;

-- Criar políticas PERMISSIVAS explícitas
CREATE POLICY "projects_insert_authenticated"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "projects_select_access"
ON public.projects
FOR SELECT
TO authenticated
USING (public.can_access_project(auth.uid(), id));

CREATE POLICY "projects_update_access"
ON public.projects
FOR UPDATE
TO authenticated
USING (public.can_access_project(auth.uid(), id));

CREATE POLICY "projects_delete_creator"
ON public.projects
FOR DELETE
TO authenticated
USING (public.is_project_creator(auth.uid(), id));

-- Garantir trigger para adicionar criador como membro admin
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.add_project_creator_as_member();