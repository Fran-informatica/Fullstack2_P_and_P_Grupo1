// Pruebas de páginas que combinan componentes, contexto y datos.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import NavbarUI from '../components/Navbar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Cart from '../pages/Cart';
import Home from '../pages/Home';
import ProductDetail from '../pages/ProductDetail';
import Products from '../pages/Products';
import Profile from '../pages/Profile';
import { crearCompra } from '../utils/boleta';
import {
  TOKEN_MOCK,
  USUARIO_MOCK,
  crearAuthMock,
  limpiarAlmacenamiento,
  renderizar,
  simularApi,
  simularApiTienda,
} from './helpers';

const ITEM = { id: 1, title: 'Global Warning', price: 15990, image: '/assets/img/JuegoTabla3.jpg', quantity: 1 };

describe('Navbar', () => {
  it('muestra la cantidad de unidades del carrito en el contador', () => {
    renderizar(<NavbarUI />, { carrito: [{ ...ITEM, quantity: 3 }] });
    expect(screen.getByTestId('cart-badge').textContent).toBe('3');
  });

  it('sin sesión muestra Ingresar y Registrarse', () => {
    renderizar(<NavbarUI />);
    expect(screen.getByText('Ingresar')).toBeTruthy();
    expect(screen.queryByText('Cerrar sesión')).toBeNull();
  });

  it('con sesión saluda al usuario y llama a logout (mock) al cerrar sesión', () => {
    const { auth } = renderizar(<NavbarUI />, { auth: crearAuthMock({ usuario: USUARIO_MOCK }) });
    expect(screen.getByText('Hola, Ana Pérez')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });
});

describe('Catálogo y detalle', () => {
  beforeEach(() => simularApiTienda());

  it('muestra "Cargando" mientras llega la respuesta y luego los destacados del inicio', async () => {
    renderizar(<Home />);
    expect(screen.getByRole('status')).toBeTruthy();
    const titulos = (await screen.findAllByRole('heading', { level: 3 })).map((h) => h.textContent);
    expect(titulos).toEqual(['Global Warning', 'Playmat']);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('filtra el catálogo por categoría al elegir un filtro', async () => {
    renderizar(<Products />);
    expect((await screen.findAllByRole('heading', { level: 3 })).length).toBe(3);
    fireEvent.click(screen.getByRole('button', { name: 'Juegos de mesa' }));
    const titulos = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titulos).toEqual(['Global Warning']);
  });

  it('muestra el detalle con el video solo si el producto lo tiene', async () => {
    renderizar(<ProductDetail />, { ruta: '/producto/2', path: '/producto/:id' });
    expect(await screen.findByRole('heading', { name: 'Playmat' })).toBeTruthy();
    expect(screen.getByText('$12.990')).toBeTruthy();
    expect(screen.getByTestId('video-producto')).toBeTruthy();
  });

  it('muestra "Producto no encontrado" con un id inexistente', async () => {
    renderizar(<ProductDetail />, { ruta: '/producto/99', path: '/producto/:id' });
    expect(await screen.findByText('Producto no encontrado')).toBeTruthy();
    expect(screen.queryByTestId('video-producto')).toBeNull();
  });
});

describe('Errores de conexión con la API', () => {
  it('muestra el mensaje de error si el servidor no responde', async () => {
    spyOn(window, 'fetch').and.rejectWith(new TypeError('Failed to fetch'));
    renderizar(<Products />);
    expect(await screen.findByText('No se pudo conectar con el servidor. Intenta nuevamente.')).toBeTruthy();
    expect(screen.queryAllByRole('heading', { level: 3 }).length).toBe(0);
  });
});

describe('Carrito', () => {
  it('muestra un aviso cuando el carrito está vacío', () => {
    renderizar(<Cart />);
    expect(screen.getByText('Tu carrito está vacío')).toBeTruthy();
  });

  it('aumenta la cantidad y recalcula subtotal y total', () => {
    renderizar(<Cart />, { carrito: [ITEM] });
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Global Warning' }));
    expect(screen.getByTestId('cantidad-1').textContent).toBe('2');
    expect(screen.getByTestId('subtotal-1').textContent).toBe('$31.980');
    expect(screen.getByTestId('carrito-total').textContent).toContain('$31.980');
  });

  it('quita el producto al bajar la cantidad a 0', () => {
    renderizar(<Cart />, { carrito: [ITEM] });
    fireEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad de Global Warning' }));
    expect(screen.getByText('Tu carrito está vacío')).toBeTruthy();
  });

  it('deshabilita Comprar si no hay sesión', () => {
    renderizar(<Cart />, { carrito: [ITEM] });
    expect(screen.getByRole('button', { name: 'Comprar' }).disabled).toBeTrue();
    expect(screen.getByText('Inicia sesión')).toBeTruthy();
  });

  it('con sesión envía la compra a la API, vacía el carrito y redirige al perfil', async () => {
    const fetch = simularApiTienda();
    renderizar(<Cart />, {
      auth: crearAuthMock({ usuario: USUARIO_MOCK, token: TOKEN_MOCK }),
      carrito: [ITEM],
      ruta: '/carrito',
      path: '/carrito',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Comprar' }));
    expect((await screen.findByTestId('ubicacion')).textContent).toBe('/perfil');
    const [url, opciones] = fetch.calls.mostRecent().args;
    expect([url, opciones.method]).toEqual(['/api/compras', 'POST']);
    expect(JSON.parse(opciones.body)).toEqual({ items: [{ id: 1, quantity: 1 }] });
  });

  it('si la API rechaza la compra muestra el error y conserva el carrito', async () => {
    simularApi(() => [401, { error: 'Tu sesión expiró. Inicia sesión nuevamente.' }]);
    renderizar(<Cart />, { auth: crearAuthMock({ usuario: USUARIO_MOCK, token: 'vencido' }), carrito: [ITEM] });
    fireEvent.click(screen.getByRole('button', { name: 'Comprar' }));
    expect(await screen.findByText('Tu sesión expiró. Inicia sesión nuevamente.')).toBeTruthy();
    expect(screen.getByTestId('cantidad-1').textContent).toBe('1');
  });
});

describe('Perfil', () => {
  it('sin sesión invita a iniciar sesión', () => {
    renderizar(<Profile />);
    expect(screen.getByText('Inicia sesión')).toBeTruthy();
    expect(screen.queryByText('Historial de compras')).toBeNull();
  });

  it('con sesión muestra las boletas que devuelve la API para ese token', async () => {
    const compra = crearCompra({ numero: 1, fecha: new Date(), usuario: USUARIO_MOCK, items: [ITEM] });
    const fetch = simularApiTienda({ compras: [compra] });
    renderizar(<Profile />, { auth: crearAuthMock({ usuario: USUARIO_MOCK, token: TOKEN_MOCK }) });
    expect(await screen.findByLabelText('Boleta N° 000001')).toBeTruthy();
    expect(fetch.calls.mostRecent().args[1].headers.Authorization).toBe(`Bearer ${TOKEN_MOCK}`);
  });
});

describe('AuthProvider (integración con la API simulada y sessionStorage)', () => {
  beforeEach(limpiarAlmacenamiento);

  // Componente de apoyo que usa el contexto real
  const Sesion = () => {
    const { usuario, registrar, login, logout } = useAuth();
    return (
      <div>
        <span data-testid="usuario">{usuario ? usuario.nombre : 'sin sesión'}</span>
        <button onClick={() => registrar({ nombre: 'Ana', email: 'ana@duoc.cl', password: 'Secreta123' })}>registrar</button>
        <button onClick={() => login('ana@duoc.cl', 'Secreta123')}>login</button>
        <button onClick={logout}>logout</button>
      </div>
    );
  };

  it('inicia sesión guardando el token en sessionStorage y la cierra avisando a la API', async () => {
    const fetch = simularApi((metodo, ruta) => {
      if (ruta === '/sesiones' && metodo === 'POST') return [201, { usuario: { nombre: 'Ana', email: 'ana@duoc.cl' }, token: TOKEN_MOCK }];
      if (ruta === '/sesiones' && metodo === 'DELETE') return [204];
      return [404, { error: 'Ruta no encontrada.' }];
    });
    render(
      <AuthProvider>
        <Sesion />
      </AuthProvider>,
    );
    fireEvent.click(screen.getByText('login'));
    // En Jasmine un expect fallido no lanza error, por eso se espera con findBy* y no con waitFor(() => expect(...))
    expect(await screen.findByText('Ana')).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem('sesionActiva')).token).toBe(TOKEN_MOCK);

    fireEvent.click(screen.getByText('logout'));
    expect(screen.getByTestId('usuario').textContent).toBe('sin sesión');
    expect(sessionStorage.getItem('sesionActiva')).toBeNull();
    await waitFor(() => {
      if (fetch.calls.count() < 2) throw new Error('Aún no se llama a DELETE /api/sesiones');
    });
    expect(fetch.calls.mostRecent().args[1].method).toBe('DELETE');
  });
});
