-- Criar trigger para adicionar criador do projeto como membro automaticamente
CREATE TRIGGER trigger_add_project_creator_as_member
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.add_project_creator_as_member();