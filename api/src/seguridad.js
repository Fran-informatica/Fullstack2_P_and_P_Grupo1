import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);
const LARGO_HASH = 64;

// Formato guardado: scrypt$<sal en hex>$<hash en hex>
export async function cifrarPassword(password) {
  const sal = crypto.randomBytes(16);
  const hash = await scrypt(password, sal, LARGO_HASH);
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`;
}

export async function verificarPassword(password, guardado) {
  const [algoritmo, salHex, hashHex] = String(guardado).split('$');
  if (algoritmo !== 'scrypt' || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const hash = await scrypt(password, Buffer.from(salHex, 'hex'), esperado.length);
  return crypto.timingSafeEqual(hash, esperado);
}

export function crearToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Compara en tiempo constante; los hashes igualan el largo, que timingSafeEqual exige
export function sonIguales(a, b) {
  return crypto.timingSafeEqual(Buffer.from(hashToken(a)), Buffer.from(hashToken(b)));
}
