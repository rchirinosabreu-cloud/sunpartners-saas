import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Credenciales incorrectas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light min-h-screen flex font-body">
      {/* Left Side: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-background-dark flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#a1a1aa 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        ></div>

        <div className="z-10 flex flex-col items-center text-center max-w-md">
          {/* Logo Icon */}
          <div className="w-16 h-16 bg-primary rounded flex items-center justify-center mb-8 border border-primary">
            <span className="material-symbols-outlined text-white text-3xl fill">
              architecture
            </span>
          </div>

          {/* Brand Name */}
          <h1 className="text-text-light text-4xl font-display font-bold tracking-tight mb-4">
            Sunpartners
          </h1>

          {/* Subtitle / Version */}
          <p className="text-text-muted text-[15px] leading-relaxed">
            Contraste Estructural<br/>Sistema de Gestión v2.0
          </p>
        </div>

        {/* Footer info on left panel */}
        <div className="absolute bottom-8 left-8 text-text-muted text-[13px]">
          © 2024 Sunpartners Logistics
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 bg-background-light flex flex-col items-center justify-center p-8 sm:p-12 border-l border-border-color">
        {/* Mobile Logo */}
        <div className="lg:hidden flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-primary rounded flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-white text-2xl fill">
              architecture
            </span>
          </div>
          <h1 className="text-text-dark text-2xl font-display font-bold tracking-tight">
            Sunpartners
          </h1>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-[320px]">
          <div className="mb-8">
            <h2 className="text-text-dark text-[24px] font-display font-semibold mb-2">Iniciar Sesión</h2>
            <p className="text-text-muted text-[15px]">Ingresa tus credenciales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-text-dark" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                className="block w-full h-[44px] px-3 py-2 bg-background-light border border-border-color rounded text-[15px] text-text-dark placeholder:text-text-muted transition-colors"
                placeholder="operador@sunpartners.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-text-dark" htmlFor="password">
                  Contraseña
                </label>
                <a className="text-[13px] font-medium text-text-muted hover:text-primary transition-colors" href="#">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                className="block w-full h-[44px] px-3 py-2 bg-background-light border border-border-color rounded text-[15px] text-text-dark placeholder:text-text-muted transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-[13px] text-alert font-medium mt-1">{error}</p>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[44px] flex items-center justify-center bg-primary hover:bg-primary-hover text-white font-semibold text-[14px] rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
