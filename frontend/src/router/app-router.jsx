import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  Inicio,
  Login,
  Registro,
  Dashboard,
  NoEncontrado,
  EnConstruccion,
} from '../page/index.jsx';

// Rutas de AutoCare.
// Las rutas privadas todavia no estan protegidas: ProtectedRoute se agregara
// cuando exista la autenticacion real (Parte 2).
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route
          path="/vehiculos"
          element={
            <EnConstruccion
              titulo="Vehiculos"
              descripcion="Aqui se listaran y administraran los vehiculos registrados por el usuario."
              parte="la Parte 3"
            />
          }
        />

        <Route
          path="/mantenimientos"
          element={
            <EnConstruccion
              titulo="Mantenimientos"
              descripcion="Aqui se registraran los mantenimientos y se calcularan los proximos servicios."
              parte="la Parte 3"
            />
          }
        />

        <Route
          path="/historial"
          element={
            <EnConstruccion
              titulo="Historial"
              descripcion="Aqui se consultara el historial completo de servicios por vehiculo."
              parte="la Parte 3"
            />
          }
        />

        <Route
          path="/perfil"
          element={
            <EnConstruccion
              titulo="Perfil"
              descripcion="Aqui se mostraran y editaran los datos de la cuenta del usuario."
              parte="la Parte 2"
            />
          }
        />

        <Route path="*" element={<NoEncontrado />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
