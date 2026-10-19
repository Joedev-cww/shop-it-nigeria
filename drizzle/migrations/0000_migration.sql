-- =====================================================================
-- SHOP IT · PHASE 1 SCHEMA: roles, profiles, shops, catalog, fees
-- Prices are whole Naira integers. All fee maths happens in the DB.
-- =====================================================================
create extension if not exists pg_trgm with schema extensions;

-- ---------- Roles ----------
create type public.app_role as enum ('buyer','seller','admin','moderator','finance','support');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Admins manage roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ---------- Profiles (private: never exposed to sellers) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  default_area text,
  language text not null default 'en',
  low_data_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'buyer') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Contact-info detector (anti-bypass, used by triggers) ----------
create or replace function public.contains_contact_info(t text)
returns boolean language plpgsql immutable set search_path = public as $$
declare digits text;
begin
  if t is null then return false; end if;
  -- 10+ digits once separators/emojis are removed (phone / account numbers)
  digits := regexp_replace(t, '[^0-9]', '', 'g');
  if t ~ '[0-9][0-9\s\-\.\(\)]{8,}[0-9]' and length(digits) >= 10 then return true; end if;
  if t ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then return true; end if;           -- email
  if t ~* '(https?://|www\.|\.com\b|\.ng\b|wa\.me|t\.me)' then return true; end if;      -- links
  if t ~* '(^|\s)@[a-z0-9_.]{3,}' then return true; end if;                               -- @handles
  if t ~* '\m(whatsapp|whatsap|watsapp|telegram|insta|ig|dm me|call me|opay|palmpay|send to)\M' then return true; end if;
  if t ~* '\m(zero|one|two|three|four|five|six|seven|eight|nine)\M(\W+\m(zero|one|two|three|four|five|six|seven|eight|nine|oh)\M){5,}' then return true; end if;
  return false;
end $$;

-- ---------- Categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  emoji text,
  sort_order int not null default 0
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Categories public" on public.categories for select to anon, authenticated using (true);
create policy "Admins manage categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ---------- Fee settings (single row, admin editable) ----------
create table public.fee_settings (
  id int primary key default 1 check (id = 1),
  mode text not null default 'flat' check (mode in ('flat','tiered')),
  flat_fee int not null default 500,
  tier1_max int not null default 2000,   -- price < tier1_max  -> tier1_fee
  tier1_fee int not null default 200,
  tier2_max int not null default 10000,  -- price <= tier2_max -> tier2_fee
  tier2_fee int not null default 500,
  tier3_percent numeric not null default 5, -- above tier2_max -> percent
  zero_fee_promo boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.fee_settings (id) values (1);
grant select on public.fee_settings to anon, authenticated;
grant all on public.fee_settings to service_role;
alter table public.fee_settings enable row level security;
create policy "Fees public" on public.fee_settings for select to anon, authenticated using (true);
create policy "Admins update fees" on public.fee_settings for update to authenticated
  using (public.has_role(auth.uid(),'admin'));

-- Server-side fee calculation: the ONLY place the Shop It fee is computed.
create or replace function public.compute_service_fee(p int)
returns int language sql stable security definer set search_path = public as $$
  select case
    when s.zero_fee_promo then 0
    when s.mode = 'flat' then s.flat_fee
    when p < s.tier1_max then s.tier1_fee
    when p <= s.tier2_max then s.tier2_fee
    else ceil(p * s.tier3_percent / 100.0)::int
  end
  from public.fee_settings s where s.id = 1
$$;

-- ---------- Shops ----------
create type public.shop_status as enum ('pending','approved','rejected','suspended');

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  slug text unique not null,
  name text not null,
  bio text,
  logo_url text,
  campus text,
  city text,
  instagram text,
  tiktok text,
  status public.shop_status not null default 'pending',
  vacation_mode boolean not null default false,
  is_minor boolean not null default false,
  rating_avg numeric(2,1) not null default 0,
  rating_count int not null default 0,
  sales_count int not null default 0,
  is_fast_responder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);
grant select on public.shops to anon, authenticated;
grant insert, update on public.shops to authenticated;
grant all on public.shops to service_role;
alter table public.shops enable row level security;
create policy "Approved shops public" on public.shops for select to anon, authenticated
  using (status = 'approved' or owner_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));
