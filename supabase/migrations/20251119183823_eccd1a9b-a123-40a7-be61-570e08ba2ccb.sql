-- Tornar user_story_id obrigatório em tasks
-- Primeiro, deletar tasks sem user_story_id (se houver)
DELETE FROM tasks WHERE user_story_id IS NULL;

-- Tornar o campo NOT NULL
ALTER TABLE tasks ALTER COLUMN user_story_id SET NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN tasks.user_story_id IS 'User Story à qual a task pertence (obrigatório). A task herda a vinculação à sprint através da user story.';