-- Create storage bucket for selected photos
INSERT INTO storage.buckets (id, name, public) VALUES ('client-selected-photos', 'client-selected-photos', false);

-- Create policies for selected photos bucket
CREATE POLICY "Photographers can view selected photos for their clients" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'client-selected-photos' 
  AND EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id::text = (storage.foldername(name))[1]
    AND clients.photographer_id = auth.uid()
  )
);

CREATE POLICY "Photographers can upload selected photos for their clients" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'client-selected-photos' 
  AND EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id::text = (storage.foldername(name))[1]
    AND clients.photographer_id = auth.uid()
  )
);

CREATE POLICY "Photographers can update selected photos for their clients" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'client-selected-photos' 
  AND EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id::text = (storage.foldername(name))[1]
    AND clients.photographer_id = auth.uid()
  )
);

CREATE POLICY "Photographers can delete selected photos for their clients" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'client-selected-photos' 
  AND EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id::text = (storage.foldername(name))[1]
    AND clients.photographer_id = auth.uid()
  )
);

-- Allow public access to selected photos for sharing
CREATE POLICY "Allow public access to selected photos for sharing" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-selected-photos');