create policy "Owner creates shop" on public.shops for insert to authenticated with check (owner_id = auth.uid());
create policy "Owner or admin updates shop" on public.shops for update to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));

-- Guard trusted columns and block contact details in shop text.
create or replace function public.guard_shop()
returns trigger language plpgsql security definer set search_path = public as $$
declare is_staff boolean := auth.uid() is null or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator');
begin
  if public.contains_contact_info(new.name) or public.contains_contact_info(new.bio) then
    raise exception 'Contact details (phone numbers, links, handles) are not allowed in shop name or bio.';
  end if;
  if not is_staff then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.rating_avg := 0; new.rating_count := 0; new.sales_count := 0; new.is_fast_responder := false;
    else
      new.status := old.status; new.rating_avg := old.rating_avg; new.rating_count := old.rating_count;
      new.sales_count := old.sales_count; new.is_fast_responder := old.is_fast_responder; new.owner_id := old.owner_id;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger guard_shop before insert or update on public.shops for each row execute function public.guard_shop();

-- Grant seller role automatically when a shop is approved.
create or replace function public.on_shop_approved()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    insert into public.user_roles (user_id, role) values (new.owner_id, 'seller') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_shop_approved after update on public.shops for each row execute function public.on_shop_approved();

-- ---------- Seller verification (private: owner + admin only) ----------
create table public.seller_verifications (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  owner_id uuid not null,
  legal_name text not null,
  date_of_birth date not null,
  id_type text not null,
  id_document_path text not null,
  guardian_name text,
  guardian_phone text,
  guardian_relationship text,
  guardian_consent boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.seller_verifications to authenticated;
grant all on public.seller_verifications to service_role;
alter table public.seller_verifications enable row level security;
create policy "Owner or admin reads verification" on public.seller_verifications for select to authenticated
  using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Owner submits verification" on public.seller_verifications for insert to authenticated
  with check (owner_id = auth.uid() and exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "Owner updates verification while pending" on public.seller_verifications for update to authenticated
  using (owner_id = auth.uid() and exists (select 1 from public.shops s where s.id = shop_id and s.status = 'pending'));

-- Under-18 sellers need guardian consent; mark shop as minor.
create or replace function public.check_seller_verification()
returns trigger language plpgsql security definer set search_path = public as $$
declare minor boolean := new.date_of_birth > (current_date - interval '18 years');
begin
  if minor and (new.guardian_consent is not true or coalesce(new.guardian_name,'') = '' or coalesce(new.guardian_phone,'') = '') then
    raise exception 'Sellers under 18 need a parent or guardian''s name, phone and consent.';
  end if;
  update public.shops set is_minor = minor where id = new.shop_id;
  return new;
end $$;
create trigger check_seller_verification before insert or update on public.seller_verifications
  for each row execute function public.check_seller_verification();

-- ---------- Products ----------
create type public.product_status as enum ('pending_review','active','hidden','rejected');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  category_id uuid references public.categories(id),
  slug text unique not null,
  title text not null,
  description text not null default '',
  seller_price int not null check (seller_price >= 100),
  service_fee int not null default 0,       -- set by trigger, never by client
  display_price int not null default 0,     -- seller_price + service_fee
  stock int not null default 1 check (stock >= 0),
  status public.product_status not null default 'pending_review',
  pickup_available boolean not null default true,
  local_delivery boolean not null default false,
  local_delivery_fee int not null default 0 check (local_delivery_fee >= 0),
  buyer_rider boolean not null default false,
  min_order_for_delivery int not null default 0,
  allows_custom boolean not null default false,
  rating_avg numeric(2,1) not null default 0,
  rating_count int not null default 0,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_title_trgm on public.products using gin (title extensions.gin_trgm_ops);
create index products_shop_idx on public.products (shop_id);
create index products_cat_idx on public.products (category_id);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create or replace function public.owns_shop(_shop uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shops where id = _shop and owner_id = auth.uid())
$$;
create or replace function public.shop_is_live(_shop uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.shops where id = _shop and status = 'approved' and not vacation_mode)
$$;

create policy "Live products public" on public.products for select to anon, authenticated
  using ((status = 'active' and public.shop_is_live(shop_id)) or public.owns_shop(shop_id)
         or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));
create policy "Owner inserts products" on public.products for insert to authenticated with check (public.owns_shop(shop_id));
create policy "Owner or staff updates products" on public.products for update to authenticated
  using (public.owns_shop(shop_id) or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));
