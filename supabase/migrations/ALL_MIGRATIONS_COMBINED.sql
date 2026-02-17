-- ══════════════════════════════════════════════════════════════
-- COMBINED MIGRATION — Paste this entire file into Supabase SQL Editor
-- and click Run. Creates all tables, seeds data, and sets up storage.
-- ══════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════
-- MIGRATION 1: INITIAL SCHEMA
-- ════════════════════════════════════════════════════════════

-- 1. profiles
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
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. verticals
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
CREATE POLICY "Verticals readable by authenticated" ON public.verticals FOR SELECT TO authenticated USING (true);

-- 3. services
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
CREATE POLICY "Services readable by authenticated" ON public.services FOR SELECT TO authenticated USING (true);

-- 4. vertical_recommended_services
CREATE TABLE public.vertical_recommended_services (
  vertical_id   TEXT NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
  service_id    TEXT NOT NULL,
  PRIMARY KEY (vertical_id, service_id)
);
ALTER TABLE public.vertical_recommended_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recommendations readable by authenticated" ON public.vertical_recommended_services FOR SELECT TO authenticated USING (true);

-- 5. clients
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
CREATE POLICY "Users can CRUD own clients" ON public.clients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. service_builder_sessions
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
CREATE POLICY "Users can CRUD own sessions" ON public.service_builder_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. proposals
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
CREATE POLICY "Users can CRUD own proposals" ON public.proposals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. proposal_photos
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
CREATE POLICY "Users can CRUD own proposal photos" ON public.proposal_photos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.proposals p WHERE p.id = proposal_photos.proposal_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.proposals p WHERE p.id = proposal_photos.proposal_id AND p.user_id = auth.uid()));

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.service_builder_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('proposal-photos', 'proposal-photos', false);

CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proposal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proposal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'proposal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ════════════════════════════════════════════════════════════
-- MIGRATION 2: SEED DATA
-- ════════════════════════════════════════════════════════════

INSERT INTO public.verticals (id, label, icon, day_rate, night_rate, day_min, night_min, sort_order) VALUES
  ('apartment',               'Apartment / Multi-Family',       E'\U0001F3E2', 90,  110, 0, 0, 1),
  ('church',                  'Church',                         E'\u26EA',     85,  105, 0, 0, 2),
  ('education',               'Education',                      E'\U0001F393', 95,  115, 0, 0, 3),
  ('food-processing',         'Food Processing / Warehousing',  E'\U0001F3ED', 115, 135, 0, 0, 4),
  ('full-service-restaurant', 'Full Service Restaurant',        E'\U0001F37D', 110, 130, 0, 0, 5),
  ('government',              'Government',                     E'\U0001F3DB', 100, 120, 0, 0, 6),
  ('healthcare',              'Healthcare',                     E'\U0001F3E5', 125, 150, 0, 0, 7),
  ('hotels',                  'Hotels / Motels / Casinos',      E'\U0001F3E8', 105, 125, 0, 0, 8),
  ('retail-food',             'Retail with Food / Grocery',     E'\U0001F6D2', 100, 120, 0, 0, 9),
  ('non-food-manufacturing',  'Non-Food Mfg / Storage',        E'\u2699',     95,  115, 0, 0, 10),
  ('non-food-retail',         'Non-Food Retail',                E'\U0001F3EC', 85,  105, 0, 0, 11),
  ('office',                  'Office / Corporate RE',          E'\U0001F3E2', 90,  110, 0, 0, 12),
  ('other',                   'Other',                          E'\U0001F4CB', 100, 120, 0, 0, 13),
  ('pharmaceutical',          'Pharmaceutical',                 E'\U0001F48A', 130, 155, 0, 0, 14),
  ('quick-service-restaurant','Quick Service Restaurant',       E'\U0001F354', 105, 125, 0, 0, 15),
  ('transportation',          'Transportation',                 E'\U0001F69B', 95,  115, 0, 0, 16);

