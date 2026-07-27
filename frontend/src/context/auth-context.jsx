import { createContext, useContext, useState, useEffect } from 'react';
import {
  apiIniciarSesion,
  apiVerificarLogin2FA,
  apiRegistrarUsuario,
  apiAutenticarConGoogle,
  apiObtenerPerfil,
  apiCerrarSesion,
} from '../services/api-service';

const AuthContext = createContext(null);
const TOKEN_KEY = 'autocare_token';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarUsuario() {
      const tokenGuardado = localStorage.getItem(TOKEN_KEY);
      if (!tokenGuardado) {
        setCargando(false);
        return;
      }

      try {
        const respuesta = await apiObtenerPerfil();
        if (respuesta?.usuario) {
          setUsuario(respuesta.usuario);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      } catch (error) {
        console.warn('[auth-context] Token invalido o expirado:', error.message);
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    }

    cargarUsuario();
  }, []);

  const login = async (correo, contrasena) => {
    const respuesta = await apiIniciarSesion({ correo, contrasena });
    if (respuesta?.requiereVerificacion || respuesta?.requiere2FA) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUsuario(null);
    } else if (respuesta?.token && respuesta?.usuario) {
      localStorage.setItem(TOKEN_KEY, respuesta.token);
      setToken(respuesta.token);
      setUsuario(respuesta.usuario);
    }
    return respuesta;
  };

  const completarLogin2FA = async (userId, token2FA) => {
    const respuesta = await apiVerificarLogin2FA({ userId, token2FA });
    if (respuesta?.token && respuesta?.usuario) {
      localStorage.setItem(TOKEN_KEY, respuesta.token);
      setToken(respuesta.token);
      setUsuario(respuesta.usuario);
    }
    return respuesta;
  };

  const registro = async (datosRegistro) => {
    const respuesta = await apiRegistrarUsuario(datosRegistro);
    if (respuesta?.requiereVerificacion || respuesta?.requiere2FA) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUsuario(null);
    } else if (respuesta?.token && respuesta?.usuario) {
      localStorage.setItem(TOKEN_KEY, respuesta.token);
      setToken(respuesta.token);
      setUsuario(respuesta.usuario);
    }
    return respuesta;
  };

  const loginGoogle = async (credential, rol) => {
    const respuesta = await apiAutenticarConGoogle({ credential, rol });
    if (respuesta?.token && respuesta?.usuario) {
      localStorage.setItem(TOKEN_KEY, respuesta.token);
      setToken(respuesta.token);
      setUsuario(respuesta.usuario);
    }
    return respuesta;
  };

  const actualizarUsuarioLocal = (nuevosDatos) => {
    setUsuario((anterior) => ({ ...anterior, ...nuevosDatos }));
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
        completarLogin2FA,
        registro,
        loginGoogle,
        actualizarUsuarioLocal,
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
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return contexto;
}