create policy "Owner deletes products" on public.products for delete to authenticated using (public.owns_shop(shop_id));

-- Product guard: server-side price, review workflow, trusted columns, contact blocking.
create or replace function public.guard_product()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_staff boolean := auth.uid() is null or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator');
  live_count int;
begin
  if public.contains_contact_info(new.title) or public.contains_contact_info(new.description) then
    raise exception 'Contact details (phone numbers, links, handles, WhatsApp etc.) are not allowed in listings.';
  end if;
  -- Fee and display price are always computed here.
  new.service_fee := public.compute_service_fee(new.seller_price);
  new.display_price := new.seller_price + new.service_fee;

  if tg_op = 'INSERT' then
    new.slug := lower(regexp_replace(regexp_replace(new.title, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
                || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6);
  end if;

  if not is_staff then
    if tg_op = 'INSERT' then
      new.rating_avg := 0; new.rating_count := 0; new.view_count := 0;
      -- New sellers: first 3 listings are reviewed before going live.
      select count(*) into live_count from public.products where shop_id = new.shop_id and status in ('active','hidden');
      new.status := case when live_count >= 3 and public.shop_is_live(new.shop_id) then 'active' else 'pending_review' end;
    else
      new.slug := old.slug; new.shop_id := old.shop_id;
      new.rating_avg := old.rating_avg; new.rating_count := old.rating_count; new.view_count := old.view_count;
      -- Seller may only toggle active <-> hidden on already-approved listings.
      if not (old.status in ('active','hidden') and new.status in ('active','hidden')) then
        new.status := old.status;
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger guard_product before insert or update on public.products for each row execute function public.guard_product();

-- Re-price all listings whenever admin changes fee settings.
create or replace function public.reprice_products()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.products set seller_price = seller_price;
  return new;
end $$;
create trigger reprice_products after update on public.fee_settings for each row execute function public.reprice_products();

-- ---------- Product images ----------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, position);
grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;
grant all on public.product_images to service_role;
alter table public.product_images enable row level security;
create policy "Images visible with product" on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy "Owner manages images" on public.product_images for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and public.owns_shop(p.shop_id)))
  with check (exists (select 1 from public.products p where p.id = product_id and public.owns_shop(p.shop_id)));