INSERT INTO public.services (id, service_type, label, description, pricing_type, unit_label, default_qty, default_traps, default_mode, default_customer, sort_order) VALUES
  ('trash',               'recurring', 'Trash',                   'Trash chute & compactor',              'perUnit',          'Trash Chutes',  '1',    NULL, NULL,       NULL,      1),
  ('rodent-control',      'recurring', 'Rodent Control/Stations', 'Exterior & interior rodent stations',  'rodentStation',    'Stations',      '8',    NULL, NULL,       NULL,      2),
  ('rodent-repellent-rec','recurring', 'Rodent Repellent',        'Ongoing rodent deterrent application', 'flat',              NULL,            NULL,   NULL, NULL,       NULL,      3),
  ('scent-services',      'recurring', 'Scent Services',          'Commercial scent diffusion system',    'flat',              NULL,            NULL,   NULL, NULL,       NULL,      4),
  ('exterior-foundation', 'recurring', 'Exterior Foundation',     'Perimeter defense per linear ft',      'linearFeet',       'Linear Feet',   '500',  NULL, NULL,       NULL,      5),
  ('interior-target',     'recurring', 'Interior Target Defense', 'Interior pest treatment by area type', 'interiorDefense',   NULL,            NULL,   NULL, NULL,       NULL,      6),
  ('bird-trapping',       'recurring', 'Bird (Trapping)',         'Bird coop trapping',                   'flat',              NULL,            NULL,   NULL, NULL,       NULL,      7),
  ('bird-flock-free',     'recurring', 'Bird (Flock Free)',       'OvoControl bird mgmt',                 'flat',              NULL,            NULL,   NULL, NULL,       NULL,      8),
  ('k9-recurring',        'recurring', 'K9',                      'Canine bed bug inspections',           'perRoom',          'Rooms',         '50',   NULL, NULL,       NULL,      9),
  ('fly-recurring',       'recurring', 'Fly',                     'ILT fly abatement',                    'perILT',           'ILT Units',     '2',    NULL, NULL,       NULL,      10),
  ('drain',               'recurring', 'Drain',                   'Green Drain trap guard',               'perUnit',          'Drain Guards',  '4',    NULL, NULL,       NULL,      11),
  ('gopher-recurring',    'recurring', 'Gopher',                  'Monthly gopher mgmt',                  'hourly',           'Hours/Month',   '2',    NULL, NULL,       NULL,      12),
  ('mosquito',            'recurring', 'Mosquito',                'Fog, In2Care, or combined',            'mosquito',          NULL,            '2000', 2,    'fog',      'current', 13);

INSERT INTO public.services (id, service_type, label, description, pricing_type, unit_label, default_qty, default_traps, default_mode, default_customer, sort_order) VALUES
  ('green-drain',         'onetime', 'Green Drain',          'Drain trap installation',              'perUnit',    'Drain Guards',  '4',    NULL, NULL, NULL, 1),
  ('bed-bug',             'onetime', 'Bed Bug',              'Heat or canine treatment',             'perBedroom', 'Bedrooms',      '1bed', NULL, NULL, NULL, 2),
  ('roach-intensive',     'onetime', 'Roach Intensive',      'Cockroach eradication',                'sqftRate',   'Sq Ft',         '3000', NULL, NULL, NULL, 3),
  ('hazmat-clean-out',    'onetime', 'Hazmat Clean Out',     'Rodent hazmat remediation',            'hourly',     'Hours',         '6',    NULL, NULL, NULL, 4),
  ('k9-onetime',          'onetime', 'K9',                   'One-time canine inspection',           'perRoom',    'Rooms',         '50',   NULL, NULL, NULL, 5),
  ('fly-onetime',         'onetime', 'Fly',                  'Exterior fly treatment',               'flat',        NULL,            NULL,   NULL, NULL, NULL, 6),
  ('flea',                'onetime', 'Flea',                 'Flea treatment per sq ft',             'sqftRate',   'Sq Ft',         '2500', NULL, NULL, NULL, 7),
  ('pantry-pest',         'onetime', 'Pantry Pest',          'Stored product pest',                  'flat',        NULL,            NULL,   NULL, NULL, NULL, 8),
  ('gopher-onetime',      'onetime', 'Gopher',               'Initial gopher eradication',           'perMound',   'Mounds/Holes',  '100',  NULL, NULL, NULL, 9),
  ('door-sweeps',         'onetime', 'Door Sweeps',          'Door sweep install',                   'perUnit',    'Door Sweeps',   '4',    NULL, NULL, NULL, 10),
  ('rodent-shield',       'onetime', 'Rodent Shield',        'Exclusion & sealing',                  'hourly',     'Hours',         '4',    NULL, NULL, NULL, 11),
  ('rodent-repellent-one','onetime', 'Rodent Repellent',     'Initial rodent deterrent installation','perUnit',    'Units',         '4',    NULL, NULL, NULL, 12),
  ('inspection',          'onetime', 'Inspection Services',  'Comprehensive inspection',             'flat',        NULL,            NULL,   NULL, NULL, NULL, 13);

