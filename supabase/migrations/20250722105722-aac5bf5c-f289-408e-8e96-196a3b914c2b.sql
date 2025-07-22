-- Create storage policies for file uploads and access

-- Policies for client-references bucket
CREATE POLICY "Authenticated users can upload to client-references" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'client-references');

CREATE POLICY "Authenticated users can view client-references" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'client-references');

CREATE POLICY "Public can view client-references" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'client-references');

CREATE POLICY "Authenticated users can delete from client-references" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'client-references');

-- Policies for client-all-photos bucket
CREATE POLICY "Authenticated users can upload to client-all-photos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'client-all-photos');

CREATE POLICY "Authenticated users can view client-all-photos" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'client-all-photos');

CREATE POLICY "Public can view client-all-photos" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'client-all-photos');

CREATE POLICY "Authenticated users can delete from client-all-photos" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'client-all-photos');

-- Policies for client-final-photos bucket
CREATE POLICY "Authenticated users can upload to client-final-photos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'client-final-photos');

CREATE POLICY "Authenticated users can view client-final-photos" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'client-final-photos');

CREATE POLICY "Public can view client-final-photos" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'client-final-photos');

CREATE POLICY "Authenticated users can delete from client-final-photos" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'client-final-photos');