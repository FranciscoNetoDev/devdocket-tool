-- Add due_date column to projects table
ALTER TABLE public.projects 
ADD COLUMN due_date DATE;