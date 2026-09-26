// Backend de demostración: imita las acciones de Code.gs usando localStorage.
// Solo sirve para probar el portal; las ligas compartidas únicamente funcionan
// en este mismo navegador.
const LocalBackend = (() => {
  const KEY = 'cap_demo_db';

  const leer = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { usuarios: [], formularios: [], respuestas: [] };
    } catch (e) {
      return { usuarios: [], formularios: [], respuestas: [] };
    }
  };
  const escribir = (db) => localStorage.setItem(KEY, JSON.stringify(db));
  const nuevoId = (p) => p + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  async function hash(s) {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
    }
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return 'x' + h;
  }

  function usuarioDe(db, token) {
    const email = token && token.startsWith('demo:') ? token.slice(5) : null;
    const u = db.usuarios.find((x) => x.email === email);
    if (!u) {
      const e = new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
      e.sesionExpirada = true;
      throw e;
    }
    return u;
  }

  function formPropio(db, u, id) {
    const f = db.formularios.find((x) => x.id === id);
    if (!f || f.owner !== u.email) throw new Error('Formulario no encontrado');
    return f;
  }

  const sesion = (u) => ({ token: 'demo:' + u.email, usuario: { email: u.email, nombre: u.nombre } });

  const acciones = {
    async register(b) {
      const db = leer();
      const email = String(b.email || '').trim().toLowerCase();
      if (!b.nombre || !email || !b.password) throw new Error('Completa todos los campos');
      if (String(b.password).length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');
      if (db.usuarios.some((u) => u.email === email)) throw new Error('Ya existe una cuenta con ese correo');
      const u = { email, nombre: String(b.nombre).trim(), hash: await hash(email + ':' + b.password) };
      db.usuarios.push(u);
      escribir(db);
      return sesion(u);
    },
    async login(b) {
      const db = leer();
      const email = String(b.email || '').trim().toLowerCase();
      const u = db.usuarios.find((x) => x.email === email);
      if (!u || u.hash !== await hash(email + ':' + b.password)) throw new Error('Correo o contraseña incorrectos');
      return sesion(u);
    },
    listForms(b) {
      const db = leer();
      const u = usuarioDe(db, b.token);
      return db.formularios
        .filter((f) => f.owner === u.email)
        .map((f) => resumen(f.data, db.respuestas.filter((r) => r.formId === f.id).length))
        .sort((a, b) => b.actualizado - a.actualizado);
    },
    getForm(b) {
      const db = leer();
      return formPropio(db, usuarioDe(db, b.token), b.id).data;
    },
    saveForm(b) {
      const db = leer();
      const u = usuarioDe(db, b.token);
      const form = Object.assign({}, b.form, { actualizado: Date.now() });
      if (form.id) {
        const f = formPropio(db, u, form.id);
        f.data = form;
      } else {
        form.id = nuevoId('f');
        form.creado = form.actualizado;
        db.formularios.push({ id: form.id, owner: u.email, data: form });
      }
      escribir(db);
      return form;
    },
    deleteForm(b) {
      const db = leer();
      formPropio(db, usuarioDe(db, b.token), b.id);
      db.formularios = db.formularios.filter((f) => f.id !== b.id);
      db.respuestas = db.respuestas.filter((r) => r.formId !== b.id);
      escribir(db);
      return true;
    },
    getPublicForm(b) {
      const db = leer();
      const f = db.formularios.find((x) => x.id === b.id);
      if (!f) throw new Error('Este formulario no existe o fue eliminado.');
      if (!f.data.config.aceptaRespuestas && !b.preview) return { cerrado: true, titulo: f.data.titulo, diseno: f.data.diseno || {} };
      return formPublico(f.data);
    },
    submit(b) {
      const db = leer();
      const f = db.formularios.find((x) => x.id === b.id);
      if (!f) throw new Error('Este formulario no existe o fue eliminado.');
      const form = f.data;
      if (!form.config.aceptaRespuestas && !b.preview) throw new Error('Este formulario ya no acepta respuestas.');
      const respuestas = b.respuestas || {};
      const falta = faltantes(form, respuestas);
      if (falta.length) throw new Error('Faltan preguntas obligatorias por responder.');
      const cal = calificar(form, respuestas);
      if (!b.preview) {
        db.respuestas.push({
          id: nuevoId('r'), formId: form.id, fecha: Date.now(),
          nombre: String(b.nombre || ''), correo: String(b.correo || ''),
          puntaje: cal.puntaje, maximo: cal.maximo, porcentaje: cal.porcentaje, aprobado: cal.aprobado,
          calificado: cal.calificado, respuestas, detalle: cal.detalle
        });
        escribir(db);
      }
      return resultadoPublico(form, cal);
    },
    listResponses(b) {
      const db = leer();
      formPropio(db, usuarioDe(db, b.token), b.id);
      return db.respuestas.filter((r) => r.formId === b.id).sort((a, b) => b.fecha - a.fecha);
    },
    logout() {
      return true;
    },
    version() {
      return 99;
    },
    deleteResponse(b) {
      const db = leer();
      const u = usuarioDe(db, b.token);
      const r = db.respuestas.find((x) => x.id === b.id);
      if (!r) throw new Error('Respuesta no encontrada');
      formPropio(db, u, r.formId);
      db.respuestas = db.respuestas.filter((x) => x.id !== b.id);
      escribir(db);
      return true;
    }
  };

  function resumen(form, numRespuestas) {
    return {
      id: form.id,
      titulo: form.titulo,
      descripcion: form.descripcion,
      actualizado: form.actualizado,
      numPreguntas: (form.preguntas || []).length,
      numRespuestas,
      esExamen: !!form.config.esExamen,
      aceptaRespuestas: !!form.config.aceptaRespuestas,
      plantilla: (form.diseno || {}).plantilla,
      acento: (form.diseno || {}).acento,
      portada: (form.diseno || {}).miniatura || (form.diseno || {}).encabezado || ''
    };
  }

  return {
    async sesionActual(token) {
      const db = leer();
      const email = token && token.startsWith('demo:') ? token.slice(5) : null;
      const u = db.usuarios.find((x) => x.email === email);
      return u ? { email: u.email, nombre: u.nombre } : null;
    },
    async handle(body) {
      await new Promise((r) => setTimeout(r, 120));
      const fn = acciones[body.action];
      if (!fn) return { ok: false, error: 'Acción no soportada: ' + body.action };
      try {
        const data = await fn(body);
        return { ok: true, data: JSON.parse(JSON.stringify(data)) };
      } catch (e) {
        return { ok: false, error: e.message, sesionExpirada: !!e.sesionExpirada };
      }
    }
  };
})();
