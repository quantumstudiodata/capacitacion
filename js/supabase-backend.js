// Backend real: Supabase (Auth + Postgres). El esquema está en supabase.sql.
const SupabaseBackend = (() => {
  let cliente = null;
  const sb = () => {
    if (!cliente) {
      if (!window.supabase) throw new Error('No se pudo cargar Supabase. Revisa tu conexión.');
      cliente = window.supabase.createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_ANON_KEY);
    }
    return cliente;
  };

  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const idValido = (id) => {
    if (!UUID.test(String(id || ''))) throw new Error('Este formulario no existe o fue eliminado.');
    return id;
  };

  const usuarioDe = (user) => ({
    email: user.email,
    nombre: (user.user_metadata && user.user_metadata.nombre) || user.email.split('@')[0]
  });

  function errorSesion() {
    const e = new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    e.sesionExpirada = true;
    return e;
  }

  async function requiereSesion() {
    const { data } = await sb().auth.getSession();
    if (!data.session) throw errorSesion();
    return data.session;
  }

  function revisar({ data, error }) {
    if (error) {
      const msg = error.message || String(error);
      if (/JWT|token/i.test(msg)) throw errorSesion();
      throw new Error(traducir(msg));
    }
    return data;
  }

  function traducir(msg) {
    const tabla = [
      [/Invalid login credentials/i, 'Correo o contraseña incorrectos'],
      [/Email not confirmed/i, 'Confirma tu correo antes de iniciar sesión (revisa tu bandeja de entrada).'],
      [/User already registered/i, 'Ya existe una cuenta con ese correo'],
      [/Password should be at least/i, 'La contraseña debe tener al menos 6 caracteres'],
      [/Signups not allowed/i, 'El registro de cuentas nuevas está desactivado.'],
      [/rate limit/i, 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'],
      [/Failed to fetch|NetworkError/i, 'No se pudo conectar con el servidor.']
    ];
    const t = tabla.find(([re]) => re.test(msg));
    return t ? t[1] : msg;
  }

  const aForm = (fila) => Object.assign({}, fila.datos, {
    id: fila.id,
    actualizado: new Date(fila.actualizado).getTime()
  });

  const acciones = {
    async register(b) {
      const email = String(b.email || '').trim().toLowerCase();
      const nombre = String(b.nombre || '').trim();
      if (!nombre || !email || !b.password) throw new Error('Completa todos los campos');
      const data = revisar(await sb().auth.signUp({ email, password: b.password, options: { data: { nombre }, emailRedirectTo: location.origin + location.pathname } }));
      if (!data.session) {
        const e = new Error('Te enviamos un correo para confirmar tu cuenta. Confírmalo y luego inicia sesión.');
        e.info = true;
        throw e;
      }
      return { token: 'supabase', usuario: usuarioDe(data.user) };
    },

    async login(b) {
      const email = String(b.email || '').trim().toLowerCase();
      const data = revisar(await sb().auth.signInWithPassword({ email, password: b.password }));
      return { token: 'supabase', usuario: usuarioDe(data.user) };
    },

    async version() {
      const { data, error } = await sb().rpc('portal_version');
      return error ? 0 : Number(data) || 0;
    },

    async logout() {
      await sb().auth.signOut();
      return true;
    },

    async listForms() {
      await requiereSesion();
      // Resumen ligero desde la base (sin descargar preguntas ni imágenes completas).
      const rapido = await sb().rpc('mis_formularios');
      if (!rapido.error) {
        return rapido.data.map((f) => ({
          id: f.id, titulo: f.titulo, descripcion: f.descripcion, actualizado: new Date(f.actualizado).getTime(),
          numPreguntas: f.num_preguntas, numRespuestas: Number(f.num_respuestas) || 0,
          esExamen: f.es_examen, aceptaRespuestas: f.acepta,
          plantilla: f.plantilla, acento: f.acento, portada: f.portada || ''
        }));
      }
      // Base de datos sin actualizar: se usa la consulta completa.
      const filas = revisar(await sb().from('formularios')
        .select('id, datos, actualizado, respuestas(count)')
        .order('actualizado', { ascending: false }));
      return filas.map((f) => {
        const form = aForm(f);
        return {
          id: form.id,
          titulo: form.titulo,
          descripcion: form.descripcion,
          actualizado: form.actualizado,
          numPreguntas: (form.preguntas || []).length,
          numRespuestas: (f.respuestas && f.respuestas[0] && f.respuestas[0].count) || 0,
          esExamen: !!(form.config && form.config.esExamen),
          aceptaRespuestas: !!(form.config && form.config.aceptaRespuestas),
          plantilla: (form.diseno || {}).plantilla, acento: (form.diseno || {}).acento,
          portada: (form.diseno || {}).miniatura || (form.diseno || {}).encabezado || ''
        };
      });
    },

    async getForm(b) {
      await requiereSesion();
      const f = revisar(await sb().from('formularios').select('id, datos, actualizado').eq('id', idValido(b.id)).maybeSingle());
      if (!f) throw new Error('Formulario no encontrado');
      return aForm(f);
    },

    async saveForm(b) {
      await requiereSesion();
      const datos = Object.assign({}, b.form);
      delete datos.id;
      delete datos.actualizado;
      const ahora = new Date().toISOString();
      const consulta = b.form.id
        ? sb().from('formularios').update({ datos, actualizado: ahora }).eq('id', idValido(b.form.id))
        : sb().from('formularios').insert({ datos, actualizado: ahora });
      const f = revisar(await consulta.select('id, datos, actualizado').maybeSingle());
      if (!f) throw new Error('Formulario no encontrado');
      return aForm(f);
    },

    async deleteForm(b) {
      await requiereSesion();
      revisar(await sb().from('formularios').delete().eq('id', idValido(b.id)));
      return true;
    },

    async getPublicForm(b) {
      return revisar(await sb().rpc('formulario_publico', { p_id: idValido(b.id), p_preview: !!b.preview }));
    },

    async submit(b) {
      return revisar(await sb().rpc('enviar_respuesta', {
        p_id: idValido(b.id),
        p_nombre: b.nombre || '',
        p_correo: b.correo || '',
        p_respuestas: b.respuestas || {},
        p_preview: !!b.preview
      }));
    },

    async listResponses(b) {
      await requiereSesion();
      const filas = revisar(await sb().from('respuestas').select('*')
        .eq('form_id', idValido(b.id)).order('fecha', { ascending: false }));
      return filas.map((r) => {
        const d = r.datos || {};
        return {
          id: r.id, formId: r.form_id, fecha: new Date(r.fecha).getTime(),
          nombre: r.nombre, correo: r.correo,
          puntaje: Number(r.puntaje) || 0, maximo: Number(r.maximo) || 0,
          porcentaje: Number(d.porcentaje) || 0, aprobado: !!d.aprobado, calificado: !!d.calificado,
          respuestas: d.respuestas || {}, detalle: d.detalle || []
        };
      });
    },

    async deleteResponse(b) {
      await requiereSesion();
      revisar(await sb().from('respuestas').delete().eq('id', idValido(b.id)));
      return true;
    }
  };

  return {
    async sesionActual() {
      try {
        const { data } = await sb().auth.getSession();
        return data.session ? usuarioDe(data.session.user) : null;
      } catch (e) {
        return null;
      }
    },
    async handle(body) {
      const fn = acciones[body.action];
      if (!fn) return { ok: false, error: 'Acción no soportada: ' + body.action };
      try {
        return { ok: true, data: await fn(body) };
      } catch (e) {
        return { ok: false, error: traducir(e.message || String(e)), sesionExpirada: !!e.sesionExpirada, info: !!e.info };
      }
    }
  };
})();
