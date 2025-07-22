-- Create packages table for wedding photography plans
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  max_edited_photos INTEGER NOT NULL,
  includes TEXT[] NOT NULL DEFAULT '{}',
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on packages table
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view packages (they're public information)
CREATE POLICY "Packages are viewable by everyone" 
ON public.packages 
FOR SELECT 
USING (true);

-- Only authenticated users can manage packages (for admin purposes)
CREATE POLICY "Authenticated users can manage packages" 
ON public.packages 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add package_id to clients table
ALTER TABLE public.clients 
ADD COLUMN package_id UUID REFERENCES public.packages(id);

-- Insert the three wedding photography packages
INSERT INTO public.packages (name, price, max_edited_photos, includes, deliverables) VALUES 
(
  'Plan 1', 
  15000.00, 
  15,
  ARRAY['Bride and groom shoot', 'Family session'],
  ARRAY['15 Edited Pictures', '1 Picstory (30s)', 'All Raw files shared via Google Drive']
),
(
  'Plan 2', 
  23000.00, 
  20,
  ARRAY['Bride and groom shoot', 'Family session', 'Mini Album'],
  ARRAY['20 Edited Pictures', 'All Raw files via Google Drive', '1 Mini Album (20 leaf, 40 pages)', '1 Laminated Frame (12x8)', '1 Picstory (30s)']
),
(
  'Plan 3', 
  28000.00, 
  20,
  ARRAY['Bride and groom shoot', 'Family session', 'Big Size Album'],
  ARRAY['20 Edited Pictures', 'All Raw files via Google Drive', '1 Big Size Album (20 leaf, 40 pages)', '1 Laminated Frame (12x8)', '1 Picstory (30s)']
);

-- Add trigger for packages updated_at
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();