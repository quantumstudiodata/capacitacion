// Reglas de calificación.
// En producción califica Supabase (supabase.sql: _fraccion, _calificable, _clave, enviar_respuesta)
// con estas mismas reglas; en el navegador se usan para el modo demo y para mostrar resultados.
// Si cambias una regla aquí, cámbiala también en supabase.sql.

function normalizarTexto(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toLowerCase().replace(/\s+/g, ' ');
}

const tieneTexto = (a) => String(a == null ? '' : a).trim() !== '';

function coincide(respuesta, aceptadas) {
  const n = normalizarTexto(respuesta);
  return n !== '' && (aceptadas || []).some((a) => normalizarTexto(a) === n);
}

function esCalificable(p) {
  switch (p.tipo) {
    case 'parrafo': return false;
    case 'corta': return (p.respuestasAceptadas || []).some(tieneTexto);
    case 'subrespuestas': return (p.campos || []).some((c) => (c.aceptadas || []).some(tieneTexto));
    case 'puntoImagen': return !!p.imagen && (p.zonas || []).length > 0;
    case 'etiquetarImagen': return (p.marcadores || []).some((m) => tieneTexto(m.texto));
    case 'zonasImagen': return (p.marcadores || []).some(zonaCalificable);
    case 'ordenar': return (p.elementos || []).length >= 2;
    case 'relacionar': return (p.pares || []).length >= 1;
    case 'huecos': return (p.huecos || []).length > 0;
    default: return (p.correctas || []).length > 0;
  }
}

// Un punto de "Zonas en imagen" se califica si tiene respuesta correcta según su modo.
function zonaCalificable(m) {
  return m.modo === 'corta' ? (m.aceptadas || []).some(tieneTexto) : tieneTexto(m.correcta);
}

// Una respuesta está vacía si no tiene ningún texto (sirve para cualquier tipo).
function respuestaVacia(r) {
  if (r == null) return true;
  if (Array.isArray(r)) return !r.some(tieneTexto);
  if (typeof r === 'object') return !Object.keys(r).some((k) => tieneTexto(r[k]));
  return !tieneTexto(r);
}

// Desglose por partes de los tipos compuestos: [{ etiqueta, respuesta, correcta, ok }].
// ok es null cuando esa parte no tiene respuesta correcta configurada.
function desglose(p, r) {
  const obj = r && typeof r === 'object' && !Array.isArray(r) ? r : {};
  const arr = Array.isArray(r) ? r : [];
  switch (p.tipo) {
    case 'subrespuestas':
      return (p.campos || []).map((c) => {
        const ac = (c.aceptadas || []).filter(tieneTexto);
        return { etiqueta: c.etiqueta || 'Campo', respuesta: obj[c.id] || '', correcta: ac.join(' / '), ok: ac.length ? coincide(obj[c.id], ac) : null };
      });
    case 'etiquetarImagen':
      return (p.marcadores || []).map((m, i) => ({
        etiqueta: `Punto ${i + 1}`, respuesta: obj[m.id] || '', correcta: m.texto || '',
        ok: tieneTexto(m.texto) ? coincide(obj[m.id], [m.texto]) : null
      }));
    case 'zonasImagen':
      return (p.marcadores || []).map((m, i) => {
        const r = obj[m.id];
        if (m.modo === 'corta') {
          const ac = (m.aceptadas || []).filter(tieneTexto);
          return { etiqueta: `Punto ${i + 1}`, respuesta: r || '', correcta: ac.join(' / '), ok: ac.length ? coincide(r, ac) : null };
        }
        const texto = (id) => ((m.opciones || []).find((o) => o.id === id) || {}).texto || '';
        return { etiqueta: `Punto ${i + 1}`, respuesta: texto(r), correcta: texto(m.correcta), ok: tieneTexto(m.correcta) ? r === m.correcta : null };
      });
    case 'ordenar': {
      const els = p.elementos || [];
      const texto = (id) => (els.find((e) => e.id === id) || {}).texto || '';
      return els.map((e, i) => ({ etiqueta: `Posición ${i + 1}`, respuesta: texto(arr[i]), correcta: e.texto, ok: arr[i] === e.id }));
    }
    case 'relacionar':
      return (p.pares || []).map((q) => ({ etiqueta: q.izquierda, respuesta: obj[q.id] || '', correcta: q.derecha, ok: coincide(obj[q.id], [q.derecha]) }));
    case 'huecos':
      return (p.huecos || []).map((h, i) => ({ etiqueta: `Espacio ${i + 1}`, respuesta: arr[i] || '', correcta: h.join(' / '), ok: coincide(arr[i], h) }));
  }
  return null;
}

