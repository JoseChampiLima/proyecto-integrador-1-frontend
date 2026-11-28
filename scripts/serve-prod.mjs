import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Servidor estatico local para probar el build de produccion de Angular
 * con las mismas cabeceras de seguridad que public/web.config (IIS).
 *
 *   npm run build
 *   npm run serve:prod      -> http://localhost:4300
 *
 * Sirve para volver a pasar OWASP ZAP sobre el build real (no sobre `ng serve`)
 * y demostrar que las alertas del dev-server ya no aparecen.
 */

const projectRoot = normalize(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const root = normalize(join(projectRoot, 'dist', 'proyecto-integrador-1-frontend', 'browser'));
const port = Number(process.env['PORT'] ?? 4300);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const SECURITY_HEADERS = (nonce) => ({
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; " +
    `style-src 'self' 'nonce-${nonce}'; ` +
    "img-src 'self' data: blob:; font-src 'self' data:; " +
    "connect-src 'self' https://reservas.com http://localhost:8080; " +
    "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
});

function isInsideRoot(filePath) {
  const normalizedRoot = root.toLowerCase();
  const normalizedFile = filePath.toLowerCase();
  return normalizedFile === normalizedRoot || normalizedFile.startsWith(normalizedRoot + sep);
}

function send(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(res, 405, 'Metodo no permitido');
    }

    const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    let pathname;

    try {
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
      return send(res, 400, 'Solicitud invalida');
    }

    if (pathname.includes('\0')) {
      return send(res, 400, 'Solicitud invalida');
    }

    let filePath = normalize(join(root, pathname));

    // Bloquea cualquier intento de salir del directorio del build
    if (!isInsideRoot(filePath)) {
      return send(res, 403, 'Prohibido');
    }

    let fileStat = await stat(filePath).catch(() => null);

    if (fileStat?.isDirectory()) {
      filePath = join(filePath, 'index.html');
      fileStat = await stat(filePath).catch(() => null);
    }

    // Fallback de rutas de la SPA
    if (!fileStat?.isFile()) {
      filePath = join(root, 'index.html');
      fileStat = await stat(filePath).catch(() => null);
    }

    if (!fileStat?.isFile()) {
      return send(res, 404, 'No encontrado');
    }

    let body = await readFile(filePath);
    const extension = extname(filePath).toLowerCase();
    const isHtml = extension === '.html' || extension === '.htm';

    // Nonce aleatorio por respuesta: se inyecta en el HTML y en la cabecera CSP
    const nonce = randomBytes(16).toString('base64');

    if (isHtml) {
      const html = body.toString('utf8');
      const withNonce = html.includes('ngCspNonce=')
        ? html.replace(/ngCspNonce="[^"]*"/g, `ngCspNonce="${nonce}"`)
        : html.replace('<app-root', `<app-root ngCspNonce="${nonce}"`);
      body = Buffer.from(withNonce, 'utf8');
    }

    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] ?? 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': isHtml
        ? 'no-store, no-cache, must-revalidate'
        : 'public, max-age=31536000, immutable',
      ...SECURITY_HEADERS(nonce),
    });

    if (req.method === 'HEAD') {
      return res.end();
    }

    res.end(body);
  } catch (error) {
    console.error(error);
    send(res, 500, 'Error interno');
  }
});

server.listen(port, () => {
  console.log(`Build de produccion servido en http://localhost:${port}`);
  console.log(`Directorio: ${root}`);
});
