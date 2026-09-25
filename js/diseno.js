// Plantillas de diseño, tipos de letra y tamaños para la página que ven los participantes.
const Diseno = (() => {
  const oscuro = { modo: 'oscuro', texto: '#f3f0ff', muted: '#a39db8', dim: '#6d6784', card: 'rgba(16, 13, 26, 0.72)', borde: 'rgba(255, 255, 255, 0.09)', input: 'rgba(0, 0, 0, 0.35)', suave: 'rgba(255, 255, 255, 0.04)' };
  const claro = { modo: 'claro', texto: '#1c1530', muted: '#5f5876', dim: '#8f88a6', card: 'rgba(255, 255, 255, 0.92)', borde: 'rgba(28, 21, 48, 0.1)', input: 'rgba(28, 21, 48, 0.04)', suave: 'rgba(28, 21, 48, 0.03)' };

  const PLANTILLAS = {
    aurora: Object.assign({}, oscuro, { nombre: 'Aurora', fondo: '#07060d', a1: '#7c3aed', a2: '#c026d3', hero: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #86198f 100%)' }),
    galaxia: Object.assign({}, oscuro, { nombre: 'Galaxia', fondo: '#05040a', a1: '#6366f1', a2: '#a855f7', hero: 'radial-gradient(1.5px 1.5px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 20%, #fff, transparent), radial-gradient(1.5px 1.5px at 85% 70%, #e9d5ff, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent), radial-gradient(120% 140% at 100% 0%, #4c1d95 0%, #1e1b4b 45%, #0b0820 100%)' }),
    neon: Object.assign({}, oscuro, { nombre: 'Neón', fondo: '#040407', a1: '#db2777', a2: '#9333ea', hero: 'linear-gradient(rgba(236, 72, 153, 0.25) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(90deg, rgba(236, 72, 153, 0.25) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(135deg, #1a0526, #4a044e 60%, #831843)' }),
    medianoche: Object.assign({}, oscuro, { nombre: 'Medianoche', fondo: '#060712', a1: '#4f46e5', a2: '#7c3aed', hero: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)' }),
    atardecer: Object.assign({}, oscuro, { nombre: 'Atardecer', fondo: '#0c0608', a1: '#f97316', a2: '#db2777', hero: 'linear-gradient(135deg, #7c2d12 0%, #9d174d 60%, #581c87 100%)' }),
    oceano: Object.assign({}, oscuro, { nombre: 'Océano', fondo: '#040a10', a1: '#0891b2', a2: '#6366f1', hero: 'linear-gradient(135deg, #083344 0%, #164e63 45%, #1e3a8a 100%)' }),
    bosque: Object.assign({}, oscuro, { nombre: 'Bosque', fondo: '#040a07', a1: '#059669', a2: '#0d9488', hero: 'linear-gradient(135deg, #022c22 0%, #064e3b 55%, #134e4a 100%)' }),
    grafito: Object.assign({}, oscuro, { nombre: 'Grafito', fondo: '#0a0a0b', a1: '#a855f7', a2: '#a855f7', hero: 'linear-gradient(135deg, #18181b, #27272a)' }),
    lavanda: Object.assign({}, claro, { nombre: 'Lavanda', fondo: '#f4f1ff', a1: '#7c3aed', a2: '#c026d3', hero: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 55%, #d946ef 100%)' }),
    papel: Object.assign({}, claro, { nombre: 'Papel', fondo: '#f7f3ec', a1: '#6d28d9', a2: '#9333ea', card: '#fffdf9', hero: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.06) 0 10px, transparent 10px 20px), linear-gradient(135deg, #3b0764, #6d28d9)' }),
    menta: Object.assign({}, claro, { nombre: 'Menta', fondo: '#effaf6', a1: '#059669', a2: '#0891b2', hero: 'linear-gradient(135deg, #047857, #0891b2)' }),
    durazno: Object.assign({}, claro, { nombre: 'Durazno', fondo: '#fff5f0', a1: '#ea580c', a2: '#db2777', hero: 'linear-gradient(135deg, #f97316, #db2777)' })
  };

  const FUENTES = [
    { nombre: 'Plus Jakarta Sans', pesos: '400;500;600;700;800', estilo: 'Moderna' },
    { nombre: 'Inter', pesos: '400;500;600;700;800', estilo: 'Neutra' },
    { nombre: 'Poppins', pesos: '400;500;600;700;800', estilo: 'Geométrica' },
    { nombre: 'Montserrat', pesos: '400;500;600;700;800', estilo: 'Elegante' },
    { nombre: 'Outfit', pesos: '400;500;600;700;800', estilo: 'Limpia' },
    { nombre: 'Space Grotesk', pesos: '400;500;600;700', estilo: 'Tecnológica' },
    { nombre: 'Nunito', pesos: '400;600;700;800', estilo: 'Amigable' },
    { nombre: 'Playfair Display', pesos: '400;500;600;700;800', estilo: 'Clásica' },
    { nombre: 'Lora', pesos: '400;500;600;700', estilo: 'Editorial' },
    { nombre: 'Merriweather', pesos: '400;700;900', estilo: 'Lectura' },
    { nombre: 'Roboto Slab', pesos: '400;500;600;700;800', estilo: 'Robusta' },
    { nombre: 'Caveat', pesos: '400;500;600;700', estilo: 'Manuscrita' }
  ];

  const TAMANOS = { chico: { nombre: 'Chico', px: 14 }, normal: { nombre: 'Normal', px: 15.5 }, grande: { nombre: 'Grande', px: 17.5 }, enorme: { nombre: 'Muy grande', px: 19.5 } };
  const ACENTOS = ['#7c3aed', '#a855f7', '#c026d3', '#db2777', '#e11d48', '#f97316', '#eab308', '#059669', '#0891b2', '#2563eb', '#4f46e5', '#57534e'];
  const BASE = { plantilla: 'aurora', fuente: 'Plus Jakarta Sans', tamano: 'normal', acento: '', encabezado: '' };

  const cargadas = new Set(['Plus Jakarta Sans']);
  function cargarFuentes(nombres) {
    const nuevas = nombres.filter((n) => !cargadas.has(n) && FUENTES.some((f) => f.nombre === n));
    if (!nuevas.length) return;
    nuevas.forEach((n) => cargadas.add(n));
    const familias = nuevas.map((n) => `family=${n.replace(/ /g, '+')}:wght@${FUENTES.find((f) => f.nombre === n).pesos}`).join('&');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${familias}&display=swap`;
    document.head.appendChild(link);
  }

  const normalizar = (d) => {
    const x = Object.assign({}, BASE, d || {});
    if (!PLANTILLAS[x.plantilla]) x.plantilla = BASE.plantilla;
    if (!TAMANOS[x.tamano]) x.tamano = BASE.tamano;
    if (!FUENTES.some((f) => f.nombre === x.fuente)) x.fuente = BASE.fuente;
    if (x.acento && !/^#[0-9a-f]{6}$/i.test(x.acento)) x.acento = '';
    return x;
  };

  // Variables CSS del tema; se aplican al contenedor .public.
  function variables(d) {
    d = normalizar(d);
    const t = PLANTILLAS[d.plantilla];
    const a1 = d.acento || t.a1;
    const a2 = d.acento ? `color-mix(in srgb, ${d.acento} 55%, ${t.modo === 'claro' ? '#1c1530' : '#ffffff'} 20%)` : t.a2;
    const grad = `linear-gradient(135deg, ${a1} 0%, ${a2} 100%)`;
    const hero = d.encabezado
      ? `linear-gradient(180deg, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.6)), url("${d.encabezado}") center / cover`
      : d.acento ? `linear-gradient(135deg, color-mix(in srgb, ${d.acento} 70%, #000), color-mix(in srgb, ${d.acento} 85%, #fff 15%))` : t.hero;
    return {
      '--bg': t.fondo,
      '--text': t.texto,
      '--muted': t.muted,
      '--dim': t.dim,
      '--card-bg': t.card,
      '--border': t.borde,
      '--border-2': t.borde,
      '--input-bg': t.input,
      '--surface': t.suave,
      '--surface-2': t.suave,
      '--grad': grad,
      '--grad-soft': `linear-gradient(135deg, color-mix(in srgb, ${a1} 22%, transparent), color-mix(in srgb, ${a2} 12%, transparent))`,
      '--p2': a1,
      '--p3': t.modo === 'claro' ? a1 : `color-mix(in srgb, ${a1} 60%, #fff)`,
      '--glow': `0 10px 30px -10px color-mix(in srgb, ${a1} 75%, transparent)`,
      '--hero': hero,
      '--font': `'${d.fuente}', system-ui, sans-serif`,
      '--fs': `${TAMANOS[d.tamano].px}px`
    };
  }

  function aplicar(el, d) {
    d = normalizar(d);
    cargarFuentes([d.fuente]);
    const vars = variables(d);
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    el.dataset.modo = PLANTILLAS[d.plantilla].modo;
    document.documentElement.style.setProperty('--scroll-grad', vars['--grad']);
  }

  function quitarDePagina() {
    document.documentElement.style.removeProperty('--scroll-grad');
  }

  return { PLANTILLAS, FUENTES, TAMANOS, ACENTOS, BASE, normalizar, variables, aplicar, cargarFuentes, quitarDePagina };
})();
