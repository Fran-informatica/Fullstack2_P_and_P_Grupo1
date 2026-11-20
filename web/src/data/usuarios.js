// Registro, inicio y cierre de sesión contra la API. Las contraseñas se guardan cifradas en el servidor.
import { pedir } from './api';

// Devuelven { ok, ... } en vez de lanzar errores para que los formularios muestren el mensaje directamente
export async function registrarUsuario({ nombre, email, password }) {
  try {
    const { usuario } = await pedir('/usuarios', { metodo: 'POST', cuerpo: { nombre, email, password } });
    return { ok: true, usuario };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function autenticarUsuario(email, password) {
  try {
    const { usuario, token } = await pedir('/sesiones', { metodo: 'POST', cuerpo: { email, password } });
    return { ok: true, usuario, token };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export function cerrarSesion(token) {
  return pedir('/sesiones', { metodo: 'DELETE', token });
}
