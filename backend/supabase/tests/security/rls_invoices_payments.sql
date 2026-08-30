-- Phase 8 invoices + payments RLS smoke
begin;
do $$
begin
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='invoices') then
    raise exception 'invoices missing';
  end if;
  if not exists (select 1 from pg_tables where schemaname='public' and tablename='payments') then
    raise exception 'payments missing';
  end if;
  if not exists (select 1 from pg_type where typname='invoice_status') then
    raise exception 'invoice_status enum missing';
  end if;
  if not exists (select 1 from pg_type where typname='payment_method') then
    raise exception 'payment_method enum missing';
  end if;
  if not exists (select 1 from public.permissions where code='business.payment.record_cash') then
    raise exception 'payment permissions missing';
  end if;
  if not exists (select 1 from public.permissions where code='invoice.read_own') then
    raise exception 'invoice.read_own missing';
  end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='invoices') then
    raise exception 'invoices RLS disabled';
  end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='payments') then
    raise exception 'payments RLS disabled';
  end if;
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'record_cash_payment'
  ) then
    raise exception 'record_cash_payment missing';
  end if;
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'convert_accepted_quotation_to_invoice'
  ) then
    raise exception 'convert_accepted_quotation_to_invoice missing';
  end if;
end $$;
rollback;
