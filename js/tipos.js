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
    huecos: { nombre: 'Completar espacios', icono: 'blank' },
    escala: { nombre: 'Escala / Likert', icono: 'sliders' },
    numero: { nombre: 'Respuesta numérica', icono: 'numero' },
    lineaNumerica: { nombre: 'Línea numérica', icono: 'linea' }
  };
  const CAMPOS_PROPIOS = ['campos', 'imagen', 'aspecto', 'zonas', 'marcadores', 'distractores', 'elementos', 'pares',
    'plantilla', 'segmentos', 'huecos', 'huecosMapa', 'modo', 'min', 'max', 'paso', 'etiquetaMin', 'etiquetaMax',
    'correcta', 'modoRespuesta', 'valor', 'minimo', 'maximo', 'tolerancia', 'unidad', 'decimales'];
  const CON_IMAGEN = ['puntoImagen', 'etiquetarImagen', 'zonasImagen'];
  const MOD_LIKERT = ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'];
  const es = (t) => Object.prototype.hasOwnProperty.call(LISTA, t);
  const lineas = (v) => v.split('\n').map((x) => x.trim()).filter(Boolean);
  const redondear = (n) => Math.round(n * 10) / 10;

  // ---------- Modelo ----------
  function nuevoCampoSub(n) {
    return { id: uid(), etiqueta: `Campo ${n}`, modo: 'abierta', manual: false, aceptadas: [], opciones: [], correctas: [] };
  }

  function nueva(tipo) {
    switch (tipo) {
      case 'subrespuestas':
        return { campos: [nuevoCampoSub(1), nuevoCampoSub(2)] };
      case 'puntoImagen':
        return { imagen: '', aspecto: 1, zonas: [], modo: 'automatico' };
      case 'etiquetarImagen':
        return { imagen: '', aspecto: 1, marcadores: [], distractores: [] };
      case 'zonasImagen':
        return { imagen: '', aspecto: 1, marcadores: [] };
      case 'ordenar':
        return { elementos: ['Primer paso', 'Segundo paso', 'Tercer paso'].map((texto) => ({ id: uid(), texto })) };
      case 'relacionar':
        return { pares: [{ id: uid(), izquierda: '', derecha: '' }, { id: uid(), izquierda: '', derecha: '' }], distractores: [] };
      case 'huecos':
        return { plantilla: '', segmentos: [''], huecos: [], huecosMapa: {} };
      case 'escala':
        return { modo: 'numerica', min: 1, max: 5, etiquetaMin: 'Nada', etiquetaMax: 'Mucho', opciones: MOD_LIKERT.map((texto) => ({ id: uid(), texto })), correcta: '' };
      case 'numero':
        return { modoRespuesta: 'exacta', valor: '', minimo: '', maximo: '', tolerancia: 0, unidad: '', decimales: 0 };
      case 'lineaNumerica':
        return { min: 0, max: 100, paso: 1, etiquetaMin: '', etiquetaMax: '', valor: '', tolerancia: 0 };
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

  function aviso(p) {
    switch (p.tipo) {
      case 'subrespuestas': return 'Define la respuesta correcta de al menos un campo (o márcalo como manual)';
      case 'puntoImagen': return p.imagen ? ((p.modo || 'automatico') === 'manual' ? '' : 'Haz clic en la imagen para marcar el punto correcto') : 'Sube una imagen';
      case 'etiquetarImagen': return p.imagen ? 'Agrega puntos y escribe su etiqueta' : 'Sube una imagen';
      case 'zonasImagen': return p.imagen ? 'Marca puntos y define la respuesta correcta de cada uno (o márcalo como manual)' : 'Sube una imagen';
      case 'ordenar': return 'Agrega al menos dos elementos';
      case 'relacionar': return 'Agrega al menos un par';
      case 'huecos': return 'Selecciona una palabra y marca un espacio';
      case 'escala': return 'Marca la respuesta correcta (o deja sin calificar, como encuesta)';
      case 'numero': return 'Escribe la respuesta correcta (o un rango aceptable)';
      case 'lineaNumerica': return 'Escribe el valor correcto sobre la línea';
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

  function huecosDom(cont) {
    const segmentos = [];
    let seg = '';
    [...cont.childNodes].forEach((n) => {
      if (n.nodeType === 3) seg += n.nodeValue;
      else if (n.nodeType === 1 && n.tagName === 'BR') seg += '\n';
      else if (n.nodeType === 1 && n.classList && n.classList.contains('hueco-mark')) { segmentos.push(seg); seg = ''; }
    });
    segmentos.push(seg);
    return segmentos;
  }

  // Índice del hueco justo antes del nodo dado (recorriendo los hermanos previos).
  function huecoIndiceAntes(cont, nodo) {
    let i = 0;
    for (const n of cont.childNodes) {
      if (n === nodo) break;
      if (n.nodeType === 1 && n.classList && n.classList.contains('hueco-mark')) i++;
    }
    return i;
  }

  function huecoHtml(p) {
    if (!p.segmentos.length) return '<span class="hint">Escribe aquí el texto de la pregunta.</span>';
    return p.segmentos.map((s, i) => esc(s).replace(/\n/g, '<br>') + (i < p.huecos.length
      ? `<mark class="hueco-mark" contenteditable="false" data-ta="quitarHueco" title="Quitar este espacio">${esc((p.huecos[i] || [])[0] || 'respuesta')}</mark>` : '')).join('');
  }

  function listaHuecos(p) {
    if (!p.huecos.length) return '<p class="hint">Selecciona una palabra o frase del texto y presiona “Marcar espacio”.</p>';
    return `<div class="sub-list">${p.huecos.map((h, i) => `
      <div class="sub-row" data-hi="${i}">
        <span class="sub-n">${i + 1}</span>
        <input class="opt-input boxed ok" data-t="huecoAceptadas" value="${esc(h.join(' | '))}" placeholder="Respuestas aceptadas (varias: separa con |)">
      </div>`).join('')}</div>`;
  }

  function editor(p, examen) {
    switch (p.tipo) {
      case 'subrespuestas':
        return `
          <p class="hint">Quien responda verá un campo por cada etiqueta. Elige cómo se responde cada uno.</p>
          <div class="sub-list">${p.campos.map((c, i) => editorCampoSub(c, i, examen, p.campos.length > 1)).join('')}</div>
          <button type="button" class="link-btn" data-ta="agregarCampo">${ic('plus')} Agregar campo</button>`;

      case 'puntoImagen': {
        const manual = (p.modo || 'automatico') === 'manual';
        return `${cargadorImagen(p)}
          ${p.imagen ? `
            <div class="zm-modo" role="group" aria-label="Tipo de calificación">
              <button type="button" class="${manual ? '' : 'sel'}" data-ta="puntoModo" data-v="automatico">${ic('target')} Calificación automática</button>
              <button type="button" class="${manual ? 'sel' : ''}" data-ta="puntoModo" data-v="manual">${ic('users')} Calificación manual</button>
            </div>
            ${manual ? `
              <p class="hint">Revisarás cada respuesta a mano en la pestaña Respuestas.</p>
              <div class="img-stage"><img src="${p.imagen}" alt="" draggable="false"></div>` : `
              <p class="hint">${examen ? 'Haz clic en la imagen para marcar el punto correcto (puedes marcar varias zonas equivalentes). Clic en una zona para quitarla.' : 'Quien responda hará clic sobre la imagen.'}</p>
              <div class="img-stage ${examen ? 'editable' : ''}" data-ta="imgClick">
                <img src="${p.imagen}" alt="" draggable="false">
                ${examen ? p.zonas.map((z, i) => `<span class="zona" data-zi="${i}" style="left:${z.x}%;top:${z.y}%;width:${z.r * 2}%"></span>`).join('') : ''}
              </div>
              ${examen && p.zonas.length ? `<label class="range-row"><span>Radio de tolerancia <small>(el margen de error al hacer clic)</small></span><input type="range" min="2" max="25" step="1" data-t="radioZona" value="${p.zonas[0].r}"></label>` : ''}`}` : ''}`;
      }

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
          <p class="hint">Escribe el texto normal. Selecciona una palabra o frase y presiona <strong>“Marcar espacio”</strong> para convertirla en algo que deba completar quien responda.</p>
          <div class="huecos-edit rt" contenteditable="true" data-q="huecosTexto" data-placeholder="Ej. El número de emergencias es el 911 y el extintor ABC sirve para casi todo." aria-label="Texto con espacios">${huecoHtml(p)}</div>
          <div class="huecos-lista" data-huecos-lista>${listaHuecos(p)}</div>`;

      case 'escala':
        return editorEscala(p, examen);

      case 'numero':
        return editorNumero(p, examen);

      case 'lineaNumerica':
        return editorLineaNumerica(p);
    }
    return '';
  }

  function editorCampoSub(c, i, examen, puedeQuitar) {
    const modo = c.modo || 'abierta';
    const NOMBRE_MODO = { abierta: 'Texto libre', unica: 'Opción única', multiple: 'Opción múltiple', select: 'Menú' };
    let cuerpo;
    if (modo === 'abierta') {
      cuerpo = `
        <label class="switch-row inline sm"><span class="switch"><input type="checkbox" data-ta="campoManual" ${c.manual ? 'checked' : ''} tabindex="-1"><span class="sw"></span></span><span>Calificar manualmente</span></label>
        ${examen && !c.manual ? `<input class="opt-input boxed ok" data-t="campoAceptadas" value="${esc((c.aceptadas || []).join(' | '))}" placeholder="Respuesta correcta (varias: separa con |)">` : ''}`;
    } else {
      cuerpo = `<div class="opts">${(c.opciones || []).map((o) => {
        const ok = examen && (c.correctas || []).includes(o.id);
        return `
          <div class="opt ${ok ? 'is-correct' : ''}" data-oid="${esc(o.id)}">
            <button type="button" class="mark ${modo === 'multiple' ? 'sq' : ''} ${examen ? '' : 'off'}" data-ta="campoCorrecta" title="${examen ? 'Marcar como correcta' : ''}" ${examen ? '' : 'tabindex="-1"'}>${ic('check')}</button>
            <input class="opt-input" data-t="campoOpcionTexto" value="${esc(o.texto)}" placeholder="Opción">
            ${ok ? '<span class="chip chip-ok">Correcta</span>' : ''}
            ${(c.opciones || []).length > 1 ? `<button type="button" class="icon-btn sm" data-ta="campoQuitarOpcion" aria-label="Quitar opción">${ic('x')}</button>` : ''}
          </div>`;
      }).join('')}</div>
      <button type="button" class="link-btn" data-ta="campoAgregarOpcion">${ic('plus')} Agregar opción</button>`;
    }
    return `
      <div class="sub-item" data-cid="${esc(c.id)}">
        <div class="sub-item-head">
          <span class="sub-n">${i + 1}</span>
          <input class="opt-input boxed" data-t="campoEtiqueta" value="${esc(c.etiqueta)}" placeholder="Etiqueta (ej. Causa)">
          <span class="zm-modo" role="group" aria-label="Tipo de respuesta">
            ${Object.entries(NOMBRE_MODO).map(([m, n]) => `<button type="button" class="${modo === m ? 'sel' : ''}" data-ta="campoModo" data-v="${m}">${n}</button>`).join('')}
          </span>
          ${quitar('quitarCampo', puedeQuitar)}
        </div>
        ${cuerpo}
      </div>`;
  }

  function editorEscala(p, examen) {
    const likert = p.modo === 'likert';
    const sinCalificar = !tieneTexto(p.correcta);
    return `
      <div class="zm-modo" role="group" aria-label="Tipo de escala">
        <button type="button" class="${likert ? '' : 'sel'}" data-ta="escalaModo" data-v="numerica">Numérica</button>
        <button type="button" class="${likert ? 'sel' : ''}" data-ta="escalaModo" data-v="likert">Likert</button>
      </div>
      ${likert ? `
        <p class="hint">Edita las etiquetas de la escala (de menor a mayor acuerdo).</p>
        <div class="opts">${(p.opciones || []).map((o) => {
          const ok = examen && p.correcta === o.id;
          return `
            <div class="opt ${ok ? 'is-correct' : ''}" data-oid="${esc(o.id)}">
              <button type="button" class="mark ${examen ? '' : 'off'}" data-ta="escalaCorrecta" title="${examen ? 'Marcar como respuesta correcta' : ''}" ${examen ? '' : 'tabindex="-1"'}>${ic('check')}</button>
              <input class="opt-input" data-t="escalaOpcion" value="${esc(o.texto)}" placeholder="Etiqueta">
              ${ok ? '<span class="chip chip-ok">Correcta</span>' : ''}
            </div>`;
        }).join('')}</div>` : `
        <div class="escala-num-cfg">
          <label class="pts"><span>Mínimo</span><input type="number" data-t="escalaMin" value="${Number(p.min) || 1}"></label>
          <label class="pts"><span>Máximo</span><input type="number" data-t="escalaMax" value="${Number(p.max) || 5}"></label>
          <input class="opt-input boxed" data-t="escalaEtiquetaMin" value="${esc(p.etiquetaMin || '')}" placeholder="Etiqueta del mínimo (ej. Nada)">
          <input class="opt-input boxed" data-t="escalaEtiquetaMax" value="${esc(p.etiquetaMax || '')}" placeholder="Etiqueta del máximo (ej. Mucho)">
        </div>
        ${examen ? `
          <label class="field compact"><span>Valor correcto <small>(déjalo vacío para no calificar, como en una encuesta)</small></span>
            <input class="opt-input boxed ok" type="number" min="${Number(p.min) || 1}" max="${Number(p.max) || 5}" data-t="escalaCorrectaNum" value="${esc(p.correcta || '')}"></label>` : ''}`}
      ${examen && likert ? `<p class="hint">${sinCalificar ? 'Sin marcar: se tratará como encuesta, sin calificar.' : ''}</p>` : ''}`;
  }

  function editorNumero(p, examen) {
    const rango = p.modoRespuesta === 'rango';
    return `
      <div class="zm-modo" role="group" aria-label="Tipo de respuesta correcta">
        <button type="button" class="${rango ? '' : 'sel'}" data-ta="numeroModo" data-v="exacta">Valor exacto</button>
        <button type="button" class="${rango ? 'sel' : ''}" data-ta="numeroModo" data-v="rango">Rango aceptable</button>
      </div>
      ${examen ? (rango ? `
        <div class="escala-num-cfg">
          <label class="pts wide"><span>Mínimo</span><input type="number" step="any" data-t="numeroMinimo" value="${esc(p.minimo || '')}"></label>
          <label class="pts wide"><span>Máximo</span><input type="number" step="any" data-t="numeroMaximo" value="${esc(p.maximo || '')}"></label>
        </div>` : `
        <div class="escala-num-cfg">
          <label class="pts wide"><span>Valor correcto</span><input type="number" step="any" data-t="numeroValor" value="${esc(p.valor || '')}"></label>
          <label class="pts wide"><span>Tolerancia (±)</span><input type="number" step="any" min="0" data-t="numeroTolerancia" value="${Number(p.tolerancia) || 0}"></label>
        </div>`) : '<p class="hint">Sin calificar: no has escrito la respuesta correcta.</p>'}
      <div class="escala-num-cfg">
        <label class="pts wide"><span>Decimales</span><input type="number" min="0" max="4" data-t="numeroDecimales" value="${Number(p.decimales) || 0}"></label>
        <input class="opt-input boxed" data-t="numeroUnidad" value="${esc(p.unidad || '')}" placeholder="Unidad (ej. mg/dL, %, años)">
      </div>`;
  }

  function editorLineaNumerica(p) {
    return `
      <div class="escala-num-cfg">
        <label class="pts"><span>Mínimo</span><input type="number" step="any" data-t="lineaMin" value="${Number(p.min) || 0}"></label>
        <label class="pts"><span>Máximo</span><input type="number" step="any" data-t="lineaMax" value="${Number(p.max) || 100}"></label>
        <label class="pts"><span>Paso</span><input type="number" step="any" min="0.001" data-t="lineaPaso" value="${Number(p.paso) || 1}"></label>
      </div>
      <div class="escala-num-cfg">
        <input class="opt-input boxed" data-t="lineaEtiquetaMin" value="${esc(p.etiquetaMin || '')}" placeholder="Etiqueta del mínimo (opcional)">
        <input class="opt-input boxed" data-t="lineaEtiquetaMax" value="${esc(p.etiquetaMax || '')}" placeholder="Etiqueta del máximo (opcional)">
      </div>
      <label class="field compact"><span>Valor correcto sobre la línea <small>(vacío = sin calificar)</small></span>
        <div class="escala-num-cfg">
          <input class="opt-input boxed ok" type="number" step="any" data-t="lineaValor" value="${esc(p.valor || '')}" placeholder="Valor">
          <label class="pts wide"><span>Tolerancia (±)</span><input type="number" step="any" min="0" data-t="lineaTolerancia" value="${Number(p.tolerancia) || 0}"></label>
        </div>
      </label>`;
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
          ? `<label class="switch-row inline sm"><span class="switch"><input type="checkbox" data-ta="zmManual" ${m.manual ? 'checked' : ''} tabindex="-1"><span class="sw"></span></span><span>Calificar manualmente</span></label>
             ${!m.manual ? `<input class="opt-input boxed ok" data-t="zmAceptadas" value="${esc((m.aceptadas || []).join(' | '))}" placeholder="Respuesta correcta (varias: separa con |)">` : ''}`
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
      case 'campoOpcionTexto': { const c = buscar(p.campos, t, 'data-cid'); buscar(c.opciones, t, 'data-oid').texto = v; break; }
      case 'marcadorTexto': buscar(p.marcadores, t, 'data-mid').texto = v; break;
      case 'distractores': p.distractores = lineas(v); break;
      case 'elementoTexto': buscar(p.elementos, t, 'data-eid').texto = v; break;
      case 'parIzquierda': buscar(p.pares, t, 'data-par').izquierda = v; break;
      case 'parDerecha': buscar(p.pares, t, 'data-par').derecha = v; break;
      case 'huecosTexto': p.segmentos = huecosDom(t); break;
      case 'huecoAceptadas': {
        const fila = t.closest('[data-hi]');
        p.huecos[Number(fila.dataset.hi)] = v.split('|').map((x) => x.trim()).filter(Boolean);
        break;
      }
      case 'escalaOpcion': buscar(p.opciones, t, 'data-oid').texto = v; break;
      case 'escalaMin': p.min = Number(v) || 1; break;
      case 'escalaMax': p.max = Number(v) || 5; break;
      case 'escalaEtiquetaMin': p.etiquetaMin = v; break;
      case 'escalaEtiquetaMax': p.etiquetaMax = v; break;
      case 'escalaCorrectaNum': p.correcta = v.trim(); break;
      case 'numeroMinimo': p.minimo = v; break;
      case 'numeroMaximo': p.maximo = v; break;
      case 'numeroValor': p.valor = v; break;
      case 'numeroTolerancia': p.tolerancia = Number(v) || 0; break;
      case 'numeroDecimales': p.decimales = Math.max(0, Math.min(4, Number(v) || 0)); break;
      case 'numeroUnidad': p.unidad = v; break;
      case 'lineaMin': p.min = Number(v) || 0; break;
      case 'lineaMax': p.max = Number(v) || 100; break;
      case 'lineaPaso': p.paso = Number(v) || 1; break;
      case 'lineaEtiquetaMin': p.etiquetaMin = v; break;
      case 'lineaEtiquetaMax': p.etiquetaMax = v; break;
      case 'lineaValor': p.valor = v; break;
      case 'lineaTolerancia': p.tolerancia = Number(v) || 0; break;
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
      case 'agregarCampo': p.campos.push(nuevoCampoSub(p.campos.length + 1)); break;
      case 'quitarCampo': p.campos = p.campos.filter((c) => c !== buscar(p.campos, b, 'data-cid')); break;
      case 'campoManual': { const c = buscar(p.campos, b, 'data-cid'); c.manual = !c.manual; break; }
      case 'campoModo': {
        const c = buscar(p.campos, b, 'data-cid');
        c.modo = b.dataset.v;
        if (c.modo === 'abierta') { c.correctas = []; } else {
          if (!c.opciones || !c.opciones.length) c.opciones = [{ id: uid(), texto: 'Opción 1' }, { id: uid(), texto: 'Opción 2' }];
          if (c.modo !== 'multiple') c.correctas = (c.correctas || []).slice(0, 1);
        }
        break;
      }
      case 'campoCorrecta': {
        if (!examen) return false;
        const c = buscar(p.campos, b, 'data-cid');
        const oid = b.closest('[data-oid]').dataset.oid;
        if (c.modo === 'multiple') c.correctas = (c.correctas || []).includes(oid) ? c.correctas.filter((x) => x !== oid) : (c.correctas || []).concat(oid);
        else c.correctas = (c.correctas || [])[0] === oid ? [] : [oid];
        break;
      }
      case 'campoAgregarOpcion': { const c = buscar(p.campos, b, 'data-cid'); c.opciones.push({ id: uid(), texto: `Opción ${c.opciones.length + 1}` }); break; }
      case 'campoQuitarOpcion': {
        const c = buscar(p.campos, b, 'data-cid');
        const oid = b.closest('[data-oid]').dataset.oid;
        c.opciones = c.opciones.filter((o) => o.id !== oid);
        c.correctas = (c.correctas || []).filter((x) => x !== oid);
        break;
      }
      case 'puntoModo': p.modo = b.dataset.v; break;
      case 'quitarHueco': {
        const cont = b.parentElement;
        const idx = huecoIndiceAntes(cont, b);
        const texto = b.textContent;
        p.segmentos.splice(idx, 2, (p.segmentos[idx] || '') + texto + (p.segmentos[idx + 1] || ''));
        p.huecos.splice(idx, 1);
        break;
      }
      case 'escalaModo': {
        p.modo = b.dataset.v;
        if (p.modo === 'likert' && (!p.opciones || !p.opciones.length)) p.opciones = MOD_LIKERT.map((texto) => ({ id: uid(), texto }));
        p.correcta = '';
        break;
      }
      case 'escalaCorrecta': {
        if (!examen) return false;
        const oid = b.closest('[data-oid]').dataset.oid;
        p.correcta = p.correcta === oid ? '' : oid;
        break;
      }
      case 'numeroModo': p.modoRespuesta = b.dataset.v; break;
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
            id: uid(), r: 0, modo: 'opciones', correcta: '', aceptadas: [], manual: false,
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
      case 'zmManual': { const m = buscar(p.marcadores, b, 'data-mid'); m.manual = !m.manual; break; }
      default: return false;
    }
    return true;
  }

  // Marca la selección actual (dentro del campo de "Completar espacios") como un espacio a rellenar.
  // Devuelve true si hay que volver a pintar.
  function marcarHueco(cont, p) {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return false;
    const range = sel.getRangeAt(0);
    if (!cont.contains(range.startContainer) || range.startContainer !== range.endContainer || range.startContainer.nodeType !== 3) return false;
    const texto = range.startContainer.nodeValue;
    const seleccion = texto.slice(range.startOffset, range.endOffset).trim();
    if (!seleccion) return false;
    const idx = huecoIndiceAntes(cont, range.startContainer);
    const antes = texto.slice(0, range.startOffset);
    const despues = texto.slice(range.endOffset);
    p.segmentos.splice(idx, 1, antes, despues);
    p.huecos.splice(idx, 0, [seleccion]);
    return true;
  }

  // ---------- Responder ----------
  const selectHtml = (opciones, attrs) => `
    <span class="select full"><select ${attrs}><option value="">Elige…</option>${opciones.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>${ic('down', 'chev')}</span>`;
  const selectHtmlObj = (opciones, attrs) => `
    <span class="select full"><select ${attrs}><option value="">Elige…</option>${(opciones || []).map((o) => `<option value="${esc(o.id)}">${esc(o.texto)}</option>`).join('')}</select>${ic('down', 'chev')}</span>`;

  function responder(p) {
    switch (p.tipo) {
      case 'subrespuestas':
        return `<div class="sub-answers">${p.campos.map((c) => {
          const modo = c.modo || 'abierta';
          let campo;
          if (modo === 'abierta') campo = `<input class="answer-input" autocomplete="off" placeholder="Tu respuesta">`;
          else if (modo === 'select') campo = selectHtmlObj(c.opciones || [], `aria-label="${esc(c.etiqueta)}"`);
          else campo = `<div class="choices">${(c.opciones || []).map((o) => `
            <label class="choice"><input type="${modo === 'multiple' ? 'checkbox' : 'radio'}" name="campo_${esc(c.id)}" value="${esc(o.id)}"><span class="ind ${modo === 'multiple' ? 'checkbox' : 'radio'}">${ic('check')}</span><span>${esc(o.texto)}</span></label>`).join('')}</div>`;
          return `<div class="field sub-campo" data-campo="${esc(c.id)}" data-modo="${modo}"><span>${esc(c.etiqueta)}</span>${campo}</div>`;
        }).join('')}</div>`;
      case 'escala':
        if (p.modo === 'likert') {
          return `<div class="escala-likert" role="radiogroup">${(p.opciones || []).map((o) => `
            <label class="escala-opt"><input type="radio" name="escala" value="${esc(o.id)}"><span class="escala-punto"></span><span class="escala-txt">${esc(o.texto)}</span></label>`).join('')}</div>`;
        }
        return `<div class="escala-numerica">
          ${p.etiquetaMin || p.etiquetaMax ? `<div class="escala-extremos"><span>${esc(p.etiquetaMin || '')}</span><span>${esc(p.etiquetaMax || '')}</span></div>` : ''}
          <div class="escala-fila" role="radiogroup">${Array.from({ length: Math.max(0, p.max - p.min + 1) }, (_, i) => p.min + i).map((v) => `
            <label class="escala-num"><input type="radio" name="escala" value="${v}"><span class="escala-circulo">${v}</span></label>`).join('')}</div>
        </div>`;
      case 'numero':
        return `<div class="numero-input-wrap">
            <input class="answer-input numero-input" type="number" step="${p.decimales ? (1 / Math.pow(10, p.decimales)) : 'any'}" inputmode="decimal" placeholder="0" data-numero>
            ${p.unidad ? `<span class="numero-unidad">${esc(p.unidad)}</span>` : ''}
          </div>
          ${p.decimales ? `<p class="hint">Hasta ${p.decimales} decimal${p.decimales === 1 ? '' : 'es'}.</p>` : ''}`;
      case 'lineaNumerica': {
        const medio = redondear((Number(p.min) + Number(p.max)) / 2);
        return `<div class="linea-num">
          <div class="linea-extremos"><span>${esc(p.etiquetaMin || String(p.min))}</span><strong class="linea-valor" data-linea-valor>${medio}</strong><span>${esc(p.etiquetaMax || String(p.max))}</span></div>
          <input type="range" class="linea-range" min="${p.min}" max="${p.max}" step="${p.paso}" value="${medio}" data-linea data-tocado="0">
        </div>`;
      }
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
    if (p.tipo === 'lineaNumerica') {
      const rango = card.querySelector('[data-linea]');
      const valor = card.querySelector('[data-linea-valor]');
      rango.addEventListener('input', () => {
        rango.dataset.tocado = '1';
        valor.textContent = rango.value;
        limpiar();
      });
    }
    if (p.tipo === 'escala' || p.tipo === 'numero') card.addEventListener('change', limpiar);
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
        card.querySelectorAll('.sub-campo').forEach((w) => {
          const id = w.dataset.campo, modo = w.dataset.modo;
          if (modo === 'multiple') {
            const sel = [...w.querySelectorAll('input:checked')].map((i) => i.value);
            if (sel.length) r[id] = sel;
          } else if (modo === 'unica') {
            const sel = w.querySelector('input:checked');
            if (sel) r[id] = sel.value;
          } else if (modo === 'select') {
            const sel = w.querySelector('select');
            if (sel.value) r[id] = sel.value;
          } else {
            const inp = w.querySelector('input');
            if (inp && inp.value.trim()) r[id] = inp.value.trim();
          }
        });
        return r;
      }
      case 'escala': { const sel = card.querySelector('[name="escala"]:checked'); return sel ? sel.value : null; }
      case 'numero': { const i = card.querySelector('[data-numero]'); return i && i.value.trim() !== '' ? i.value.trim() : null; }
      case 'lineaNumerica': { const i = card.querySelector('[data-linea]'); return i && i.dataset.tocado === '1' ? i.value : null; }
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

  return { LISTA, es, nueva, aplicarTipo, aviso, editor, input, change, click, marcarHueco, responder, montar, leer, detalle, textoPlano, resumen };
})();
