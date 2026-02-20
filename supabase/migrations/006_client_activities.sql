-- CRM-Lite: Activity log for client interactions (notes, calls, visits, etc.)
CREATE TABLE IF NOT EXISTS public.client_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  follow_up_date DATE DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_activities_client ON public.client_activities(client_id, created_at DESC);

ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own activities" ON public.client_activities
  FOR ALL USING (auth.uid() = user_id);
