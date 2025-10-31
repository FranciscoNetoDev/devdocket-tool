-- Ensure created_by is set server-side to match auth.uid() before RLS checks
CREATE OR REPLACE FUNCTION public.set_project_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Create/replace BEFORE INSERT trigger so created_by is always populated
DROP TRIGGER IF EXISTS set_project_created_by ON public.projects;
CREATE TRIGGER set_project_created_by
BEFORE INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.set_project_created_by();