-- ---------- Wishlist ----------
create table public.wishlists (
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
grant select, insert, delete on public.wishlists to authenticated;
grant all on public.wishlists to service_role;
alter table public.wishlists enable row level security;
create policy "Own wishlist" on public.wishlists for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Sold-out notify ----------
create table public.stock_alerts (
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
grant select, insert, delete on public.stock_alerts to authenticated;
grant all on public.stock_alerts to service_role;
alter table public.stock_alerts enable row level security;
create policy "Own alerts" on public.stock_alerts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Product view counter (safe RPC) ----------
create or replace function public.record_product_view(_product uuid)
returns void language sql security definer set search_path = public as $$
  update public.products set view_count = view_count + 1 where id = _product and status = 'active'
$$;
grant execute on function public.record_product_view(uuid) to anon, authenticated;

-- ---------- Typo-tolerant search with filters + sort ----------
create or replace function public.search_products(
  q text default null, cat text default null, campus_q text default null,
  min_price int default null, max_price int default null, min_rating numeric default null,
  sort text default 'newest', lim int default 40, off int default 0)
returns table (id uuid, slug text, title text, display_price int, rating_avg numeric, rating_count int,
  stock int, image_url text, shop_name text, shop_slug text, campus text, category_slug text, created_at timestamptz)
language sql stable security invoker set search_path = public, extensions as $$
  select p.id, p.slug, p.title, p.display_price, p.rating_avg, p.rating_count, p.stock,
    (select i.url from public.product_images i where i.product_id = p.id order by i.position limit 1),
    s.name, s.slug, s.campus, c.slug, p.created_at
  from public.products p
  join public.shops s on s.id = p.shop_id
  left join public.categories c on c.id = p.category_id
  where p.status = 'active' and s.status = 'approved' and not s.vacation_mode
    and p.stock > 0  -- auto-hide sold-out items from listings
    and (q is null or q = '' or p.title ilike '%'||q||'%' or word_similarity(q, p.title) > 0.35
         or word_similarity(q, coalesce(c.name,'')) > 0.45 or word_similarity(q, s.name) > 0.45)
    and (cat is null or cat = '' or c.slug = cat)
    and (campus_q is null or campus_q = '' or s.campus ilike '%'||campus_q||'%' or s.city ilike '%'||campus_q||'%')
    and (min_price is null or p.display_price >= min_price)
    and (max_price is null or p.display_price <= max_price)
    and (min_rating is null or p.rating_avg >= min_rating)
  order by
    case when sort = 'relevance' and q is not null and q <> '' then word_similarity(q, p.title) end desc nulls last,
    case when sort = 'price_asc' then p.display_price end asc,
    case when sort = 'price_desc' then p.display_price end desc,
    case when sort = 'top_rated' then p.rating_avg end desc,
    p.created_at desc
  limit lim offset off
$$;
grant execute on function public.search_products(text,text,text,int,int,numeric,text,int,int) to anon, authenticated;

-- =====================================================================
-- SAMPLE DATA
-- =====================================================================
insert into public.categories (slug, name, emoji, sort_order) values
 ('beads','Beads & Jewellery','📿',1), ('fragrance','Fragrance','🌸',2),
 ('bags','Bags','👜',3), ('crochet','Crochet & Knits','🧶',4),
 ('hair','Hair Accessories','🎀',5), ('art','Art & Decor','🎨',6);

insert into public.shops (id, owner_id, slug, name, bio, campus, city, instagram, status, rating_avg, rating_count, sales_count, is_fast_responder) values
 ('11111111-0000-0000-0000-000000000001', gen_random_uuid(), 'ada-beads', 'Ada''s Bead Studio', 'Hand-strung waist beads and bracelets made to order. Every piece is knotted twice.', 'UNILAG', 'Lagos', 'adabeads', 'approved', 4.8, 42, 120, true),
 ('11111111-0000-0000-0000-000000000002', gen_random_uuid(), 'scent-by-temi', 'Scent by Temi', 'Small-batch fragrance oils and body mists blended in my hostel lab.', 'UI', 'Ibadan', 'scentbytemi', 'approved', 4.6, 18, 35, false),
 ('11111111-0000-0000-0000-000000000003', gen_random_uuid(), 'kente-and-co', 'Kente & Co', 'Ankara totes and purses with sturdy linings. Built for lecture-hall life.', 'UNN', 'Nsukka', 'kenteandco', 'approved', 4.9, 27, 64, true),
 ('11111111-0000-0000-0000-000000000004', gen_random_uuid(), 'hooked-by-zee', 'Hooked by Zee', 'Crochet hats, earrings and tops. Custom colours welcome.', 'ABU', 'Zaria', 'hookedbyzee', 'approved', 4.7, 15, 22, false),
 ('11111111-0000-0000-0000-000000000005', gen_random_uuid(), 'oyin-crafts', 'Oyin Crafts', 'Beaded hair pins, scrunchies and little gifts for your girls.', 'OAU', 'Ile-Ife', 'oyincrafts', 'approved', 4.5, 9, 12, false),
 ('11111111-0000-0000-0000-000000000006', gen_random_uuid(), 'uyo-makers', 'Uyo Makers', 'A tiny collective of student makers: bags, beads and scents.', 'UNIUYO', 'Uyo', 'uyomakers', 'approved', 4.4, 6, 8, false);

-- products (status active: inserted as service, so guard allows it)
with p(shop, cat, title, descr, price, stock, img, pickup, local, lfee, rating, rcount, custom) as (values
 ('11111111-0000-0000-0000-000000000001','beads','Rainbow Waist Bead Set (3 strands)','Three hand-strung waist beads in bright mixed colours. Tie-on, adjustable to any size.',2500,12,'/images/beads.jpg',true,true,800,4.9,21,true),
 ('11111111-0000-0000-0000-000000000001','beads','Blue Glass Bead Bracelet','Chunky blue glass beads with gold spacers. Stretch fit.',1800,8,'/images/beads.jpg',true,true,800,4.7,9,false),
 ('11111111-0000-0000-0000-000000000001','beads','Custom Name Bead Bracelet','Your name or initials in letter beads. Pick your colours at checkout.',1500,20,'/images/beads.jpg',true,true,800,4.8,12,true),
 ('11111111-0000-0000-0000-000000000002','fragrance','Vanilla Bean Fragrance Oil 10ml','Warm, sweet vanilla oil. Lasts all day on pulse points.',3000,15,'/images/fragrance.jpg',true,false,0,4.6,7,false),
 ('11111111-0000-0000-0000-000000000002','fragrance','Coconut & Vanilla Body Mist 50ml','Light everyday mist. Great for after the gym.',4500,10,'/images/fragrance.jpg',true,true,1000,4.5,5,false),
 ('11111111-0000-0000-0000-000000000002','fragrance','Mini Scent Trio (Lavender, Orange, Vanilla)','Three 10ml oils in a gift box. Perfect present.',8000,6,'/images/fragrance.jpg',true,true,1000,4.8,6,false),
 ('11111111-0000-0000-0000-000000000003','bags','Sunburst Ankara Tote','Ankara tote with wooden ring handles and inner zip pocket.',12000,5,'/images/bag.jpg',true,true,1500,5.0,11,false),
 ('11111111-0000-0000-0000-000000000003','bags','Ankara Laptop Sleeve','Padded sleeve fits 14" laptops. Matching print to our totes.',9500,7,'/images/bag.jpg',true,true,1500,4.8,8,true),
 ('11111111-0000-0000-0000-000000000003','bags','Mini Ankara Coin Purse','Zip purse for coins, earbuds and lip gloss.',2000,25,'/images/bag.jpg',true,true,1500,4.7,8,false),
 ('11111111-0000-0000-0000-000000000004','crochet','Mustard Crochet Bucket Hat','Soft cotton bucket hat in mustard with green trim.',7000,4,'/images/crochet.jpg',true,true,1200,4.8,6,true),
 ('11111111-0000-0000-0000-000000000004','crochet','Crochet Flower Earrings','Lightweight round crochet earrings on gold hooks.',1500,18,'/images/crochet.jpg',true,true,1200,4.6,5,true),
 ('11111111-0000-0000-0000-000000000004','crochet','Crochet Hat + Earrings Set','The full set: bucket hat and matching earrings. Save vs buying apart.',8000,3,'/images/crochet.jpg',true,true,1200,4.9,4,true),
 ('11111111-0000-0000-0000-000000000005','hair','Beaded Hair Pins (Set of 6)','Gold and glass bead pins for braids and buns.',1200,30,'/images/beads.jpg',true,false,0,4.5,5,false),
 ('11111111-0000-0000-0000-000000000005','hair','Ankara Scrunchie Pack (3)','Three soft Ankara scrunchies, assorted prints.',1800,22,'/images/bag.jpg',true,true,700,4.4,4,false),
 ('11111111-0000-0000-0000-000000000005','beads','Friendship Bracelet Bundle (5)','Five colourful bracelets to share with your squad.',3500,9,'/images/beads.jpg',true,true,700,4.6,3,true),
 ('11111111-0000-0000-0000-000000000006','bags','Ankara Bucket Bag','Drawstring bucket bag with shoulder strap.',8500,4,'/images/bag.jpg',true,true,1000,4.3,3,false),
 ('11111111-0000-0000-0000-000000000006','fragrance','Sweet Orange Fragrance Oil 10ml','Fresh citrus oil. Bright and clean.',2800,0,'/images/fragrance.jpg',true,false,0,4.4,2,false),
 ('11111111-0000-0000-0000-000000000006','crochet','Crochet Coaster Set (4)','Four green and mustard coasters for your desk.',2500,11,'/images/crochet.jpg',true,true,1000,4.5,2,false)
), ins as (
  insert into public.products (shop_id, category_id, title, description, seller_price, stock, status, pickup_available, local_delivery, local_delivery_fee, min_order_for_delivery, rating_avg, rating_count, allows_custom, slug)
  select p.shop::uuid, c.id, p.title, p.descr, p.price, p.stock, 'active', p.pickup, p.local, p.lfee, case when p.local then 2000 else 0 end, p.rating, p.rcount, p.custom, 'tmp'
  from p join public.categories c on c.slug = p.cat
  returning id, title
)
insert into public.product_images (product_id, url, position)
select ins.id, p.img, 0 from ins join p on p.title = ins.title;
