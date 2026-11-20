// Productos de Pixel & Play desde la API (tabla productos en PostgreSQL), con operaciones CRUD.
import { ErrorApi, pedir } from './api';
import { CATEGORIAS, PRODUCTOS_INICIALES } from './productosIniciales';

export { CATEGORIAS, PRODUCTOS_INICIALES };

// Leer
export function listarProductos() {
  return pedir('/productos');
}

export function listarDestacados() {
  return pedir('/productos?destacados=true');
}

export async function obtenerProducto(id) {
  try {
    return await pedir(`/productos/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 404) return null;
    throw error;
  }
}

export function filtrarPorCategoria(productos, categoria) {
  if (categoria === 'todas') return productos;
  return productos.filter((p) => p.category === categoria);
}

// Crear, actualizar y eliminar requieren el ADMIN_TOKEN configurado en la API
export function crearProducto(datos, tokenAdmin) {
  return pedir('/productos', { metodo: 'POST', cuerpo: datos, token: tokenAdmin });
}

export async function actualizarProducto(id, cambios, tokenAdmin) {
  try {
    return await pedir(`/productos/${encodeURIComponent(id)}`, { metodo: 'PUT', cuerpo: cambios, token: tokenAdmin });
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 404) return null;
    throw error;
  }
}

export async function eliminarProducto(id, tokenAdmin) {
  try {
    await pedir(`/productos/${encodeURIComponent(id)}`, { metodo: 'DELETE', token: tokenAdmin });
    return true;
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 404) return false;
    throw error;
  }
}
