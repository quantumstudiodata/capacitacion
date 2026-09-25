(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clonar = (o) => JSON.parse(JSON.stringify(o));

  // ---------- Iconos ----------
  const ICONOS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    more: '<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
    form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M8.2 13.3 7 22l5-3 5 3-1.2-8.7"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    radio: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
    checkbox: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12 3 3 5-6"/>',
    toggle: '<rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="16" cy="12" r="3"/>',
    texto: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
    parrafo: '<path d="M4 6h16M4 10h16M4 14h16M4 18h10"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>'
  };
  const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ''}</svg>`;

  const TIPOS = {
    unica: { nombre: 'Opción única', icono: 'radio' },
    multiple: { nombre: 'Opción múltiple', icono: 'checkbox' },
    vf: { nombre: 'Verdadero / Falso', icono: 'toggle' },
    corta: { nombre: 'Respuesta corta', icono: 'texto' },
    parrafo: { nombre: 'Párrafo', icono: 'parrafo' }
  };
  const esOpciones = (t) => t === 'unica' || t === 'multiple' || t === 'vf';

  const CONFIG_BASE = {
    esExamen: true,
    mostrarResultados: true,
    mostrarCorrectas: true,
    aceptaRespuestas: true,
    pedirNombre: true,
    pedirCorreo: false,
    mezclarPreguntas: false,
    aprobatorio: 70,
    mensajeFinal: ''
  };

  function nuevaPregunta(tipo) {
    const p = { id: uid(), tipo, texto: '', obligatoria: true, puntos: 1, opciones: [], correctas: [], respuestasAceptadas: [] };
    if (tipo === 'unica' || tipo === 'multiple') p.opciones = [{ id: uid(), texto: 'Opción 1' }, { id: uid(), texto: 'Opción 2' }];
    if (tipo === 'vf') p.opciones = [{ id: 'v', texto: 'Verdadero' }, { id: 'f', texto: 'Falso' }];
    if (tipo === 'parrafo') p.puntos = 0;
    return p;
  }

  function cambiarTipo(p, tipo) {
    const antes = p.tipo;
    p.tipo = tipo;
    if (tipo === 'vf') {
      p.opciones = [{ id: 'v', texto: 'Verdadero' }, { id: 'f', texto: 'Falso' }];
      p.correctas = [];
    } else if (tipo === 'unica' || tipo === 'multiple') {
      if (antes === 'vf' || !esOpciones(antes)) {
        p.opciones = [{ id: uid(), texto: 'Opción 1' }, { id: uid(), texto: 'Opción 2' }];
        p.correctas = [];
      }
      if (tipo === 'unica') p.correctas = p.correctas.slice(0, 1);
    } else {
      p.opciones = [];
      p.correctas = [];
    }
    if (tipo === 'parrafo') p.puntos = 0;
    else if (!p.puntos) p.puntos = 1;
  }

  // ---------- Utilidades de UI ----------
  function toast(msg, tipo = 'ok') {
    const el = document.createElement('div');
    el.className = `toast toast-${tipo}`;
    el.innerHTML = `${ic(tipo === 'err' ? 'alert' : 'check')}<span>${esc(msg)}</span>`;
    $('#toasts').appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  function modal(html, alMontar) {
    const el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const cerrar = () => {
      el.classList.remove('show');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => el.remove(), 220);
    };
    const onKey = (e) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', onKey);
    el.addEventListener('mousedown', (e) => { if (e.target === el) cerrar(); });
    el.addEventListener('click', (e) => { if (e.target.closest('[data-cerrar]')) cerrar(); });
    if (alMontar) alMontar(el, cerrar);
    return cerrar;
  }

  function confirmar(titulo, texto, textoOk = 'Eliminar') {
    return new Promise((resolve) => {
      let respuesta = false;
      const cerrar = modal(`
        <div class="modal-icon danger">${ic('trash')}</div>
        <h3>${esc(titulo)}</h3>
        <p class="muted">${esc(texto)}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-cerrar>Cancelar</button>
          <button class="btn btn-danger" data-ok>${esc(textoOk)}</button>
        </div>`, (el) => {
        el.querySelector('[data-ok]').addEventListener('click', () => { respuesta = true; cerrar(); });
        const obs = new MutationObserver(() => {
          if (!document.body.contains(el)) { obs.disconnect(); resolve(respuesta); }
        });
        obs.observe(document.body, { childList: true });
      });
    });
  }

  function fechaRelativa(ts) {
    if (!ts) return '';
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return 'hace un momento';
    const m = Math.round(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    if (d < 7) return `hace ${d} día${d > 1 ? 's' : ''}`;
    return new Date(ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const fechaCompleta = (ts) => new Date(ts).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const ligaPublica = (id) => `${location.origin}${location.pathname}#/responder/${id}`;
  const iniciales = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

  function autoAltura(t) {
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 'px';
  }

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (e) {
      const t = document.createElement('textarea');
      t.value = texto;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    toast('Liga copiada');
  }

  const logo = () => `<div class="brand">${'<span class="brand-mark">' + ic('check') + '</span>'}<span class="brand-name">${esc(window.CONFIG.NOMBRE)}</span></div>`;

  function topbar() {
    const u = Sesion.usuario() || {};
    return `
      <header class="topbar">
        <a href="#/formularios" class="brand-link">${logo()}</a>
        <div class="topbar-right">
          ${API.modoDemo ? '<span class="chip chip-demo" title="Configura Supabase en js/config.js">Modo demo</span>' : ''}
          <div class="user-menu">
            <button class="avatar" id="avatarBtn" aria-label="Cuenta">${esc(iniciales(u.nombre))}</button>
            <div class="dropdown" id="userDropdown">
              <div class="dropdown-head"><strong>${esc(u.nombre)}</strong><span>${esc(u.email)}</span><span class="chip chip-role">Capacitador</span></div>
              <button class="dropdown-item" data-accion="logout">${ic('logout')} Cerrar sesión</button>
            </div>
          </div>
        </div>
      </header>`;
  }

  function enlazarTopbar() {
    const btn = $('#avatarBtn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      $('#userDropdown').classList.toggle('open');
    });
    $('[data-accion="logout"]').addEventListener('click', async () => {
      await guardarSiHayCambios();
      try { await API.call('logout'); } catch (e) {}
      Sesion.cerrar();
      E = null;
      location.hash = '#/login';
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown, .menu')) $$('.dropdown.open, .menu.open').forEach((m) => m.classList.remove('open'));
  });

  // ---------- Router ----------
  let renderId = 0;
  function ruta() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    return { partes: path.split('/').filter(Boolean), params: new URLSearchParams(qs || '') };
  }

  async function render() {
    const id = ++renderId;
    const { partes, params } = ruta();
    $$('.modal-backdrop').forEach((m) => m.remove());

    if (partes[0] === 'responder') return vistaResponder(partes[1], params.get('preview') === '1', id);
    if (!Sesion.usuario()) return vistaLogin();
    if (partes[0] === 'login') { location.hash = '#/formularios'; return; }

    if (partes[0] === 'editar' && partes[1]) {
      if (E && E.form.id !== partes[1]) await guardarSiHayCambios();
      return vistaEditor(partes[1], partes[2] || 'preguntas', id);
    }
    await guardarSiHayCambios();
    E = null;
    return vistaDashboard(id);
  }

  // ---------- Login ----------
  function vistaLogin() {
    document.title = `Iniciar sesión · ${window.CONFIG.NOMBRE}`;
    app.innerHTML = `
      <div class="auth">
        <section class="auth-brand">
          ${logo()}
          <div class="auth-copy">
            <p class="eyebrow">Portal para capacitadores</p>
            <h1>Crea, comparte y califica <span class="grad-text">evaluaciones</span> en minutos.</h1>
            <p class="muted">Diseña exámenes y formularios, comparte una liga y deja que la calificación se haga sola.</p>
            <ul class="features">
              <li><span>${ic('award')}</span>Exámenes con calificación automática</li>
              <li><span>${ic('link')}</span>Comparte con una liga, sin que se registren</li>
              <li><span>${ic('chart')}</span>Resultados y estadísticas al instante</li>
            </ul>
          </div>
          <div class="auth-preview" aria-hidden="true">
            <div class="ap-card">
              <div class="ap-line w60"></div>
              <div class="ap-opt"><span class="ap-dot on"></span><div class="ap-line w40"></div></div>
              <div class="ap-opt"><span class="ap-dot"></span><div class="ap-line w50"></div></div>
              <div class="ap-opt"><span class="ap-dot"></span><div class="ap-line w30"></div></div>
            </div>
            <div class="ap-score"><strong>92%</strong><span>Aprobado</span></div>
          </div>
        </section>
        <section class="auth-panel">
          <div class="auth-card">
            <div class="seg" role="tablist">
              <button type="button" class="seg-btn active" data-modo="login">Iniciar sesión</button>
              <button type="button" class="seg-btn" data-modo="registro">Crear cuenta</button>
              <span class="seg-ind"></span>
            </div>
            <div class="auth-head">
              <h2 id="authTitulo">Bienvenido de vuelta</h2>
              <p class="muted" id="authSub">Ingresa a tu cuenta de capacitador.</p>
            </div>
            <form id="authForm" novalidate>
              <label class="field solo-registro" hidden>
                <span>Nombre completo</span>
                <input name="nombre" autocomplete="name" placeholder="Ej. Ana López">
              </label>
              <label class="field">
                <span>Correo electrónico</span>
                <input name="email" type="email" autocomplete="email" placeholder="tu@correo.com" required>
              </label>
              <label class="field">
                <span>Contraseña</span>
                <input name="password" type="password" autocomplete="current-password" placeholder="••••••••" required minlength="6">
              </label>
              <p class="form-msg" id="authMsg" hidden></p>
              <button class="btn btn-primary btn-block btn-lg" id="authBtn">Entrar</button>
            </form>
            ${API.modoDemo ? `<p class="demo-note">${ic('sparkles')} Modo demo: los datos se guardan solo en este navegador.</p>` : ''}
          </div>
        </section>
      </div>`;

    let modo = 'login';
    const form = $('#authForm');
    const msg = $('#authMsg');
    const mostrarMsg = (t, tipo = 'err') => { msg.hidden = false; msg.className = `form-msg ${tipo}`; msg.textContent = t; };

    $$('.seg-btn').forEach((b) => b.addEventListener('click', () => {
      modo = b.dataset.modo;
      $$('.seg-btn').forEach((x) => x.classList.toggle('active', x === b));
      $('.seg').classList.toggle('der', modo === 'registro');
      $$('.solo-registro').forEach((x) => { x.hidden = modo !== 'registro'; });
      $('#authTitulo').textContent = modo === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta';
      $('#authSub').textContent = modo === 'login' ? 'Ingresa a tu cuenta de capacitador.' : 'Empieza a crear tus formularios y exámenes.';
      $('#authBtn').textContent = modo === 'login' ? 'Entrar' : 'Crear cuenta';
      form.password.autocomplete = modo === 'login' ? 'current-password' : 'new-password';
      msg.hidden = true;
    }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const datos = Object.fromEntries(new FormData(form));
      if (modo === 'registro' && !datos.nombre.trim()) return mostrarMsg('Escribe tu nombre.');
      if (!/^\S+@\S+\.\S+$/.test(datos.email)) return mostrarMsg('Escribe un correo válido.');
      if ((datos.password || '').length < 6) return mostrarMsg('La contraseña debe tener al menos 6 caracteres.');
      const btn = $('#authBtn');
      btn.disabled = true;
      btn.classList.add('loading');
      try {
        const s = await API.call(modo === 'login' ? 'login' : 'register', datos);
        Sesion.set(s);
        location.hash = '#/formularios';
        render();
      } catch (err) {
        mostrarMsg(err.message, err.info ? 'info' : 'err');
      } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    });
  }

  // ---------- Panel ----------
  let listaForms = [];

  async function vistaDashboard(id) {
    document.title = `Mis formularios · ${window.CONFIG.NOMBRE}`;
    const u = Sesion.usuario();
    app.innerHTML = `
      ${topbar()}
      <main class="container">
        <section class="hero">
          <p class="eyebrow">Panel del capacitador</p>
          <h1>Hola, <span class="grad-text">${esc(String(u.nombre).split(' ')[0])}</span></h1>
          <p class="muted">¿Qué vas a crear hoy?</p>
        </section>
        <section class="create-grid">
          <button class="create-card" data-crear="examen">
            <span class="cc-icon">${ic('award')}</span>
            <span class="cc-text"><strong>Nuevo examen</strong><small>Con puntos y calificación automática</small></span>
            <span class="cc-plus">${ic('plus')}</span>
          </button>
          <button class="create-card" data-crear="formulario">
            <span class="cc-icon alt">${ic('form')}</span>
            <span class="cc-text"><strong>Nuevo formulario</strong><small>Encuestas, registros y opiniones</small></span>
            <span class="cc-plus">${ic('plus')}</span>
          </button>
          <div class="create-card soon" aria-disabled="true">
            <span class="cc-icon muted-icon">${ic('book')}</span>
            <span class="cc-text"><strong>Contenido</strong><small>Sube materiales de capacitación</small></span>
            <span class="chip">Próximamente</span>
          </div>
        </section>
        <section>
          <div class="section-head">
            <h2>Mis formularios</h2>
            <label class="search">${ic('search')}<input id="buscar" placeholder="Buscar formularios" autocomplete="off"></label>
          </div>
          <div class="forms-grid" id="formsGrid">${'<div class="form-card skeleton"></div>'.repeat(3)}</div>
        </section>
      </main>`;
    enlazarTopbar();

    $$('[data-crear]').forEach((b) => b.addEventListener('click', () => crearForm(b.dataset.crear, b)));
    $('#buscar').addEventListener('input', pintarLista);

    try {
      const lista = await API.call('listForms');
      if (id !== renderId) return;
      listaForms = lista;
      pintarLista();
    } catch (err) {
      if (id !== renderId) return;
      $('#formsGrid').innerHTML = `<div class="empty">${ic('alert')}<p>${esc(err.message)}</p></div>`;
    }
  }

  function pintarLista() {
    const grid = $('#formsGrid');
    if (!grid) return;
    const q = normalizarTexto($('#buscar').value);
    const lista = listaForms.filter((f) => !q || normalizarTexto(f.titulo).includes(q));
    if (!listaForms.length) {
      grid.innerHTML = `
        <div class="empty">
          <div class="empty-art">${ic('sparkles')}</div>
          <h3>Aún no tienes formularios</h3>
          <p class="muted">Crea tu primer examen o formulario con los botones de arriba.</p>
        </div>`;
      return;
    }
    if (!lista.length) {
      grid.innerHTML = `<div class="empty"><p class="muted">No hay formularios que coincidan con “${esc($('#buscar').value)}”.</p></div>`;
      return;
    }
    grid.innerHTML = lista.map((f, i) => `
      <article class="form-card" data-id="${esc(f.id)}" style="--i:${i}">
        <a class="fc-cover ${f.esExamen ? 'examen' : 'encuesta'}" href="#/editar/${esc(f.id)}">
          <span class="fc-art">${ic(f.esExamen ? 'award' : 'form')}</span>
          <span class="chip chip-glass">${f.esExamen ? 'Examen' : 'Formulario'}</span>
          ${f.aceptaRespuestas ? '' : '<span class="chip chip-glass chip-closed">Cerrado</span>'}
        </a>
        <div class="fc-body">
          <a href="#/editar/${esc(f.id)}" class="fc-title">${esc(f.titulo || 'Sin título')}</a>
          <p class="fc-meta"><span>${ic('list')} ${f.numPreguntas} pregunta${f.numPreguntas === 1 ? '' : 's'}</span><span>${ic('users')} ${f.numRespuestas} respuesta${f.numRespuestas === 1 ? '' : 's'}</span></p>
          <p class="fc-date">${ic('clock')} Editado ${fechaRelativa(f.actualizado)}</p>
        </div>
        <div class="fc-menu">
          <button class="icon-btn" data-menu aria-label="Opciones">${ic('more')}</button>
          <div class="menu">
            <a class="dropdown-item" href="#/editar/${esc(f.id)}">${ic('form')} Abrir</a>
            <a class="dropdown-item" href="#/editar/${esc(f.id)}/respuestas">${ic('chart')} Ver respuestas</a>
            <button class="dropdown-item" data-fa="compartir">${ic('share')} Compartir</button>
            <button class="dropdown-item" data-fa="duplicar">${ic('copy')} Duplicar</button>
            <button class="dropdown-item danger" data-fa="eliminar">${ic('trash')} Eliminar</button>
          </div>
        </div>
      </article>`).join('');

    $$('[data-menu]', grid).forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const m = b.nextElementSibling;
      const abierto = m.classList.contains('open');
      $$('.menu.open').forEach((x) => x.classList.remove('open'));
      if (!abierto) m.classList.add('open');
    }));
    $$('[data-fa]', grid).forEach((b) => b.addEventListener('click', async () => {
      const id = b.closest('.form-card').dataset.id;
      const f = listaForms.find((x) => x.id === id);
      b.closest('.menu').classList.remove('open');
      if (b.dataset.fa === 'compartir') abrirCompartir(f.id);
      if (b.dataset.fa === 'duplicar') {
        try {
          const orig = await API.call('getForm', { id });
          const copia = clonar(orig);
          delete copia.id;
          copia.titulo = `${orig.titulo || 'Sin título'} (copia)`;
          await API.call('saveForm', { form: copia });
          toast('Formulario duplicado');
          listaForms = await API.call('listForms');
          pintarLista();
        } catch (err) { toast(err.message, 'err'); }
      }
      if (b.dataset.fa === 'eliminar') {
        const ok = await confirmar('¿Eliminar formulario?', `Se eliminará “${f.titulo || 'Sin título'}” junto con sus ${f.numRespuestas} respuestas. No se puede deshacer.`);
        if (!ok) return;
        try {
          await API.call('deleteForm', { id });
          listaForms = listaForms.filter((x) => x.id !== id);
          pintarLista();
          toast('Formulario eliminado');
        } catch (err) { toast(err.message, 'err'); }
      }
    }));
  }

  async function crearForm(tipo, btn) {
    btn.disabled = true;
    btn.classList.add('loading');
    const examen = tipo === 'examen';
    const form = {
      titulo: examen ? 'Examen sin título' : 'Formulario sin título',
      descripcion: '',
      config: Object.assign({}, CONFIG_BASE, { esExamen: examen }),
      preguntas: [nuevaPregunta('unica')]
    };
    try {
      const creado = await API.call('saveForm', { form });
      location.hash = `#/editar/${creado.id}`;
    } catch (err) {
      toast(err.message, 'err');
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }

  function abrirCompartir(id, extra = '') {
    const liga = ligaPublica(id);
    modal(`
      <button class="icon-btn modal-x" data-cerrar aria-label="Cerrar">${ic('x')}</button>
      <div class="modal-icon">${ic('share')}</div>
      <h3>Compartir formulario</h3>
      <p class="muted">Cualquier persona con esta liga puede responder, sin necesidad de cuenta.</p>
      <div class="copy-row">
        <span class="copy-ic">${ic('link')}</span>
        <input readonly value="${esc(liga)}" id="ligaInput">
        <button class="btn btn-primary" id="copiarLiga">${ic('copy')} Copiar</button>
      </div>
      ${extra}
      ${API.modoDemo ? `<p class="demo-note">${ic('alert')} En modo demo la liga solo funciona en este navegador. Configura Supabase para compartirla con otras personas.</p>` : ''}
      <div class="modal-actions">
        <a class="btn btn-ghost" href="${esc(liga)}" target="_blank" rel="noopener">${ic('external')} Abrir formulario</a>
      </div>`, (el) => {
      el.querySelector('#copiarLiga').addEventListener('click', () => copiar(liga));
      el.querySelector('#ligaInput').addEventListener('focus', (e) => e.target.select());
    });
  }

  // ---------- Editor ----------
  let E = null; // { form, tab, respuestas, sucio, timer, guardando }

  function setEstado(texto, tipo = '') {
    const el = $('#saveState');
    if (!el) return;
    el.className = `save-state ${tipo}`;
    el.innerHTML = `${tipo === 'ok' ? ic('check') : '<span class="dot"></span>'}${esc(texto)}`;
  }

  function programarGuardado() {
    if (!E) return;
    E.sucio = true;
    setEstado('Cambios sin guardar', 'pend');
    clearTimeout(E.timer);
    E.timer = setTimeout(() => guardar(), 800);
  }

  async function guardar() {
    const ed = E;
    if (!ed) return;
    clearTimeout(ed.timer);
    while (ed.guardando) await ed.guardando;
    if (!ed.sucio) return;
    ed.sucio = false;
    if (E === ed) setEstado('Guardando…', 'saving');
    ed.guardando = API.call('saveForm', { form: ed.form })
      .then(() => { if (!ed.sucio && E === ed) setEstado('Guardado', 'ok'); })
      .catch((err) => {
        ed.sucio = true;
        if (E === ed) setEstado('No se pudo guardar', 'err');
        toast(err.message, 'err');
      })
      .finally(() => { ed.guardando = null; });
    await ed.guardando;
  }

  async function guardarSiHayCambios() {
    if (E && (E.sucio || E.guardando)) await guardar();
  }

  window.addEventListener('beforeunload', (e) => {
    if (E && (E.sucio || E.guardando)) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  async function vistaEditor(id, tab, rid) {
    if (!['preguntas', 'respuestas', 'configuracion'].includes(tab)) tab = 'preguntas';
    if (!E || E.form.id !== id) {
      app.innerHTML = `${topbar()}<main class="container narrow"><div class="loader"><span></span></div></main>`;
      enlazarTopbar();
      try {
        const form = await API.call('getForm', { id });
        if (rid !== renderId) return;
        form.config = Object.assign({}, CONFIG_BASE, form.config || {});
        form.preguntas = form.preguntas || [];
        E = { form, tab, respuestas: null, sucio: false, timer: null, guardando: null };
      } catch (err) {
        if (rid !== renderId) return;
        app.innerHTML = `${topbar()}<main class="container narrow"><div class="empty">${ic('alert')}<h3>No se pudo abrir</h3><p class="muted">${esc(err.message)}</p><a class="btn btn-ghost" href="#/formularios">${ic('back')} Volver</a></div></main>`;
        enlazarTopbar();
        return;
      }
    }
    E.tab = tab;
    const f = E.form;
    document.title = `${f.titulo || 'Sin título'} · ${window.CONFIG.NOMBRE}`;
    const tabs = [['preguntas', 'list', 'Preguntas'], ['respuestas', 'chart', 'Respuestas'], ['configuracion', 'sliders', 'Configuración']];
    app.innerHTML = `
      <header class="topbar editor-bar">
        <div class="eb-left">
          <a class="icon-btn" href="#/formularios" aria-label="Volver">${ic('back')}</a>
          <div class="eb-title">
            <span class="eb-name" id="ebName">${esc(f.titulo || 'Sin título')}</span>
            <span class="save-state ok" id="saveState">${ic('check')}Guardado</span>
          </div>
        </div>
        <nav class="tabs">
          ${tabs.map(([k, i, n]) => `<a href="#/editar/${esc(f.id)}/${k}" class="tab ${k === tab ? 'active' : ''}">${ic(i)}<span>${n}</span></a>`).join('')}
        </nav>
        <div class="eb-actions">
          <a class="btn btn-ghost" href="${esc(ligaPublica(f.id))}?preview=1" target="_blank" rel="noopener" id="btnPreview">${ic('eye')}<span>Vista previa</span></a>
          <button class="btn btn-primary" id="btnCompartir">${ic('share')}<span>Compartir</span></button>
        </div>
      </header>
      <main class="container narrow editor" id="editorBody"></main>`;

    $('#btnCompartir').addEventListener('click', async () => {
      await guardarSiHayCambios();
      abrirCompartir(f.id, `
        <label class="switch-row">
          <span><strong>Aceptar respuestas</strong><small>Si lo desactivas, la liga mostrará que el formulario está cerrado.</small></span>
          <span class="switch"><input type="checkbox" id="swAcepta" ${f.config.aceptaRespuestas ? 'checked' : ''}><span class="sw"></span></span>
        </label>`);
      $('#swAcepta').addEventListener('change', (e) => {
        f.config.aceptaRespuestas = e.target.checked;
        programarGuardado();
        guardar();
      });
    });
    $('#btnPreview').addEventListener('click', () => guardarSiHayCambios());

    const cuerpo = $('#editorBody');
    if (tab === 'preguntas') pintarPreguntas();
    else if (tab === 'configuracion') pintarConfig();
    else pintarRespuestas(rid);

    cuerpo.addEventListener('input', onEditorInput);
    cuerpo.addEventListener('change', onEditorChange);
    cuerpo.addEventListener('click', onEditorClick);
  }

  const preguntaDe = (el) => {
    const card = el.closest('[data-qid]');
    return card ? E.form.preguntas.find((p) => p.id === card.dataset.qid) : null;
  };

  function onEditorInput(e) {
    const t = e.target;
    if (t.tagName === 'TEXTAREA') autoAltura(t);
    if (t.dataset.f) {
      E.form[t.dataset.f] = t.value;
      if (t.dataset.f === 'titulo') $('#ebName').textContent = t.value || 'Sin título';
      programarGuardado();
      return;
    }
    const p = preguntaDe(t);
    if (!p) return;
    if (t.dataset.q === 'texto') p.texto = t.value;
    else if (t.dataset.q === 'puntos') {
      p.puntos = Math.max(0, Number(t.value) || 0);
      actualizarTotal();
    } else if (t.dataset.q === 'aceptadas') {
      p.respuestasAceptadas = t.value.split('\n').map((x) => x.trim()).filter(Boolean);
      actualizarAviso(p);
    } else if (t.dataset.o === 'texto') {
      const o = p.opciones.find((x) => x.id === t.closest('[data-oid]').dataset.oid);
      if (o) o.texto = t.value;
    } else return;
    programarGuardado();
  }

  function onEditorChange(e) {
    const t = e.target;
    if (t.dataset.c) {
      const cfg = E.form.config;
      if (t.type === 'checkbox') cfg[t.dataset.c] = t.checked;
      else if (t.type === 'number') cfg[t.dataset.c] = Math.min(100, Math.max(0, Number(t.value) || 0));
      else cfg[t.dataset.c] = t.value;
      if (t.dataset.c === 'esExamen') pintarConfig();
      programarGuardado();
      return;
    }
    const p = preguntaDe(t);
    if (!p) return;
    if (t.dataset.q === 'tipo') {
      cambiarTipo(p, t.value);
      pintarPreguntas();
      programarGuardado();
    } else if (t.dataset.q === 'obligatoria') {
      p.obligatoria = t.checked;
      programarGuardado();
    }
  }

  function onEditorClick(e) {
    const b = e.target.closest('[data-qa]');
    if (!b) return;
    const lista = E.form.preguntas;
    const p = preguntaDe(b);
    const i = p ? lista.indexOf(p) : -1;
    const accion = b.dataset.qa;
    let enfocar = null;

    if (accion === 'agregar') {
      const nueva = nuevaPregunta(b.dataset.tipo);
      lista.push(nueva);
      enfocar = nueva.id;
      $('#tipoMenu') && $('#tipoMenu').classList.remove('open');
    } else if (accion === 'menuTipos') {
      e.stopPropagation();
      $('#tipoMenu').classList.toggle('open');
      return;
    } else if (accion === 'subir' && i > 0) {
      [lista[i - 1], lista[i]] = [lista[i], lista[i - 1]];
    } else if (accion === 'bajar' && i < lista.length - 1) {
      [lista[i + 1], lista[i]] = [lista[i], lista[i + 1]];
    } else if (accion === 'duplicar') {
      const copia = clonar(p);
      copia.id = uid();
      if (copia.tipo === 'unica' || copia.tipo === 'multiple') {
        const mapa = {};
        copia.opciones.forEach((o) => { const n = uid(); mapa[o.id] = n; o.id = n; });
        copia.correctas = copia.correctas.map((c) => mapa[c]);
      }
      lista.splice(i + 1, 0, copia);
    } else if (accion === 'eliminar') {
      lista.splice(i, 1);
    } else if (accion === 'correcta') {
      if (!E.form.config.esExamen) return;
      const oid = b.closest('[data-oid]').dataset.oid;
      if (p.tipo === 'multiple') {
        p.correctas = p.correctas.includes(oid) ? p.correctas.filter((x) => x !== oid) : p.correctas.concat(oid);
      } else {
        p.correctas = p.correctas[0] === oid ? [] : [oid];
      }
    } else if (accion === 'agregarOpcion') {
      const o = { id: uid(), texto: `Opción ${p.opciones.length + 1}` };
      p.opciones.push(o);
      enfocar = p.id + ':' + o.id;
    } else if (accion === 'quitarOpcion') {
      const oid = b.closest('[data-oid]').dataset.oid;
      p.opciones = p.opciones.filter((x) => x.id !== oid);
      p.correctas = p.correctas.filter((x) => x !== oid);
    } else return;

    pintarPreguntas();
    programarGuardado();
    if (enfocar) {
      const [qid, oid] = enfocar.split(':');
      const card = $(`[data-qid="${qid}"]`);
      if (!card) return;
      if (oid) {
        const inp = $(`[data-oid="${oid}"] input`, card);
        inp.focus();
        inp.select();
      } else {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('nuevo');
        setTimeout(() => $('[data-q="texto"]', card).focus({ preventScroll: true }), 250);
      }
    }
  }

  function totalPuntos() {
    return E.form.preguntas.filter(esCalificable).reduce((s, p) => s + (Number(p.puntos) || 0), 0);
  }
  function actualizarTotal() {
    const el = $('#totalPts');
    if (el) el.textContent = `${totalPuntos()} pts`;
  }
  function avisoPregunta(p) {
    if (!E.form.config.esExamen || p.tipo === 'parrafo') return '';
    if (esCalificable(p)) return `<span class="q-ok">${ic('check')} Respuesta configurada</span>`;
    return `<span class="q-warn">${ic('alert')} ${p.tipo === 'corta' ? 'Agrega al menos una respuesta aceptada' : 'Marca la respuesta correcta'}</span>`;
  }
  function actualizarAviso(p) {
    const el = $(`[data-qid="${p.id}"] .q-aviso`);
    if (el) el.innerHTML = avisoPregunta(p);
    actualizarTotal();
  }

  function tarjetaPregunta(p, i, total) {
    const examen = E.form.config.esExamen;
    let cuerpo = '';
    if (esOpciones(p.tipo)) {
      cuerpo = `<div class="opts">${p.opciones.map((o) => {
        const ok = examen && p.correctas.includes(o.id);
        return `
          <div class="opt ${ok ? 'is-correct' : ''}" data-oid="${esc(o.id)}">
            <button type="button" class="mark ${p.tipo === 'multiple' ? 'sq' : ''} ${examen ? '' : 'off'}" data-qa="correcta" title="${examen ? 'Marcar como correcta' : ''}" ${examen ? '' : 'tabindex="-1"'}>${ic('check')}</button>
            <input class="opt-input" data-o="texto" value="${esc(o.texto)}" ${p.tipo === 'vf' ? 'readonly' : ''} placeholder="Opción">
            ${ok ? '<span class="chip chip-ok">Correcta</span>' : ''}
            ${p.tipo !== 'vf' && p.opciones.length > 1 ? `<button type="button" class="icon-btn sm" data-qa="quitarOpcion" aria-label="Quitar opción">${ic('x')}</button>` : ''}
          </div>`;
      }).join('')}</div>
      ${p.tipo !== 'vf' ? `<button type="button" class="link-btn" data-qa="agregarOpcion">${ic('plus')} Agregar opción</button>` : ''}`;
    } else if (p.tipo === 'corta') {
      cuerpo = `<div class="fake-input">Respuesta corta del participante</div>
        ${examen ? `<label class="field compact"><span>Respuestas aceptadas <small>(una por línea; no distingue mayúsculas ni acentos)</small></span>
          <textarea data-q="aceptadas" rows="2" placeholder="Ej. Ciudad de México">${esc(p.respuestasAceptadas.join('\n'))}</textarea></label>` : ''}`;
    } else {
      cuerpo = `<div class="fake-input tall">Respuesta larga del participante</div>
        ${examen ? '<p class="hint">Las preguntas de párrafo no se califican automáticamente.</p>' : ''}`;
    }
    return `
      <article class="q-card" data-qid="${esc(p.id)}" style="--i:${i}">
        <div class="q-top">
          <span class="q-num">${i + 1}</span>
          <label class="select">
            ${ic(TIPOS[p.tipo].icono)}
            <select data-q="tipo" aria-label="Tipo de pregunta">
              ${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}" ${k === p.tipo ? 'selected' : ''}>${t.nombre}</option>`).join('')}
            </select>
            ${ic('down', 'chev')}
          </label>
          ${examen && p.tipo !== 'parrafo' ? `<label class="pts"><input type="number" min="0" step="1" data-q="puntos" value="${Number(p.puntos) || 0}" aria-label="Puntos"><span>pts</span></label>` : ''}
        </div>
        <textarea class="q-text" data-q="texto" rows="1" placeholder="Escribe la pregunta">${esc(p.texto)}</textarea>
        <div class="q-body">${cuerpo}</div>
        <div class="q-foot">
          <span class="q-aviso">${avisoPregunta(p)}</span>
          <div class="q-tools">
            <label class="switch sm" title="Obligatoria"><input type="checkbox" data-q="obligatoria" ${p.obligatoria ? 'checked' : ''}><span class="sw"></span><span class="sw-label">Obligatoria</span></label>
            <span class="sep"></span>
            <button type="button" class="icon-btn" data-qa="subir" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${ic('up')}</button>
            <button type="button" class="icon-btn" data-qa="bajar" ${i === total - 1 ? 'disabled' : ''} aria-label="Bajar">${ic('down')}</button>
            <button type="button" class="icon-btn" data-qa="duplicar" aria-label="Duplicar">${ic('copy')}</button>
            <button type="button" class="icon-btn danger" data-qa="eliminar" aria-label="Eliminar">${ic('trash')}</button>
          </div>
        </div>
      </article>`;
  }

  function pintarPreguntas() {
    const f = E.form;
    const cuerpo = $('#editorBody');
    const scroll = window.scrollY;
    cuerpo.innerHTML = `
      <section class="q-card header-card">
        <input class="title-input" data-f="titulo" value="${esc(f.titulo)}" placeholder="Formulario sin título" aria-label="Título">
        <textarea class="desc-input" data-f="descripcion" rows="1" placeholder="Agrega una descripción (opcional)">${esc(f.descripcion)}</textarea>
        <div class="header-meta">
          <span class="chip ${f.config.esExamen ? 'chip-accent' : ''}">${ic(f.config.esExamen ? 'award' : 'form')} ${f.config.esExamen ? 'Examen' : 'Formulario'}</span>
          <span class="chip">${ic('list')} ${f.preguntas.length} pregunta${f.preguntas.length === 1 ? '' : 's'}</span>
          ${f.config.esExamen ? `<span class="chip">${ic('target')} <span id="totalPts">${totalPuntos()} pts</span></span>` : ''}
        </div>
      </section>
      <div class="q-list">
        ${f.preguntas.length ? f.preguntas.map((p, i) => tarjetaPregunta(p, i, f.preguntas.length)).join('') : `<div class="empty small"><p class="muted">Este formulario no tiene preguntas todavía.</p></div>`}
      </div>
      <div class="add-q">
        <button type="button" class="btn btn-add" data-qa="menuTipos">${ic('plus')} Agregar pregunta</button>
        <div class="type-menu" id="tipoMenu">
          ${Object.entries(TIPOS).map(([k, t]) => `<button type="button" class="type-opt" data-qa="agregar" data-tipo="${k}">${ic(t.icono)}<span>${t.nombre}</span></button>`).join('')}
        </div>
      </div>`;
    $$('textarea', cuerpo).forEach(autoAltura);
    window.scrollTo(0, scroll);
  }

  function pintarConfig() {
    const c = E.form.config;
    const fila = (k, t, d, deshabilitado = false) => `
      <label class="switch-row ${deshabilitado ? 'disabled' : ''}">
        <span><strong>${t}</strong>${d ? `<small>${d}</small>` : ''}</span>
        <span class="switch"><input type="checkbox" data-c="${k}" ${c[k] ? 'checked' : ''} ${deshabilitado ? 'disabled' : ''}><span class="sw"></span></span>
      </label>`;
    $('#editorBody').innerHTML = `
      <section class="panel">
        <h3>${ic('award')} Calificación</h3>
        ${fila('esExamen', 'Calificar automáticamente', 'Convierte el formulario en examen: asigna puntos y marca las respuestas correctas.')}
        ${fila('mostrarResultados', 'Mostrar calificación al enviar', 'El participante ve su puntaje al terminar.', !c.esExamen)}
        ${fila('mostrarCorrectas', 'Mostrar respuestas correctas', 'Después de enviar, se muestra qué contestó bien y mal.', !c.esExamen || !c.mostrarResultados)}
        <div class="switch-row ${c.esExamen ? '' : 'disabled'}">
          <span><strong>Calificación aprobatoria</strong><small>Porcentaje mínimo para aprobar.</small></span>
          <label class="pts wide"><input type="number" min="0" max="100" data-c="aprobatorio" value="${Number(c.aprobatorio) || 0}" ${c.esExamen ? '' : 'disabled'}><span>%</span></label>
        </div>
      </section>
      <section class="panel">
        <h3>${ic('users')} Respuestas</h3>
        ${fila('aceptaRespuestas', 'Aceptar respuestas', 'Si lo desactivas, la liga mostrará que el formulario está cerrado.')}
        ${fila('pedirNombre', 'Pedir nombre', 'Se pide el nombre completo antes de responder.')}
        ${fila('pedirCorreo', 'Pedir correo electrónico', '')}
        ${fila('mezclarPreguntas', 'Mezclar el orden de las preguntas', 'Cada participante ve las preguntas en distinto orden.')}
      </section>
      <section class="panel">
        <h3>${ic('sparkles')} Mensaje final</h3>
        <label class="field compact"><span>Se muestra al enviar el formulario</span>
          <textarea data-c="mensajeFinal" rows="2" placeholder="¡Gracias por responder!">${esc(c.mensajeFinal)}</textarea></label>
      </section>`;
    const msg = $('[data-c="mensajeFinal"]');
    autoAltura(msg);
    msg.addEventListener('input', () => { c.mensajeFinal = msg.value; programarGuardado(); });
  }

  // ---------- Respuestas ----------
  function textoRespuesta(p, r) {
    if (r == null || (Array.isArray(r) && !r.length) || r === '') return '<span class="muted">Sin respuesta</span>';
    if (esOpciones(p.tipo)) {
      const ids = Array.isArray(r) ? r : [r];
      return ids.map((id) => {
        const o = p.opciones.find((x) => x.id === id);
        return o ? esc(o.texto) : '<span class="muted">(opción eliminada)</span>';
      }).join(', ');
    }
    return esc(r);
  }

  async function pintarRespuestas(rid) {
    const cuerpo = $('#editorBody');
    cuerpo.innerHTML = '<div class="loader"><span></span></div>';
    let lista;
    try {
      lista = await API.call('listResponses', { id: E.form.id });
    } catch (err) {
      if (rid !== renderId) return;
      cuerpo.innerHTML = `<div class="empty">${ic('alert')}<p>${esc(err.message)}</p></div>`;
      return;
    }
    if (rid !== renderId) return;
    E.respuestas = lista;
    const f = E.form;
    const calificadas = lista.filter((r) => r.calificado);
    const prom = calificadas.length ? calificadas.reduce((s, r) => s + r.porcentaje, 0) / calificadas.length : 0;
    const aprob = calificadas.filter((r) => r.aprobado).length;
    const mejor = calificadas.length ? Math.max(...calificadas.map((r) => r.porcentaje)) : 0;

    const stat = (icono, valor, etiqueta, cls = '') => `<div class="stat ${cls}"><span class="stat-ic">${ic(icono)}</span><strong>${valor}</strong><span>${etiqueta}</span></div>`;

    const barra = (etiqueta, n, total, ok) => {
      const pct = total ? Math.round(n / total * 100) : 0;
      return `<div class="bar-row ${ok ? 'ok' : ''}"><div class="bar-label"><span>${etiqueta}${ok ? ` ${ic('check')}` : ''}</span><span>${n} · ${pct}%</span></div><div class="bar"><span style="--w:${pct}%"></span></div></div>`;
    };

    const resumen = f.preguntas.map((p, i) => {
      const resp = lista.map((r) => r.respuestas[p.id]).filter((r) => r != null && r !== '' && !(Array.isArray(r) && !r.length));
      let contenido;
      if (esOpciones(p.tipo)) {
        contenido = p.opciones.map((o) => {
          const n = resp.filter((r) => (Array.isArray(r) ? r.includes(o.id) : r === o.id)).length;
          return barra(esc(o.texto), n, resp.length, f.config.esExamen && p.correctas.includes(o.id));
        }).join('');
      } else {
        contenido = resp.length
          ? `<ul class="text-answers">${resp.slice(0, 8).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>${resp.length > 8 ? `<p class="hint">y ${resp.length - 8} más…</p>` : ''}`
          : '<p class="muted">Sin respuestas todavía.</p>';
      }
      let aciertos = '';
      if (f.config.esExamen && esCalificable(p) && lista.length) {
        const ok = lista.filter((r) => (r.detalle || []).some((d) => d.id === p.id && d.correcta)).length;
        aciertos = `<span class="chip">${Math.round(ok / lista.length * 100)}% acertó</span>`;
      }
      return `<div class="panel q-summary"><div class="qs-head"><span class="q-num">${i + 1}</span><strong>${esc(p.texto || 'Pregunta sin texto')}</strong>${aciertos}</div><p class="hint">${resp.length} respuesta${resp.length === 1 ? '' : 's'}</p>${contenido}</div>`;
    }).join('');

    cuerpo.innerHTML = `
      <div class="resp-head">
        <label class="switch-row inline">
          <span class="switch"><input type="checkbox" id="swAcepta2" ${f.config.aceptaRespuestas ? 'checked' : ''}><span class="sw"></span></span>
          <span><strong>${f.config.aceptaRespuestas ? 'Aceptando respuestas' : 'No acepta respuestas'}</strong></span>
        </label>
        <button class="btn btn-ghost" id="btnCsv" ${lista.length ? '' : 'disabled'}>${ic('download')} Exportar CSV</button>
      </div>
      <div class="stats">
        ${stat('users', lista.length, 'Respuestas')}
        ${f.config.esExamen ? stat('target', `${Math.round(prom)}%`, 'Promedio') + stat('trophy', `${calificadas.length ? Math.round(aprob / calificadas.length * 100) : 0}%`, 'Aprobaron', 'ok') + stat('sparkles', `${Math.round(mejor)}%`, 'Mejor calificación') : ''}
      </div>
      ${lista.length ? `
        <section class="panel">
          <h3>${ic('users')} Respuestas individuales</h3>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Participante</th><th>Fecha</th>${f.config.esExamen ? '<th>Calificación</th><th>Estado</th>' : ''}<th></th></tr></thead>
              <tbody>
                ${lista.map((r) => `
                  <tr data-rid="${esc(r.id)}" tabindex="0">
                    <td><div class="person"><span class="avatar sm">${esc(iniciales(r.nombre || r.correo || 'Anónimo'))}</span><span><strong>${esc(r.nombre || 'Anónimo')}</strong>${r.correo ? `<small>${esc(r.correo)}</small>` : ''}</span></div></td>
                    <td class="muted">${fechaCompleta(r.fecha)}</td>
                    ${f.config.esExamen ? `<td><strong>${r.puntaje}</strong><span class="muted"> / ${r.maximo}</span> <span class="muted">(${Math.round(r.porcentaje)}%)</span></td>
                    <td>${r.calificado ? `<span class="chip ${r.aprobado ? 'chip-ok' : 'chip-bad'}">${r.aprobado ? 'Aprobado' : 'No aprobado'}</span>` : '<span class="chip">Sin calificar</span>'}</td>` : ''}
                    <td class="right"><button class="icon-btn danger" data-borrar aria-label="Eliminar respuesta">${ic('trash')}</button></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </section>
        <h3 class="section-title">${ic('chart')} Resumen por pregunta</h3>
        ${resumen}` : `
        <div class="empty">
          <div class="empty-art">${ic('share')}</div>
          <h3>Aún no hay respuestas</h3>
          <p class="muted">Comparte la liga para empezar a recibir respuestas.</p>
          <button class="btn btn-primary" id="btnCompartir2">${ic('share')} Compartir</button>
        </div>`}`;

    $('#swAcepta2').addEventListener('change', (e) => {
      f.config.aceptaRespuestas = e.target.checked;
      e.target.closest('.switch-row').querySelector('strong').textContent = e.target.checked ? 'Aceptando respuestas' : 'No acepta respuestas';
      programarGuardado();
    });
    const b2 = $('#btnCompartir2');
    if (b2) b2.addEventListener('click', () => $('#btnCompartir').click());
    $('#btnCsv').addEventListener('click', () => exportarCsv(lista));
    $$('tr[data-rid]').forEach((tr) => {
      const abrir = () => verRespuesta(lista.find((r) => r.id === tr.dataset.rid));
      tr.addEventListener('click', (e) => { if (!e.target.closest('[data-borrar]')) abrir(); });
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') abrir(); });
      $('[data-borrar]', tr).addEventListener('click', async () => {
        const ok = await confirmar('¿Eliminar respuesta?', 'Esta respuesta se eliminará de forma permanente.');
        if (!ok) return;
        try {
          await API.call('deleteResponse', { id: tr.dataset.rid });
          toast('Respuesta eliminada');
          pintarRespuestas(renderId);
        } catch (err) { toast(err.message, 'err'); }
      });
    });
  }

  function verRespuesta(r) {
    const f = E.form;
    const detalle = {};
    (r.detalle || []).forEach((d) => { detalle[d.id] = d; });
    modal(`
      <button class="icon-btn modal-x" data-cerrar aria-label="Cerrar">${ic('x')}</button>
      <div class="resp-detail-head">
        <span class="avatar">${esc(iniciales(r.nombre || r.correo || 'Anónimo'))}</span>
        <div><h3>${esc(r.nombre || 'Anónimo')}</h3><p class="muted">${r.correo ? esc(r.correo) + ' · ' : ''}${fechaCompleta(r.fecha)}</p></div>
        ${r.calificado ? `<div class="score-pill ${r.aprobado ? 'ok' : 'bad'}"><strong>${Math.round(r.porcentaje)}%</strong><span>${r.puntaje}/${r.maximo} pts</span></div>` : ''}
      </div>
      <div class="resp-detail">
        ${f.preguntas.map((p, i) => {
          const d = detalle[p.id];
          const estado = d && d.correcta !== null ? (d.correcta ? 'ok' : 'bad') : '';
          return `<div class="rd-item ${estado}">
            <div class="rd-q"><span class="q-num">${i + 1}</span><strong>${esc(p.texto || 'Pregunta sin texto')}</strong>${d && d.correcta !== null ? `<span class="rd-pts">${d.obtenidos}/${d.puntos}</span>` : ''}</div>
            <div class="rd-a">${estado ? ic(estado === 'ok' ? 'check' : 'x') : ''}<span>${textoRespuesta(p, r.respuestas[p.id])}</span></div>
          </div>`;
        }).join('')}
      </div>`);
    $('.modal-card').classList.add('wide');
  }

  function exportarCsv(lista) {
    const f = E.form;
    const celda = (v) => {
      let s = String(v == null ? '' : v);
      if (/^[=+\-@]/.test(s)) s = "'" + s;
      return `"${s.replace(/"/g, '""')}"`;
    };
    const plano = (p, r) => {
      if (r == null) return '';
      if (esOpciones(p.tipo)) return (Array.isArray(r) ? r : [r]).map((id) => (p.opciones.find((o) => o.id === id) || {}).texto || '').join('; ');
      return r;
    };
    const enc = ['Fecha', 'Nombre', 'Correo'];
    if (f.config.esExamen) enc.push('Puntaje', 'Máximo', 'Porcentaje', 'Aprobado');
    f.preguntas.forEach((p, i) => enc.push(`${i + 1}. ${p.texto}`));
    const filas = lista.map((r) => {
      const fila = [fechaCompleta(r.fecha), r.nombre, r.correo];
      if (f.config.esExamen) fila.push(r.puntaje, r.maximo, r.porcentaje, r.calificado ? (r.aprobado ? 'Sí' : 'No') : '');
      f.preguntas.forEach((p) => fila.push(plano(p, r.respuestas[p.id])));
      return fila.map(celda).join(',');
    });
    const csv = '﻿' + [enc.map(celda).join(','), ...filas].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `${(f.titulo || 'respuestas').replace(/[\\/:*?"<>|]/g, '')}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- Responder (público) ----------
  async function vistaResponder(id, preview, rid) {
    E = null;
    app.innerHTML = `<div class="public"><header class="public-bar">${logo()}</header><main class="container narrow"><div class="loader"><span></span></div></main></div>`;
    let form;
    try {
      form = await API.call('getPublicForm', { id, preview });
    } catch (err) {
      if (rid !== renderId) return;
      return pintarPublico(`<div class="result-card">${ic('alert', 'big muted')}<h2>No disponible</h2><p class="muted">${esc(err.message)}</p></div>`);
    }
    if (rid !== renderId) return;
    document.title = `${form.titulo || 'Formulario'} · ${window.CONFIG.NOMBRE}`;
    if (form.cerrado) {
      return pintarPublico(`<div class="result-card"><div class="result-icon muted-icon">${ic('clock')}</div><h2>${esc(form.titulo || 'Formulario')}</h2><p class="muted">Este formulario ya no acepta respuestas. Si crees que es un error, contacta a tu capacitador.</p></div>`);
    }

    const preguntas = form.config.mezclarPreguntas ? mezclar(form.preguntas.slice()) : form.preguntas;
    const total = preguntas.reduce((s, p) => s + (Number(p.puntos) || 0), 0);
    const hayObligatorias = preguntas.some((p) => p.obligatoria) || form.config.pedirNombre || form.config.pedirCorreo;

    const campo = (p, i) => {
      let entrada;
      if (esOpciones(p.tipo)) {
        const tipo = p.tipo === 'multiple' ? 'checkbox' : 'radio';
        entrada = `<div class="choices ${p.tipo === 'vf' ? 'row' : ''}">${p.opciones.map((o) => `
          <label class="choice">
            <input type="${tipo}" name="q_${esc(p.id)}" value="${esc(o.id)}">
            <span class="ind ${tipo}">${ic('check')}</span>
            <span>${esc(o.texto)}</span>
          </label>`).join('')}</div>`;
      } else if (p.tipo === 'corta') {
        entrada = `<input class="answer-input" name="q_${esc(p.id)}" placeholder="Tu respuesta" autocomplete="off">`;
      } else {
        entrada = `<textarea class="answer-input" name="q_${esc(p.id)}" rows="3" placeholder="Tu respuesta"></textarea>`;
      }
      return `
        <section class="q-card public-q" data-pid="${esc(p.id)}" style="--i:${i}">
          <div class="pq-head">
            <span class="q-num">${i + 1}</span>
            <h3>${esc(p.texto || 'Pregunta')}${p.obligatoria ? '<span class="req">*</span>' : ''}</h3>
            ${p.puntos ? `<span class="chip">${p.puntos} pt${p.puntos === 1 ? '' : 's'}</span>` : ''}
          </div>
          ${p.tipo === 'multiple' ? '<p class="hint">Selecciona todas las que apliquen.</p>' : ''}
          ${entrada}
          <p class="q-error">${ic('alert')} Esta pregunta es obligatoria.</p>
        </section>`;
    };

    pintarPublico(`
      <section class="pf-hero">
        <h1>${esc(form.titulo || 'Formulario')}</h1>
        ${form.descripcion ? `<p>${esc(form.descripcion).replace(/\n/g, '<br>')}</p>` : ''}
        <div class="pf-meta">
          <span class="chip chip-glass">${ic('list')} ${preguntas.length} pregunta${preguntas.length === 1 ? '' : 's'}</span>
          ${form.config.esExamen && total ? `<span class="chip chip-glass">${ic('target')} ${total} puntos</span>` : ''}
        </div>
        ${hayObligatorias ? '<p class="req-note"><span class="req">*</span> Obligatorio</p>' : ''}
      </section>
      <form id="pf" novalidate>
        ${form.config.pedirNombre || form.config.pedirCorreo ? `
          <section class="q-card public-q" data-pid="__datos">
            ${form.config.pedirNombre ? `<label class="field"><span>Nombre completo <span class="req">*</span></span><input name="nombre" autocomplete="name" placeholder="Tu nombre"></label>` : ''}
            ${form.config.pedirCorreo ? `<label class="field"><span>Correo electrónico <span class="req">*</span></span><input name="correo" type="email" autocomplete="email" placeholder="tu@correo.com"></label>` : ''}
            <p class="q-error">${ic('alert')} Completa tus datos.</p>
          </section>` : ''}
        ${preguntas.map(campo).join('')}
        <div class="pf-actions">
          <button class="btn btn-primary btn-lg" id="btnEnviar">Enviar respuestas</button>
        </div>
      </form>`, preview);

    const formEl = $('#pf');
    formEl.addEventListener('input', (e) => {
      const card = e.target.closest('.public-q');
      if (card) card.classList.remove('invalid');
    });
    formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      const respuestas = {};
      const invalidas = [];
      preguntas.forEach((p) => {
        const nombre = `q_${p.id}`;
        let r;
        if (p.tipo === 'multiple') r = $$(`[name="${CSS.escape(nombre)}"]:checked`, formEl).map((x) => x.value);
        else if (esOpciones(p.tipo)) r = ($(`[name="${CSS.escape(nombre)}"]:checked`, formEl) || {}).value;
        else r = (formEl.elements[nombre] || {}).value || '';
        const vacio = r == null || (Array.isArray(r) ? !r.length : !String(r).trim());
        if (!vacio) respuestas[p.id] = Array.isArray(r) ? r : String(r).trim() === '' ? undefined : r;
        if (p.obligatoria && vacio) invalidas.push(p.id);
      });
      const nombre = formEl.elements.nombre ? formEl.elements.nombre.value.trim() : '';
      const correo = formEl.elements.correo ? formEl.elements.correo.value.trim() : '';
      if ((form.config.pedirNombre && !nombre) || (form.config.pedirCorreo && !/^\S+@\S+\.\S+$/.test(correo))) invalidas.unshift('__datos');

      $$('.public-q').forEach((c) => c.classList.toggle('invalid', invalidas.includes(c.dataset.pid)));
      if (invalidas.length) {
        $(`[data-pid="${CSS.escape(invalidas[0])}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      const btn = $('#btnEnviar');
      btn.disabled = true;
      btn.classList.add('loading');
      try {
        const res = await API.call('submit', { id, nombre, correo, respuestas, preview });
        mostrarResultado(form, preguntas, respuestas, res, preview);
      } catch (err) {
        toast(err.message, 'err');
        btn.disabled = false;
        btn.classList.remove('loading');
      }
    });
  }

  function pintarPublico(html, preview) {
    app.innerHTML = `
      <div class="public">
        <header class="public-bar">${logo()}</header>
        ${preview ? `<div class="preview-banner">${ic('eye')} Vista previa · las respuestas no se guardan</div>` : ''}
        <main class="container narrow">${html}</main>
      </div>`;
    window.scrollTo(0, 0);
  }

  function mezclar(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mostrarResultado(form, preguntas, respuestas, res, preview) {
    let html;
    if (res.calificado) {
      const pct = Math.round(res.porcentaje);
      const c = 2 * Math.PI * 54;
      html = `
        <div class="result-card">
          <div class="ring ${res.aprobado ? 'ok' : 'bad'}">
            <svg viewBox="0 0 120 120"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#d946ef"/></linearGradient></defs>
              <circle cx="60" cy="60" r="54" class="ring-bg"/>
              <circle cx="60" cy="60" r="54" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c}" style="--off:${c * (1 - pct / 100)}"/></svg>
            <div class="ring-text"><strong data-count="${pct}">0%</strong><span>${res.puntaje} / ${res.maximo} pts</span></div>
          </div>
          <span class="chip big ${res.aprobado ? 'chip-ok' : 'chip-bad'}">${ic(res.aprobado ? 'trophy' : 'alert')} ${res.aprobado ? '¡Aprobado!' : 'No aprobado'}</span>
          <h2>${esc(form.titulo || 'Formulario')}</h2>
          <p class="muted">${esc(res.mensaje || (res.aprobado ? '¡Excelente trabajo!' : 'Sigue practicando, ¡tú puedes!'))}</p>
        </div>`;
      if (res.revision) {
        const rev = {};
        res.revision.forEach((d) => { rev[d.id] = d; });
        html += `<h3 class="section-title">${ic('list')} Revisión</h3>` + preguntas.map((p, i) => {
          const d = rev[p.id];
          const estado = d && d.correcta !== null ? (d.correcta ? 'ok' : 'bad') : '';
          let correcta = '';
          if (d && d.correcta === false && d.clave) {
            correcta = esOpciones(p.tipo)
              ? d.clave.map((cid) => esc((p.opciones.find((o) => o.id === cid) || {}).texto || '')).join(', ')
              : d.clave.map(esc).join(' / ');
          }
          return `<div class="rd-item panel ${estado}" style="--i:${i}">
            <div class="rd-q"><span class="q-num">${i + 1}</span><strong>${esc(p.texto || 'Pregunta')}</strong>${d && d.correcta !== null ? `<span class="rd-pts">${d.obtenidos}/${d.puntos}</span>` : ''}</div>
            <div class="rd-a">${estado ? ic(estado === 'ok' ? 'check' : 'x') : ''}<span>${textoRespuesta(p, respuestas[p.id])}</span></div>
            ${correcta ? `<div class="rd-correct">${ic('check')} Respuesta correcta: <strong>${correcta}</strong></div>` : ''}
          </div>`;
        }).join('');
      }
    } else {
      html = `
        <div class="result-card">
          <div class="result-icon">${ic('check')}</div>
          <h2>¡Respuesta enviada!</h2>
          <p class="muted">${esc(res.mensaje || 'Gracias por responder.')}</p>
        </div>`;
    }
    html += `<div class="pf-actions center"><button class="btn btn-ghost" id="otraVez">Enviar otra respuesta</button></div>`;
    pintarPublico(html, preview);
    $('#otraVez').addEventListener('click', () => render());

    const fg = $('.ring-fg');
    if (fg) {
      requestAnimationFrame(() => requestAnimationFrame(() => { fg.style.strokeDashoffset = 'var(--off)'; }));
      const el = $('[data-count]');
      const meta = Number(el.dataset.count);
      const t0 = performance.now();
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / 1200);
        el.textContent = `${Math.round(meta * (1 - Math.pow(1 - k, 3)))}%`;
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }
  }

  // ---------- Inicio ----------
  window.addEventListener('hashchange', render);
  // Regreso desde el correo de confirmación de Supabase: la liga trae datos en el hash.
  const hashInicial = location.hash;
  API.iniciar().finally(() => {
    if (/access_token=|error_description=/.test(hashInicial)) {
      const err = new URLSearchParams(hashInicial.replace(/^#\/?/, '')).get('error_description');
      history.replaceState(null, '', location.pathname + '#/formularios');
      if (err) toast('La liga de confirmación ya no es válida. Inicia sesión o regístrate de nuevo.', 'err');
      else if (Sesion.usuario()) toast('¡Cuenta confirmada!');
    }
    render();
  });
})();
