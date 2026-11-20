// Único punto de salida hacia la API. Las rutas son relativas: Vite (dev y preview) reenvía /api al servidor.
import axios from 'axios';

const BASE = '/api';

// Instancia compartida; las pruebas reemplazan su adaptador para responder sin servidor
export const cliente = axios.create({ baseURL: BASE, headers: { Accept: 'application/json' } });

export class ErrorApi extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
  }
}

export async function pedir(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  try {
    // axios convierte el cuerpo a JSON, agrega Content-Type y rechaza las respuestas 4xx y 5xx
    const respuesta = await cliente.request({
      url: ruta,
      method: metodo,
      data: cuerpo,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return respuesta.status === 204 ? null : respuesta.data;
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error;
    // Sin respuesta: el servidor no está disponible o se cortó la conexión
    if (!error.response) {
      throw new ErrorApi('No se pudo conectar con el servidor. Intenta nuevamente.', 0);
    }
    const { status, data } = error.response;
    throw new ErrorApi(data?.error ?? `Error del servidor (${status}).`, status);
  }
}
