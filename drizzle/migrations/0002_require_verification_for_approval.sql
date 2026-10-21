-- A shop can only be approved once its owner has submitted ID verification.
create or replace function public.require_verification_on_approve()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved')
     and not exists (select 1 from public.seller_verifications v where v.shop_id = new.id) then
    raise exception 'This shop has not submitted ID verification yet.';
  end if;
  return new;
end $$;
create trigger require_verification_on_approve before update on public.shops
  for each row execute function public.require_verification_on_approve();