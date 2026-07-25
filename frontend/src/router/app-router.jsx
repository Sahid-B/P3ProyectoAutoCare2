import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  Inicio,
  Login,
  Registro,
  Dashboard,
  NoEncontrado,
  EnConstruccion,
  Vehiculos,
  NuevoVehiculo,
  EditarVehiculo,
  DetalleVehiculo,
  Mantenimientos,
  NuevoMantenimiento,
  DetalleMantenimiento,
  EditarMantenimiento,
  Historial,
  Perfil,
} from '../page/index.jsx';


import ProtectedRoute from '../components/protected-route/index.jsx';

// Rutas de AutoCare.
// Las rutas privadas estan protegidas mediante el componente ProtectedRoute.
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Modulo de vehiculos (Parte 3) */}
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

        {/* Modulo de mantenimientos (Parte 4) */}
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


        <Route path="*" element={<NoEncontrado />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
