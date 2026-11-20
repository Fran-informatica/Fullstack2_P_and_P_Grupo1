import { CATEGORIAS } from './dominio/catalogo.js';

const MAX_CANTIDAD = 99;
const MAX_ITEMS = 50;

const esEnteroEntre = (valor, min, max) => Number.isInteger(valor) && valor >= min && valor <= max;

// Devuelve [{ id, quantity }] sin ids repetidos, o null si el carrito no es válido.
// Solo se aceptan id y cantidad: el precio siempre se lee desde la base, nunca desde el cliente.
export function normalizarItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) return null;
  const cantidades = new Map();
  for (const item of items) {
    if (!esEnteroEntre(item?.id, 1, 2 ** 31 - 1) || !esEnteroEntre(item?.quantity, 1, MAX_CANTIDAD)) return null;
    cantidades.set(item.id, (cantidades.get(item.id) ?? 0) + item.quantity);
  }
  const resultado = [...cantidades].map(([id, quantity]) => ({ id, quantity }));
  return resultado.every((i) => i.quantity <= MAX_CANTIDAD) ? resultado : null;
}

const REGLAS_PRODUCTO = {
  title: (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 120,
  price: (v) => esEnteroEntre(v, 0, 100_000_000),
  category: (v) => CATEGORIAS.includes(v),
  featured: (v) => typeof v === 'boolean',
  description: (v) => typeof v === 'string' && v.length <= 2000,
  image: (v) => typeof v === 'string' && v.length <= 500,
  images: (v) => Array.isArray(v) && v.length <= 10 && v.every((i) => typeof i === 'string' && i.length <= 500),
  video: (v) => v === null || (typeof v === 'string' && v.length <= 500),
};

export const CAMPOS_PRODUCTO = Object.keys(REGLAS_PRODUCTO);

// Con parcial = true (actualizar) no se exigen los campos obligatorios. Los campos desconocidos se ignoran.
export function validarProducto(datos, { parcial = false } = {}) {
  if (!datos || typeof datos !== 'object') return { error: 'Datos de producto inválidos.' };
  const campos = {};
  for (const campo of CAMPOS_PRODUCTO) {
    if (datos[campo] === undefined) continue;
    if (!REGLAS_PRODUCTO[campo](datos[campo])) return { error: `El campo "${campo}" no es válido.` };
    campos[campo] = campo === 'title' ? datos[campo].trim() : datos[campo];
  }
  if (!parcial) {
    const faltante = ['title', 'price', 'category'].find((c) => campos[c] === undefined);
    if (faltante) return { error: `Falta el campo "${faltante}".` };
  }
  if (Object.keys(campos).length === 0) return { error: 'No hay campos para guardar.' };
  return { campos };
}
