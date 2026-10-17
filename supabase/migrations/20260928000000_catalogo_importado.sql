-- De donde sale cada ejercicio del catalogo.
--
-- Hasta aqui los quince ejercicios estaban escritos a mano, con su biomecanica
-- completa: perfil de resistencia, punto mas duro, demanda tecnica. Eso es lo
-- que leen la prescripcion y el analisis de rutina.
--
-- Al importar mil trescientos de una fuente externa hay que poder distinguir
-- una cosa de la otra, y no por pulcritud: un ejercicio importado NO trae esa
-- biomecanica, asi que el codigo que la necesita tiene que saber que no puede
-- contar con ella. `source` es esa marca.
--
--   curado     escrito aqui, con biomecanica completa
--   importado  del conjunto externo: nombre, musculos, equipo e instrucciones
--
-- `external_id` guarda el identificador de origen. Con el indice unico de
-- abajo, volver a correr el importador ACTUALIZA en vez de duplicar: es lo que
-- permite reimportar cuando la fuente corrija una instruccion.

alter table public.exercise_catalog
  add column source text not null default 'curado'
    check (source in ('curado', 'importado')),
  add column external_id text;

comment on column public.exercise_catalog.source is
  'curado = escrito a mano con biomecanica; importado = fuente externa sin ella.';

-- Sin condicion, y por un motivo practico: PostgREST no puede apoyar un
-- `on conflict` en un indice PARCIAL —no emite su clausula `where`, asi que
-- Postgres no lo reconoce y el upsert falla con "no unique or exclusion
-- constraint matching"—. Comprobado al correr el importador la primera vez.
--
-- Un indice normal vale igual: las filas curadas llevan `external_id` nulo, y
-- en un indice unico los nulos no chocan entre si.
create unique index exercise_catalog_external_key
  on public.exercise_catalog (source, external_id);
