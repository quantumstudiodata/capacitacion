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

create or replace function public._normalizar(t text) returns text
language sql stable set search_path = public, extensions as $$
  select lower(regexp_replace(trim(extensions.unaccent(coalesce(t, ''))), '\s+', ' ', 'g'))
$$;

create or replace function public._calificable(p jsonb) returns boolean
language sql immutable as $$
  select case
    when p->>'tipo' = 'parrafo' then false
    when p->>'tipo' = 'corta' then exists (
      select 1 from jsonb_array_elements_text(coalesce(p->'respuestasAceptadas', '[]')) a where trim(a) <> '')
    else jsonb_array_length(coalesce(p->'correctas', '[]')) > 0
  end
$$;

create or replace function public._bool(v jsonb) returns boolean
language sql immutable as $$
  select coalesce(v = 'true'::jsonb, false)
$$;

-- Formulario sin respuestas correctas, para quien lo va a contestar.
create or replace function public.formulario_publico(p_id uuid, p_preview boolean default false)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
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
    return jsonb_build_object('cerrado', true, 'titulo', f.datos->'titulo');
  end if;

  return jsonb_build_object(
    'id', f.id,
    'titulo', f.datos->'titulo',
    'descripcion', f.datos->'descripcion',
    'config', jsonb_build_object(
      'esExamen', examen,
      'pedirNombre', _bool(cfg->'pedirNombre'),
      'pedirCorreo', _bool(cfg->'pedirCorreo'),
      'mezclarPreguntas', _bool(cfg->'mezclarPreguntas')),
    'preguntas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p->'id',
        'tipo', p->'tipo',
        'texto', p->'texto',
        'obligatoria', _bool(p->'obligatoria'),
        'puntos', case when examen and _calificable(p) then coalesce((p->>'puntos')::numeric, 0) else 0 end,
        'opciones', coalesce((
          select jsonb_agg(jsonb_build_object('id', o->'id', 'texto', o->'texto') order by oi)
          from jsonb_array_elements(coalesce(p->'opciones', '[]')) with ordinality as x (o, oi)), '[]')
      ) order by pi)
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
  ok boolean;
  pts numeric;
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

    if _bool(p->'obligatoria') and (
      r is null or jsonb_typeof(r) = 'null'
      or (jsonb_typeof(r) = 'array' and jsonb_array_length(r) = 0)
      or (jsonb_typeof(r) = 'string' and trim(r #>> '{}') = '')
    ) then
      raise exception 'Faltan preguntas obligatorias por responder.';
    end if;

    if not examen or not _calificable(p) then
      v_detalle := v_detalle || jsonb_build_array(
        jsonb_build_object('id', p->'id', 'correcta', null, 'obtenidos', 0, 'puntos', 0));
      continue;
    end if;

    pts := coalesce((p->>'puntos')::numeric, 0);
    v_maximo := v_maximo + pts;

    if p->>'tipo' = 'multiple' then
      ok := jsonb_typeof(r) = 'array' and r @> (p->'correctas') and (p->'correctas') @> r;
    elsif p->>'tipo' = 'corta' then
      ok := jsonb_typeof(r) = 'string' and _normalizar(r #>> '{}') <> '' and exists (
        select 1 from jsonb_array_elements_text(p->'respuestasAceptadas') a
        where _normalizar(a) = _normalizar(r #>> '{}'));
    else
      ok := jsonb_typeof(r) = 'string' and (p->'correctas') ? (r #>> '{}');
    end if;
    ok := coalesce(ok, false);

    if ok then
      v_puntaje := v_puntaje + pts;
    end if;
    v_detalle := v_detalle || jsonb_build_array(jsonb_build_object(
      'id', p->'id', 'correcta', ok, 'obtenidos', case when ok then pts else 0 end, 'puntos', pts));
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
          case when d->'correcta' = 'null'::jsonb then null
               when q->>'tipo' = 'corta' then q->'respuestasAceptadas'
               else q->'correctas' end) order by i)
        into v_revision
        from jsonb_array_elements(v_detalle) with ordinality as a (d, i)
        join jsonb_array_elements(f.datos->'preguntas') with ordinality as b (q, j) on i = j;
      salida := salida || jsonb_build_object('revision', coalesce(v_revision, '[]'));
    end if;
  end if;
  return salida;
end;
$$;

revoke all on function public.formulario_publico(uuid, boolean) from public;
revoke all on function public.enviar_respuesta(uuid, text, text, jsonb, boolean) from public;
grant execute on function public.formulario_publico(uuid, boolean) to anon, authenticated;
grant execute on function public.enviar_respuesta(uuid, text, text, jsonb, boolean) to anon, authenticated;
