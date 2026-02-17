-- ══════════════════════════════════════════════════════════
-- Seed Data — Verticals, Services, Recommended mappings
-- ══════════════════════════════════════════════════════════

-- ── Verticals (from VERTICALS + VERTICAL_RATES) ──
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


-- ── Recurring Services ──
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


-- ── One-Time Services ──
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


-- ── Recommended Services per Vertical ──
INSERT INTO public.vertical_recommended_services (vertical_id, service_id) VALUES
  -- apartment
  ('apartment', 'interior-target'),
  ('apartment', 'exterior-foundation'),
  ('apartment', 'rodent-control'),
  ('apartment', 'trash'),
  ('apartment', 'k9-recurring'),
  ('apartment', 'bed-bug'),
  -- church
  ('church', 'interior-target'),
  ('church', 'exterior-foundation'),
  ('church', 'rodent-control'),
  -- education
  ('education', 'interior-target'),
  ('education', 'exterior-foundation'),
  ('education', 'rodent-control'),
  ('education', 'fly-recurring'),
  -- food-processing
  ('food-processing', 'interior-target'),
  ('food-processing', 'exterior-foundation'),
  ('food-processing', 'rodent-control'),
  ('food-processing', 'fly-recurring'),
  ('food-processing', 'drain'),
  -- full-service-restaurant
  ('full-service-restaurant', 'interior-target'),
  ('full-service-restaurant', 'exterior-foundation'),
  ('full-service-restaurant', 'fly-recurring'),
  ('full-service-restaurant', 'drain'),
  ('full-service-restaurant', 'rodent-control'),
  ('full-service-restaurant', 'roach-intensive'),
  -- government
  ('government', 'interior-target'),
  ('government', 'exterior-foundation'),
  ('government', 'rodent-control'),
  -- healthcare
  ('healthcare', 'interior-target'),
  ('healthcare', 'exterior-foundation'),
  ('healthcare', 'rodent-control'),
  ('healthcare', 'fly-recurring'),
  ('healthcare', 'k9-recurring'),
  -- hotels
  ('hotels', 'interior-target'),
  ('hotels', 'exterior-foundation'),
  ('hotels', 'rodent-control'),
  ('hotels', 'k9-recurring'),
  ('hotels', 'bed-bug'),
  ('hotels', 'fly-recurring'),
  -- retail-food
  ('retail-food', 'interior-target'),
  ('retail-food', 'exterior-foundation'),
  ('retail-food', 'rodent-control'),
  ('retail-food', 'fly-recurring'),
  ('retail-food', 'drain'),
  -- non-food-manufacturing
  ('non-food-manufacturing', 'interior-target'),
  ('non-food-manufacturing', 'exterior-foundation'),
  ('non-food-manufacturing', 'rodent-control'),
  ('non-food-manufacturing', 'rodent-shield'),
  -- non-food-retail
  ('non-food-retail', 'interior-target'),
  ('non-food-retail', 'exterior-foundation'),
  ('non-food-retail', 'rodent-control'),
  -- office
  ('office', 'interior-target'),
  ('office', 'exterior-foundation'),
  ('office', 'rodent-control'),
  -- other
  ('other', 'interior-target'),
  ('other', 'exterior-foundation'),
  ('other', 'rodent-control'),
  -- pharmaceutical
  ('pharmaceutical', 'interior-target'),
  ('pharmaceutical', 'exterior-foundation'),
  ('pharmaceutical', 'rodent-control'),
  ('pharmaceutical', 'fly-recurring'),
  ('pharmaceutical', 'drain'),
  -- quick-service-restaurant
  ('quick-service-restaurant', 'interior-target'),
  ('quick-service-restaurant', 'exterior-foundation'),
  ('quick-service-restaurant', 'fly-recurring'),
  ('quick-service-restaurant', 'drain'),
  ('quick-service-restaurant', 'rodent-control'),
  -- transportation
  ('transportation', 'interior-target'),
  ('transportation', 'exterior-foundation'),
  ('transportation', 'rodent-control'),
  ('transportation', 'gopher-recurring');
