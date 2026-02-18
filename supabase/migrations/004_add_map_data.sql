-- Add map_data column to proposals for storing map annotations/drawings
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS map_data JSONB DEFAULT NULL;