INSERT INTO public.vertical_recommended_services (vertical_id, service_id) VALUES
  ('apartment', 'interior-target'), ('apartment', 'exterior-foundation'), ('apartment', 'rodent-control'),
  ('apartment', 'trash'), ('apartment', 'k9-recurring'), ('apartment', 'bed-bug'),
  ('church', 'interior-target'), ('church', 'exterior-foundation'), ('church', 'rodent-control'),
  ('education', 'interior-target'), ('education', 'exterior-foundation'), ('education', 'rodent-control'), ('education', 'fly-recurring'),
  ('food-processing', 'interior-target'), ('food-processing', 'exterior-foundation'), ('food-processing', 'rodent-control'), ('food-processing', 'fly-recurring'), ('food-processing', 'drain'),
  ('full-service-restaurant', 'interior-target'), ('full-service-restaurant', 'exterior-foundation'), ('full-service-restaurant', 'fly-recurring'), ('full-service-restaurant', 'drain'), ('full-service-restaurant', 'rodent-control'), ('full-service-restaurant', 'roach-intensive'),
  ('government', 'interior-target'), ('government', 'exterior-foundation'), ('government', 'rodent-control'),
  ('healthcare', 'interior-target'), ('healthcare', 'exterior-foundation'), ('healthcare', 'rodent-control'), ('healthcare', 'fly-recurring'), ('healthcare', 'k9-recurring'),
  ('hotels', 'interior-target'), ('hotels', 'exterior-foundation'), ('hotels', 'rodent-control'), ('hotels', 'k9-recurring'), ('hotels', 'bed-bug'), ('hotels', 'fly-recurring'),
  ('retail-food', 'interior-target'), ('retail-food', 'exterior-foundation'), ('retail-food', 'rodent-control'), ('retail-food', 'fly-recurring'), ('retail-food', 'drain'),
  ('non-food-manufacturing', 'interior-target'), ('non-food-manufacturing', 'exterior-foundation'), ('non-food-manufacturing', 'rodent-control'), ('non-food-manufacturing', 'rodent-shield'),
  ('non-food-retail', 'interior-target'), ('non-food-retail', 'exterior-foundation'), ('non-food-retail', 'rodent-control'),
  ('office', 'interior-target'), ('office', 'exterior-foundation'), ('office', 'rodent-control'),
  ('other', 'interior-target'), ('other', 'exterior-foundation'), ('other', 'rodent-control'),
  ('pharmaceutical', 'interior-target'), ('pharmaceutical', 'exterior-foundation'), ('pharmaceutical', 'rodent-control'), ('pharmaceutical', 'fly-recurring'), ('pharmaceutical', 'drain'),
  ('quick-service-restaurant', 'interior-target'), ('quick-service-restaurant', 'exterior-foundation'), ('quick-service-restaurant', 'fly-recurring'), ('quick-service-restaurant', 'drain'), ('quick-service-restaurant', 'rodent-control'),
  ('transportation', 'interior-target'), ('transportation', 'exterior-foundation'), ('transportation', 'rodent-control'), ('transportation', 'gopher-recurring');


-- ════════════════════════════════════════════════════════════
-- MIGRATION 3: PROPOSAL SNAPSHOTS
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS proposal_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  variant text NOT NULL CHECK (variant IN ('customer', 'internal')),
  html text NOT NULL,
  snapshot_data jsonb DEFAULT '{}',
  version_number int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_proposal ON proposal_snapshots(proposal_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user ON proposal_snapshots(user_id);

ALTER TABLE proposal_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own snapshots" ON proposal_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own snapshots" ON proposal_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Done! All tables, seed data, storage bucket, and RLS policies are set up.
