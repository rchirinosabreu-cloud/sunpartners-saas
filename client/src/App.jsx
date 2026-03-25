import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import InventoryCommercial from './pages/InventoryCommercial';
import Events from './pages/Events';
import Clients from './pages/Clients';
import QuotationList from './pages/QuotationList';
import QuotationDetail from './pages/QuotationDetail';
import NewQuotation from './pages/NewQuotation';
import PublicQuotation from './pages/PublicQuotation';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen font-body text-zinc-400">Autenticando sesión...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Public Routes */}
          <Route path="/q/:hash" element={<PublicQuotation />} />

          {/* Protected Internal Routes */}
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
            <Route path="comercial" element={<InventoryCommercial />} />
            <Route path="eventos" element={<Events />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="cotizaciones" element={<QuotationList />} />
            <Route path="cotizaciones/nueva" element={<NewQuotation />} />
            <Route path="cotizaciones/editar/:id" element={<NewQuotation />} />
            <Route path="cotizaciones/:id" element={<QuotationDetail />} />
            <Route path="equipo" element={<div className="p-8 text-zinc-500 font-body uppercase text-xs font-black tracking-widest">Módulo de Equipo en desarrollo...</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
