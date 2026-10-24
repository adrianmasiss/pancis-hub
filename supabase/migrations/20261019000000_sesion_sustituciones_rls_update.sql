-- La política de UPDATE de workout_session_exercises sólo comprobaba que la
-- fila fuera del usuario, no que la SESIÓN lo fuera. Con un UPDATE (o un
-- upsert que acaba en DO UPDATE) se podía mover un cambio propio a la sesión
-- de otra persona y, por el índice único (session_id, plan_exercise_id),
-- bloquearle sus propios cambios de ese ejercicio. Se exige lo mismo que al
-- insertar.
drop policy if exists "workout_session_exercises_update_own"
  on public.workout_session_exercises;

create policy "workout_session_exercises_update_own"
  on public.workout_session_exercises
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );
