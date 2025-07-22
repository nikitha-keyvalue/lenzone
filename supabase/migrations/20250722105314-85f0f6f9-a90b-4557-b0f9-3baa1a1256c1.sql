-- Create a table for photo comments
CREATE TABLE public.photo_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  photo_path TEXT NOT NULL,
  comment TEXT NOT NULL,
  commenter_name TEXT,
  commenter_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for photo comments
CREATE POLICY "Anyone can view comments for photos" 
ON public.photo_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create comments" 
ON public.photo_comments 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_photo_comments_updated_at
BEFORE UPDATE ON public.photo_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();