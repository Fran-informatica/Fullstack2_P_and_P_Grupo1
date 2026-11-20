// Utilidades compartidas por las pruebas: proveedores, mocks y datos de ejemplo.
import { render } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { cliente } from '../data/api';
import { PRODUCTOS_INICIALES } from '../data/productosIniciales';
import { crearCompra } from '../utils/boleta';

export const PRODUCTO_MOCK = {
  id: 1,
  title: 'Global Warning',
  price: 15990,
  category: 'Juegos de mesa',
  description: 'Disfruta con tus amigos colaborando por un mundo más sano',
  image: '/assets/img/JuegoTabla3.jpg',
};

export const USUARIO_MOCK = { nombre: 'Ana Pérez', email: 'ana@duoc.cl' };
export const TOKEN_MOCK = 'token-de-prueba';

// Mock del contexto de autenticación: cada función es un espía de Jasmine
export function crearAuthMock(cambios = {}) {
  return {
    usuario: null,
    token: null,
    registrar: jasmine.createSpy('registrar').and.returnValue({ ok: true }),
    login: jasmine.createSpy('login').and.returnValue({ ok: true }),
    logout: jasmine.createSpy('logout'),
    ...cambios,
  };
}

// Muestra la ruta actual para comprobar redirecciones
function UbicacionActual() {
  const location = useLocation();
  return <div data-testid="ubicacion">{location.pathname}</div>;
}

// Renderiza un componente con el carrito real, la autenticación simulada y un router en memoria.
// Si se indica `path`, el componente se monta en esa ruta y cualquier otra muestra la ubicación.
export function renderizar(ui, { auth = crearAuthMock(), carrito = [], ruta = '/', path } = {}) {
  const contenido = path ? (
    <Routes>
      <Route path={path} element={ui} />
      <Route path="*" element={<UbicacionActual />} />
    </Routes>
  ) : (
    ui
  );

  const resultado = render(
    <AuthContext.Provider value={auth}>
      <CartProvider initialCart={carrito}>
        <MemoryRouter initialEntries={[ruta]}>{contenido}</MemoryRouter>
      </CartProvider>
    </AuthContext.Provider>,
  );
  return { auth, ...resultado };
}

export function limpiarAlmacenamiento() {
  window.localStorage.clear();
  window.sessionStorage.clear();
}

// El adaptador recibe la configuración ya procesada por axios: método en minúsculas y cuerpo como texto JSON
function leerConfig(config) {
  return {
    url: `${config.baseURL}${config.url}`,
    metodo: config.method.toUpperCase(),
    headers: config.headers,
    cuerpo: config.data ? JSON.parse(config.data) : undefined,
  };
}

// Datos de una petición registrada por el espía de simularApi (por defecto, la última)
export function llamada(espia, n = espia.calls.count() - 1) {
  return leerConfig(espia.calls.argsFor(n)[0]);
}

// Reemplaza el adaptador de axios por un espía de Jasmine (se restaura solo al terminar cada prueba).
// responder(metodo, ruta, cuerpo, headers) devuelve [estado, datos]; la ruta llega sin el prefijo /api.
export function simularApi(responder) {
  return spyOn(cliente.defaults, 'adapter').and.callFake(async (config) => {
    const { metodo, headers, cuerpo } = leerConfig(config);
    const [estado, datos] = await responder(metodo, config.url, cuerpo, headers);
    const respuesta = {
      data: estado === 204 ? '' : JSON.stringify(datos),
      status: estado,
      statusText: '',
      headers: { 'content-type': 'application/json' },
      config,
    };
    // Un adaptador propio debe rechazar las respuestas de error, igual que el adaptador real de axios
    if (config.validateStatus(estado)) return respuesta;
    throw new AxiosError(`Request failed with status code ${estado}`, AxiosError.ERR_BAD_RESPONSE, config, null, respuesta);
  });
}

// Simula que el servidor no responde: axios rechaza sin respuesta
export function simularSinConexion() {
  return spyOn(cliente.defaults, 'adapter').and.rejectWith(new AxiosError('Network Error', AxiosError.ERR_NETWORK));
}

// API de la tienda en memoria: catálogo inicial y compras del usuario con TOKEN_MOCK
export function simularApiTienda({ compras = [] } = {}) {
  const productos = structuredClone(PRODUCTOS_INICIALES);
  return simularApi((metodo, ruta, cuerpo, headers) => {
    if (metodo === 'GET' && ruta === '/productos') return [200, productos];
    if (metodo === 'GET' && ruta === '/productos?destacados=true') return [200, productos.filter((p) => p.featured)];

    const detalle = ruta.match(/^\/productos\/(\d+)$/);
    if (metodo === 'GET' && detalle) {
      const producto = productos.find((p) => p.id === Number(detalle[1]));
      return producto ? [200, producto] : [404, { error: 'Producto no encontrado.' }];
    }

    if (ruta === '/compras') {
      if (headers.Authorization !== `Bearer ${TOKEN_MOCK}`) return [401, { error: 'Debes iniciar sesión.' }];
      if (metodo === 'GET') return [200, compras];
      const items = cuerpo.items.map((i) => ({ ...productos.find((p) => p.id === i.id), quantity: i.quantity }));
      const compra = crearCompra({ numero: compras.length + 1, fecha: new Date(), usuario: USUARIO_MOCK, items });
      compras.unshift(compra);
      return [201, compra];
    }
    return [404, { error: 'Ruta no encontrada.' }];
  });
}
