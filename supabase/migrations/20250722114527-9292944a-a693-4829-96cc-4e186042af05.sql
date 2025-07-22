-- Remove the incorrect policy that has the wrong column reference
DROP POLICY IF EXISTS "Photographers can upload photos for their clients" ON storage.objects;
DROP POLICY IF EXISTS "Photographers can update photos for their clients" ON storage.objects;
DROP POLICY IF EXISTS "Photographers can view photos for their clients" ON storage.objects;

-- Create the correct policies with the right column references
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