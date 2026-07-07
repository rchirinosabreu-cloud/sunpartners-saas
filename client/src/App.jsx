import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import InventoryCommercial from './pages/InventoryCommercial';
import Clients from './pages/Clients';
import QuotationList from './pages/QuotationList';
import QuotationDetail from './pages/QuotationDetail';
import Planner from './pages/Planner';
import NewQuotation from './pages/NewQuotation';
import PublicQuotation from './pages/PublicQuotation';
import Profile from './pages/Profile';
import TeamSettings from './pages/TeamSettings';
import Kanban from './pages/Kanban';

const ProtectedRoute = ({ children, allowedRoles = [], redirectPath = "/" }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen font-body text-zinc-400">Autenticando sesión...</div>;
  if (!user) return <Navigate to="/login" />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectPath} state={{ accessDenied: true }} replace />;
  }

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
            <Route path="clientes" element={<Clients />} />
            <Route
              path="cotizaciones"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EDITOR']} redirectPath="/">
                  <QuotationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="cotizaciones/nueva"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EDITOR']} redirectPath="/">
                  <NewQuotation />
                </ProtectedRoute>
              }
            />
            <Route
              path="cotizaciones/editar/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EDITOR']} redirectPath="/">
                  <NewQuotation />
                </ProtectedRoute>
              }
            />
            <Route
              path="cotizaciones/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EDITOR']} redirectPath="/">
                  <QuotationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="cotizaciones/:id/planeador"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EDITOR']} redirectPath="/">
                  <Planner />
                </ProtectedRoute>
              }
            />
            <Route path="tasks" element={<Kanban />} />
            <Route path="perfil" element={<Profile />} />
            <Route
              path="equipo"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EDITOR']}>
                  <TeamSettings />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
