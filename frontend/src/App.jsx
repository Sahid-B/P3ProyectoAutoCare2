import AppRouter from './router/app-router.jsx';
import { AuthProvider } from './context/auth-context.jsx';
import { CarritoProvider } from './context/carrito-context.jsx';

// Componente raiz de AutoCare: monta los proveedores de autenticacion y de
// carrito de repuestos, y el enrutador.
function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <AppRouter />
      </CarritoProvider>
    </AuthProvider>
  );
}

export default App;

