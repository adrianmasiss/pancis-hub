-- Notificaciones por tipo (Perfil › Notificaciones). Un solo jsonb para las
-- preferencias: cuáles están encendidas y a qué hora. La forma la valida la
-- server action (src/features/reminders/prefs.ts); lo que falte toma el valor
-- por defecto del código, así un perfil sin preferencias sigue igual que hoy
-- (comidas y entreno a las 17:00).
alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb;

-- Los avisos nuevos usan la misma bitácora para no repetirse en el día.
alter table public.reminder_log
  drop constraint if exists reminder_log_kind_check;
alter table public.reminder_log
  add constraint reminder_log_kind_check
  check (kind in ('comida', 'entreno', 'agua', 'semanal'));
