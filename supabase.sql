-- Portal de Capacitación: esquema de Supabase.
-- Pega este archivo completo en Supabase > SQL Editor y ejecútalo (se puede volver a ejecutar).
--
-- Seguridad:
--  * Cada capacitador solo ve y edita sus propios formularios y sus respuestas (RLS).
--  * Quien responde nunca lee la tabla: usa formulario_publico(), que oculta las
--    respuestas correctas, y enviar_respuesta(), que califica en el servidor.

create extension if not exists unaccent with schema extensions;

-- ---------- Tablas ----------

create table if not exists public.formularios (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users (id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.respuestas (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.formularios (id) on delete cascade,
  fecha timestamptz not null default now(),
  nombre text not null default '',
  correo text not null default '',
  puntaje numeric not null default 0,
  maximo numeric not null default 0,
  datos jsonb not null default '{}'::jsonb
);

create index if not exists formularios_owner_idx on public.formularios (owner);
create index if not exists respuestas_form_idx on public.respuestas (form_id);

alter table public.formularios enable row level security;
alter table public.respuestas enable row level security;

drop policy if exists "capacitador gestiona sus formularios" on public.formularios;
create policy "capacitador gestiona sus formularios" on public.formularios
  for all to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());

drop policy if exists "capacitador ve sus respuestas" on public.respuestas;
create policy "capacitador ve sus respuestas" on public.respuestas
  for select to authenticated
  using (exists (select 1 from public.formularios f where f.id = form_id and f.owner = auth.uid()));

drop policy if exists "capacitador borra sus respuestas" on public.respuestas;
create policy "capacitador borra sus respuestas" on public.respuestas
  for delete to authenticated
  using (exists (select 1 from public.formularios f where f.id = form_id and f.owner = auth.uid()));

-- ---------- Calificación ----------
-- Mismas reglas que js/calificacion.js. Tipos: unica, multiple, vf, corta, parrafo,
-- subrespuestas, puntoImagen, etiquetarImagen, zonasImagen, ordenar, relacionar, huecos.
-- Cualquier pregunta puede traer una imagen de apoyo: { "apoyo": { "imagen": "data:...", "posicion": "arriba" | "lado" } }.

create or replace function public._normalizar(t text) returns text
language sql stable set search_path = public, extensions as $$
  select lower(regexp_replace(trim(extensions.unaccent(coalesce(t, ''))), '\s+', ' ', 'g'))
$$;

create or replace function public._bool(v jsonb) returns boolean
language sql immutable as $$
  select coalesce(v = 'true'::jsonb, false)
$$;

create or replace function public._texto(v jsonb) returns text
language sql immutable as $$
  select case when v is null or jsonb_typeof(v) = 'null' then '' else trim(v #>> '{}') end
$$;

-- true si alguna de las respuestas aceptadas coincide con r (sin mayúsculas, acentos ni espacios extra).
create or replace function public._coincide(r text, aceptadas jsonb) returns boolean
language sql stable set search_path = public as $$
  select _normalizar(r) <> '' and exists (
    select 1 from jsonb_array_elements_text(coalesce(aceptadas, '[]')) a where _normalizar(a) = _normalizar(r))
$$;

create or replace function public._vacia(r jsonb) returns boolean
language sql immutable set search_path = public as $$
  select case
    when r is null or jsonb_typeof(r) = 'null' then true
    when jsonb_typeof(r) = 'array' then not exists (select 1 from jsonb_array_elements(r) v where _texto(v) <> '')
    when jsonb_typeof(r) = 'object' then not exists (select 1 from jsonb_each(r) v where _texto(v.value) <> '')
    when jsonb_typeof(r) = 'string' then _texto(r) = ''
    else false
  end
$$;

-- Un punto de "Zonas en imagen" se califica si tiene respuesta correcta según su modo.
create or replace function public._zona_calificable(m jsonb) returns boolean
language sql immutable set search_path = public as $$
  select case when m->>'modo' = 'corta'
    then exists (select 1 from jsonb_array_elements_text(coalesce(m->'aceptadas', '[]')) a where trim(a) <> '')
    else _texto(m->'correcta') <> '' end
$$;

create or replace function public._calificable(p jsonb) returns boolean
language sql immutable set search_path = public as $$
  select case p->>'tipo'
    when 'parrafo' then false
    when 'corta' then exists (
      select 1 from jsonb_array_elements_text(coalesce(p->'respuestasAceptadas', '[]')) a where trim(a) <> '')
    when 'subrespuestas' then exists (
      select 1 from jsonb_array_elements(coalesce(p->'campos', '[]')) c,
        jsonb_array_elements_text(coalesce(c->'aceptadas', '[]')) a where trim(a) <> '')
    when 'puntoImagen' then _texto(p->'imagen') <> '' and jsonb_array_length(coalesce(p->'zonas', '[]')) > 0
    when 'etiquetarImagen' then exists (
      select 1 from jsonb_array_elements(coalesce(p->'marcadores', '[]')) m where _texto(m->'texto') <> '')
    when 'zonasImagen' then exists (
      select 1 from jsonb_array_elements(coalesce(p->'marcadores', '[]')) m where _zona_calificable(m))
    when 'ordenar' then jsonb_array_length(coalesce(p->'elementos', '[]')) >= 2
    when 'relacionar' then jsonb_array_length(coalesce(p->'pares', '[]')) >= 1
    when 'huecos' then jsonb_array_length(coalesce(p->'huecos', '[]')) > 0
    else jsonb_array_length(coalesce(p->'correctas', '[]')) > 0
  end
$$;

-- Fracción de la pregunta contestada correctamente (0 a 1). Los tipos compuestos dan crédito parcial.
create or replace function public._fraccion(p jsonb, r jsonb) returns numeric
language plpgsql stable set search_path = public as $$
declare
  t text := p->>'tipo';
  total int := 0;
  buenos int := 0;
  asp numeric;
begin
  if t = 'multiple' then
    return case when jsonb_typeof(r) = 'array' and r @> (p->'correctas') and (p->'correctas') @> r then 1 else 0 end;
  elsif t in ('unica', 'vf') then
    return case when jsonb_typeof(r) = 'string' and (p->'correctas') ? (r #>> '{}') then 1 else 0 end;
  elsif t = 'corta' then
    return case when jsonb_typeof(r) = 'string' and _coincide(r #>> '{}', p->'respuestasAceptadas') then 1 else 0 end;
  elsif t = 'puntoImagen' then
    if jsonb_typeof(r) is distinct from 'object' or jsonb_typeof(r->'x') is distinct from 'number' or jsonb_typeof(r->'y') is distinct from 'number' then
      return 0;
    end if;
    asp := coalesce((p->>'aspecto')::numeric, 1);
    return case when exists (
      select 1 from jsonb_array_elements(coalesce(p->'zonas', '[]')) z
      where sqrt(power((r->>'x')::numeric - (z->>'x')::numeric, 2) + power(((r->>'y')::numeric - (z->>'y')::numeric) * asp, 2)) <= (z->>'r')::numeric
    ) then 1 else 0 end;
  elsif t = 'subrespuestas' then
    select count(*), count(*) filter (where jsonb_typeof(r) = 'object' and _coincide(r->>(c->>'id'), c->'aceptadas'))
      into total, buenos
      from jsonb_array_elements(coalesce(p->'campos', '[]')) c
      where exists (select 1 from jsonb_array_elements_text(coalesce(c->'aceptadas', '[]')) a where trim(a) <> '');
  elsif t = 'etiquetarImagen' then
    select count(*), count(*) filter (where jsonb_typeof(r) = 'object' and _coincide(r->>(m->>'id'), jsonb_build_array(m->'texto')))
      into total, buenos
      from jsonb_array_elements(coalesce(p->'marcadores', '[]')) m
      where _texto(m->'texto') <> '';
  elsif t = 'zonasImagen' then
    select count(*), count(*) filter (where jsonb_typeof(r) = 'object' and case
        when m->>'modo' = 'corta' then _coincide(r->>(m->>'id'), m->'aceptadas')
        else _texto(r->(m->>'id')) = _texto(m->'correcta') end)
      into total, buenos
      from jsonb_array_elements(coalesce(p->'marcadores', '[]')) m
      where _zona_calificable(m);
  elsif t = 'ordenar' then
    select count(*), count(*) filter (where jsonb_typeof(r) = 'array' and r->>(i - 1)::int = e->>'id')
      into total, buenos
      from jsonb_array_elements(coalesce(p->'elementos', '[]')) with ordinality as x (e, i);
  elsif t = 'relacionar' then
    select count(*), count(*) filter (where jsonb_typeof(r) = 'object' and _coincide(r->>(q->>'id'), jsonb_build_array(q->'derecha')))
      into total, buenos
      from jsonb_array_elements(coalesce(p->'pares', '[]')) q;
  elsif t = 'huecos' then
    select count(*), count(*) filter (where jsonb_typeof(r) = 'array' and _coincide(r->>(i - 1)::int, h))
      into total, buenos
      from jsonb_array_elements(coalesce(p->'huecos', '[]')) with ordinality as x (h, i);
  else
    return 0;
  end if;
  return case when total = 0 then 0 else buenos::numeric / total end;
end;
$$;

-- Respuesta correcta, en el formato que recibe el participante al revisar.
create or replace function public._clave(p jsonb) returns jsonb
language sql immutable as $$
  select case p->>'tipo'
    when 'corta' then coalesce(p->'respuestasAceptadas', '[]')
    when 'subrespuestas' then (select coalesce(jsonb_object_agg(c->>'id', coalesce(c->'aceptadas', '[]')), '{}')
      from jsonb_array_elements(coalesce(p->'campos', '[]')) c)
    when 'puntoImagen' then coalesce(p->'zonas', '[]')
    when 'etiquetarImagen' then (select coalesce(jsonb_object_agg(m->>'id', coalesce(m->'texto', '""')), '{}')
      from jsonb_array_elements(coalesce(p->'marcadores', '[]')) m)
    when 'zonasImagen' then (select coalesce(jsonb_object_agg(m->>'id', case
        when m->>'modo' = 'corta' then coalesce(m->'aceptadas', '[]')
        when _texto(m->'correcta') <> '' then jsonb_build_array(m->'correcta')
        else '[]'::jsonb end), '{}')
      from jsonb_array_elements(coalesce(p->'marcadores', '[]')) m)
    when 'ordenar' then (select coalesce(jsonb_agg(e->'id' order by i), '[]')
      from jsonb_array_elements(coalesce(p->'elementos', '[]')) with ordinality as x (e, i))
    when 'relacionar' then (select coalesce(jsonb_object_agg(q->>'id', q->'derecha'), '{}')
      from jsonb_array_elements(coalesce(p->'pares', '[]')) q)
    when 'huecos' then coalesce(p->'huecos', '[]')
    else coalesce(p->'correctas', '[]')
  end
$$;

-- Textos únicos ordenados (bancos de opciones sin revelar a qué corresponden).
create or replace function public._banco(textos jsonb) returns jsonb
language sql immutable set search_path = public as $$
  select coalesce(jsonb_agg(t order by lower(t)), '[]')
  from (select distinct trim(x) as t from jsonb_array_elements_text(coalesce(textos, '[]')) x where trim(x) <> '') d
$$;

-- Pregunta sin respuestas correctas.
create or replace function public._pregunta_publica(p jsonb, examen boolean) returns jsonb
language plpgsql volatile set search_path = public as $$
declare
  base jsonb;
  mezcla jsonb;
begin
  base := jsonb_build_object(
    'id', p->'id',
    'tipo', p->'tipo',
    'texto', p->'texto',
    'textoHtml', coalesce(p->'textoHtml', '""'),
    'obligatoria', _bool(p->'obligatoria'),
    'puntos', case when examen and _calificable(p) then coalesce((p->>'puntos')::numeric, 0) else 0 end,
    'opciones', coalesce((
      select jsonb_agg(jsonb_build_object('id', o->'id', 'texto', o->'texto') order by oi)
      from jsonb_array_elements(coalesce(p->'opciones', '[]')) with ordinality as x (o, oi)), '[]'),
    'apoyo', case when _texto(p->'apoyo'->'imagen') <> ''
      then jsonb_build_object('imagen', p->'apoyo'->'imagen', 'posicion', coalesce(p->'apoyo'->'posicion', '"arriba"'))
      else null end);

  case p->>'tipo'
    when 'subrespuestas' then
      base := base || jsonb_build_object('campos', coalesce((
        select jsonb_agg(jsonb_build_object('id', c->'id', 'etiqueta', c->'etiqueta') order by i)
        from jsonb_array_elements(coalesce(p->'campos', '[]')) with ordinality as x (c, i)), '[]'));
    when 'puntoImagen' then
      base := base || jsonb_build_object('imagen', coalesce(p->'imagen', '""'), 'aspecto', coalesce(p->'aspecto', '1'));
    when 'etiquetarImagen' then
      base := base || jsonb_build_object(
        'imagen', coalesce(p->'imagen', '""'),
        'aspecto', coalesce(p->'aspecto', '1'),
        'marcadores', coalesce((
          select jsonb_agg(jsonb_build_object('id', m->'id', 'x', m->'x', 'y', m->'y') order by i)
          from jsonb_array_elements(coalesce(p->'marcadores', '[]')) with ordinality as x (m, i)), '[]'),
        'banco', _banco(coalesce((select jsonb_agg(m->'texto') from jsonb_array_elements(coalesce(p->'marcadores', '[]')) m
                                  where jsonb_typeof(m->'texto') = 'string'), '[]') || coalesce(p->'distractores', '[]')));
    when 'zonasImagen' then
      base := base || jsonb_build_object(
        'imagen', coalesce(p->'imagen', '""'),
        'aspecto', coalesce(p->'aspecto', '1'),
        'marcadores', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', m->'id', 'x', m->'x', 'y', m->'y', 'r', coalesce(m->'r', '0'),
            'modo', coalesce(m->'modo', '"opciones"'),
            'opciones', case when m->>'modo' = 'corta' then '[]'::jsonb else coalesce((
              select jsonb_agg(jsonb_build_object('id', o->'id', 'texto', o->'texto') order by oi)
              from jsonb_array_elements(coalesce(m->'opciones', '[]')) with ordinality as z (o, oi)), '[]') end
          ) order by i)
          from jsonb_array_elements(coalesce(p->'marcadores', '[]')) with ordinality as x (m, i)), '[]'));
    when 'ordenar' then
      -- Mezcla; si por azar queda en el orden correcto, rota una posición.
      select coalesce(jsonb_agg(jsonb_build_object('id', e->'id', 'texto', e->'texto') order by random()), '[]')
        into mezcla from jsonb_array_elements(coalesce(p->'elementos', '[]')) e;
      if jsonb_array_length(mezcla) > 1 and (select jsonb_agg(m->'id') from jsonb_array_elements(mezcla) m) = _clave(p) then
        mezcla := (mezcla - 0) || jsonb_build_array(mezcla->0);
      end if;
      base := base || jsonb_build_object('elementos', mezcla);
    when 'relacionar' then
      base := base || jsonb_build_object(
        'izquierda', coalesce((
          select jsonb_agg(jsonb_build_object('id', q->'id', 'texto', q->'izquierda') order by i)
          from jsonb_array_elements(coalesce(p->'pares', '[]')) with ordinality as x (q, i)), '[]'),
        'derecha', _banco(coalesce((select jsonb_agg(q->'derecha') from jsonb_array_elements(coalesce(p->'pares', '[]')) q
                                    where jsonb_typeof(q->'derecha') = 'string'), '[]') || coalesce(p->'distractores', '[]')));
    when 'huecos' then
      base := base || jsonb_build_object('segmentos', coalesce(p->'segmentos', '[""]'));
    else
      null;
  end case;
  return base;
