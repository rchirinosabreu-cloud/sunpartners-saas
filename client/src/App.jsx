import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Events from './pages/Events';
import Clients from './pages/Clients';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen font-body">Cargando...</div>;
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
            <Route path="inventario" element={<Inventory />} />
            <Route path="eventos" element={<Events />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="cotizaciones" element={<div className="p-8 text-zinc-500 font-body">Módulo de Cotizaciones en desarrollo...</div>} />
            <Route path="equipo" element={<div className="p-8 text-zinc-500 font-body">Módulo de Equipo en desarrollo...</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
