-- =========================================================
-- СБРОС — схема БД MVP
-- Философия: телефон живёт ТОЛЬКО в auth.users (Supabase Auth),
-- никогда не дублируется в публичных таблицах.
-- Всё, что доступно через PostgREST/клиент, физически не содержит телефон.
-- =========================================================

-- ---------- ENUM-ы ----------

create type public.scope_type as enum ('building', 'residential_complex', 'district', 'city', 'country');
create type public.app_role as enum ('user', 'admin');

-- ---------- PROFILES ----------
-- 1:1 с auth.users. НЕ содержит phone.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  avatar_url text,
  role public.app_role not null default 'user',
  is_blocked boolean not null default false,

  country text not null default 'Казахстан',
  city text not null,
  district text,                 -- район города
  residential_complex text,      -- ЖК, может быть пустым
  street text not null,
  building text not null,        -- номер дома

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Публичный профиль. Телефон НИКОГДА сюда не пишется.';

-- ---------- PRICE TIERS (уровни цены предложения) ----------

create table public.price_tiers (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers_placeholder(id), -- будет исправлено ниже (см. offers)
  min_participants int not null,
  price numeric(12,2) not null,
  created_at timestamptz not null default now()
);

-- ^ placeholder-ссылка выше невалидна, потому что offers объявляется ниже.
-- Postgres не позволяет ссылаться вперёд, поэтому пересоздаём таблицу правильно:
drop table public.price_tiers;

-- ---------- OFFERS ----------

create table public.offers (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text,
  image_url text,

  base_price numeric(12,2) not null,       -- обычная цена
  target_price numeric(12,2) not null,     -- цена при полном наборе участников
  target_participants int not null check (target_participants > 0),

  ends_at timestamptz not null,

  -- география предложения
  scope_type public.scope_type not null,
  country text not null default 'Казахстан',
  city text,                    -- обязательно для city/district/residential_complex/building
  district text,                -- обязательно для district/residential_complex/building
  residential_complex text,     -- обязательно для residential_complex
  building text,                -- обязательно для building (может дублировать street+building, для MVP держим building как "улица дом")

  street text,                  -- обязательно для building

  is_active boolean not null default true,

  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint scope_fields_check check (
    (scope_type = 'country') or
    (scope_type = 'city' and city is not null) or
    (scope_type = 'district' and city is not null and district is not null) or
    (scope_type = 'residential_complex' and city is not null and residential_complex is not null) or
    (scope_type = 'building' and city is not null and street is not null and building is not null)
  )
);

create index offers_scope_idx on public.offers (scope_type, city, district, residential_complex);
create index offers_active_idx on public.offers (is_active, ends_at);

-- ---------- PRICE TIERS (правильно, после offers) ----------

create table public.price_tiers (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  min_participants int not null,
  price numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique (offer_id, min_participants)
);

create index price_tiers_offer_idx on public.price_tiers (offer_id, min_participants);

-- ---------- PARTICIPATIONS (кто участвует в предложении) ----------

create table public.participations (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (offer_id, user_id)
);

create index participations_offer_idx on public.participations (offer_id);
create index participations_user_idx on public.participations (user_id);

-- ---------- MESSAGES (чат предложения) ----------

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_offer_idx on public.messages (offer_id, created_at);

-- =========================================================
-- ФУНКЦИЯ ДОСТУПА: "может ли пользователь видеть/участвовать в предложении"
-- Единая точка правды — используется в RLS и на клиенте (RPC).
-- =========================================================

