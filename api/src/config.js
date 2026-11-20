import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Node lee .env sin dependencias extra. pg toma de ahí PGHOST, PGPORT, PGUSER, PGPASSWORD y PGDATABASE.
// Si el archivo no existe se usan las variables de entorno del sistema.
try {
  process.loadEnvFile(path.join(RAIZ, '.env'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

process.env.PGDATABASE ||= 'pixel_play';

export const PUERTO_API = Number(process.env.API_PORT) || 3001;
// Sin ADMIN_TOKEN las rutas que crean, modifican o eliminan productos quedan desactivadas
export const TOKEN_ADMIN = process.env.ADMIN_TOKEN || '';
export const HORAS_SESION = 8;