function dentroDeZona(p, r) {
  if (!r || typeof r !== 'object' || r.x == null) return false;
  const asp = Number(p.aspecto) || 1;
  return (p.zonas || []).some((z) => Math.hypot(r.x - z.x, (r.y - z.y) * asp) <= z.r);
}

// Fracción de la pregunta que se contestó bien (0 a 1).
function fraccion(p, r) {
  switch (p.tipo) {
    case 'multiple': {
      const sel = Array.isArray(r) ? r : [];
      return sel.every((s) => p.correctas.includes(s)) && p.correctas.every((c) => sel.includes(c)) ? 1 : 0;
    }
    case 'unica':
    case 'vf':
      return typeof r === 'string' && p.correctas.includes(r) ? 1 : 0;
    case 'corta':
      return typeof r === 'string' && coincide(r, p.respuestasAceptadas) ? 1 : 0;
    case 'puntoImagen':
      return dentroDeZona(p, r) ? 1 : 0;
    default: {
      const partes = (desglose(p, r) || []).filter((x) => x.ok !== null);
      return partes.length ? partes.filter((x) => x.ok).length / partes.length : 0;
    }
  }
}

function calificar(form, respuestas) {
  const cfg = form.config || {};
  const detalle = [];
  let puntaje = 0, maximo = 0;
  (form.preguntas || []).forEach((p) => {
    if (!cfg.esExamen || !esCalificable(p)) {
      detalle.push({ id: p.id, correcta: null, obtenidos: 0, puntos: 0 });
      return;
    }
    const pts = Number(p.puntos) || 0;
    const f = fraccion(p, respuestas[p.id]);
    const obt = Math.round(pts * f * 100) / 100;
    maximo += pts;
    puntaje += obt;
    detalle.push({ id: p.id, correcta: f === 1, obtenidos: obt, puntos: pts });
  });
  puntaje = Math.round(puntaje * 100) / 100;
  const porcentaje = maximo ? Math.round(puntaje / maximo * 1000) / 10 : 0;
  return {
    calificado: !!cfg.esExamen && maximo > 0,
    puntaje, maximo, porcentaje,
    aprobado: porcentaje >= (Number(cfg.aprobatorio) || 0),
    detalle
  };
}

// Respuesta correcta de una pregunta, en el formato que viaja al participante al revisar.
function claveDe(p) {
  switch (p.tipo) {
    case 'corta': return p.respuestasAceptadas || [];
    case 'subrespuestas': return Object.fromEntries((p.campos || []).map((c) => [c.id, c.aceptadas || []]));
    case 'puntoImagen': return p.zonas || [];
    case 'etiquetarImagen': return Object.fromEntries((p.marcadores || []).map((m) => [m.id, m.texto || '']));
    case 'zonasImagen': return Object.fromEntries((p.marcadores || []).map((m) => [m.id,
      m.modo === 'corta' ? m.aceptadas || [] : tieneTexto(m.correcta) ? [m.correcta] : []]));
    case 'ordenar': return (p.elementos || []).map((e) => e.id);
    case 'relacionar': return Object.fromEntries((p.pares || []).map((q) => [q.id, q.derecha]));
    case 'huecos': return p.huecos || [];
    default: return p.correctas || [];
  }
}

// Reconstruye una pregunta completa a partir de la versión pública más su clave.
function conClave(pub, clave) {
  const p = Object.assign({}, pub);
  if (clave == null) return p;
  switch (p.tipo) {
    case 'corta': p.respuestasAceptadas = clave; break;
    case 'subrespuestas': p.campos = (pub.campos || []).map((c) => Object.assign({}, c, { aceptadas: clave[c.id] || [] })); break;
    case 'puntoImagen': p.zonas = clave; break;
    case 'etiquetarImagen': p.marcadores = (pub.marcadores || []).map((m) => Object.assign({}, m, { texto: clave[m.id] || '' })); break;
    case 'zonasImagen': p.marcadores = (pub.marcadores || []).map((m) => Object.assign({}, m, m.modo === 'corta'
      ? { aceptadas: clave[m.id] || [] } : { correcta: (clave[m.id] || [])[0] || '' })); break;
    case 'ordenar': p.elementos = clave.map((id) => (pub.elementos || []).find((e) => e.id === id)).filter(Boolean); break;
    case 'relacionar': p.pares = (pub.izquierda || []).map((q) => ({ id: q.id, izquierda: q.texto, derecha: clave[q.id] || '' })); break;
    case 'huecos': p.huecos = clave; break;
    default: p.correctas = clave;
  }
  return p;
}

