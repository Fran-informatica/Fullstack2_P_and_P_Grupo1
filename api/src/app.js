import express from 'express';

import { crearCompra } from './dominio/boleta.js';
import { calcularTotal, contarUnidades } from './dominio/carrito.js';
import { validarEmail, validarNombre, validarPassword } from './dominio/validaciones.js';
import { HORAS_SESION, TOKEN_ADMIN } from './config.js';
import { enTransaccion, pool } from './db.js';
import { cifrarPassword, crearToken, hashToken, sonIguales, verificarPassword } from './seguridad.js';
import { CAMPOS_PRODUCTO, normalizarItems, validarProducto } from './validacion.js';

const COLUMNAS_PRODUCTO = 'id, title, price, category, featured, description, image, images, video';

// Sin video se omite la propiedad, igual que en el catálogo inicial
function aProducto({ video, ...resto }) {
  return video ? { ...resto, video } : resto;
}

function leerToken(req) {
  const [tipo, token] = (req.get('authorization') ?? '').split(' ');
  return tipo === 'Bearer' && token ? token : '';
}

async function requiereSesion(req, res, next) {
  const token = leerToken(req);
  if (!token) return res.status(401).json({ error: 'Debes iniciar sesión.' });
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.token_hash = $1 AND s.expira > now()`,
    [hashToken(token)],
  );
  if (rows.length === 0) return res.status(401).json({ error: 'Tu sesión expiró. Inicia sesión nuevamente.' });
  req.usuario = rows[0];
  req.tokenHash = hashToken(token);
  return next();
}

function requiereAdmin(req, res, next) {
  if (!TOKEN_ADMIN) {
    return res.status(403).json({ error: 'La administración de productos está desactivada (falta ADMIN_TOKEN).' });
  }
  const token = leerToken(req);
  if (!token || !sonIguales(token, TOKEN_ADMIN)) {
    return res.status(401).json({ error: 'Token de administración inválido.' });
  }
  return next();
}

function leerId(req, res) {
  const id = Number(req.params.id);
  if (Number.isInteger(id) && id > 0) return id;
  res.status(404).json({ error: 'Producto no encontrado.' });
  return null;
}

async function listarComprasDe(usuario) {
  const { rows: compras } = await pool.query(
    'SELECT numero, fecha FROM compras WHERE usuario_id = $1 ORDER BY numero DESC',
    [usuario.id],
  );
  if (compras.length === 0) return [];
  const { rows: items } = await pool.query(
    `SELECT compra_numero, producto_id AS id, title, price, quantity FROM compra_items
     WHERE compra_numero = ANY($1::int[]) ORDER BY compra_numero, id`,
    [compras.map((c) => c.numero)],
  );
  return compras.map((c) =>
    crearCompra({ ...c, usuario, items: items.filter((i) => i.compra_numero === c.numero) }),
  );
}

export function crearApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '20kb' }));

  // ----- Productos -----
  app.get('/api/productos', async (req, res) => {
    const soloDestacados = req.query.destacados === 'true';
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS_PRODUCTO} FROM productos ${soloDestacados ? 'WHERE featured' : ''} ORDER BY id`,
    );
    res.json(rows.map(aProducto));
  });

  app.get('/api/productos/:id', async (req, res) => {
    const id = leerId(req, res);
    if (id === null) return;
    const { rows } = await pool.query(`SELECT ${COLUMNAS_PRODUCTO} FROM productos WHERE id = $1`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(aProducto(rows[0]));
  });

  app.post('/api/productos', requiereAdmin, async (req, res) => {
    const { campos, error } = validarProducto(req.body);
    if (error) return res.status(400).json({ error });
    const columnas = Object.keys(campos);
    const { rows } = await pool.query(
      `INSERT INTO productos (${columnas.join(', ')}) VALUES (${columnas.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING ${COLUMNAS_PRODUCTO}`,
      Object.values(campos),
    );
    res.status(201).json(aProducto(rows[0]));
  });

  app.put('/api/productos/:id', requiereAdmin, async (req, res) => {
    const id = leerId(req, res);
    if (id === null) return;
    const { campos, error } = validarProducto(req.body, { parcial: true });
    if (error) return res.status(400).json({ error });
    // Los nombres de columna vienen de CAMPOS_PRODUCTO, nunca del cuerpo de la petición
    const columnas = Object.keys(campos).filter((c) => CAMPOS_PRODUCTO.includes(c));
    const { rows } = await pool.query(
      `UPDATE productos SET ${columnas.map((c, i) => `${c} = $${i + 2}`).join(', ')} WHERE id = $1
       RETURNING ${COLUMNAS_PRODUCTO}`,
      [id, ...columnas.map((c) => campos[c])],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(aProducto(rows[0]));
  });

  app.delete('/api/productos/:id', requiereAdmin, async (req, res) => {
    const id = leerId(req, res);
    if (id === null) return;
    const { rowCount } = await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.status(204).end();
  });

  // ----- Usuarios y sesiones -----
  app.post('/api/usuarios', async (req, res) => {
    const nombre = String(req.body?.nombre ?? '').trim();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const error = validarNombre(nombre) || validarEmail(email) || validarPassword(password);
    if (error) return res.status(400).json({ error });

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING RETURNING nombre, email`,
      [nombre, email, await cifrarPassword(password)],
    );
    if (rows.length === 0) return res.status(409).json({ error: 'Ya existe una cuenta registrada con este correo.' });
    res.status(201).json({ usuario: rows[0] });
  });

  app.post('/api/sesiones', async (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const { rows } = await pool.query('SELECT id, nombre, email, password_hash FROM usuarios WHERE email = $1', [email]);
    const encontrado = rows[0];
    if (!encontrado || !(await verificarPassword(password, encontrado.password_hash))) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }
    const token = crearToken();
    await pool.query("DELETE FROM sesiones WHERE expira <= now()");
    await pool.query(
      `INSERT INTO sesiones (token_hash, usuario_id, expira) VALUES ($1, $2, now() + make_interval(hours => $3))`,
      [hashToken(token), encontrado.id, HORAS_SESION],
    );
    res.status(201).json({ token, usuario: { nombre: encontrado.nombre, email: encontrado.email } });
  });

  app.delete('/api/sesiones', requiereSesion, async (req, res) => {
    await pool.query('DELETE FROM sesiones WHERE token_hash = $1', [req.tokenHash]);
    res.status(204).end();
  });

  // ----- Compras (siempre del usuario de la sesión) -----
  app.get('/api/compras', requiereSesion, async (req, res) => {
    res.json(await listarComprasDe(req.usuario));
  });

  app.post('/api/compras', requiereSesion, async (req, res) => {
    const pedidos = normalizarItems(req.body?.items);
    if (!pedidos) return res.status(400).json({ error: 'El carrito no es válido.' });

    const compra = await enTransaccion(async (cliente) => {
      const { rows } = await cliente.query('SELECT id, title, price FROM productos WHERE id = ANY($1::int[])', [
        pedidos.map((p) => p.id),
      ]);
      if (rows.length !== pedidos.length) return null;
      const porId = new Map(rows.map((r) => [r.id, r]));
      const items = pedidos.map((p) => ({ ...porId.get(p.id), quantity: p.quantity }));

      const { rows: [fila] } = await cliente.query(
        'INSERT INTO compras (usuario_id, unidades, total) VALUES ($1, $2, $3) RETURNING numero, fecha',
        [req.usuario.id, contarUnidades(items), calcularTotal(items)],
      );
      const nueva = crearCompra({ ...fila, usuario: req.usuario, items });
      for (const item of nueva.items) {
        await cliente.query(
          `INSERT INTO compra_items (compra_numero, producto_id, title, price, quantity, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [nueva.numero, item.id, item.title, item.price, item.quantity, item.subtotal],
        );
      }
      return nueva;
    });

    if (!compra) return res.status(400).json({ error: 'Alguno de los productos ya no está disponible.' });
    res.status(201).json(compra);
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

  // Express 5 envía aquí también los errores de las funciones async
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Petición demasiado grande.' });
    console.error(`[${req.method} ${req.path}]`, error.message);
    if (res.headersSent) return next(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  return app;
}
