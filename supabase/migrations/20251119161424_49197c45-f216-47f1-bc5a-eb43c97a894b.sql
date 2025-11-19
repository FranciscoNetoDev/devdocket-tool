-- Adicionar constraint para garantir apenas uma sprint ativa por projeto
-- Primeiro, criar índice único parcial para sprints ativas
CREATE UNIQUE INDEX unique_active_sprint_per_project 
ON sprints(project_id) 
WHERE status = 'active';

-- Adicionar comentário explicativo
COMMENT ON INDEX unique_active_sprint_per_project IS 
'Garante que apenas uma sprint pode estar ativa por projeto ao mesmo tempo';