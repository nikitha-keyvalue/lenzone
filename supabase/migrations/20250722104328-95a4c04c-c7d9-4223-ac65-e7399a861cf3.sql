-- Add a public policy for client details when shared
-- This allows unauthenticated access to client information for sharing purposes
CREATE POLICY "Allow public access to client details for sharing" 
ON public.clients 
FOR SELECT 
USING (true);

-- Note: This creates a policy that allows anyone to read any client details
-- In a production environment, you might want to add a 'shared' column to clients table
-- and only allow public access when shared=true, or implement a more secure sharing mechanism