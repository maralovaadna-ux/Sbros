-- =========================================================
-- Миграция 0003: доработки по фидбеку
-- - единица измерения предложения (человек/кг/шт)
-- - произвольный scope "custom" с текстовым описанием
-- - dата+время окончания уже была timestamptz — просто уточняем использование
-- =========================================================

-- ---------- единица измерения ----------
create type public.unit_type as enum ('participants', 'kg', 'pcs');

alter table public.offers
  add column unit public.unit_type not null default 'participants';

comment on column public.offers.unit is 'В чём считаем прогресс: participants — люди, kg — килограммы, pcs — штуки';

-- переименовываем смысл: target_participants остаётся числовым полем "целевое количество",
-- но теперь трактуется в единицах `unit`, а не всегда "человек". Колонку не переименовываем
-- (миграция схемы наименьшего сопротивления), только уточняем комментарий.
comment on column public.offers.target_participants is 'Целевое количество в единицах поля unit (не всегда "участники")';

-- ---------- scope "custom" ----------
alter type public.scope_type add value if not exists 'custom';

alter table public.offers
  add column custom_scope_label text;

alter table public.offers drop constraint scope_fields_check;

alter table public.offers add constraint scope_fields_check check (
  (scope_type = 'country') or
  (scope_type = 'city' and city is not null) or
  (scope_type = 'district' and city is not null and district is not null) or
  (scope_type = 'residential_complex' and city is not null and residential_complex is not null) or
  (scope_type = 'building' and city is not null and street is not null and building is not null) or
  (scope_type = 'custom' and custom_scope_label is not null)
);

-- custom scope: доступ решает админ вручную (через отдельную таблицу allowed_users) —
-- на этом этапе MVP просто делаем custom видимым только админу и тем, кого админ добавит.
create table public.custom_scope_access (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (offer_id, user_id)
);

alter table public.custom_scope_access enable row level security;

create policy custom_scope_access_select on public.custom_scope_access
  for select using (public.is_admin() or user_id = auth.uid());

create policy custom_scope_access_admin_write on public.custom_scope_access
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- Гостевой доступ (просмотр без регистрации)
-- =========================================================
-- Принцип: анонимные (auth.uid() is null) могут ЧИТАТЬ:
--   - offers/price_tiers уровня city/country полностью
--   - offers уровня building/residential_complex/district/custom — тоже видны при select
--     (иначе прямые ссылки-приглашения не открывались бы гостю), но фронтенд сам решает,
--     показывать ли гостю детали в общей ленте или заглушку — для ленты используется
--     отдельная упрощённая витрина offers_public_preview без чувствительных полей.
-- Писать (insert в participations/messages) анонимам по-прежнему нельзя — только auth.uid().

-- offers: разрешаем select всем (в т.ч. анонимам). Право УЧАСТВОВАТЬ по-прежнему
-- проверяется через can_user_access_offer, который для анонима вернёт false (нет profile).
drop policy offers_select_scoped on public.offers;
create policy offers_select_public on public.offers
  for select using (true);

-- price_tiers: тоже открываем на чтение всем — цены не секрет, наоборот их и нужно
-- показывать гостю, чтобы замотивировать зарегистрироваться.
drop policy price_tiers_select on public.price_tiers;
create policy price_tiers_select_public on public.price_tiers
  for select using (true);

-- participations: список участников (имена) можно оставить закрытым от анонимов —
-- гостю для ленты и карточки достаточно count(), а не персональных данных.
-- (offer_stats — VIEW, а не таблица с RLS, count там уже агрегирован — доступен всем.)
drop policy participations_select on public.participations;
create policy participations_select_auth on public.participations
  for select using (
    auth.uid() is not null and (
      public.is_admin() or exists (
        select 1 from public.offers o where o.id = offer_id and public.can_user_access_offer(auth.uid(), o.id)
      )
    )
  );

-- messages: чтение открываем всем (в т.ч. анонимам) — гость должен видеть переписку.
-- Запись (insert) остаётся только для зарегистрированных — политика messages_insert_own
-- уже требует auth.uid() = user_id, что физически невозможно для анонима.
drop policy messages_select on public.messages;
create policy messages_select_public on public.messages
  for select using (true);

comment on table public.offers is 'Просмотр открыт всем, включая анонимов. Участие (participations insert) и чат (messages insert) требуют регистрации.';
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
    when 'custom' then exists (
      select 1 from public.custom_scope_access csa
      where csa.offer_id = o.id and csa.user_id = p_user_id
    )
    else false
  end
  from public.offers o, public.profiles p
  where o.id = p_offer_id and p.id = p_user_id;
$$;

-- =========================================================
-- Короткий человекочитаемый номер СБРОСа (для комментариев к чеку и т.п.)
-- Автоинкремент, начиная с 1000 для солидности.
-- =========================================================

create sequence public.offer_number_seq start 1000;

alter table public.offers
  add column offer_number int not null default nextval('public.offer_number_seq');

create unique index offers_offer_number_idx on public.offers (offer_number);

comment on column public.offers.offer_number is 'Короткий номер СБРОСа для устной/письменной коммуникации, напр. #1042';
