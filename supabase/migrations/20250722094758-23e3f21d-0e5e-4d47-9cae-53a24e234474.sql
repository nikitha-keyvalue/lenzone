-- Create clients table for photography management
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  due_date DATE,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  location TEXT,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies for photographer access to their clients
CREATE POLICY "Photographers can view their own clients" 
ON public.clients 
FOR SELECT 
USING (auth.uid() = photographer_id);

CREATE POLICY "Photographers can create their own clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid() = photographer_id);

CREATE POLICY "Photographers can update their own clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() = photographer_id);

CREATE POLICY "Photographers can delete their own clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid() = photographer_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for client files
INSERT INTO storage.buckets (id, name, public) VALUES ('client-references', 'client-references', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('client-all-photos', 'client-all-photos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('client-final-photos', 'client-final-photos', false);

-- Create storage policies for photographer access
CREATE POLICY "Photographers can upload client references" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-references' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Photographers can view client references" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-references' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Photographers can upload all photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-all-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Photographers can view all photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-all-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Photographers can upload final photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-final-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Photographers can view final photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-final-photos' AND auth.uid()::text = (storage.foldername(name))[1]);