-- Ensure required triggers exist for projects
-- 1) BEFORE INSERT: set created_by = auth.uid()
DROP TRIGGER IF EXISTS set_project_created_by ON public.projects;
CREATE TRIGGER set_project_created_by
BEFORE INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.set_project_created_by();

-- 2) AFTER INSERT: add creator as project member (admin)
DROP TRIGGER IF EXISTS add_project_creator_as_member ON public.projects;
CREATE TRIGGER add_project_creator_as_member
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.add_project_creator_as_member();

-- 3) BEFORE UPDATE: keep updated_at fresh
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();