const unicosOrdenados = (lista) => [...new Set(lista.map((t) => String(t || '').trim()).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

function mezclarLista(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// Mezcla asegurando que no quede en el orden original (si hay más de un elemento).
function mezclarOrden(a) {
  const b = mezclarLista(a);
  if (b.length > 1 && b.every((x, i) => x === a[i])) b.push(b.shift());
  return b;
}

// Lo que ve quien responde: sin respuestas correctas.
function preguntaPublica(p, examen) {
  const base = {
    id: p.id, tipo: p.tipo, texto: p.texto, obligatoria: !!p.obligatoria,
    puntos: examen && esCalificable(p) ? Number(p.puntos) || 0 : 0,
    opciones: (p.opciones || []).map((o) => ({ id: o.id, texto: o.texto })),
    apoyo: p.apoyo && p.apoyo.imagen ? { imagen: p.apoyo.imagen, posicion: p.apoyo.posicion || 'arriba' } : null
  };
  switch (p.tipo) {
    case 'subrespuestas':
      base.campos = (p.campos || []).map((c) => ({ id: c.id, etiqueta: c.etiqueta }));
      break;
    case 'puntoImagen':
      base.imagen = p.imagen || '';
      base.aspecto = p.aspecto || 1;
      break;
    case 'etiquetarImagen':
      base.imagen = p.imagen || '';
      base.aspecto = p.aspecto || 1;
      base.marcadores = (p.marcadores || []).map((m) => ({ id: m.id, x: m.x, y: m.y }));
      base.banco = unicosOrdenados((p.marcadores || []).map((m) => m.texto).concat(p.distractores || []));
      break;
    case 'zonasImagen':
      base.imagen = p.imagen || '';
      base.aspecto = p.aspecto || 1;
      base.marcadores = (p.marcadores || []).map((m) => ({
        id: m.id, x: m.x, y: m.y, r: m.r || 0, modo: m.modo || 'opciones',
        opciones: m.modo === 'corta' ? [] : (m.opciones || []).map((o) => ({ id: o.id, texto: o.texto }))
      }));
      break;
    case 'ordenar':
      base.elementos = mezclarOrden((p.elementos || []).map((e) => ({ id: e.id, texto: e.texto })));
      break;
    case 'relacionar':
      base.izquierda = (p.pares || []).map((q) => ({ id: q.id, texto: q.izquierda }));
      base.derecha = unicosOrdenados((p.pares || []).map((q) => q.derecha).concat(p.distractores || []));
      break;
    case 'huecos':
      base.segmentos = p.segmentos || [''];
      break;
  }
  return base;
}

function formPublico(form) {
  const cfg = form.config || {};
  return {
    id: form.id,
    titulo: form.titulo,
    descripcion: form.descripcion,
    diseno: form.diseno || {},
    config: {
      esExamen: !!cfg.esExamen,
      pedirNombre: !!cfg.pedirNombre,
      pedirCorreo: !!cfg.pedirCorreo,
      mezclarPreguntas: !!cfg.mezclarPreguntas
    },
    preguntas: (form.preguntas || []).map((p) => preguntaPublica(p, !!cfg.esExamen))
  };
}

function faltantes(form, respuestas) {
  return (form.preguntas || []).filter((p) => p.obligatoria && respuestaVacia(respuestas[p.id]));
}

// Lo que recibe quien responde al enviar, según la configuración.
function resultadoPublico(form, cal) {
  const cfg = form.config || {};
  const out = { mensaje: cfg.mensajeFinal || '', calificado: false };
  if (cal.calificado && cfg.mostrarResultados) {
    Object.assign(out, { calificado: true, puntaje: cal.puntaje, maximo: cal.maximo, porcentaje: cal.porcentaje, aprobado: cal.aprobado });
    if (cfg.mostrarCorrectas) {
      out.revision = cal.detalle.map((d) => {
        const p = form.preguntas.find((q) => q.id === d.id);
        return Object.assign({}, d, { clave: d.correcta === null ? null : claveDe(p) });
      });
    }
  }
  return out;
}
