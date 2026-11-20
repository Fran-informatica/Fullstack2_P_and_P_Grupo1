import { createContext, useContext, useState } from 'react';

import { borrar, guardar, leer } from '../data/almacenamiento';
import { autenticarUsuario, cerrarSesion, registrarUsuario } from '../data/usuarios';

export const AuthContext = createContext(null);

// sessionStorage guarda { usuario, token }: la sesión dura lo que la pestaña y la API la valida con el token
const CLAVE_SESION = 'sesionActiva';

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => leer(CLAVE_SESION, null, window.sessionStorage));

  const registrar = (datos) => registrarUsuario(datos);

  const login = async (email, password) => {
    const resultado = await autenticarUsuario(email, password);
    if (resultado.ok) {
      const nueva = { usuario: resultado.usuario, token: resultado.token };
      guardar(CLAVE_SESION, nueva, window.sessionStorage);
      setSesion(nueva);
    }
    return resultado;
  };

  // La sesión se cierra en el navegador aunque la API no responda
  const logout = async () => {
    const token = sesion?.token;
    borrar(CLAVE_SESION, window.sessionStorage);
    setSesion(null);
    if (token) await cerrarSesion(token).catch(() => {});
  };

  const value = { usuario: sesion?.usuario ?? null, token: sesion?.token ?? null, registrar, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
