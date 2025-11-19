-- Criar bucket para anexos de user stories
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-story-attachments', 'user-story-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket de anexos
CREATE POLICY "Usuários podem ver anexos de user stories que têm acesso"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-story-attachments' AND
  EXISTS (
    SELECT 1 FROM user_story_attachments usa
    JOIN user_stories us ON us.id = usa.user_story_id
    WHERE usa.file_url LIKE '%' || storage.objects.name || '%'
    AND can_access_project(auth.uid(), us.project_id)
  )
);

CREATE POLICY "Usuários podem fazer upload de anexos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-story-attachments' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Usuários podem deletar seus próprios anexos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-story-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);