end;
$$;

-- Formulario sin respuestas correctas, para quien lo va a contestar.
create or replace function public.formulario_publico(p_id uuid, p_preview boolean default false)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  f public.formularios;
  cfg jsonb;
  examen boolean;
begin
  select * into f from public.formularios where id = p_id;
  if not found then
    raise exception 'Este formulario no existe o fue eliminado.';
  end if;
  cfg := coalesce(f.datos->'config', '{}');
  examen := _bool(cfg->'esExamen');

  if not _bool(cfg->'aceptaRespuestas') and not (coalesce(p_preview, false) and f.owner = auth.uid()) then
    return jsonb_build_object('cerrado', true, 'titulo', f.datos->'titulo', 'diseno', coalesce(f.datos->'diseno', '{}'));
  end if;

  return jsonb_build_object(
    'id', f.id,
    'titulo', f.datos->'titulo',
    'descripcion', f.datos->'descripcion',
    'descripcionHtml', coalesce(f.datos->'descripcionHtml', '""'),
    'diseno', coalesce(f.datos->'diseno', '{}'),
    'config', jsonb_build_object(
      'esExamen', examen,
      'pedirNombre', _bool(cfg->'pedirNombre'),
      'pedirCorreo', _bool(cfg->'pedirCorreo'),
      'mezclarPreguntas', _bool(cfg->'mezclarPreguntas')),
    'preguntas', coalesce((
      select jsonb_agg(_pregunta_publica(p, examen) order by pi)
      from jsonb_array_elements(coalesce(f.datos->'preguntas', '[]')) with ordinality as y (p, pi)), '[]')
  );
