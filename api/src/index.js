import process from 'node:process';

import { crearApp } from './app.js';
import { PUERTO_API } from './config.js';
import { crearBaseSiFalta, prepararBase } from './prepararBase.js';

try {
  await crearBaseSiFalta();
  await prepararBase();
} catch (error) {
  console.error('No se pudo preparar la base de datos en PostgreSQL:', error.message);
  console.error('Revisa que el servicio esté iniciado y que los datos de conexión en .env sean correctos.');
  process.exit(1);
}

// Solo escucha en este equipo; Vite reenvía /api hacia aquí
crearApp().listen(PUERTO_API, '127.0.0.1', () => {
  console.log(`API de Pixel & Play en http://localhost:${PUERTO_API}/api`);
});