create or replace function public.can_user_access_offer(p_user_id uuid, p_offer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case o.scope_type
    when 'country' then true
    when 'city' then p.city = o.city
    when 'district' then p.city = o.city and p.district = o.district
    when 'residential_complex' then p.city = o.city and p.residential_complex = o.residential_complex
    when 'building' then p.city = o.city and p.street = o.street and p.building = o.building
    else false
  end
  from public.offers o, public.profiles p
  where o.id = p_offer_id and p.id = p_user_id;
$$;

-- Хелпер: текущий пользователь — admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- =========================================================
-- ТЕКУЩАЯ ЦЕНА И СЧЁТЧИК УЧАСТНИКОВ (вычисляемое представление)
-- =========================================================

create or replace view public.offer_stats as
select
  o.id as offer_id,
  count(p.id)::int as participants_count,
  coalesce(
    (select pt.price
     from public.price_tiers pt
     where pt.offer_id = o.id and pt.min_participants <= count(p.id)
     order by pt.min_participants desc
     limit 1),
    o.base_price
  ) as current_price
from public.offers o
left join public.participations p on p.offer_id = o.id
group by o.id, o.base_price;

-- =========================================================
-- ТРИГГЕР: авто-создание профиля при регистрации через Auth
-- (профиль создаётся из raw_user_meta_data, который передаём при signUp)
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, city, district, residential_complex, street, building)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Пользователь'),
    coalesce(new.raw_user_meta_data->>'city', 'Актобе'),
    new.raw_user_meta_data->>'district',
    new.raw_user_meta_data->>'residential_complex',
    coalesce(new.raw_user_meta_data->>'street', ''),
    coalesce(new.raw_user_meta_data->>'building', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.offers enable row level security;
alter table public.price_tiers enable row level security;
alter table public.participations enable row level security;
alter table public.messages enable row level security;

-- ---- profiles ----
-- Любой залогиненный видит публичные поля всех профилей (не телефон — его тут физически нет).
create policy profiles_select_all on public.profiles
  for select using (auth.uid() is not null);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy profiles_update_admin on public.profiles
  for update using (public.is_admin());

-- вставка профиля делается только триггером (security definer), прямая вставка от клиента запрещена
create policy profiles_no_direct_insert on public.profiles
  for insert with check (false);

-- ---- offers ----
-- Видно только те предложения, на которые у пользователя есть доступ по гео, либо все — админу.
create policy offers_select_scoped on public.offers
  for select using (
    public.is_admin() or public.can_user_access_offer(auth.uid(), id)
  );

create policy offers_admin_write on public.offers
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- price_tiers ----
create policy price_tiers_select on public.price_tiers
  for select using (
    public.is_admin() or exists (
      select 1 from public.offers o where o.id = offer_id and public.can_user_access_offer(auth.uid(), o.id)
    )
  );

create policy price_tiers_admin_write on public.price_tiers
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- participations ----
-- Видеть список участников можно только если у тебя есть доступ к предложению.
create policy participations_select on public.participations
  for select using (
    public.is_admin() or exists (
      select 1 from public.offers o where o.id = offer_id and public.can_user_access_offer(auth.uid(), o.id)
    )
  );

-- Участвовать можно только за себя и только если есть доступ к предложению, и не заблокирован.
create policy participations_insert_own on public.participations
  for insert with check (
    auth.uid() = user_id
    and public.can_user_access_offer(auth.uid(), offer_id)
    and not exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_blocked)
  );

create policy participations_delete_admin on public.participations
  for delete using (public.is_admin());

-- ---- messages ----
create policy messages_select on public.messages
  for select using (
    public.is_admin() or exists (
      select 1 from public.offers o where o.id = offer_id and public.can_user_access_offer(auth.uid(), o.id)
    )
  );

create policy messages_insert_own on public.messages
  for insert with check (
    auth.uid() = user_id
    and public.can_user_access_offer(auth.uid(), offer_id)
    and not exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.is_blocked)
  );

create policy messages_delete_admin on public.messages
  for update using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- REALTIME
-- =========================================================

alter publication supabase_realtime add table public.participations;
alter publication supabase_realtime add table public.messages;

-- =========================================================
-- STORAGE: bucket для фото предложений и аватаров
-- =========================================================

insert into storage.buckets (id, name, public) values ('offer-images', 'offer-images', true)
  on conflict (id) do nothing;

create policy "public read offer images" on storage.objects
  for select using (bucket_id = 'offer-images');

create policy "admin upload offer images" on storage.objects
  for insert with check (bucket_id = 'offer-images' and public.is_admin());

create policy "admin update offer images" on storage.objects
  for update using (bucket_id = 'offer-images' and public.is_admin());
