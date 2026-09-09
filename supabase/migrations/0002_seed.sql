-- =========================================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- Запускать ПОСЛЕ того, как через приложение зарегистрирован
-- хотя бы один пользователь (нужен created_by, хотя он nullable).
-- Этот скрипт создаёт 4 демо-предложения на разных уровнях гео.
-- =========================================================

-- Предложение 1: дом (Актобе, ул. Абая, дом 15)
with new_offer as (
  insert into public.offers (
    title, description, base_price, target_price, target_participants,
    ends_at, scope_type, city, street, building
  ) values (
    'Мясной набор на неделю',
    '5 кг мяса + фарш + курица',
    35000, 29900, 50,
    now() + interval '10 days',
    'building', 'Актобе', 'Абая', '15'
  ) returning id
)
insert into public.price_tiers (offer_id, min_participants, price)
select id, tier.min_p, tier.price
from new_offer, (values (1, 35000), (10, 32000), (25, 30900), (50, 29900)) as tier(min_p, price);

-- Предложение 2: ЖК Альтаир
with new_offer as (
  insert into public.offers (
    title, description, base_price, target_price, target_participants,
    ends_at, scope_type, city, residential_complex
  ) values (
    'Шиномонтаж — переобувка авто',
    'Замена резины со скидкой на весь ЖК',
    8000, 4900, 30,
    now() + interval '14 days',
    'residential_complex', 'Актобе', 'Альтаир'
  ) returning id
)
insert into public.price_tiers (offer_id, min_participants, price)
select id, tier.min_p, tier.price
from new_offer, (values (1, 8000), (10, 6500), (20, 5500), (30, 4900)) as tier(min_p, price);

-- Предложение 3: город Актобе
with new_offer as (
  insert into public.offers (
    title, description, base_price, target_price, target_participants,
    ends_at, scope_type, city
  ) values (
    'Кондиционеры на лето',
    'Сплит-система 12 000 BTU с установкой',
    180000, 129000, 100,
    now() + interval '20 days',
    'city', 'Актобе'
  ) returning id
)
insert into public.price_tiers (offer_id, min_participants, price)
select id, tier.min_p, tier.price
from new_offer, (values (1, 180000), (25, 155000), (50, 140000), (100, 129000)) as tier(min_p, price);

-- Предложение 4: весь Казахстан
with new_offer as (
  insert into public.offers (
    title, description, base_price, target_price, target_participants,
    ends_at, scope_type
  ) values (
    'iPhone 17 Pro',
    'СБРОС по всему Казахстану',
    650000, 549000, 500,
    now() + interval '30 days',
    'country'
  ) returning id
)
insert into public.price_tiers (offer_id, min_participants, price)
select id, tier.min_p, tier.price
from new_offer, (values (1, 650000), (100, 600000), (250, 570000), (500, 549000)) as tier(min_p, price);
