# Analisis del escaneo OWASP ZAP

Documento de apoyo para el informe: explica cada alerta del escaneo, su causa real,
que se corrigio en el proyecto y que queda como riesgo aceptado o depende del backend/infraestructura.

> **Importante:** el escaneo se hizo contra `http://localhost:4200`, que es el servidor
> de desarrollo de Angular (`ng serve`). Ese servidor **no es el que se despliega**:
> sirve los archivos fuente, el cache de Vite y utilidades de depuracion. Varias alertas
> desaparecen simplemente escaneando el build de produccion.

## Resumen de alertas

| # | Alerta | Riesgo / Confianza | Origen | Estado |
|---|--------|--------------------|--------|--------|
| 1 | Ruta Transversal (`/@fs/D:/.../vite/deps/chunk-*.js`) | Alto / Baja | Servidor de desarrollo (Vite) | Falso positivo en produccion |
| 2 | CSP: directiva sin fallback (`/robots.txt`) | Medio / Alta | `robots.txt` no existia (404) | Corregido |
| 3 | CSP: `style-src unsafe-inline` | Medio / Alta | Angular inyecta estilos en runtime | Mitigado / aceptado |
| 4 | HSTS no establecido (`content-autofill.googleapis.com`) | Bajo / Alta | Dominio de Google, no es la app | No aplica |
| 5 | Divulgacion de marcas de tiempo Unix (`chunk-*.js?v=...`) | Bajo / Baja | Cache de Vite en desarrollo | No aplica en produccion |
| 6 | Recuperado de la cache (`dl.google.com`) | Informativo / Media | Dominio de Google | No aplica |
| 7 | Aplicacion Web Moderna (`/`) | Informativo / Media | Es una SPA con Angular | No aplica |
| 8 | Informacion sensible en URL (`/?token=...`) | Informativo / Media | Parametro ajeno al codigo del frontend | Sin cambios en codigo |
| 9 | Comentarios sospechosos (`/main.js`) | Informativo / Media | Bundle de desarrollo sin minificar | Corregido / no aplica en produccion |
| 10 | Reexaminar Cache-Control (`content-autofill.googleapis.com`) | Informativo / Baja | Dominio de Google | No aplica |

## Detalle y correcciones

### 1. Ruta Transversal (Path Traversal) — Alto

ZAP solicito `http://localhost:4200/@fs/D:/UTP/.../node_modules/.vite/deps/chunk-JRFR6BLO.js`.
Ese endpoint `@fs/` solo existe en el **dev server de Vite/Angular**: permite cargar
dependencias precompiladas desde el disco durante el desarrollo. No se publica en el
build de produccion, por lo que no es explotable en el sistema desplegado.

- No se modifica codigo: es una caracteristica del servidor de desarrollo.
- Al volver a escanear se debe usar el build de produccion (ver seccion final).
- Ademas, `scripts/serve-prod.mjs` normaliza y valida las rutas, bloqueando `..` y rutas
  fuera del directorio del build (responde 403).

### 2. CSP: Failure to Define Directive with No Fallback — Medio

Se disparo sobre `GET /robots.txt`, que devolvia 404. Se agrego `public/robots.txt`
para que exista y para indicar a los buscadores que no indexen zonas privadas.
La CSP configurada ya define `default-src` (el fallback que pide la alerta).

### 3. CSP: style-src unsafe-inline — Medio

Angular inyecta los estilos de cada componente como etiquetas `<style>` en tiempo de
ejecucion y, en produccion, inserta el CSS critico directamente en `index.html`
(`optimization.styles.inlineCritical`). Por eso `style-src` necesita `'unsafe-inline'`.

- Se mantiene `script-src 'self'` (sin `'unsafe-inline'`), que es donde el riesgo XSS es real.
- Se agrego `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` y `frame-ancestors 'none'`.
- Riesgo aceptado y documentado. Eliminarlo requeriria nonces por peticion generados en el
  servidor (IIS) o hashes recalculados en cada build.

### 4, 6 y 10. Alertas sobre `content-autofill.googleapis.com` y `dl.google.com`

