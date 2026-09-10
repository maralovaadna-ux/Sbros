-- =========================================================
-- Миграция 0007: WhatsApp продавца на карточке предложения
-- =========================================================

alter table public.offers
  add column seller_whatsapp text;

comment on column public.offers.seller_whatsapp is 'Номер телефона продавца для прямой связи через WhatsApp (формат +7XXXXXXXXXX), опционально на каждом предложении';
