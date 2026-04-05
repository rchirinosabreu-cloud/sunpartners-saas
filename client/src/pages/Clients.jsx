import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import NewClientModal from '../components/modals/NewClientModal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uiModal, setUiModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);
  const { user } = useAuth();

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients', { withCredentials: true });
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c =>
    (c.razon_social || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nit_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/clients/${id}`, { withCredentials: true });
      setUiModal({
        isOpen: true,
        title: 'Cliente Eliminado',
        content: 'El registro ha sido removido correctamente del directorio.',
        type: 'success'
      });
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      setUiModal({
        isOpen: true,
        title: 'Error al Eliminar',
        content: 'No se pudo completar la acción. Inténtalo de nuevo.',
        type: 'error'
      });
    } finally {
      setClientToDelete(null);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-hidden font-body">
      <Modal
        isOpen={uiModal.isOpen}
        onClose={() => setUiModal({ ...uiModal, isOpen: false })}
        title={uiModal.title}
        type={uiModal.type}
      >
        {uiModal.content}
      </Modal>

      <Modal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        title="Confirmar Eliminación"
        type="warning"
        action={{
          label: 'Confirmar Eliminación',
          onClick: () => handleDelete(clientToDelete.id),
          color: 'danger'
        }}
      >
        ¿Estás seguro de eliminar a <span className="font-black text-zinc-900">{clientToDelete?.razon_social}</span>? Esta acción no se puede deshacer y el registro será archivado.
      </Modal>

      <NewClientModal
        isOpen={isClientModalOpen}
        onClose={() => { setIsClientModalOpen(false); setEditingClient(null); }}
        onClientCreated={() => { fetchClients(); setEditingClient(null); }}
        initialData={editingClient}
      />

      {/* Header */}
      <header className="h-16 border-b border-zinc-200 flex items-center justify-between px-8 shrink-0 bg-white shadow-sm">
        <div className="flex items-center flex-1">
          <h2 className="font-display font-black text-[22px] text-zinc-900 uppercase tracking-tight">Directorio de Clientes</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">search</span>
            <input
              className="w-full h-10 pl-10 pr-4 text-sm border-2 border-zinc-100 rounded-sm bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 transition-all font-medium"
              placeholder="Buscar por Empresa, NIT o Email..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setEditingClient(null); setIsClientModalOpen(true); }}
            className="h-10 px-6 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-sm hover:opacity-90 transition-all flex items-center shadow-lg"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">person_add</span>
            Nuevo Cliente
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto border-2 border-zinc-100 rounded-sm bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50/50 border-b-2 border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-1/3">Empresa / Razón Social</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-1/4">NIT / Identificación</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-1/4">Contacto Principal</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center w-32">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right w-20"></th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-50">
              {loading ? (
                <tr><td colSpan="5" className="p-12 text-center text-zinc-400 font-medium animate-pulse uppercase text-[10px] tracking-widest">Sincronizando base de clientes...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan="5" className="p-12 text-center text-zinc-400 font-bold uppercase text-[11px] tracking-widest">No se encontraron clientes registrados.</td></tr>
              ) : filteredClients.map((client, idx) => (
                <tr key={client.id} className="hover:bg-zinc-50/80 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-primary">
                  <td className="px-6 py-5">
                    <div className="font-black text-zinc-900 uppercase tracking-tight text-[13px]">{client.razon_social}</div>
                    <div className="text-[10px] font-bold text-zinc-400 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">mail</span>
                      {client.email || 'SIN EMAIL'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="bg-zinc-100 px-2 py-1 rounded-sm text-[11px] font-black text-zinc-600 tracking-tighter">
                      {client.nit_id || 'PENDIENTE'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-zinc-700 text-[12px] uppercase">{client.responsable || 'No asignado'}</div>
                    <div className="text-[10px] font-medium text-zinc-400 mt-0.5">{client.ciudad || '-'}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-100 shadow-sm">
                      ACTIVO
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClient(client);
                          setIsClientModalOpen(true);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-sm text-zinc-300 hover:text-primary hover:bg-blue-50 transition-all"
                        title="Editar cliente"
                      >
                        <span className="material-symbols-outlined text-[20px]">settings_suggest</span>
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setClientToDelete(client);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-sm text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Eliminar cliente"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default Clients;
