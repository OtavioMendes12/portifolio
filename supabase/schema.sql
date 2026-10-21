-- Rode no SQL Editor do Supabase (projeto free).
-- Contador de visitas + livro de visitas, com RLS: leitura pública,
-- escrita só pelos caminhos permitidos, sem update/delete.

-- ===== Contador de visitas =====
create table if not exists public.site_stats (
  key   text primary key,
  value bigint not null default 0
);

insert into public.site_stats (key, value) values ('visits', 0)
on conflict (key) do nothing;

alter table public.site_stats enable row level security;

drop policy if exists "site_stats leitura publica" on public.site_stats;
create policy "site_stats leitura publica" on public.site_stats
  for select using (true);

-- Incremento atômico; o anon só consegue somar 1 por chamada.
create or replace function public.increment_visits()
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.site_stats set value = value + 1 where key = 'visits' returning value;
$$;

revoke all on function public.increment_visits() from public;
grant execute on function public.increment_visits() to anon;
