import { useState, useRef } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import SharedUserAvatar from '../components/SharedUserAvatar';

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [modal, setModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      return setModal({ isOpen: true, title: 'Error', content: 'Por favor selecciona una imagen válida.', type: 'error' });
    }

    setUploading(true);
    try {
      // Compression options
      const options = {
        maxSizeMB: 0.3, // Max 300KB
        maxWidthOrHeight: 800,
        useWebWorker: true
      };

      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append('foto', compressedFile, file.name);

      await axios.post('/api/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      await checkAuth(); // Refresh user data to get the new signed URL
      setModal({ isOpen: true, title: 'Éxito', content: 'Tu foto de perfil ha sido actualizada.', type: 'success' });
    } catch (err) {
      console.error('Error uploading image:', err);
      setModal({ isOpen: true, title: 'Error', content: 'No se pudo cargar la imagen.', type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setModal({ isOpen: true, title: 'Error', content: 'Las contraseñas no coinciden.', type: 'error' });
    }
    if (passwords.newPassword.length < 8) {
      return setModal({ isOpen: true, title: 'Seguridad', content: 'La nueva contraseña debe tener al menos 8 caracteres.', type: 'warning' });
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }, { withCredentials: true });

      setModal({ isOpen: true, title: 'Éxito', content: 'Tu contraseña ha sido actualizada correctamente.', type: 'success' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setModal({ isOpen: true, title: 'Error', content: err.response?.data?.message || 'No se pudo cambiar la contraseña.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-8 bg-[#FAFAFA] font-body overflow-y-auto">
      <Modal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} type={modal.type}>
        {modal.content}
      </Modal>

      <div className="max-w-3xl mx-auto space-y-8">
        <header className="mb-12">
          <h2 className="font-display text-3xl font-black  tracking-tight text-zinc-900">Mi perfil de usuario</h2>
          <p className="text-[13px] text-zinc-500 font-semibold mt-1  tracking-wider">Gestión de seguridad y datos personales en Sunpartners.</p>
        </header>

        <div className="bg-white border-2 border-zinc-100 rounded-xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group">
              <SharedUserAvatar user={user} size={120} className="border-4 border-white shadow-md" />
              <button
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 cursor-pointer"
                title="Cambiar foto de perfil"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {uploading ? 'sync' : 'photo_camera'}
                </span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 w-full">
              <h3 className="text-[11px] font-black tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">account_circle</span> Información del Sistema
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="block text-[10px] font-black text-zinc-400 mb-1">Nombre completo</span>
                  <p className="font-black text-zinc-900">{user?.nombre}</p>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-zinc-400 mb-1">Correo electrónico</span>
                  <p className="font-bold text-zinc-600">{user?.email}</p>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-zinc-400 mb-1">Rol asignado</span>
                  <span className="inline-block px-3 py-1 rounded bg-primary/10 text-primary text-[10px] font-black tracking-widest border border-primary/20 mt-1">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-zinc-100 rounded-xl p-8 shadow-sm">
          <h3 className="text-[11px] font-black  tracking-widest text-zinc-400 mb-8 flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">lock</span> Seguridad: Cambiar Contraseña
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
            <div>
              <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Contraseña actual</label>
              <input
                required
                type="password"
                value={passwords.currentPassword}
                onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Nueva contraseña</label>
                <input
                  required
                  type="password"
                  value={passwords.newPassword}
                  onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Confirmar</label>
                <input
                  required
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                />
              </div>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 ">* Mínimo 8 caracteres</p>
            <button
              disabled={loading}
              type="submit"
              className="bg-primary text-white px-10 py-3 rounded-lg text-[11px] font-black  tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Profile;
