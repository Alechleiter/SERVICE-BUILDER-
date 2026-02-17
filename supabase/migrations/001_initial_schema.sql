-- ══════════════════════════════════════════════════════════
-- Service Builder + Proposal Generator — Initial Schema
-- ══════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────
-- 1. profiles: extends Supabase auth.users
-- ────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  company_name  TEXT,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────
-- 2. verticals: industry verticals with pricing rates
-- ────────────────────────────────────────────────────────
CREATE TABLE public.verticals (
  id            TEXT PRIMARY KEY,
  label         TEXT NOT NULL,
  icon          TEXT NOT NULL,
  day_rate      NUMERIC(10,2) NOT NULL,
  night_rate    NUMERIC(10,2) NOT NULL,
  day_min       NUMERIC(10,2) NOT NULL DEFAULT 0,
  night_min     NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verticals readable by authenticated"
  ON public.verticals FOR SELECT
  TO authenticated
  USING (true);


-- ────────────────────────────────────────────────────────
-- 3. services: service catalog definitions
-- ────────────────────────────────────────────────────────
CREATE TABLE public.services (
  id              TEXT NOT NULL,
  service_type    TEXT NOT NULL CHECK (service_type IN ('recurring', 'onetime')),
  label           TEXT NOT NULL,
  description     TEXT NOT NULL,
  pricing_type    TEXT NOT NULL,
  unit_label      TEXT,
  default_qty     TEXT,
  default_traps   INT,
  default_mode    TEXT,
  default_customer TEXT,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, service_type)
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Services readable by authenticated"
  ON public.services FOR SELECT
  TO authenticated
  USING (true);


-- ────────────────────────────────────────────────────────
-- 4. vertical_recommended_services: M:N junction
-- ────────────────────────────────────────────────────────
CREATE TABLE public.vertical_recommended_services (
  vertical_id   TEXT NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
  service_id    TEXT NOT NULL,
  PRIMARY KEY (vertical_id, service_id)
);

ALTER TABLE public.vertical_recommended_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recommendations readable by authenticated"
  ON public.vertical_recommended_services FOR SELECT
  TO authenticated
  USING (true);


-- ────────────────────────────────────────────────────────
-- 5. clients: client / property records
-- ────────────────────────────────────────────────────────
CREATE TABLE public.clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  vertical_id     TEXT REFERENCES public.verticals(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_user ON public.clients(user_id);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own clients"
  ON public.clients FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────
-- 6. service_builder_sessions: saved wizard state
-- ────────────────────────────────────────────────────────
CREATE TABLE public.service_builder_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT,
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  vertical_id     TEXT NOT NULL REFERENCES public.verticals(id),
  is_night        BOOLEAN NOT NULL DEFAULT false,
  offering        JSONB NOT NULL DEFAULT '[]',
  totals          JSONB NOT NULL DEFAULT '{}',
  step            INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sb_sessions_user ON public.service_builder_sessions(user_id);

ALTER TABLE public.service_builder_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own sessions"
  ON public.service_builder_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────
-- 7. proposals: saved proposals
-- ────────────────────────────────────────────────────────
CREATE TABLE public.proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  session_id      UUID REFERENCES public.service_builder_sessions(id) ON DELETE SET NULL,
  template_id     TEXT NOT NULL,
  name            TEXT,
  form_data       JSONB NOT NULL DEFAULT '{}',
  inspection_date DATE,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','accepted','declined')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposals_user   ON public.proposals(user_id);
CREATE INDEX idx_proposals_client ON public.proposals(client_id);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own proposals"
  ON public.proposals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────
-- 8. proposal_photos: photo metadata (files in Storage)
-- ────────────────────────────────────────────────────────
CREATE TABLE public.proposal_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  caption         TEXT NOT NULL DEFAULT '',
  zone            TEXT NOT NULL DEFAULT 'exterior',
  unit_number     TEXT NOT NULL DEFAULT '',
  custom_zone     TEXT NOT NULL DEFAULT '',
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photos_proposal ON public.proposal_photos(proposal_id);

ALTER TABLE public.proposal_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own proposal photos"
  ON public.proposal_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_photos.proposal_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_photos.proposal_id
        AND p.user_id = auth.uid()
    )
  );


-- ────────────────────────────────────────────────────────
-- Auto-update updated_at timestamps
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.service_builder_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ────────────────────────────────────────────────────────
-- Storage bucket for proposal photos (private)
-- ────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-photos', 'proposal-photos', false);

CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'proposal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'proposal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'proposal-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
