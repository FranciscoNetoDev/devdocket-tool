-- Add deleted_at column for soft delete
ALTER TABLE public.tasks 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX idx_tasks_deleted_at ON public.tasks(deleted_at);

COMMENT ON COLUMN public.tasks.deleted_at IS 'Timestamp when task was soft deleted. NULL means task is active.';