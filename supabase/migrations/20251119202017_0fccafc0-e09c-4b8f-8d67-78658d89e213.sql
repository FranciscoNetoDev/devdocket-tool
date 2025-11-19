-- Add icon_name column to projects table
ALTER TABLE public.projects 
ADD COLUMN icon_name text DEFAULT 'folder-kanban';

-- Add comment explaining the column
COMMENT ON COLUMN public.projects.icon_name IS 'Name of the lucide-react icon to display for this project';