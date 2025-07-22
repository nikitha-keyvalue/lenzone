-- Add resolved status to photo_comments table
ALTER TABLE public.photo_comments 
ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN resolved_by UUID NULL;