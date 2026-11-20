import { listarMisCompras, registrarCompra } from '../data/compras';
import { autenticarUsuario, cerrarSesion, registrarUsuario } from '../data/usuarios';
import { crearCompra, formatearNumeroBoleta, generarBoletaTexto } from '../utils/boleta';
import { TOKEN_MOCK, USUARIO_MOCK, simularApi } from './helpers';

const ITEMS = [
  { id: 1, title: 'Global Warning', price: 15990, quantity: 2 },
  { id: 3, title: 'Porta Lápices', price: 5990, quantity: 1 },
];

describe('Compras, boletas y usuarios', () => {
  it('crea una compra con subtotales, unidades y total', () => {
    const compra = crearCompra({ numero: 1, fecha: new Date(2026, 10, 8, 10, 5), usuario: USUARIO_MOCK, items: ITEMS });
    expect(compra.items[0].subtotal).toBe(31980);
    expect(compra.unidades).toBe(3);
    expect(compra.total).toBe(37970);
    expect(compra.cliente).toEqual(USUARIO_MOCK);
  });

  it('genera la boleta en texto con número de 6 dígitos y el total', () => {
    const compra = crearCompra({ numero: 7, fecha: new Date(2026, 10, 8, 10, 5), usuario: USUARIO_MOCK, items: ITEMS });
    const texto = generarBoletaTexto(compra);
    expect(formatearNumeroBoleta(7)).toBe('000007');
    expect(texto).toContain('Boleta N° 000007');
    expect(texto).toContain('Fecha: 08-11-2026 10:05');
    expect(texto).toContain('$37.970');
    expect(texto.split('\n').every((linea) => linea.length <= 40)).toBeTrue();
  });

  it('registra la compra enviando solo id y cantidad, con el token de la sesión', async () => {
    const fetch = simularApi((metodo, ruta, cuerpo) => [201, { numero: 1, items: cuerpo.items }]);
    const compra = await registrarCompra(TOKEN_MOCK, ITEMS);
    expect(compra.numero).toBe(1);
    const [url, opciones] = fetch.calls.mostRecent().args;
    expect(url).toBe('/api/compras');
    expect(opciones.method).toBe('POST');
    expect(opciones.headers.Authorization).toBe(`Bearer ${TOKEN_MOCK}`);
    // El precio no viaja: lo calcula la API con los datos de PostgreSQL
    expect(JSON.parse(opciones.body)).toEqual({ items: [{ id: 1, quantity: 2 }, { id: 3, quantity: 1 }] });
  });

  it('lista las compras de la sesión y rechaza si el token no es válido', async () => {
    simularApi((metodo, ruta, cuerpo, headers) =>
      headers.Authorization === `Bearer ${TOKEN_MOCK}` ? [200, [{ numero: 2 }, { numero: 1 }]] : [401, { error: 'Debes iniciar sesión.' }],
    );
    expect((await listarMisCompras(TOKEN_MOCK)).map((c) => c.numero)).toEqual([2, 1]);
    await expectAsync(listarMisCompras('otro')).toBeRejectedWith(jasmine.objectContaining({ estado: 401 }));
  });

  it('registra usuarios y devuelve el error de la API si el correo está repetido', async () => {
    const registrados = new Set();
    simularApi((metodo, ruta, { nombre, email }) => {
      if (registrados.has(email)) return [409, { error: 'Ya existe una cuenta registrada con este correo.' }];
      registrados.add(email);
      return [201, { usuario: { nombre, email } }];
    });
    const datos = { nombre: 'Ana', email: 'ana@duoc.cl', password: 'Secreta123' };
    expect(await registrarUsuario(datos)).toEqual({ ok: true, usuario: { nombre: 'Ana', email: 'ana@duoc.cl' } });
    expect(await registrarUsuario(datos)).toEqual({ ok: false, error: 'Ya existe una cuenta registrada con este correo.' });
  });

  it('inicia sesión recibiendo el token, informa credenciales incorrectas y cierra la sesión', async () => {
    const fetch = simularApi((metodo, ruta, cuerpo) => {
      if (metodo === 'DELETE') return [204];
      return cuerpo.password === 'Secreta123'
        ? [201, { usuario: USUARIO_MOCK, token: TOKEN_MOCK }]
        : [401, { error: 'Correo o contraseña incorrectos.' }];
    });
    expect(await autenticarUsuario('ana@duoc.cl', 'Secreta123')).toEqual({ ok: true, usuario: USUARIO_MOCK, token: TOKEN_MOCK });
    expect(await autenticarUsuario('ana@duoc.cl', 'Otra1234')).toEqual({ ok: false, error: 'Correo o contraseña incorrectos.' });
    await cerrarSesion(TOKEN_MOCK);
    const [url, opciones] = fetch.calls.mostRecent().args;
    expect([url, opciones.method, opciones.headers.Authorization]).toEqual(['/api/sesiones', 'DELETE', `Bearer ${TOKEN_MOCK}`]);
  });
});
