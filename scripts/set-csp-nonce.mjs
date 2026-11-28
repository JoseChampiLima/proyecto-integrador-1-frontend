import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Genera un nonce aleatorio por build y lo escribe en:
 *   - dist/.../browser/index.html  (atributo ngCspNonce de <app-root>)
 *   - dist/.../browser/web.config  (directiva style-src de la CSP)
 *
 * Se ejecuta automaticamente al final de `npm run build`.
 */

const projectRoot = normalize(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const outDir = join(projectRoot, 'dist', 'proyecto-integrador-1-frontend', 'browser');

const nonce = randomBytes(18).toString('base64');
const placeholder = '__CSP_NONCE__';
const targets = ['index.html', 'web.config'];

for (const file of targets) {
  const filePath = join(outDir, file);

  let content;
  try {
    content = await readFile(filePath, 'utf8');
  } catch {
    console.error(`No se encontro ${filePath}. Ejecuta primero "ng build".`);
    process.exit(1);
  }

  if (!content.includes(placeholder)) {
    console.warn(`Aviso: ${file} no contiene ${placeholder}; no se modifico.`);
    continue;
  }

  await writeFile(filePath, content.split(placeholder).join(nonce), 'utf8');
}

console.log(`Nonce CSP generado: ${nonce}`);
