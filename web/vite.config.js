import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // API_URL se puede definir en web/.env; sin prefijo VITE_, así que no llega al código del navegador
  const { API_URL = 'http://127.0.0.1:3001' } = loadEnv(mode, process.cwd(), '');
  // El navegador llama a /api en el mismo origen y Vite lo reenvía a la API: no hace falta CORS
  const proxy = { '/api': API_URL };

  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { proxy },
  };
});
