
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  wallet_balance numeric(10,2) not null default 350.00,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self select" on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- dishes (public catalog)
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text not null,
  rating numeric(2,1) not null default 4.8,
  category text not null default 'Popular',
  created_at timestamptz not null default now()
);
alter table public.dishes enable row level security;
create policy "dishes public read" on public.dishes for select using (true);

-- cart_items
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dish_id uuid not null references public.dishes(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, dish_id)
);
alter table public.cart_items enable row level security;
create policy "cart self all" on public.cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- addresses
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.addresses enable row level security;
create policy "addresses self all" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total numeric(10,2) not null,
  status text not null default 'confirmed',
  address text,
  payment_method text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "orders self all" on public.orders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- order_items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  quantity int not null,
  image_url text
);
alter table public.order_items enable row level security;
create policy "order_items self read" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "order_items self insert" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
