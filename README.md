# Portal de Capacitación

Portal para capacitadores estilo Microsoft Forms: inicias sesión, ves tus formularios, los editas, compartes una liga y el examen se califica solo.

- **Página**: GitHub Pages (HTML/CSS/JS, sin compilar nada).
- **Datos y login**: Supabase (gratis).
- Sin configurar Supabase, funciona en **modo demo** (todo se guarda en tu navegador) para que lo pruebes.

## Qué incluye

- Login y registro de capacitadores.
- Panel "Mis formularios" con búsqueda, duplicar, compartir y eliminar.
- Editor con autoguardado y 11 tipos de pregunta (ver abajo).
- Pestaña **Diseño**: 5 composiciones (Clásica, Portada, Lateral, Paso a paso, Minimalista), 12 plantillas (oscuras y claras), 12 tipos de letra, 4 tamaños, color de acento e imagen de encabezado.
- Aviso automático en el panel si tu base de datos de Supabase necesita actualizarse (con botón para copiar el SQL).
- Exámenes: puntos por pregunta, respuestas correctas, calificación aprobatoria y calificación automática **en el servidor** (quien responde nunca ve las respuestas correctas antes de enviar).
- Liga pública para responder (sin cuenta), vista previa, abrir/cerrar respuestas.
- Resultados: estadísticas, respuestas individuales, resumen por pregunta y exportación a CSV.

## Configuración (una sola vez)

### 1. Supabase

1. Crea una cuenta en <https://supabase.com> y un proyecto nuevo.
2. Ve a **SQL Editor**, pega todo el contenido de [`supabase.sql`](supabase.sql) y dale **Run**.
3. Ve a **Project Settings → API** y copia la **Project URL** y la **anon public key**.
4. Pégalas en [`js/config.js`](js/config.js):

   ```js
   window.CONFIG = {
     SUPABASE_URL: 'https://xxxx.supabase.co',
     SUPABASE_ANON_KEY: 'eyJhbGciOi...',
     NOMBRE: 'Portal de Capacitación'
   };
   ```

   La *anon key* es pública por diseño; los datos están protegidos por las reglas (RLS) del archivo SQL.

5. En **Authentication → URL Configuration**, pon en *Site URL* la dirección de tu GitHub Pages (paso 2).

Opcional:
- Si no quieres que se tenga que confirmar el correo al registrarse: **Authentication → Providers → Email → Confirm email** (desactivar).
- Cuando ya tengas creadas las cuentas de capacitador, puedes impedir registros nuevos en **Authentication → Providers → Email → Allow new users to sign up** (desactivar).

### 2. GitHub Pages

1. En el repositorio: **Settings → Pages**.
2. *Source*: **Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. Tu portal quedará en `https://<usuario>.github.io/capacitacion/`.

## Archivos

| Archivo | Para qué |
| --- | --- |
| `index.html` | Página única de la app |
| `css/styles.css` | Diseño (modo oscuro negro/morado) |
| `js/app.js` | Pantallas: login, panel, editor, respuestas y formulario público |
| `js/supabase-backend.js` | Conexión con Supabase |
| `js/local-backend.js` | Modo demo (localStorage) |
| `js/calificacion.js` | Reglas de calificación (demo y revisión de resultados) |
| `js/tipos.js` | Tipos interactivos: editor, respuesta y revisión |
| `js/diseno.js` | Plantillas, fuentes y tamaños |
| `js/ui.js` | Iconos y utilidades compartidas |
| `supabase.sql` | Tablas, seguridad y calificación en Supabase |

## Tipos de pregunta

Básicas: opción única, opción múltiple, verdadero/falso, respuesta corta y párrafo.
Interactivas (las compuestas dan **crédito parcial**):

| Tipo | Cómo responde | Cómo se califica |
| --- | --- | --- |
| `subrespuestas` | Un campo de texto por etiqueta | Proporción de campos correctos |
| `puntoImagen` | Toca la imagen (se guarda x/y en %) | Correcto si cae dentro de alguna zona |
| `etiquetarImagen` | Elige la etiqueta de cada punto numerado | Proporción de puntos correctos |
| `ordenar` | Arrastra (o usa flechas) | Proporción de posiciones correctas |
| `relacionar` | Líneas entre columnas (en celular, listas) | Proporción de pares correctos |
| `huecos` | Escribe dentro del párrafo | Proporción de espacios correctos |

Los textos se comparan sin mayúsculas, acentos ni espacios extra. Quien responde nunca recibe las respuestas correctas: la versión pública las quita, mezcla los elementos a ordenar y ordena alfabéticamente los bancos de opciones.

### Modelos de datos

Cada pregunta comparte `{ id, tipo, texto, obligatoria, puntos }` y agrega:

```jsonc
// subrespuestas → respuesta: { "c1": "incendio", "c2": "humo" }
{ "campos": [{ "id": "c1", "etiqueta": "Causa", "aceptadas": ["fuego", "incendio"] }] }

// puntoImagen → respuesta: { "x": 27.4, "y": 51.2 }  (porcentajes)
// r = radio en % del ancho; aspecto = alto/ancho de la imagen
{ "imagen": "data:image/jpeg;base64,...", "aspecto": 0.625, "zonas": [{ "x": 25, "y": 50, "r": 8 }] }

// etiquetarImagen → respuesta: { "k1": "Casco", "k2": "Guantes" }
{ "imagen": "...", "aspecto": 0.625,
  "marcadores": [{ "id": "k1", "x": 25, "y": 50, "texto": "Casco" }], "distractores": ["Botas"] }

// ordenar (guardado en el orden correcto) → respuesta: ["e1", "e2", "e3"]
{ "elementos": [{ "id": "e1", "texto": "Dar la alarma" }, { "id": "e2", "texto": "Evacuar" }] }

// relacionar → respuesta: { "p1": "Sólidos", "p2": "Líquidos" }
{ "pares": [{ "id": "p1", "izquierda": "Clase A", "derecha": "Sólidos" }], "distractores": ["Metales"] }

// huecos: se escribe "El número es [911] y el extintor [ABC|PQS]"  → respuesta: ["911", "pqs"]
{ "plantilla": "...", "segmentos": ["El número es ", " y el extintor ", ""], "huecos": [["911"], ["ABC", "PQS"]] }
```

El diseño del formulario se guarda en `diseno`:
`{ "composicion": "pasos", "plantilla": "galaxia", "fuente": "Poppins", "tamano": "grande", "acento": "#db2777", "encabezado": "data:image/..." }`.

## Reglas de calificación

- **Opción única / Verdadero-Falso**: puntos completos si eligió la correcta.
- **Opción múltiple**: puntos completos solo si marcó exactamente todas las correctas.
- **Respuesta corta**: compara con las respuestas aceptadas sin distinguir mayúsculas, acentos ni espacios extra.
- **Párrafo**: no se califica.
- **Tipos interactivos**: ver la tabla de "Tipos de pregunta".

> Cada vez que actualices el portal, vuelve a ejecutar `supabase.sql` en Supabase (se puede correr varias veces sin perder datos).
