-- Create temporary policies for unauthenticated photo moves (for testing/demo)

-- Allow public uploads to selected photos bucket
CREATE POLICY "Allow public uploads to selected photos for demo" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-selected-photos');

-- Allow public deletes from all photos bucket  
CREATE POLICY "Allow public deletes from all photos for demo"
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'client-all-photos');

-- Allow public deletes from selected photos bucket
CREATE POLICY "Allow public deletes from selected photos for demo"
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'client-selected-photos');

-- Allow public uploads to final photos bucket
CREATE POLICY "Allow public uploads to final photos for demo"
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-final-photos');