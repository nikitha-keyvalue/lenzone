-- Add storage policies for photographers to upload and replace photos
CREATE POLICY "Photographers can upload photos for their clients" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'client-all-photos' 
  AND EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id::text = (storage.foldername(name))[1]
    AND clients.photographer_id = auth.uid()
  )
);

CREATE POLICY "Photographers can update photos for their clients" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'client-all-photos' 
  AND EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id::text = (storage.foldername(name))[1]
    AND clients.photographer_id = auth.uid()
  )
);

CREATE POLICY "Photographers can view photos for their clients" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'client-all-photos' 
  AND EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id::text = (storage.foldername(name))[1]
    AND clients.photographer_id = auth.uid()
  )
);