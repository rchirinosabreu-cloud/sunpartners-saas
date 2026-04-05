import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/ui/Modal';

const TeamSettings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', username: '', position: '', email: '', password: '', role: 'EDITOR', department: 'ADMINISTRACION', isActive: true });
  const [messageModal, setMessageModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users', { withCredentials: true });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData };
      if (editingUser && !dataToSubmit.password) {
        delete dataToSubmit.password;
      }

      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, dataToSubmit, { withCredentials: true });
      } else {
        await axios.post('/api/users', dataToSubmit, { withCredentials: true });
      }
      setMessageModal({ isOpen: true, title: 'Éxito', content: `Usuario ${editingUser ? 'actualizado' : 'creado'} correctamente.`, type: 'success' });
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setMessageModal({ isOpen: true, title: 'Error', content: err.response?.data?.error || 'No se pudo completar la acción.', type: 'error' });
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await axios.put(`/api/users/${user.id}`, { ...user, isActive: !user.isActive }, { withCredentials: true });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u =>
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="flex-1 p-8 bg-[#FAFAFA] font-body overflow-y-auto">
      <Modal isOpen={messageModal.isOpen} onClose={() => setMessageModal({ ...messageModal, isOpen: false })} title={messageModal.title} type={messageModal.type}>{messageModal.content}</Modal>

      {/* User Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-primary w-full max-w-lg rounded-xl shadow-2xl overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display text-xl font-black uppercase tracking-tight text-zinc-900">
                {editingUser ? 'Editar Miembro de Equipo' : 'Registrar Nuevo Miembro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Nombre Completo</label>
                  <input required type="text" autoComplete="new-password" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Username (Obligatorio)</label>
                  <input required type="text" autoComplete="new-password" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Cargo (Ej: Conductor)</label>
                  <input type="text" autoComplete="new-password" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Email (Opcional)</label>
                  <input type="email" autoComplete="new-password" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Rol</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs">
                    <option value="ADMIN">ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="CONSULTOR">CONSULTOR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Departamento</label>
                  <select value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs">
                    <option value="ADMINISTRACION">ADMINISTRACIÓN</option>
                    <option value="OPERATIVO">OPERATIVO</option>
                    <option value="DIRECCION_COMERCIAL">DIRECCIÓN / COMERCIAL</option>
                    <option value="LOGISTICA_TRANSPORTE">LOGÍSTICA / TRANSPORTE</option>
                    <option value="COMERCIAL">COMERCIAL</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                    {editingUser ? 'Resetear Contraseña (Manual)' : 'Contraseña Inicial'}
                  </label>
                  <input required={!editingUser} type="password" autoComplete="new-password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" placeholder={editingUser ? "Asignar nueva clave temporal..." : ""} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100">Cancelar</button>
                <button type="submit" className="bg-primary text-white px-10 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg">
                  {editingUser ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-zinc-900">Configuración de Equipo</h2>
          <p className="text-[13px] text-zinc-500 font-semibold mt-1 uppercase tracking-wider">Gestión de acceso, roles y estados de cuenta.</p>
        </div>
        <button
          onClick={() => { setEditingUser(null); setFormData({ nombre: '', username: '', position: '', email: '', password: '', role: 'EDITOR', department: 'ADMINISTRACION', isActive: true }); setIsModalOpen(true); }}
          className="flex items-center gap-3 bg-zinc-900 text-white px-6 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Nuevo Miembro
        </button>
      </header>

      <div className="bg-white border-2 border-zinc-100 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
           <div className="relative w-72">
             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">search</span>
             <input
               type="text"
               placeholder="Buscar por nombre o email..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full h-10 pl-10 pr-4 bg-white border-2 border-zinc-100 rounded-lg text-xs font-bold focus:outline-none focus:border-primary transition-all"
             />
           </div>
           <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{users.length} Miembros registrados</p>
        </div>
        <table className="w-full text-left">
          <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
            <tr>
              <th className="px-6 py-4">Nombre / Usuario</th>
              <th className="px-6 py-4">Cargo / Email</th>
              <th className="px-6 py-4">Rol / Depto</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filteredUsers.map(u => (
              <tr key={u.id} className={`hover:bg-zinc-50/50 transition-all ${!u.isActive ? 'opacity-50 grayscale' : ''}`}>
                <td className="px-6 py-5">
                   <div className="font-black text-zinc-900 uppercase text-[12px]">{u.nombre}</div>
                   <div className="text-[10px] font-bold text-zinc-400 lowercase italic tracking-tight">@{u.username}</div>
                </td>
                <td className="px-6 py-5">
                   <div className="font-bold text-zinc-600 uppercase text-[10px]">{u.position || 'SIN CARGO'}</div>
                   <div className="text-[10px] font-medium text-zinc-400 lowercase">{u.email || 'SIN EMAIL'}</div>
                </td>
                <td className="px-6 py-5">
                   <div className="inline-flex items-center gap-2">
                     <span className="px-2 py-0.5 rounded bg-primary/5 border border-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">{u.role}</span>
                     <span className="text-[9px] font-black text-zinc-400 uppercase">{u.department}</span>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <button
                     onClick={() => handleToggleStatus(u)}
                     className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${u.isActive ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                   >
                     {u.isActive ? 'ACTIVO' : 'INACTIVO'}
                   </button>
                </td>
                <td className="px-6 py-5 text-right">
                   <button
                     onClick={() => { setEditingUser(u); setFormData({ ...u, password: '' }); setIsModalOpen(true); }}
                     className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-300 hover:text-primary hover:bg-primary/5 transition-all"
                   >
                     <span className="material-symbols-outlined text-[20px]">edit_note</span>
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default TeamSettings;
