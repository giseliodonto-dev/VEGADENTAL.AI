create table public.evolution_waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  email text,
  source text default 'landing_evolucao',
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.evolution_waitlist enable row level security;

create policy "anyone can join waitlist"
  on public.evolution_waitlist for insert
  to anon, authenticated
  with check (true);

create policy "owners can read waitlist"
  on public.evolution_waitlist for select
  to authenticated
  using (
    exists (
      select 1 from public.clinic_members
      where user_id = auth.uid() and role in ('dono','admin')
    )
  );