import { useState, useEffect } from 'react';
import axios from 'axios';

const NewClientModal = ({ isOpen, onClose, onClientCreated, initialData = null }) => {
  const [clientData, setClientData] = useState({
    razon_social: '',
    nit_id: '',
    responsable: '',
    direccion_fiscal: '',
    email: '',
    telefono: '',
    ciudad: '',
    observaciones: ''
  });
  const [isDuplicate, setIsDuplicate] = useState({ nit: false, email: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setClientData(initialData);
    } else {
      setClientData({
        razon_social: '',
        nit_id: '',
        responsable: '',
        direccion_fiscal: '',
        email: '',
        telefono: '',
        ciudad: '',
        observaciones: ''
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (clientData.nit_id || clientData.email) {
        try {
          const res = await axios.get('/api/clients/check-duplicates', {
            params: { nit_id: clientData.nit_id, email: clientData.email },
            withCredentials: true,
            timeout: 5000
          });
          setIsDuplicate({ nit: res.data.nitExists, email: res.data.emailExists });
          setError(null);
        } catch (e) {
          console.error(e);
          if (e.code === 'ECONNABORTED' || !e.response) {
            setError('Conexión inestable con el servidor. Verifica tu internet.');
          }
        }
      } else {
        setIsDuplicate({ nit: false, email: false });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [clientData.nit_id, clientData.email]);

  const handleNitChange = (val) => {
    const clean = val.replace(/\D/g, '').substring(0, 10);
    let masked = clean;
    if (clean.length > 9) masked = `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9, 10)}`;
    else if (clean.length > 6) masked = `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6)}`;
    else if (clean.length > 3) masked = `${clean.substring(0, 3)}.${clean.substring(3)}`;
    setClientData({ ...clientData, nit_id: masked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDuplicate.nit || isDuplicate.email) return;
    setSaving(true);
    setError(null);
    try {
      let res;
      if (initialData?.id) {
        res = await axios.put(`/api/clients/${initialData.id}`, clientData, { withCredentials: true, timeout: 8000 });
      } else {
        res = await axios.post('/api/clients', clientData, { withCredentials: true, timeout: 8000 });
      }
      onClientCreated(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error ||
                 (err.code === 'ECONNABORTED' ? 'Tiempo de espera agotado.' : 'Error de conexión con el servidor.');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-body">
      <div className="bg-white w-full max-w-2xl rounded-[12px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-primary">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">{initialData?.id ? 'edit_note' : 'person_add'}</span>
              <h3 className="font-display text-xl font-black uppercase tracking-tight text-zinc-900">
                {initialData?.id ? 'Editar Cliente Maestro' : 'Registrar Nuevo Cliente'}
              </h3>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Empresa / Razón Social</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Sunpartners SAS"
                  value={clientData.razon_social}
                  onChange={e => setClientData({ ...clientData, razon_social: e.target.value })}
                  className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">NIT / Identificación</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: 900.123.456-1"
                  value={clientData.nit_id}
                  onChange={e => handleNitChange(e.target.value)}
                  className={`w-full border-2 ${isDuplicate.nit ? 'border-brand-alert' : 'border-zinc-100'} rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Responsable de Cuenta</label>
                <input
                  required
                  type="text"
                  placeholder="Nombre del contacto principal"
                  value={clientData.responsable}
                  onChange={e => setClientData({ ...clientData, responsable: e.target.value })}
                  className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Dirección Fiscal</label>
                <input
                  required
                  type="text"
                  placeholder="Dirección para facturación"
                  value={clientData.direccion_fiscal}
                  onChange={e => setClientData({ ...clientData, direccion_fiscal: e.target.value })}
                  className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Email Corporativo</label>
                <input
                  required
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={clientData.email}
                  onChange={e => setClientData({ ...clientData, email: e.target.value })}
                  className={`w-full border-2 ${isDuplicate.email ? 'border-brand-alert' : 'border-zinc-100'} rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Teléfono</label>
                  <input
                    required
                    type="text"
                    placeholder="+57 ..."
                    value={clientData.telefono}
                    onChange={e => setClientData({ ...clientData, telefono: e.target.value })}
                    className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Ciudad</label>
                  <input
                    required
                    type="text"
                    placeholder="Ciudad de operación"
                    value={clientData.ciudad}
                    onChange={e => setClientData({ ...clientData, ciudad: e.target.value })}
                    className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Observaciones</label>
              <textarea
                placeholder="Notas adicionales sobre el cliente..."
                value={clientData.observaciones}
                onChange={e => setClientData({ ...clientData, observaciones: e.target.value })}
                className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs h-24 resize-none"
              ></textarea>
            </div>

            {(isDuplicate.nit || isDuplicate.email || error) && (
              <div className={`p-4 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${error ? 'bg-red-50 border-2 border-red-100' : 'bg-[#FBAE17]/10 border-2 border-brand-alert'}`}>
                <span className={`material-symbols-outlined ${error ? 'text-red-500' : 'text-brand-alert'}`}>
                  {error ? 'cloud_off' : 'warning'}
                </span>
                <p className={`text-[11px] font-bold ${error ? 'text-red-700' : 'text-zinc-900'}`}>
                  {error || 'Este NIT o Email ya se encuentra registrado en el sistema. Por favor, verifícalo en el directorio.'}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 rounded-lg border-2 border-zinc-100 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || (isDuplicate.nit && !initialData?.id) || (isDuplicate.email && !initialData?.id)}
                className="bg-primary text-white px-10 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : (initialData?.id ? 'Actualizar Cliente' : 'Guardar Cliente')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewClientModal;
