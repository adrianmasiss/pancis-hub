-- Nombre de usuario: la segunda forma de entrar.
--
-- Hasta aqui la identidad de una cuenta era su correo. Se añade `username`
-- para poder entrar con cualquiera de los dos, y con tres decisiones dentro:
--
--  1. SE GUARDA EN MINUSCULAS y se compara en minusculas. "Adrian" y "adrian"
--     no pueden ser dos cuentas: seria una trampa para el que escribe su
--     propio nombre con mayuscula el martes. La normalizacion la hace tambien
--     la app, pero el indice unico es quien lo garantiza.
--  2. EL FORMATO VA EN LA BASE, no solo en el formulario. Un `check` con la
--     misma regla que valida la app (3 a 20, letras, digitos, punto y guion
--     bajo, y que no empiece por signo) evita que una escritura por otra via
--     —un script, el panel de Supabase— meta algo que la app no sabe mostrar.
--  3. NULABLE. Las cuentas que ya existen se rellenan aqui, pero la columna no
--     se declara `not null`: una cuenta creada por fuera sin usuario debe
--     poder existir y seguir entrando por correo, no quedarse sin entrar.

alter table public.profiles add column username text;

-- Relleno de las cuentas que ya existen: la parte local del correo, limpia de
-- lo que el formato no admite.
--
-- Va en un bucle y no en un `update` con `row_number` porque la primera
-- version, que era eso, fallo al crear el indice: los candidatos se recortan a
-- 20 caracteres, y varios correos distintos —`e2e-plan-nutricion-<fecha>`—
-- caian en el mismo recorte. Numerar por candidato no bastaba, porque el
-- sufijo obligaba a recortar otra vez y volvia a chocar. Asignar de uno en uno
-- comprobando lo que ya se escribio no tiene ese problema: cada fila ve las
-- anteriores.
do $$
declare
  fila record;
  deseado text;
  candidato text;
  intento int;
begin
  for fila in
    select p.id, u.email
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at, p.id
  loop
    deseado := regexp_replace(
      regexp_replace(lower(split_part(fila.email, '@', 1)), '[^a-z0-9._]', '', 'g'),
      '^[._]+', ''
    );
    if length(deseado) < 3 then
      deseado := deseado || 'usuario';
    end if;
    deseado := left(deseado, 20);

    candidato := deseado;
    intento := 0;
    while exists (select 1 from public.profiles where username = candidato) loop
      intento := intento + 1;
      candidato := left(deseado, 20 - length(intento::text) - 1) || '.' || intento::text;
      exit when intento > 500;
    end loop;

    update public.profiles set username = candidato where id = fila.id;
  end loop;
end;
$$;

alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9][a-z0-9._]{2,19}$');

-- El indice es sobre la columna tal cual porque la columna ya viene en
-- minusculas —lo garantiza el `check` de arriba—, asi que un indice sobre
-- `lower(username)` seria el mismo indice con una llamada de mas.
create unique index profiles_username_key on public.profiles (username);

-- El alta, con dos caminos que no se comportan igual a proposito:
--
--  * El usuario ELEGIDO (llega en los metadatos del registro) se respeta tal
--    cual. Si ya esta tomado, el insert falla, y eso es lo correcto: la
--    insercion en auth.users va en la misma transaccion, asi que la cuenta no
--    llega a crearse y la app puede decir "ese usuario ya esta tomado". Darle
--    otro en silencio —"adrian.1"— seria entregarle un nombre que no pidio.
--  * El usuario DERIVADO (no hubo metadatos: alta desde el panel, un script)
--    si se ajusta hasta encontrar hueco, porque ahi nadie eligio nada y lo que
--    no puede pasar es que la cuenta no se cree.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  elegido text;
  deseado text;
  candidato text;
  intento int := 0;
begin
  elegido := lower(nullif(trim(new.raw_user_meta_data ->> 'username'), ''));

  if elegido is not null then
    candidato := elegido;
  else
    deseado := regexp_replace(
      regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9._]', '', 'g'),
      '^[._]+', ''
    );
    if length(deseado) < 3 then
      deseado := deseado || 'usuario';
    end if;
    deseado := left(deseado, 20);

    candidato := deseado;
    while intento < 500
      and exists (select 1 from public.profiles where username = candidato)
    loop
      intento := intento + 1;
      candidato := left(deseado, 20 - length(intento::text) - 1) || '.' || intento::text;
    end loop;
    if intento >= 500 then
      candidato := null;
    end if;
  end if;

  insert into public.profiles (id, display_name, username, locale, theme)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    candidato,
    'es-419',
    'system'
  );
  return new;
end;
$$;

comment on column public.profiles.username is
  'Nombre de usuario en minusculas, unico. Sirve para entrar ademas del correo.';
