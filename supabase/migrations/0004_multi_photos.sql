-- =========================================================
-- Миграция 0004: несколько фото на предложение (макс. 3)
-- =========================================================

alter table public.offers
  add column image_urls text[] not null default '{}';

comment on column public.offers.image_urls is 'До 3 фото предложения. image_url оставлен для обратной совместимости старых записей.';

-- переносим уже загруженные одиночные фото в новый массив
update public.offers
  set image_urls = array[image_url]
  where image_url is not null and image_urls = '{}';
