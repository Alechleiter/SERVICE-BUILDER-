-- ════════════════════════════════════════════════════════════
-- MIGRATION 5: ADD BUCKET COLUMN TO PROPOSALS
-- ════════════════════════════════════════════════════════════
-- Allows organizing proposals into named "buckets" (stacks)
-- within a client. Examples: "Active", "Completed", "Inspections"

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS bucket TEXT DEFAULT NULL;

-- Index for efficient client + bucket queries
CREATE INDEX IF NOT EXISTS idx_proposals_bucket
  ON public.proposals(client_id, bucket);
