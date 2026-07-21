-- Historial de cambios visible para el usuario
-- (docs/02_PRODUCT_REQUIREMENTS.md 22).
--
-- Cada cambio relevante debe conservar fecha, valores anteriores, valores
-- nuevos, quien lo hizo, el motivo y el origen. audit_logs ya existia con
-- la forma generica; aqui se completa para que sirva tambien como
-- historial consultable, sin duplicar tablas.

alter table public.audit_logs
  add column previous_values jsonb,
  add column new_values jsonb,
  add column reason text,
  -- De donde salio el cambio: lo pidio el usuario, lo propuso la IA, lo
  -- hizo el sistema o vino de una importacion.
  add column origin text not null default 'usuario' check (
    origin in ('usuario', 'ia', 'sistema', 'importacion')
  );

create index audit_logs_actor_created_idx
  on public.audit_logs (actor_user_id, created_at desc);

-- El usuario puede LEER su propio historial. La escritura sigue sin
-- policy: solo el service role inserta, desde Server Actions. Si se
-- permitiera escribir desde el cliente, el historial dejaria de ser
-- confiable como registro de lo que realmente paso.
create policy "audit_logs_select_own" on public.audit_logs
  for select to authenticated using (
    actor_user_id = (select auth.uid())
  );

comment on table public.audit_logs is
  'Historial de cambios. Lectura del propio usuario; escritura solo con service role.';
