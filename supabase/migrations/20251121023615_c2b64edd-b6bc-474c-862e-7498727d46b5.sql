-- Fix critical storage security issue: Make user-story-attachments bucket private

-- Update bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'user-story-attachments';

-- Add RLS policies for storage bucket access
CREATE POLICY "Users can access attachments from their projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-story-attachments' AND
  auth.uid() IN (
    SELECT pm.user_id 
    FROM project_members pm
    INNER JOIN user_stories us ON us.project_id = pm.project_id
    WHERE (storage.foldername(name))[2]::uuid = us.id
  )
);

CREATE POLICY "Users can upload attachments to their projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-story-attachments' AND
  auth.uid() IN (
    SELECT pm.user_id 
    FROM project_members pm
    INNER JOIN user_stories us ON us.project_id = pm.project_id
    WHERE (storage.foldername(name))[2]::uuid = us.id
  )
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-story-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);