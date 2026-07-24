import AppRouter from './router/app-router.jsx';
import { AuthProvider } from './context/auth-context.jsx';

// Componente raiz de AutoCare: monta el proveedor de autenticacion y el enrutador.
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;