end;
$$;

-- Guarda una respuesta, la califica y devuelve lo que el participante puede ver.
-- p_preview solo funciona para el dueño: califica sin guardar.
create or replace function public.enviar_respuesta(
  p_id uuid,
  p_nombre text,
  p_correo text,
  p_respuestas jsonb,
  p_preview boolean default false
) returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  f public.formularios;
  cfg jsonb;
  examen boolean;
  es_preview boolean;
  p jsonb;
  r jsonb;
  pts numeric;
  frac numeric;
  obt numeric;
  v_puntaje numeric := 0;
  v_maximo numeric := 0;
  v_porcentaje numeric;
  v_aprobado boolean;
  v_calificado boolean;
  v_detalle jsonb := '[]';
  v_revision jsonb;
  salida jsonb;
begin
  select * into f from public.formularios where id = p_id;
  if not found then
    raise exception 'Este formulario no existe o fue eliminado.';
  end if;
  cfg := coalesce(f.datos->'config', '{}');
  examen := _bool(cfg->'esExamen');
  es_preview := coalesce(p_preview, false) and f.owner = auth.uid();

  if not _bool(cfg->'aceptaRespuestas') and not es_preview then
    raise exception 'Este formulario ya no acepta respuestas.';
  end if;
  if jsonb_typeof(p_respuestas) is distinct from 'object' then
    p_respuestas := '{}';
  end if;

  for p in select value from jsonb_array_elements(coalesce(f.datos->'preguntas', '[]')) loop
    r := p_respuestas -> (p->>'id');

    if _bool(p->'obligatoria') and _vacia(r) then
      raise exception 'Faltan preguntas obligatorias por responder.';
    end if;

    if not examen or not _calificable(p) then
      v_detalle := v_detalle || jsonb_build_array(
        jsonb_build_object('id', p->'id', 'correcta', null, 'obtenidos', 0, 'puntos', 0));
      continue;
    end if;

    pts := coalesce((p->>'puntos')::numeric, 0);
    frac := coalesce(_fraccion(p, r), 0);
    obt := round(pts * frac, 2);
    v_maximo := v_maximo + pts;
    v_puntaje := v_puntaje + obt;
    v_detalle := v_detalle || jsonb_build_array(jsonb_build_object(
      'id', p->'id', 'correcta', frac = 1, 'obtenidos', obt, 'puntos', pts));
  end loop;

  v_calificado := examen and v_maximo > 0;
  v_porcentaje := case when v_maximo > 0 then round(v_puntaje / v_maximo * 100, 1) else 0 end;
  v_aprobado := v_porcentaje >= coalesce((cfg->>'aprobatorio')::numeric, 0);

  if not es_preview then
    insert into public.respuestas (form_id, nombre, correo, puntaje, maximo, datos)
    values (f.id, left(coalesce(p_nombre, ''), 200), left(coalesce(p_correo, ''), 200), v_puntaje, v_maximo,
      jsonb_build_object('respuestas', p_respuestas, 'detalle', v_detalle, 'porcentaje', v_porcentaje,
        'aprobado', v_aprobado, 'calificado', v_calificado));
  end if;

  salida := jsonb_build_object('mensaje', coalesce(cfg->>'mensajeFinal', ''), 'calificado', false);
  if v_calificado and _bool(cfg->'mostrarResultados') then
    salida := salida || jsonb_build_object('calificado', true, 'puntaje', v_puntaje, 'maximo', v_maximo,
      'porcentaje', v_porcentaje, 'aprobado', v_aprobado);
    if _bool(cfg->'mostrarCorrectas') then
      select jsonb_agg(d || jsonb_build_object('clave',
          case when d->'correcta' = 'null'::jsonb then null else _clave(q) end) order by i)
        into v_revision
        from jsonb_array_elements(v_detalle) with ordinality as a (d, i)
        join jsonb_array_elements(f.datos->'preguntas') with ordinality as b (q, j) on i = j;
      salida := salida || jsonb_build_object('revision', coalesce(v_revision, '[]'));
    end if;
  end if;
  return salida;
