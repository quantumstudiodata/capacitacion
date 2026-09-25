// Tipos de pregunta avanzados: cómo se editan, cómo se responden y cómo se revisan.
// Modelos de datos: ver README.md, sección "Tipos de pregunta".
const Tipos = (() => {
  const LISTA = {
    subrespuestas: { nombre: 'Párrafo con sub-respuestas', icono: 'layers' },
    puntoImagen: { nombre: 'Señalar en imagen', icono: 'crosshair' },
    etiquetarImagen: { nombre: 'Etiquetar imagen', icono: 'tag' },
    zonasImagen: { nombre: 'Zonas en imagen', icono: 'target' },
    ordenar: { nombre: 'Ordenar elementos', icono: 'sort' },
    relacionar: { nombre: 'Relacionar columnas', icono: 'match' },
    huecos: { nombre: 'Completar espacios', icono: 'blank' }
  };
  const CAMPOS_PROPIOS = ['campos', 'imagen', 'aspecto', 'zonas', 'marcadores', 'distractores', 'elementos', 'pares', 'plantilla', 'segmentos', 'huecos'];
  const CON_IMAGEN = ['puntoImagen', 'etiquetarImagen', 'zonasImagen'];
  const es = (t) => Object.prototype.hasOwnProperty.call(LISTA, t);
  const lineas = (v) => v.split('\n').map((x) => x.trim()).filter(Boolean);
  const redondear = (n) => Math.round(n * 10) / 10;

  // ---------- Modelo ----------
  function nueva(tipo) {
    switch (tipo) {
      case 'subrespuestas':
        return { campos: [{ id: uid(), etiqueta: 'Campo 1', aceptadas: [] }, { id: uid(), etiqueta: 'Campo 2', aceptadas: [] }] };
      case 'puntoImagen':
        return { imagen: '', aspecto: 1, zonas: [] };
      case 'etiquetarImagen':
        return { imagen: '', aspecto: 1, marcadores: [], distractores: [] };
      case 'zonasImagen':
        return { imagen: '', aspecto: 1, marcadores: [] };
      case 'ordenar':
        return { elementos: ['Primer paso', 'Segundo paso', 'Tercer paso'].map((texto) => ({ id: uid(), texto })) };
      case 'relacionar':
        return { pares: [{ id: uid(), izquierda: '', derecha: '' }, { id: uid(), izquierda: '', derecha: '' }], distractores: [] };
      case 'huecos':
        return { plantilla: '', segmentos: [''], huecos: [] };
    }
    return {};
  }

  // Ajusta una pregunta al cambiar de tipo (conserva la imagen entre los dos tipos de imagen).
  function aplicarTipo(p, tipo) {
    const imagen = p.imagen ? { imagen: p.imagen, aspecto: p.aspecto } : null;
    CAMPOS_PROPIOS.forEach((k) => { delete p[k]; });
    Object.assign(p, nueva(tipo));
    if (imagen && CON_IMAGEN.includes(tipo)) Object.assign(p, imagen);
  }

  function parsearHuecos(t) {
    const segmentos = [];
    const huecos = [];
    const re = /\[([^\]]*)\]/g;
    let ultimo = 0, m;
    while ((m = re.exec(t))) {
      segmentos.push(t.slice(ultimo, m.index));
      huecos.push(m[1].split('|').map((s) => s.trim()).filter(Boolean));
      ultimo = re.lastIndex;
    }
    segmentos.push(t.slice(ultimo));
    return { segmentos, huecos };
  }

  function aviso(p) {
    switch (p.tipo) {
      case 'subrespuestas': return 'Escribe la respuesta correcta de al menos un campo';
      case 'puntoImagen': return p.imagen ? 'Haz clic en la imagen para marcar la zona correcta' : 'Sube una imagen';
      case 'etiquetarImagen': return p.imagen ? 'Agrega puntos y escribe su etiqueta' : 'Sube una imagen';
      case 'zonasImagen': return p.imagen ? 'Marca puntos y define la respuesta correcta de cada uno' : 'Sube una imagen';
      case 'ordenar': return 'Agrega al menos dos elementos';
      case 'relacionar': return 'Agrega al menos un par';
      case 'huecos': return 'Escribe la respuesta entre [corchetes]';
    }
    return '';
  }

  // ---------- Editor ----------
  function cargadorImagen(p) {
    return `
      <div class="img-upload">
        <label class="btn btn-ghost btn-sm">${ic('image')} ${p.imagen ? 'Cambiar imagen' : 'Subir imagen'}
          <input type="file" accept="image/*" data-t="imagen" hidden></label>
        ${p.imagen ? `<button type="button" class="link-btn danger" data-ta="quitarImagen">${ic('trash')} Quitar</button>` : '<span class="hint">JPG o PNG. Se optimiza automáticamente.</span>'}
      </div>`;
  }

  const quitar = (accion, visible = true) => visible ? `<button type="button" class="icon-btn sm" data-ta="${accion}" aria-label="Quitar">${ic('x')}</button>` : '';

  function previewHuecos(p) {
    if (!p.huecos.length) return '<span class="hint">Vista previa: aquí verás el texto con sus espacios.</span>';
    return p.segmentos.map((s, i) => esc(s).replace(/\n/g, '<br>') + (i < p.huecos.length
      ? `<span class="hueco-chip ${p.huecos[i].length ? '' : 'vacio'}">${p.huecos[i].length ? esc(p.huecos[i].join(' / ')) : '¿?'}</span>` : '')).join('');
  }

  function editor(p, examen) {
    switch (p.tipo) {
      case 'subrespuestas':
        return `
          <p class="hint">Quien responda verá un campo de texto por cada etiqueta.${examen ? ' Puedes aceptar varias respuestas separándolas con |' : ''}</p>
          <div class="sub-list">${p.campos.map((c, i) => `
            <div class="sub-row" data-cid="${esc(c.id)}">
              <span class="sub-n">${i + 1}</span>
              <div class="sub-fields">
                <input class="opt-input boxed" data-t="campoEtiqueta" value="${esc(c.etiqueta)}" placeholder="Etiqueta (ej. Causa)">
                ${examen ? `<input class="opt-input boxed ok" data-t="campoAceptadas" value="${esc((c.aceptadas || []).join(' | '))}" placeholder="Respuesta correcta">` : ''}
              </div>
              ${quitar('quitarCampo', p.campos.length > 1)}
            </div>`).join('')}
          </div>
          <button type="button" class="link-btn" data-ta="agregarCampo">${ic('plus')} Agregar campo</button>`;

      case 'puntoImagen':
        return `${cargadorImagen(p)}
          ${p.imagen ? `
            <p class="hint">${examen ? 'Haz clic en la imagen para marcar la zona correcta (puedes marcar varias). Clic en una zona para quitarla.' : 'Quien responda hará clic sobre la imagen.'}</p>
            <div class="img-stage ${examen ? 'editable' : ''}" data-ta="imgClick">
              <img src="${p.imagen}" alt="" draggable="false">
              ${examen ? p.zonas.map((z, i) => `<span class="zona" data-zi="${i}" style="left:${z.x}%;top:${z.y}%;width:${z.r * 2}%"></span>`).join('') : ''}
            </div>
            ${examen && p.zonas.length ? `<label class="range-row"><span>Tamaño de la zona</span><input type="range" min="2" max="25" step="1" data-t="radioZona" value="${p.zonas[0].r}"></label>` : ''}` : ''}`;

      case 'etiquetarImagen':
        return `${cargadorImagen(p)}
          ${p.imagen ? `
            <p class="hint">Haz clic en la imagen para agregar puntos numerados y escribe la etiqueta correcta de cada uno.</p>
            <div class="img-stage editable" data-ta="imgClick">
              <img src="${p.imagen}" alt="" draggable="false">
              ${p.marcadores.map((m, i) => `<span class="pin-num" style="left:${m.x}%;top:${m.y}%">${i + 1}</span>`).join('')}
            </div>
            <div class="sub-list">${p.marcadores.map((m, i) => `
              <div class="sub-row" data-mid="${esc(m.id)}">
                <span class="pin-num static">${i + 1}</span>
                <input class="opt-input boxed" data-t="marcadorTexto" value="${esc(m.texto)}" placeholder="Etiqueta correcta de este punto">
                ${quitar('quitarMarcador')}
              </div>`).join('')}
            </div>
            <label class="field compact"><span>Opciones de distracción <small>(una por línea, opcional)</small></span>
              <textarea data-t="distractores" rows="2" placeholder="Etiquetas extra que no corresponden a ningún punto">${esc((p.distractores || []).join('\n'))}</textarea></label>` : ''}`;

      case 'zonasImagen':
        return `${cargadorImagen(p)}
          ${p.imagen ? `
            <p class="hint">Haz clic en la imagen para marcar cada punto o zona. Para cada uno elige si se responde con <strong>opción múltiple</strong> o con <strong>respuesta corta</strong>.</p>
            <div class="img-stage editable" data-ta="imgClick">
              <img src="${p.imagen}" alt="" draggable="false">
              ${marcasZonas(p)}
            </div>
            <div class="zm-list">${p.marcadores.map((m, i) => editorMarcador(m, i, examen)).join('')}</div>` : ''}`;

      case 'ordenar':
        return `
          <p class="hint">Escribe los elementos en el <strong>orden correcto</strong>. A cada participante se le mostrarán mezclados.</p>
          <div class="sub-list">${p.elementos.map((e, i) => `
            <div class="sub-row" data-eid="${esc(e.id)}">
              <span class="sub-n">${i + 1}</span>
              <input class="opt-input boxed" data-t="elementoTexto" value="${esc(e.texto)}" placeholder="Elemento">
              <button type="button" class="icon-btn sm" data-ta="subirElemento" ${i === 0 ? 'disabled' : ''} aria-label="Subir">${ic('up')}</button>
              <button type="button" class="icon-btn sm" data-ta="bajarElemento" ${i === p.elementos.length - 1 ? 'disabled' : ''} aria-label="Bajar">${ic('down')}</button>
              ${quitar('quitarElemento', p.elementos.length > 2)}
            </div>`).join('')}
          </div>
          <button type="button" class="link-btn" data-ta="agregarElemento">${ic('plus')} Agregar elemento</button>`;

      case 'relacionar':
        return `
          <div class="pair-head"><span>Columna A</span><span></span><span>Columna B · su pareja correcta</span></div>
          <div class="sub-list">${p.pares.map((q) => `
            <div class="pair-row" data-par="${esc(q.id)}">
              <input class="opt-input boxed" data-t="parIzquierda" value="${esc(q.izquierda)}" placeholder="Elemento">
              <span class="pair-link">${ic('link')}</span>
              <input class="opt-input boxed" data-t="parDerecha" value="${esc(q.derecha)}" placeholder="Pareja">
              ${quitar('quitarPar', p.pares.length > 1)}
            </div>`).join('')}
          </div>
          <button type="button" class="link-btn" data-ta="agregarPar">${ic('plus')} Agregar par</button>
          <label class="field compact"><span>Opciones extra en la columna B <small>(una por línea, opcional)</small></span>
            <textarea data-t="distractores" rows="2" placeholder="Parejas que no corresponden a nada">${esc((p.distractores || []).join('\n'))}</textarea></label>`;

      case 'huecos':
        return `
          <label class="field compact"><span>Texto con espacios <small>Escribe cada respuesta entre corchetes. Alternativas con |</small></span>
            <textarea data-t="plantilla" rows="3" placeholder="Ej. El extintor tipo [ABC] sirve para fuegos de clase [A|sólidos], B y C.">${esc(p.plantilla)}</textarea></label>
          <div class="huecos-preview" data-prev>${previewHuecos(p)}</div>`;
    }
    return '';
  }

  // Pines numerados (y zona circular opcional) de una pregunta "Zonas en imagen".
  const marcasZonas = (p) => p.marcadores.map((m, i) => `
    ${m.r ? `<span class="zona fija zm-zona" data-zm="${esc(m.id)}" style="left:${m.x}%;top:${m.y}%;width:${m.r * 2}%"></span>` : ''}
    <span class="pin-num" data-zm="${esc(m.id)}" style="left:${m.x}%;top:${m.y}%">${i + 1}</span>`).join('');

  function editorMarcador(m, i, examen) {
    const corta = m.modo === 'corta';
    return `
      <div class="zm-item" data-mid="${esc(m.id)}">
        <div class="zm-head">
          <span class="pin-num static">${i + 1}</span>
          <div class="zm-modo" role="group" aria-label="Tipo de respuesta">
            <button type="button" class="${corta ? '' : 'sel'}" data-ta="zmModo" data-v="opciones">${ic('radio')} Opción múltiple</button>
            <button type="button" class="${corta ? 'sel' : ''}" data-ta="zmModo" data-v="corta">${ic('texto')} Respuesta corta</button>
          </div>
          <label class="range-row zm-radio" title="Tamaño de la zona (0 = solo el punto)"><span>Zona</span><input type="range" min="0" max="20" step="1" data-t="zmRadio" value="${m.r || 0}"></label>
          ${quitar('quitarMarcador')}
        </div>
        ${corta ? (examen
          ? `<input class="opt-input boxed ok" data-t="zmAceptadas" value="${esc((m.aceptadas || []).join(' | '))}" placeholder="Respuesta correcta (varias: separa con |)">`
          : '<div class="fake-input">El participante escribirá el nombre</div>')
        : `<div class="opts">${(m.opciones || []).map((o) => {
            const ok = examen && m.correcta === o.id;
            return `
              <div class="opt ${ok ? 'is-correct' : ''}" data-zo="${esc(o.id)}">
                <button type="button" class="mark ${examen ? '' : 'off'}" data-ta="zmCorrecta" title="${examen ? 'Marcar como correcta' : ''}" ${examen ? '' : 'tabindex="-1"'}>${ic('check')}</button>
                <input class="opt-input" data-t="zmOpcion" value="${esc(o.texto)}" placeholder="Opción">
                ${ok ? '<span class="chip chip-ok">Correcta</span>' : ''}
                ${m.opciones.length > 1 ? `<button type="button" class="icon-btn sm" data-ta="zmQuitarOpcion" aria-label="Quitar opción">${ic('x')}</button>` : ''}
              </div>`;
          }).join('')}</div>
          <button type="button" class="link-btn" data-ta="zmAgregarOpcion">${ic('plus')} Agregar opción</button>`}
      </div>`;
  }

  const buscar = (lista, el, attr) => {
    const fila = el.closest(`[${attr}]`);
    return fila ? lista.find((x) => x.id === fila.getAttribute(attr)) : null;
  };

  // Devuelve true si cambió la pregunta (sin volver a pintar).
  function input(t, p) {
    const v = t.value;
    switch (t.dataset.t) {
      case 'campoEtiqueta': buscar(p.campos, t, 'data-cid').etiqueta = v; break;
      case 'campoAceptadas': buscar(p.campos, t, 'data-cid').aceptadas = v.split('|').map((s) => s.trim()).filter(Boolean); break;
      case 'marcadorTexto': buscar(p.marcadores, t, 'data-mid').texto = v; break;
      case 'distractores': p.distractores = lineas(v); break;
      case 'elementoTexto': buscar(p.elementos, t, 'data-eid').texto = v; break;
      case 'parIzquierda': buscar(p.pares, t, 'data-par').izquierda = v; break;
      case 'parDerecha': buscar(p.pares, t, 'data-par').derecha = v; break;
      case 'plantilla': {
        p.plantilla = v;
        Object.assign(p, parsearHuecos(v));
        const prev = t.closest('.q-card').querySelector('[data-prev]');
        if (prev) prev.innerHTML = previewHuecos(p);
        break;
      }
      case 'zmAceptadas': buscar(p.marcadores, t, 'data-mid').aceptadas = v.split('|').map((x) => x.trim()).filter(Boolean); break;
      case 'zmOpcion': {
        const m = buscar(p.marcadores, t, 'data-mid');
        const o = buscar(m.opciones, t, 'data-zo');
        o.texto = v;
        break;
      }
      case 'zmRadio': {
        const m = buscar(p.marcadores, t, 'data-mid');
        const card = t.closest('.q-card');
        const antes = !!m.r;
        m.r = Number(v);
        if (antes !== !!m.r) {
          // Aparece o desaparece el círculo: se vuelve a pintar solo la imagen.
          card.querySelector('.img-stage').innerHTML = `<img src="${p.imagen}" alt="" draggable="false">${marcasZonas(p)}`;
        } else {
          const z = card.querySelector(`.zm-zona[data-zm="${CSS.escape(m.id)}"]`);
          if (z) z.style.width = `${m.r * 2}%`;
        }
        break;
      }
      case 'radioZona': {
        p.zonas.forEach((z) => { z.r = Number(v); });
        t.closest('.q-card').querySelectorAll('.zona').forEach((el) => { el.style.width = `${Number(v) * 2}%`; });
        break;
      }
      default: return false;
    }
    return true;
  }

  // Cambios asíncronos (subir imagen). Devuelve true si hay que volver a pintar.
  async function change(t, p) {
    if (t.dataset.t !== 'imagen' || !t.files[0]) return false;
    const { dataUrl, aspecto } = await leerImagen(t.files[0]);
    p.imagen = dataUrl;
    p.aspecto = aspecto;
    if (p.zonas) p.zonas = [];
    if (p.marcadores) p.marcadores = [];
    return true;
  }

  function posicion(e, el) {
    const r = el.getBoundingClientRect();
    return {
      x: redondear(Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100))),
      y: redondear(Math.min(100, Math.max(0, (e.clientY - r.top) / r.height * 100)))
    };
  }

  const mover = (lista, item, d) => {
    const i = lista.indexOf(item);
    const j = i + d;
    if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
  };

  // Clic en un control de la pregunta. Devuelve true si hay que volver a pintar.
  function click(e, b, p, examen) {
    switch (b.dataset.ta) {
      case 'agregarCampo': p.campos.push({ id: uid(), etiqueta: `Campo ${p.campos.length + 1}`, aceptadas: [] }); break;
      case 'quitarCampo': p.campos = p.campos.filter((c) => c !== buscar(p.campos, b, 'data-cid')); break;
      case 'quitarImagen': p.imagen = ''; p.zonas = p.zonas && []; p.marcadores = p.marcadores && []; break;
      case 'imgClick': {
        if (p.tipo === 'puntoImagen') {
          if (!examen) return false;
          const zona = e.target.closest('.zona');
          if (zona) p.zonas.splice(Number(zona.dataset.zi), 1);
          else p.zonas.push(Object.assign(posicion(e, b), { r: p.zonas.length ? p.zonas[0].r : 8 }));
        } else if (p.tipo === 'zonasImagen') {
          if (e.target.closest('.pin-num')) return false;
          p.marcadores.push(Object.assign({
            id: uid(), r: 0, modo: 'opciones', correcta: '', aceptadas: [],
            opciones: [{ id: uid(), texto: 'Opción 1' }, { id: uid(), texto: 'Opción 2' }]
          }, posicion(e, b)));
        } else {
          if (e.target.closest('.pin-num')) return false;
          p.marcadores.push(Object.assign({ id: uid(), texto: '' }, posicion(e, b)));
        }
        break;
      }
      case 'zmModo': {
        const m = buscar(p.marcadores, b, 'data-mid');
        m.modo = b.dataset.v;
        if (!m.opciones || !m.opciones.length) m.opciones = [{ id: uid(), texto: 'Opción 1' }, { id: uid(), texto: 'Opción 2' }];
        m.aceptadas = m.aceptadas || [];
        break;
      }
      case 'zmCorrecta': {
        if (!examen) return false;
        const m = buscar(p.marcadores, b, 'data-mid');
        const oid = b.closest('[data-zo]').dataset.zo;
        m.correcta = m.correcta === oid ? '' : oid;
        break;
      }
      case 'zmAgregarOpcion': {
        const m = buscar(p.marcadores, b, 'data-mid');
        m.opciones.push({ id: uid(), texto: `Opción ${m.opciones.length + 1}` });
        break;
      }
      case 'zmQuitarOpcion': {
        const m = buscar(p.marcadores, b, 'data-mid');
        const oid = b.closest('[data-zo]').dataset.zo;
        m.opciones = m.opciones.filter((o) => o.id !== oid);
        if (m.correcta === oid) m.correcta = '';
        break;
      }
      case 'quitarMarcador': p.marcadores = p.marcadores.filter((m) => m !== buscar(p.marcadores, b, 'data-mid')); break;
      case 'agregarElemento': p.elementos.push({ id: uid(), texto: '' }); break;
      case 'quitarElemento': p.elementos = p.elementos.filter((x) => x !== buscar(p.elementos, b, 'data-eid')); break;
      case 'subirElemento': mover(p.elementos, buscar(p.elementos, b, 'data-eid'), -1); break;
      case 'bajarElemento': mover(p.elementos, buscar(p.elementos, b, 'data-eid'), 1); break;
      case 'agregarPar': p.pares.push({ id: uid(), izquierda: '', derecha: '' }); break;
      case 'quitarPar': p.pares = p.pares.filter((x) => x !== buscar(p.pares, b, 'data-par')); break;
      default: return false;
    }
    return true;
  }

  // ---------- Responder ----------
  const selectHtml = (opciones, attrs) => `
    <span class="select full"><select ${attrs}><option value="">Elige…</option>${opciones.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>${ic('down', 'chev')}</span>`;

  function responder(p) {
    switch (p.tipo) {
      case 'subrespuestas':
        return `<div class="sub-answers">${p.campos.map((c) => `
          <label class="field"><span>${esc(c.etiqueta)}</span><input class="answer-input" data-campo="${esc(c.id)}" autocomplete="off" placeholder="Tu respuesta"></label>`).join('')}</div>`;
      case 'puntoImagen':
        return `<p class="hint">${ic('crosshair')} Toca la imagen para marcar tu respuesta.</p>
          <div class="img-stage responder" data-stage><img src="${p.imagen}" alt="" draggable="false"><span class="pin" hidden></span></div>`;
      case 'etiquetarImagen':
        return `<div class="img-stage"><img src="${p.imagen}" alt="" draggable="false">
            ${p.marcadores.map((m, i) => `<span class="pin-num" style="left:${m.x}%;top:${m.y}%">${i + 1}</span>`).join('')}</div>
          <div class="label-grid">${p.marcadores.map((m, i) => `
            <label class="label-row"><span class="pin-num static">${i + 1}</span>${selectHtml(p.banco, `data-marcador="${esc(m.id)}" aria-label="Etiqueta del punto ${i + 1}"`)}</label>`).join('')}</div>`;
      case 'zonasImagen':
        return `<div class="img-stage" data-stage-zm><img src="${p.imagen}" alt="" draggable="false">${marcasZonas(p)}</div>
          <div class="zm-answers">${p.marcadores.map((m, i) => `
            <label class="label-row zm-answer" data-zm="${esc(m.id)}">
              <span class="pin-num static">${i + 1}</span>
              ${m.modo === 'corta'
                ? `<input class="answer-input" data-zona="${esc(m.id)}" autocomplete="off" placeholder="Escribe el nombre" aria-label="Respuesta del punto ${i + 1}">`
                : `<span class="select full"><select data-zona="${esc(m.id)}" aria-label="Respuesta del punto ${i + 1}"><option value="">Elige…</option>${(m.opciones || []).map((o) => `<option value="${esc(o.id)}">${esc(o.texto)}</option>`).join('')}</select>${ic('down', 'chev')}</span>`}
            </label>`).join('')}</div>`;
      case 'ordenar':
        return `<p class="hint">${ic('grip')} Arrastra los elementos (o usa las flechas) para ponerlos en orden.</p>
          <ol class="sort-list" data-sort>${p.elementos.map((e) => `
            <li class="sort-item" data-id="${esc(e.id)}">
              <span class="grip">${ic('grip')}</span><span class="sort-n"></span><span class="sort-t">${esc(e.texto)}</span>
              <span class="sort-btns"><button type="button" class="icon-btn sm" data-mv="-1" aria-label="Subir">${ic('up')}</button><button type="button" class="icon-btn sm" data-mv="1" aria-label="Bajar">${ic('down')}</button></span>
            </li>`).join('')}</ol>`;
      case 'relacionar':
        return `<p class="hint">${ic('match')} <span class="solo-escritorio">Toca un elemento de la izquierda y después su pareja de la derecha.</span><span class="solo-movil">Elige la pareja de cada elemento.</span></p>
          <div class="match" data-match>
            <svg class="match-lines" aria-hidden="true"></svg>
            <div class="match-col izq">${p.izquierda.map((q) => `
              <div class="match-item" data-izq="${esc(q.id)}" tabindex="0" role="button">
                <span class="match-t">${esc(q.texto)}</span><span class="dot"></span>
                <span class="match-select">${selectHtml(p.derecha, `data-rel="${esc(q.id)}" aria-label="Pareja de ${esc(q.texto)}"`)}</span>
              </div>`).join('')}</div>
            <div class="match-col der">${p.derecha.map((t, i) => `
              <div class="match-item" data-der="${i}" tabindex="0" role="button"><span class="dot"></span><span class="match-t">${esc(t)}</span></div>`).join('')}</div>
          </div>`;
      case 'huecos':
        return `<p class="cloze">${p.segmentos.map((s, i) => esc(s).replace(/\n/g, '<br>')
          + (i < p.segmentos.length - 1 ? `<input class="cloze-input" data-hueco="${i}" autocomplete="off" aria-label="Espacio ${i + 1}">` : '')).join('')}</p>`;
    }
    return '';
  }

  const COLORES = ['#c084fc', '#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'];

  // Activa la interacción de una pregunta ya pintada.
  function montar(card, p) {
    const limpiar = () => card.classList.remove('invalid');
    if (p.tipo === 'puntoImagen') {
      const stage = card.querySelector('[data-stage]');
      const pin = stage.querySelector('.pin');
      stage.addEventListener('click', (e) => {
        card._resp = posicion(e, stage);
        pin.hidden = false;
        pin.style.left = `${card._resp.x}%`;
        pin.style.top = `${card._resp.y}%`;
        pin.classList.remove('pop');
        void pin.offsetWidth;
        pin.classList.add('pop');
        limpiar();
      });
    }
    if (p.tipo === 'ordenar') montarOrden(card, limpiar);
    if (p.tipo === 'zonasImagen') {
      const resaltar = (id, si) => card.querySelectorAll(`.img-stage [data-zm="${CSS.escape(id)}"]`).forEach((el) => el.classList.toggle('activo', si));
      card.addEventListener('focusin', (e) => { const r = e.target.closest('.zm-answer'); if (r) resaltar(r.dataset.zm, true); });
      card.addEventListener('focusout', (e) => { const r = e.target.closest('.zm-answer'); if (r) resaltar(r.dataset.zm, false); });
      card.addEventListener('change', limpiar);
    }
    if (p.tipo === 'relacionar') montarRelacion(card, p, limpiar);
    if (p.tipo === 'huecos') {
      card.querySelectorAll('.cloze-input').forEach((i) => {
        const ajustar = () => { i.style.width = `${Math.max(7, i.value.length + 2)}ch`; };
        i.addEventListener('input', ajustar);
        ajustar();
      });
    }
  }

  function montarOrden(card, limpiar) {
    const lista = card.querySelector('[data-sort]');
    lista.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mv]');
      if (!b) return;
      const item = b.closest('.sort-item');
      if (b.dataset.mv === '-1' && item.previousElementSibling) lista.insertBefore(item, item.previousElementSibling);
      if (b.dataset.mv === '1' && item.nextElementSibling) lista.insertBefore(item.nextElementSibling, item);
      item.classList.add('moved');
      setTimeout(() => item.classList.remove('moved'), 300);
      limpiar();
    });
    lista.addEventListener('pointerdown', (e) => {
      const item = e.target.closest('.sort-item');
      if (!item || e.target.closest('button') || e.button > 0) return;
      e.preventDefault();
      let y0 = e.clientY;
      item.setPointerCapture(e.pointerId);
      item.classList.add('dragging');
      const mover = (ev) => {
        let dy = ev.clientY - y0;
        const prev = item.previousElementSibling;
        const next = item.nextElementSibling;
        if (next && dy > next.offsetHeight / 2) {
          lista.insertBefore(next, item);
          y0 += next.offsetHeight + 8;
          dy = ev.clientY - y0;
        } else if (prev && dy < -prev.offsetHeight / 2) {
          lista.insertBefore(item, prev);
          y0 -= prev.offsetHeight + 8;
          dy = ev.clientY - y0;
        }
        item.style.transform = `translateY(${dy}px)`;
      };
      const soltar = () => {
        item.classList.remove('dragging');
        item.style.transform = '';
        item.removeEventListener('pointermove', mover);
        item.removeEventListener('pointerup', soltar);
        item.removeEventListener('pointercancel', soltar);
        limpiar();
      };
      item.addEventListener('pointermove', mover);
      item.addEventListener('pointerup', soltar);
      item.addEventListener('pointercancel', soltar);
    });
  }

  function montarRelacion(card, p, limpiar) {
    const cont = card.querySelector('[data-match]');
    const svg = cont.querySelector('.match-lines');
    const estado = {};
    card._resp = estado;
    let activo = null;

    const pintar = () => {
      const base = cont.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
      const lineas = [];
      p.izquierda.forEach((q, i) => {
        const izq = cont.querySelector(`[data-izq="${CSS.escape(q.id)}"]`);
        const sel = izq.querySelector('select');
        const texto = estado[q.id];
        const di = p.derecha.indexOf(texto);
        const der = di > -1 ? cont.querySelector(`[data-der="${di}"]`) : null;
        const color = COLORES[i % COLORES.length];
        izq.classList.toggle('conectado', !!der);
        izq.classList.toggle('activo', activo === q.id);
        izq.style.setProperty('--c', color);
        sel.value = texto || '';
        if (!der) return;
        const a = izq.querySelector('.dot').getBoundingClientRect();
        const b = der.querySelector('.dot').getBoundingClientRect();
        const x1 = a.left + a.width / 2 - base.left, y1 = a.top + a.height / 2 - base.top;
        const x2 = b.left + b.width / 2 - base.left, y2 = b.top + b.height / 2 - base.top;
        const dx = (x2 - x1) / 2;
        lineas.push(`<path d="M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}" stroke="${color}"/>`);
      });
      cont.querySelectorAll('[data-der]').forEach((d) => {
        const t = p.derecha[Number(d.dataset.der)];
        const usado = p.izquierda.findIndex((q) => estado[q.id] === t);
        d.classList.toggle('conectado', usado > -1);
        d.style.setProperty('--c', usado > -1 ? COLORES[usado % COLORES.length] : '');
      });
      svg.innerHTML = lineas.join('');
    };

    cont.addEventListener('click', (e) => {
      if (e.target.closest('select')) return;
      const izq = e.target.closest('[data-izq]');
      const der = e.target.closest('[data-der]');
      if (izq) {
        const id = izq.dataset.izq;
        if (activo === id && estado[id]) delete estado[id];
        activo = activo === id ? null : id;
      } else if (der && activo) {
        estado[activo] = p.derecha[Number(der.dataset.der)];
        activo = null;
        limpiar();
      }
      pintar();
    });
    cont.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.match-item')) {
        e.preventDefault();
        e.target.click();
      }
    });
    cont.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-rel]');
      if (!sel) return;
      if (sel.value) estado[sel.dataset.rel] = sel.value;
      else delete estado[sel.dataset.rel];
      limpiar();
      pintar();
    });
    const alCambiarTamano = () => { if (document.body.contains(cont)) pintar(); else window.removeEventListener('resize', alCambiarTamano); };
    window.addEventListener('resize', alCambiarTamano);
    requestAnimationFrame(pintar);
  }

  // Lee la respuesta actual de la pregunta.
  function leer(card, p) {
    switch (p.tipo) {
      case 'subrespuestas': {
        const r = {};
        card.querySelectorAll('[data-campo]').forEach((i) => { if (i.value.trim()) r[i.dataset.campo] = i.value.trim(); });
        return r;
      }
      case 'puntoImagen': return card._resp || null;
      case 'etiquetarImagen': {
        const r = {};
        card.querySelectorAll('[data-marcador]').forEach((s) => { if (s.value) r[s.dataset.marcador] = s.value; });
        return r;
      }
      case 'zonasImagen': {
        const r = {};
        card.querySelectorAll('[data-zona]').forEach((el) => { if (el.value.trim()) r[el.dataset.zona] = el.value.trim(); });
        return r;
      }
      case 'ordenar': return [...card.querySelectorAll('.sort-item')].map((li) => li.dataset.id);
      case 'relacionar': return Object.assign({}, card._resp || {});
      case 'huecos': return [...card.querySelectorAll('[data-hueco]')].map((i) => i.value.trim());
    }
    return null;
  }

  // ---------- Revisión (participante y capacitador) ----------
  // p debe traer su clave (pregunta completa o conClave). Con mostrarCorrecta=false no revela respuestas.
  function detalle(p, r, mostrarCorrecta = true) {
    if (p.tipo === 'puntoImagen') {
      const ok = p.zonas ? dentroDeZona(p, r) : null;
      return `<div class="img-stage mini">
        <img src="${p.imagen}" alt="" draggable="false">
        ${mostrarCorrecta ? (p.zonas || []).map((z) => `<span class="zona fija" style="left:${z.x}%;top:${z.y}%;width:${z.r * 2}%"></span>`).join('') : ''}
        ${r && r.x != null ? `<span class="pin ${ok === null ? '' : ok ? 'ok' : 'bad'}" style="left:${r.x}%;top:${r.y}%"></span>` : ''}
      </div>${r && r.x != null ? '' : '<p class="muted">Sin respuesta</p>'}`;
    }
    const filas = desglose(p, r) || [];
    const figura = (p.tipo === 'etiquetarImagen' || p.tipo === 'zonasImagen') && p.imagen
      ? `<div class="img-stage mini"><img src="${p.imagen}" alt="" draggable="false">${p.tipo === 'zonasImagen' ? marcasZonas(p) : (p.marcadores || []).map((m, i) => `<span class="pin-num" style="left:${m.x}%;top:${m.y}%">${i + 1}</span>`).join('')}</div>` : '';
    return `${figura}<div class="dg">${filas.map((f) => {
      const est = f.ok === null ? '' : f.ok ? 'ok' : 'bad';
      return `<div class="dg-row ${est}">
        <span class="dg-lbl">${esc(f.etiqueta)}</span>
        <span class="dg-resp">${est ? ic(f.ok ? 'check' : 'x') : ''}${f.respuesta ? esc(f.respuesta) : '<span class="muted">Sin respuesta</span>'}</span>
        ${mostrarCorrecta && f.ok === false && f.correcta ? `<span class="dg-ok">${ic('check')} ${esc(f.correcta)}</span>` : ''}
      </div>`;
    }).join('')}</div>`;
  }

  // Texto plano para CSV.
  function textoPlano(p, r) {
    if (p.tipo === 'puntoImagen') return r && r.x != null ? `x=${r.x}%, y=${r.y}%` : '';
    return (desglose(p, r) || []).filter((f) => f.respuesta).map((f) => `${f.etiqueta}: ${f.respuesta}`).join('; ');
  }

  // Resumen de todas las respuestas de una pregunta (panel del capacitador).
  function resumen(p, respuestas, barra) {
    if (p.tipo === 'puntoImagen') {
      return `<div class="img-stage mini">
        <img src="${p.imagen}" alt="" draggable="false">
        ${(p.zonas || []).map((z) => `<span class="zona fija" style="left:${z.x}%;top:${z.y}%;width:${z.r * 2}%"></span>`).join('')}
        ${respuestas.filter((r) => r && r.x != null).map((r) => `<span class="pin small ${p.zonas && p.zonas.length ? (dentroDeZona(p, r) ? 'ok' : 'bad') : ''}" style="left:${r.x}%;top:${r.y}%"></span>`).join('')}
      </div>`;
    }
    const tablas = respuestas.map((r) => desglose(p, r) || []);
    const partes = desglose(p, null) || [];
    return partes.map((parte, i) => {
      const filas = tablas.map((t) => t[i]).filter(Boolean);
      if (parte.ok !== null && filas.length) {
        const n = filas.filter((f) => f.ok).length;
        return barra(`${esc(parte.etiqueta)} <span class="muted">→ ${esc(parte.correcta)}</span>`, n, filas.length, false, 'acertó');
      }
      const textos = filas.map((f) => f.respuesta).filter(Boolean);
      return `<div class="dg-sum"><strong>${esc(parte.etiqueta)}</strong>${textos.length
        ? `<ul class="text-answers">${textos.slice(0, 5).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="muted">Sin respuestas.</p>'}</div>`;
    }).join('');
  }

  return { LISTA, es, nueva, aplicarTipo, aviso, editor, input, change, click, responder, montar, leer, detalle, textoPlano, resumen };
})();
