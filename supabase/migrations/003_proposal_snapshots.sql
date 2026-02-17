-- ═══════════════════════════════════════════════════════
-- Proposal Snapshots — CRM-like versioned export records
-- ═══════════════════════════════════════════════════════

create table if not exists proposal_snapshots (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  variant text not null check (variant in ('customer', 'internal')),
  html text not null,
  snapshot_data jsonb default '{}',
  version_number int not null default 1,
  created_at timestamptz not null default now()
);

-- Index for fast lookups by proposal
create index if not exists idx_snapshots_proposal on proposal_snapshots(proposal_id);

-- Index for fast lookups by user
create index if not exists idx_snapshots_user on proposal_snapshots(user_id);

-- RLS policies
alter table proposal_snapshots enable row level security;

create policy "Users can view their own snapshots"
  on proposal_snapshots for select
  using (auth.uid() = user_id);

create policy "Users can insert their own snapshots"
  on proposal_snapshots for insert
  with check (auth.uid() = user_id);

-- Snapshots are immutable — no update or delete policies
-- (re-finalizing creates new version rows, old ones are preserved)
