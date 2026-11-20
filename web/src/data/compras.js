// Compras de la cuenta con sesión iniciada. La API identifica al cliente por el token, no por un correo enviado.
import { pedir } from './api';

// Más reciente primero
export function listarMisCompras(token) {
  return pedir('/compras', { token });
}

// Solo se envían id y cantidad: la API toma los precios de la base de datos
export function registrarCompra(token, items) {
  const cuerpo = { items: items.map(({ id, quantity }) => ({ id, quantity })) };
  return pedir('/compras', { metodo: 'POST', cuerpo, token });
}
