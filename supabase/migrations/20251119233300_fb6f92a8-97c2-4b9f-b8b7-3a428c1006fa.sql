-- Adiciona campo due_date em user_stories
ALTER TABLE public.user_stories 
ADD COLUMN IF NOT EXISTS due_date date;

-- Cria função de validação para due_date da task
CREATE OR REPLACE FUNCTION public.validate_task_due_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_project_due_date date;
  v_story_due_date date;
BEGIN
  -- Se não tem due_date na task, não precisa validar
  IF NEW.due_date IS NULL THEN
    RETURN NEW;
  END IF;

  -- Buscar due_date do projeto
  SELECT due_date INTO v_project_due_date
  FROM public.projects
  WHERE id = NEW.project_id;

  -- Validar contra due_date do projeto
  IF v_project_due_date IS NOT NULL AND NEW.due_date > v_project_due_date THEN
    RAISE EXCEPTION 'A data de finalização da task (%) não pode ser maior que a data do projeto (%)', 
      NEW.due_date, v_project_due_date;
  END IF;

  -- Buscar due_date da user story
  SELECT due_date INTO v_story_due_date
  FROM public.user_stories
  WHERE id = NEW.user_story_id;

  -- Validar contra due_date da user story
  IF v_story_due_date IS NOT NULL AND NEW.due_date > v_story_due_date THEN
    RAISE EXCEPTION 'A data de finalização da task (%) não pode ser maior que a data da história de usuário (%)', 
      NEW.due_date, v_story_due_date;
  END IF;

  RETURN NEW;
END;
$$;

-- Cria trigger para validar due_date antes de inserir ou atualizar tasks
DROP TRIGGER IF EXISTS validate_task_due_date_trigger ON public.tasks;
CREATE TRIGGER validate_task_due_date_trigger
  BEFORE INSERT OR UPDATE OF due_date, project_id, user_story_id
  ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_task_due_date();

-- Comentários para documentação
COMMENT ON COLUMN public.user_stories.due_date IS 'Data de entrega prevista para a história de usuário';
COMMENT ON FUNCTION public.validate_task_due_date() IS 'Valida que a data de finalização da task não ultrapassa as datas do projeto e da user story';