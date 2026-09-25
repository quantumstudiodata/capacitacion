const Sesion = {
  KEY: 'cap_sesion',
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || null; } catch (e) { return null; }
  },
  set(s) { try { localStorage.setItem(this.KEY, JSON.stringify(s)); } catch (e) {} },
  cerrar() { try { localStorage.removeItem(this.KEY); } catch (e) {} },
  token() { const s = this.get(); return s ? s.token : null; },
  usuario() { const s = this.get(); return s ? s.usuario : null; }
};

const API = {
  modoDemo: !(window.CONFIG.SUPABASE_URL && window.CONFIG.SUPABASE_ANON_KEY),

  backend() {
    return this.modoDemo ? LocalBackend : SupabaseBackend;
  },

  // Sincroniza la sesión guardada con la del backend (p. ej. si expiró).
  async iniciar() {
    const usuario = await this.backend().sesionActual(Sesion.token());
    if (usuario) Sesion.set({ token: Sesion.token(), usuario });
    else Sesion.cerrar();
  },

  async call(action, data = {}) {
    const body = Object.assign({ action, token: Sesion.token() }, data);
    const res = await this.backend().handle(body);
    if (!res.ok) {
      if (res.sesionExpirada) {
        Sesion.cerrar();
        location.hash = '#/login';
      }
      const e = new Error(res.error || 'Error desconocido');
      e.info = !!res.info;
      throw e;
    }
    return res.data;
  }
};
