# Portal de Capacitación

Portal para capacitadores estilo Microsoft Forms: inicias sesión, ves tus formularios, los editas, compartes una liga y el examen se califica solo.

- **Página**: GitHub Pages (HTML/CSS/JS, sin compilar nada).
- **Datos y login**: Supabase (gratis).
- Sin configurar Supabase, funciona en **modo demo** (todo se guarda en tu navegador) para que lo pruebes.

## Qué incluye

- Login y registro de capacitadores.
- Panel "Mis formularios" con búsqueda, duplicar, compartir y eliminar.
- Editor con autoguardado: opción única, opción múltiple, verdadero/falso, respuesta corta y párrafo.
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
| `js/calificacion.js` | Reglas de calificación del modo demo |
| `supabase.sql` | Tablas, seguridad y calificación en Supabase |

## Reglas de calificación

- **Opción única / Verdadero-Falso**: puntos completos si eligió la correcta.
- **Opción múltiple**: puntos completos solo si marcó exactamente todas las correctas.
- **Respuesta corta**: compara con las respuestas aceptadas sin distinguir mayúsculas, acentos ni espacios extra.
- **Párrafo**: no se califica.
