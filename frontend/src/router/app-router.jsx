import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context.jsx';
import {
  Inicio,
  Login,
  Registro,
  RegistroVerificacion,
  Dashboard,
  NoEncontrado,
  EnConstruccion,
  Vehiculos,
  NuevoVehiculo,
  EditarVehiculo,
  DetalleVehiculo,
  Comprar,
  Vender,
  Mantenimientos,
  NuevoMantenimiento,
  DetalleMantenimiento,
  EditarMantenimiento,
  Historial,
  Perfil,
  AdminDashboard,
  Talleres,
  TallerDashboard,
  MiTaller,
  SolicitudesTaller,
} from '../page/index.jsx';

import ProtectedRoute from '../components/protected-route/index.jsx';

// Rutas de AutoCare.
// Las rutas privadas estan protegidas mediante el componente ProtectedRoute.
function AppRouter() {
  const { usuario } = useAuth();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/registro/verificacion" element={<RegistroVerificacion />} />

        {/* Rutas protegidas (Usuarios normales) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {usuario?.rol === 'taller' ? <Navigate to="/taller-dashboard" replace /> : <Dashboard />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehiculos"
          element={
            <ProtectedRoute>
              <Vehiculos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehiculos/nuevo"
          element={
            <ProtectedRoute>
              <NuevoVehiculo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehiculos/:id"
          element={
            <ProtectedRoute>
              <DetalleVehiculo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehiculos/:id/editar"
          element={
            <ProtectedRoute>
              <EditarVehiculo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comprar"
          element={
            <ProtectedRoute>
              <Comprar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vender"
          element={
            <ProtectedRoute>
              <Vender />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos"
          element={
            <ProtectedRoute>
              <Mantenimientos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/nuevo"
          element={
            <ProtectedRoute>
              <NuevoMantenimiento />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/:id"
          element={
            <ProtectedRoute>
              <DetalleMantenimiento />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mantenimientos/:id/editar"
          element={
            <ProtectedRoute>
              <EditarMantenimiento />
            </ProtectedRoute>
          }
        />
        <Route
          path="/historial"
          element={
            <ProtectedRoute>
              <Historial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          }
        />
        <Route
          path="/talleres"
          element={
            <ProtectedRoute>
              <Talleres />
            </ProtectedRoute>
          }
        />

        {/* Rutas protegidas (Admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas protegidas (Taller) */}
        <Route
          path="/taller-dashboard"
          element={
            <ProtectedRoute>
              <TallerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mi-taller"
          element={
            <ProtectedRoute>
              <MiTaller />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <ProtectedRoute>
              <SolicitudesTaller />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NoEncontrado />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
