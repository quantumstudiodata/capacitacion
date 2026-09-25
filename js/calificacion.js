// Lógica de calificación del modo demo.
// En producción la calificación la hace Supabase (supabase.sql, función enviar_respuesta)
// con las mismas reglas: si cambias una, cambia la otra.

function normalizarTexto(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase().replace(/\s+/g, ' ');
}

function esCalificable(p) {
  if (p.tipo === 'parrafo') return false;
  if (p.tipo === 'corta') return (p.respuestasAceptadas || []).some(function (a) { return String(a).trim() !== ''; });
  return (p.correctas || []).length > 0;
}

function calificar(form, respuestas) {
  var cfg = form.config || {};
  var detalle = [];
  var puntaje = 0, maximo = 0;
  (form.preguntas || []).forEach(function (p) {
    if (!cfg.esExamen || !esCalificable(p)) {
      detalle.push({ id: p.id, correcta: null, obtenidos: 0, puntos: 0 });
      return;
    }
    var pts = Number(p.puntos) || 0;
    maximo += pts;
    var r = respuestas[p.id];
    var ok = false;
    if (p.tipo === 'multiple') {
      var sel = Array.isArray(r) ? r : [];
      ok = sel.length === p.correctas.length && p.correctas.every(function (c) { return sel.indexOf(c) > -1; });
    } else if (p.tipo === 'corta') {
      var n = normalizarTexto(r);
      ok = n !== '' && p.respuestasAceptadas.some(function (a) { return normalizarTexto(a) === n; });
    } else {
      ok = r != null && p.correctas.indexOf(r) > -1;
    }
    var obt = ok ? pts : 0;
    puntaje += obt;
    detalle.push({ id: p.id, correcta: ok, obtenidos: obt, puntos: pts });
  });
  var porcentaje = maximo ? Math.round(puntaje / maximo * 1000) / 10 : 0;
  return {
    calificado: !!cfg.esExamen && maximo > 0,
    puntaje: puntaje,
    maximo: maximo,
    porcentaje: porcentaje,
    aprobado: porcentaje >= (Number(cfg.aprobatorio) || 0),
    detalle: detalle
  };
}

// Lo que ve quien responde: sin respuestas correctas.
function formPublico(form) {
  var cfg = form.config || {};
  return {
    id: form.id,
    titulo: form.titulo,
    descripcion: form.descripcion,
    config: {
      esExamen: !!cfg.esExamen,
      pedirNombre: !!cfg.pedirNombre,
      pedirCorreo: !!cfg.pedirCorreo,
      mezclarPreguntas: !!cfg.mezclarPreguntas
    },
    preguntas: (form.preguntas || []).map(function (p) {
      return {
        id: p.id, tipo: p.tipo, texto: p.texto, obligatoria: !!p.obligatoria,
        puntos: cfg.esExamen && esCalificable(p) ? Number(p.puntos) || 0 : 0,
        opciones: (p.opciones || []).map(function (o) { return { id: o.id, texto: o.texto }; })
      };
    })
  };
}

function faltantes(form, respuestas) {
  return (form.preguntas || []).filter(function (p) {
    if (!p.obligatoria) return false;
    var r = respuestas[p.id];
    return r == null || (Array.isArray(r) ? r.length === 0 : String(r).trim() === '');
  });
}

// Lo que recibe quien responde al enviar, según la configuración.
function resultadoPublico(form, cal) {
  var cfg = form.config || {};
  var out = { mensaje: cfg.mensajeFinal || '', calificado: false };
  if (cal.calificado && cfg.mostrarResultados) {
    out.calificado = true;
    out.puntaje = cal.puntaje;
    out.maximo = cal.maximo;
    out.porcentaje = cal.porcentaje;
    out.aprobado = cal.aprobado;
    if (cfg.mostrarCorrectas) {
      out.revision = cal.detalle.map(function (d) {
        var p = form.preguntas.filter(function (q) { return q.id === d.id; })[0];
        var clave = d.correcta === null ? null : (p.tipo === 'corta' ? p.respuestasAceptadas : p.correctas);
        return { id: d.id, correcta: d.correcta, obtenidos: d.obtenidos, puntos: d.puntos, clave: clave };
      });
    }
  }
  return out;
}
