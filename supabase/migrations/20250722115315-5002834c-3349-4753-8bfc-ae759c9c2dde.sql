-- Add event_type column to clients table
ALTER TABLE public.clients 
ADD COLUMN event_type TEXT;