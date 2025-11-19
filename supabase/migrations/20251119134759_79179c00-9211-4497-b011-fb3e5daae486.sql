-- Enable realtime for project_members table
ALTER TABLE public.project_members REPLICA IDENTITY FULL;

-- Add project_members to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;