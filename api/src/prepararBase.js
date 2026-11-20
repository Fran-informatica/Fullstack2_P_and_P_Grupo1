import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import pg from 'pg';

import { PRODUCTOS_INICIALES } from './dominio/catalogo.js';
import { RAIZ } from './config.js';
import { pool } from './db.js';

// Se conecta a la base de mantenimiento "postgres" con las mismas credenciales para crear la del proyecto
export async function crearBaseSiFalta() {
  const nombre = process.env.PGDATABASE;
  const cliente = new pg.Client({ database: 'postgres' });
  await cliente.connect();
  try {
    const { rowCount } = await cliente.query('SELECT 1 FROM pg_database WHERE datname = $1', [nombre]);
    if (rowCount === 0) {
      await cliente.query(`CREATE DATABASE ${cliente.escapeIdentifier(nombre)}`);
      console.log(`Base de datos "${nombre}" creada.`);
    }
  } finally {
    await cliente.end();
  }
}

export async function prepararBase() {
  const esquema = await fs.readFile(path.join(RAIZ, 'src', 'esquema.sql'), 'utf8');
  await pool.query(esquema);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS cantidad FROM productos');
  if (rows[0].cantidad > 0) return;

  for (const p of PRODUCTOS_INICIALES) {
    await pool.query(
      `INSERT INTO productos (id, title, price, category, featured, description, image, images, video)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [p.id, p.title, p.price, p.category, p.featured, p.description, p.image, p.images, p.video ?? null],
    );
  }
  // Los ids se insertaron a mano; la secuencia debe continuar desde el mayor
  await pool.query("SELECT setval(pg_get_serial_sequence('productos', 'id'), (SELECT MAX(id) FROM productos))");
  console.log(`Catálogo inicial cargado (${PRODUCTOS_INICIALES.length} productos).`);
}
