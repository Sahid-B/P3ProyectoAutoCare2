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

        <Route
          path="/mantenimientos"
          element={
            <ProtectedRoute>
              <EnConstruccion
                titulo="Mantenimientos"
                descripcion="Aqui se registraran los mantenimientos y se calcularan los proximos servicios."
                parte="la Parte 3"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/historial"
          element={
            <ProtectedRoute>
              <EnConstruccion
                titulo="Historial"
                descripcion="Aqui se consultara el historial completo de servicios por vehiculo."
                parte="la Parte 3"
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <EnConstruccion
                titulo="Perfil"
                descripcion="Aqui se mostraran y editaran los datos de la cuenta del usuario."
                parte="la Parte 2"
              />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NoEncontrado />} />
      </Routes>
    </BrowserRouter>
  );
}


export default AppRouter;
