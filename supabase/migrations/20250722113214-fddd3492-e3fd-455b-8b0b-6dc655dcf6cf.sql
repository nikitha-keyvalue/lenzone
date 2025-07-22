-- Add RLS policy to allow photographers to update photo comments (for resolving)
CREATE POLICY "Photographers can update comments for their clients" 
ON public.photo_comments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = photo_comments.client_id 
    AND clients.photographer_id = auth.uid()
  )
);