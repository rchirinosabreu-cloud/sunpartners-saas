import { useAuth } from '../context/AuthContext';
import { Package, Calendar, FileText, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, description }) => (
  <div className="bg-white border border-zinc-200 p-6 rounded-lg flex items-start gap-4">
    <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg">
      <Icon className="w-5 h-5 text-zinc-900" />
    </div>
    <div>
      <h3 className="text-sm font-medium text-zinc-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      {description && <p className="text-xs text-zinc-400 mt-1">{description}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
          Hola, {user?.nombre?.split(' ')[0]} 👋
        </h1>
        <p className="text-zinc-500">
          Bienvenido a la gestión de Sunpartners. Aquí tienes un resumen de hoy.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Inventario Disponible"
          value="1,245"
          icon={Package}
          description="98% de la flota"
        />
        <StatCard
          title="Eventos este mes"
          value="12"
          icon={Calendar}
          description="4 próximos esta semana"
        />
        <StatCard
          title="Cotizaciones"
          value="24"
          icon={FileText}
          description="8 pendientes de aprobación"
        />
        <StatCard
          title="Ingresos Estimados"
          value="$15.4M"
          icon={TrendingUp}
          description="+12% vs mes pasado"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Eventos Recientes</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-zinc-900">Boda Residencial - Medellín</p>
                  <p className="text-xs text-zinc-500">22 de Marzo, 2024</p>
                </div>
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 rounded">
                  Borrador
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-zinc-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Alertas de Inventario</h2>
          <div className="space-y-4">
             <div className="flex items-center gap-3 p-3 bg-[#FFFBEB] border border-[#FEF3C7] rounded-md">
                <div className="w-2 h-2 rounded-full bg-brand-yellow" />
                <p className="text-sm text-[#92400E]">
                  <span className="font-bold">Stock Bajo:</span> Sillas Tiffany Oro (Queda 15%)
                </p>
             </div>
             <p className="text-sm text-zinc-500 px-1">No hay otras alertas pendientes.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
