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

-- ===== Livro de visitas =====
create table if not exists public.guestbook (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 2 and 40),
  message    text not null check (char_length(message) between 2 and 280),
  client_id  uuid not null,            -- id anônimo do navegador (só para rate limit; não é público)
  created_at timestamptz not null default now()
);

create index if not exists guestbook_created_at_idx on public.guestbook (created_at desc);
create index if not exists guestbook_client_idx on public.guestbook (client_id, created_at desc);

alter table public.guestbook enable row level security;

drop policy if exists "guestbook leitura publica" on public.guestbook;
create policy "guestbook leitura publica" on public.guestbook
  for select using (true);

drop policy if exists "guestbook insert publico" on public.guestbook;
create policy "guestbook insert publico" on public.guestbook
  for insert with check (true);  -- validação fica na trigger abaixo
-- Sem policies de update/delete: ninguém edita nem apaga pelo site.

-- O anon lê só as colunas públicas (client_id fica escondido) e insere só os campos do formulário.
revoke all on public.guestbook from anon, authenticated;
grant select (id, name, message, created_at) on public.guestbook to anon, authenticated;
grant insert (name, message, client_id) on public.guestbook to anon, authenticated;

-- Validação no banco: espaços, palavrões e rate limit (o cliente também valida, mas não é confiável).
create or replace function public.guestbook_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- palavras inteiras (\m início, \M fim): 'computador', 'disputa', 'viaduto' passam
  blocked text := '\m(porra|caralh\w*|buceta|putas?|putos?|merda|foder|fod[ae]|fodase|viad[oa]s?|arrombad[oa]s?|desgracad[oa]s?|fuck\w*|shit|bitch|cunt|nigg\w*|fag|faggot)\M';
begin
  new.name := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.message := btrim(new.message);
  new.created_at := now();

  if char_length(new.name) < 2 or char_length(new.message) < 2 then
    raise exception 'guestbook: campos vazios' using errcode = 'check_violation';
  end if;
  if lower(unaccent_safe(new.name || ' ' || new.message)) ~ blocked then
    raise exception 'guestbook: linguagem bloqueada' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from public.guestbook
    where client_id = new.client_id and created_at > now() - interval '1 minute'
  ) then
    raise exception 'guestbook: aguarde um minuto' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  if (select count(*) from public.guestbook where created_at > now() - interval '1 minute') >= 20 then
    raise exception 'guestbook: muitas mensagens agora' using errcode = 'P0001', hint = 'rate_limited';
  end if;
  return new;
end;
$$;

-- remove acentos sem depender da extensão unaccent
create or replace function public.unaccent_safe(t text)
returns text
language sql
immutable
as $$
  select translate(t, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
$$;

drop trigger if exists guestbook_guard on public.guestbook;
create trigger guestbook_guard
  before insert on public.guestbook
  for each row execute function public.guestbook_guard();
