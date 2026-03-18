import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inventario" element={<div className="text-zinc-500">Módulo de Inventario en desarrollo...</div>} />
            <Route path="eventos" element={<div className="text-zinc-500">Módulo de Eventos en desarrollo...</div>} />
            <Route path="cotizaciones" element={<div className="text-zinc-500">Módulo de Cotizaciones en desarrollo...</div>} />
            <Route path="clientes" element={<div className="text-zinc-500">Módulo de Clientes en desarrollo...</div>} />
            <Route path="equipo" element={<div className="text-zinc-500">Módulo de Equipo en desarrollo...</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
