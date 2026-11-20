import { ErrorApi } from '../data/api';
import {
  PRODUCTOS_INICIALES,
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  filtrarPorCategoria,
  listarDestacados,
  listarProductos,
  obtenerProducto,
} from '../data/productos';
import { simularApi, simularApiTienda } from './helpers';

const llamada = (espia, n = 0) => {
  const [url, opciones] = espia.calls.argsFor(n);
  return { url, metodo: opciones.method, headers: opciones.headers, cuerpo: opciones.body && JSON.parse(opciones.body) };
};

describe('Fuente de datos de productos (API con fetch simulado)', () => {
  it('lista los 3 productos con los precios nuevos pidiendo GET /api/productos', async () => {
    const fetch = simularApiTienda();
    const productos = await listarProductos();
    expect(productos.map((p) => p.title)).toEqual(['Global Warning', 'Playmat', 'Porta Lápices']);
    expect(productos.map((p) => p.price)).toEqual([15990, 12990, 5990]);
    expect(llamada(fetch)).toEqual(jasmine.objectContaining({ url: '/api/productos', metodo: 'GET' }));
  });

  it('obtiene un producto por id (también como texto) y devuelve null si la API responde 404', async () => {
    simularApiTienda();
    expect((await obtenerProducto('2')).title).toBe('Playmat');
    expect(await obtenerProducto(99)).toBeNull();
  });

  it('pide solo los destacados y filtra por categoría en el navegador', async () => {
    const fetch = simularApiTienda();
    expect((await listarDestacados()).map((p) => p.title)).toEqual(['Global Warning', 'Playmat']);
    expect(llamada(fetch).url).toBe('/api/productos?destacados=true');
    expect(filtrarPorCategoria(PRODUCTOS_INICIALES, 'todas').length).toBe(3);
    expect(filtrarPorCategoria(PRODUCTOS_INICIALES, 'Accesorios de escritorio').map((p) => p.id)).toEqual([2, 3]);
  });

  it('crea un producto con POST, enviando los datos y el token de administración', async () => {
    const fetch = simularApi((metodo, ruta, cuerpo) => [201, { ...cuerpo, id: 4 }]);
    const nuevo = await crearProducto({ title: 'Dados', price: 2990, category: 'Juegos de mesa' }, 'admin-123');
    expect(nuevo.id).toBe(4);
    const { metodo, headers, cuerpo } = llamada(fetch);
    expect(metodo).toBe('POST');
    expect(headers.Authorization).toBe('Bearer admin-123');
    expect(cuerpo).toEqual({ title: 'Dados', price: 2990, category: 'Juegos de mesa' });
  });

  it('actualiza con PUT y devuelve null si el producto no existe', async () => {
    simularApi((metodo, ruta, cuerpo) =>
      ruta === '/productos/3' ? [200, { ...PRODUCTOS_INICIALES[2], ...cuerpo }] : [404, { error: 'Producto no encontrado.' }],
    );
    expect((await actualizarProducto(3, { price: 4990 }, 'admin-123')).price).toBe(4990);
    expect(await actualizarProducto(99, { price: 1 }, 'admin-123')).toBeNull();
  });

  it('elimina con DELETE y avisa si no existía', async () => {
    const fetch = simularApi((metodo, ruta) => (ruta === '/productos/1' ? [204] : [404, { error: 'Producto no encontrado.' }]));
    expect(await eliminarProducto(1, 'admin-123')).toBeTrue();
    expect(await eliminarProducto(7, 'admin-123')).toBeFalse();
    expect(llamada(fetch).metodo).toBe('DELETE');
  });

  it('propaga el mensaje de error de la API (por ejemplo, sin token de administración)', async () => {
    simularApi(() => [401, { error: 'Token de administración inválido.' }]);
    await expectAsync(crearProducto({ title: 'X', price: 1, category: 'Juegos de mesa' })).toBeRejectedWith(
      jasmine.objectContaining({ estado: 401, message: 'Token de administración inválido.' }),
    );
  });

  it('avisa con un ErrorApi si el servidor no responde (mock de fetch que falla)', async () => {
    spyOn(window, 'fetch').and.rejectWith(new TypeError('Failed to fetch'));
    const error = await listarProductos().catch((e) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error.estado).toBe(0);
    expect(error.message).toBe('No se pudo conectar con el servidor. Intenta nuevamente.');
  });
});
