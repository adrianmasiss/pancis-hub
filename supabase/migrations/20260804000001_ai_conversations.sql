-- Persistencia del copiloto (docs/spec/docs/08 y 11).
--
-- Hoy el asistente no recuerda nada: cada pregunta es independiente. El doc 06
-- del set de julio lo pone como la diferencia principal entre un chatbot
-- generico y lo que Pancis Hub necesita.
--
-- Se guardan tambien las LLAMADAS A HERRAMIENTAS y las CITAS. Sin eso no se
-- puede auditar de donde salio un numero que el asistente dijo, que es
-- justamente lo que la fase 2 exige.

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  -- Desde donde se abrio: chat general o una pantalla concreta.
  origin text not null default 'chat'
    check (origin in ('chat', 'comida', 'alimento', 'ejercicio', 'biometria')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_user_idx
  on public.ai_conversations (user_id, updated_at desc);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.ai_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  -- 'reglas' cuando respondio el motor deterministico sin IA (RF-015), para
  -- poder distinguir despues quien contesto.
  provider text check (provider in ('reglas', 'gemini')),
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_idx
  on public.ai_messages (conversation_id, created_at);

create table public.ai_tool_calls (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.ai_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_name text not null,
  input jsonb,
  output jsonb,
  -- 'lectura' o 'propuesta'. Una propuesta NUNCA se aplico por si sola: si el
  -- usuario la confirmo, quedo ademas en audit_logs.
  result_kind text not null check (result_kind in ('lectura', 'propuesta')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index ai_tool_calls_message_idx
  on public.ai_tool_calls (message_id);

create table public.ai_citations (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.ai_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  research_source_id uuid
    references public.research_sources (id) on delete set null,
  -- Instantanea de la cita. Si la fuente cambia despues, la respuesta que se
  -- le dio al usuario sigue siendo auditable tal como se dio.
  cited_title text not null,
  cited_identifier text,
  created_at timestamptz not null default now()
);

create index ai_citations_message_idx
  on public.ai_citations (message_id);

-- Triggers
create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

-- =========================================================================
-- RLS: datos personales, aislamiento estricto
-- =========================================================================

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_tool_calls enable row level security;
alter table public.ai_citations enable row level security;

create policy "ai_conversations_select_own" on public.ai_conversations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ai_conversations_insert_own" on public.ai_conversations
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "ai_conversations_update_own" on public.ai_conversations
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
-- El doc 08 exige que el usuario pueda BORRAR sus conversaciones.
create policy "ai_conversations_delete_own" on public.ai_conversations
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "ai_messages_select_own" on public.ai_messages
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ai_messages_insert_own" on public.ai_messages
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "ai_messages_delete_own" on public.ai_messages
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "ai_tool_calls_select_own" on public.ai_tool_calls
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ai_tool_calls_insert_own" on public.ai_tool_calls
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "ai_citations_select_own" on public.ai_citations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "ai_citations_insert_own" on public.ai_citations
  for insert to authenticated with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, delete on public.ai_messages to authenticated;
grant select, insert on public.ai_tool_calls to authenticated;
grant select, insert on public.ai_citations to authenticated;
