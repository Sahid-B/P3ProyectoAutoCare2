import { createContext, useContext, useState, useEffect } from 'react';
import {
  iniciarSesion as apiIniciarSesion,
  registrarUsuario as apiRegistrarUsuario,
  obtenerPerfil as apiObtenerPerfil,
  cerrarSesion as apiCerrarSesion,
} from '../services/api-service.js';

const TOKEN_KEY = 'autocare_token';

const AuthContext = createContext({
  usuario: null,
  token: null,
  cargando: true,
  login: async () => {},
  registro: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargarUsuario() {
      const tokenGuardado = localStorage.getItem(TOKEN_KEY);
      if (!tokenGuardado) {
        if (activo) {
          setUsuario(null);
          setCargando(false);
        }
        return;
      }

      try {
        const respuesta = await apiObtenerPerfil();
        if (activo && respuesta?.success && respuesta?.usuario) {
          setUsuario(respuesta.usuario);
          setToken(tokenGuardado);
        } else if (activo) {
          localStorage.removeItem(TOKEN_KEY);
          setUsuario(null);
          setToken(null);
        }
      } catch (error) {
        console.warn('[auth-context] Token no valido o expirado:', error.message);
        if (activo) {
          localStorage.removeItem(TOKEN_KEY);
          setUsuario(null);
          setToken(null);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarUsuario();

    return () => {
      activo = false;
    };
  }, []);

  const login = async (datosCredenciales) => {
    const respuesta = await apiIniciarSesion(datosCredenciales);
    if (respuesta?.token && respuesta?.usuario) {
      localStorage.setItem(TOKEN_KEY, respuesta.token);
      setToken(respuesta.token);
      setUsuario(respuesta.usuario);
    }
    return respuesta;
  };

  const registro = async (datosRegistro) => {
    const respuesta = await apiRegistrarUsuario(datosRegistro);
    if (respuesta?.token && respuesta?.usuario) {
      localStorage.setItem(TOKEN_KEY, respuesta.token);
      setToken(respuesta.token);
      setUsuario(respuesta.usuario);
    }
    return respuesta;
  };

  const logout = async () => {
    try {
      await apiCerrarSesion();
    } catch (error) {
      console.warn('[auth-context] Error al cerrar sesion en el backend:', error.message);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUsuario(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        login,
        registro,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return contexto;
}

export default AuthContext;