end;
$$;

-- Resumen de "Mis formularios" sin descargar las preguntas ni las imágenes completas.
create or replace function public.mis_formularios()
returns table (
  id uuid, titulo text, descripcion text, actualizado timestamptz, num_preguntas int, num_respuestas bigint,
  es_examen boolean, acepta boolean, plantilla text, acento text, portada text
)
language sql stable security invoker set search_path = public as $$
  select f.id, f.datos->>'titulo', f.datos->>'descripcion', f.actualizado,
    case when jsonb_typeof(f.datos->'preguntas') = 'array' then jsonb_array_length(f.datos->'preguntas') else 0 end,
    (select count(*) from public.respuestas r where r.form_id = f.id),
    _bool(f.datos->'config'->'esExamen'), _bool(f.datos->'config'->'aceptaRespuestas'),
    f.datos->'diseno'->>'plantilla', f.datos->'diseno'->>'acento',
    coalesce(nullif(f.datos->'diseno'->>'miniatura', ''), nullif(f.datos->'diseno'->>'encabezado', ''))
  from public.formularios f
  where f.owner = auth.uid()
  order by f.actualizado desc
$$;

revoke all on function public.mis_formularios() from public;
grant execute on function public.mis_formularios() to authenticated;

-- Versión del esquema: el portal avisa al capacitador si su base de datos está desactualizada.
create or replace function public.portal_version() returns int
language sql immutable as $$ select 5 $$;

grant execute on function public.portal_version() to anon, authenticated;
revoke all on function public.formulario_publico(uuid, boolean) from public;
revoke all on function public.enviar_respuesta(uuid, text, text, jsonb, boolean) from public;
grant execute on function public.formulario_publico(uuid, boolean) to anon, authenticated;
grant execute on function public.enviar_respuesta(uuid, text, text, jsonb, boolean) to anon, authenticated;
