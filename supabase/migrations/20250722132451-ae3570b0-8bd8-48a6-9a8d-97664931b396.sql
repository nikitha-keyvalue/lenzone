-- Create deliverable_status table to track client deliverable approvals
CREATE TABLE public.deliverable_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deliverable_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'pending-review', 'revisions-needed', 'approved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, deliverable_name)
);

-- Enable Row Level Security
ALTER TABLE public.deliverable_status ENABLE ROW LEVEL SECURITY;

-- Create policies for deliverable_status
CREATE POLICY "Photographers can manage deliverable status for their clients" 
ON public.deliverable_status 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = deliverable_status.client_id 
    AND clients.photographer_id = auth.uid()
  )
);

CREATE POLICY "Allow public access to deliverable status for sharing" 
ON public.deliverable_status 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public updates to deliverable status for client approvals" 
ON public.deliverable_status 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_deliverable_status_updated_at
BEFORE UPDATE ON public.deliverable_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for deliverable_status table
ALTER TABLE public.deliverable_status REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverable_status;