Son peticiones del navegador (autocompletado de Chrome) y del propio escaneo a dominios
de Google. No pertenecen a la aplicacion y no se pueden corregir desde este repositorio.
En ZAP conviene excluirlas del contexto o configurar el navegador sin autocompletado.

### 5. Divulgacion de marcas de tiempo Unix — Bajo

El archivo afectado es `chunk-*.js?v=b1c12a91`, generado por el cache de Vite durante
el desarrollo. En el build de produccion los nombres llevan hash de contenido, no timestamps.

### 7. Aplicacion Web Moderna — Informativo

Detecta que la app es una SPA (Angular). Es informativo, no es una vulnerabilidad.

### 8. Informacion sensible en URL — Informativo

La URL `/?token=bwf3FzvnPQeD` **no la genera el frontend**: el codigo guarda el JWT en
`localStorage`/`sessionStorage` y lo envia por la cabecera `Authorization`
(`src/app/core/auth/auth.service.ts` y `auth.interceptor.ts`). No hay ninguna ruta ni
servicio que coloque el token en la query string.

Recomendaciones para el backend / proceso de recuperacion de contrasena:

- No enviar tokens ni codigos en la URL. Usar un formulario POST o un codigo de un solo uso.
- Si se usa un enlace de recuperacion, que el token sea de un solo uso, con caducidad corta
  y que se invalide al cambiar la contrasena.

Ademas, se agrego validacion estricta del parametro `returnUrl` en el login para evitar
redirecciones abiertas: solo se aceptan rutas internas que empiezan con `/` (nunca `//dominio`).

### 9. Comentarios sospechosos en `/main.js` — Informativo

En desarrollo el bundle se sirve sin minificar y conserva comentarios y `console.log`.
En el build de produccion Angular elimina comentarios y minifica. Aun asi se limpiaron
los `console.log` que imprimian objetos de respuesta y el comentario `Mock API call`,
y se elimino el retardo artificial de 1.5 s que simulaba una llamada de API en el login.

## Cambios aplicados

| Archivo | Cambio |
|---------|--------|
| `public/robots.txt` | Nuevo. Elimina el 404 y restringe la indexacion de rutas privadas. |
| `public/web.config` | Nuevo (antes solo existia en `dist/` y se perdia en cada build). Incluye CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, cache de assets, `index.html` sin cache y **fallback de rutas SPA para IIS**. |
| `angular.json` | Cabeceras del dev-server alineadas con produccion + dominios de Google Fonts permitidos en la CSP (antes la CSP bloqueaba las fuentes del proyecto). |
| `src/app/features/auth/pages/login/login.component.ts` | Se elimino el `setTimeout` con el comentario "Mock API call"; `returnUrl` validado contra redirecciones abiertas; se quito un `console.log` con datos de respuesta. |
| `src/app/features/{reservas,usuarios,admin}/...` | Se eliminaron `console.log` que imprimian objetos de datos. |
| `scripts/serve-prod.mjs` + `package.json` | Servidor local del build con las mismas cabeceras de seguridad y proteccion de rutas, para re-escanear en condiciones reales (`npm run serve:prod`). |

## Como volver a escanear correctamente

1. Generar el build de produccion:

   ```bash
   npm run build
   ```

2. Servirlo con cabeceras equivalentes a IIS:

   ```bash
   npm run serve:prod
   ```

   Queda en `http://localhost:4300`. (En el servidor real se usa `dist/.../browser/web.config` con IIS.)

3. En ZAP escanear `http://localhost:4300` y no `http://localhost:4200`.

4. Excluir del contexto/escaneo los dominios de terceros (`googleapis.com`, `dl.google.com`)
   y las URLs que empiecen con `/?token=` si aparecen por historial del navegador.

## Recomendaciones que dependen del backend (no del frontend)

- Guardar el JWT en cookie `HttpOnly; Secure; SameSite=Strict` en lugar de `localStorage`
  (reduce el impacto de un XSS).
- Implementar `Content-Security-Policy` report-only primero y revisar reportes antes de bloquear.
- Rate limiting y bloqueo por intentos fallidos en `/auth/login`.
- Validar y sanear todas las entradas en el API (el frontend no es una barrera de seguridad).
- Servir siempre por HTTPS y redirigir HTTP a HTTPS (ademas de la cabecera HSTS ya configurada).
