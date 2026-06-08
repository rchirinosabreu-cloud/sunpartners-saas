import { useState, useEffect } from 'react';
import axios from 'axios';

const NewClientModal = ({ isOpen, onClose, onClientCreated, initialData = null }) => {
  const [clientData, setClientData] = useState({
    razon_social: '',
    nit_id: '',
    documentType: 'NIT',
    isTaxExempt: false,
    direccion_fiscal: '',
    ciudad: '',
    referidoPor: '',
    observaciones: '',
    contacts: []
  });
  const [isDuplicate, setIsDuplicate] = useState({ nit: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      let contacts = initialData.contacts || [];

      // v60.1: Fallback hydration for non-migrated legacy records
      if (contacts.length === 0 && (initialData.responsable || initialData.email || initialData.telefono)) {
        contacts = [{
          name: initialData.responsable || 'Contacto Principal',
          email: initialData.email || '',
          phone: initialData.telefono || '',
          role: 'Migrado (Auto)',
          isPrimary: true
        }];
      }

      setClientData({
        ...initialData,
        contacts
      });
    } else {
      setClientData({
        razon_social: '',
        nit_id: '',
        documentType: 'NIT',
        isTaxExempt: false,
        direccion_fiscal: '',
        ciudad: '',
        referidoPor: '',
        observaciones: '',
        contacts: [{ name: '', email: '', phone: '', role: '', isPrimary: true }]
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (clientData.nit_id) {
        try {
          const res = await axios.get('/api/clients/check-duplicates', {
            params: {
              nit_id: clientData.nit_id,
              excludeId: initialData?.id
            },
            withCredentials: true,
            timeout: 5000
          });
          setIsDuplicate({ nit: res.data.nitExists });
          setError(null);
        } catch (e) {
          console.error(e);
          if (e.code === 'ECONNABORTED' || !e.response) {
            setError('Conexión inestable con el servidor. Verifica tu internet.');
          }
        }
      } else {
        setIsDuplicate({ nit: false });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [clientData.nit_id]);

  const handleNitChange = (val) => {
    if (clientData.documentType === 'NIT') {
      const clean = val.replace(/\D/g, '').substring(0, 10);
      let masked = clean;
      if (clean.length > 9) masked = `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9, 10)}`;
      else if (clean.length > 6) masked = `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6)}`;
      else if (clean.length > 3) masked = `${clean.substring(0, 3)}.${clean.substring(3)}`;
      setClientData({ ...clientData, nit_id: masked });
    } else {
      setClientData({ ...clientData, nit_id: val });
    }
  };

  const addContact = () => {
    setClientData({
      ...clientData,
      contacts: [...clientData.contacts, { name: '', email: '', phone: '', role: '', isPrimary: false }]
    });
  };

  const removeContact = (index) => {
    const newContacts = clientData.contacts.filter((_, i) => i !== index);
    // Ensure at least one primary if we deleted the primary one
    if (newContacts.length > 0 && !newContacts.find(c => c.isPrimary)) {
      newContacts[0].isPrimary = true;
    }
    setClientData({ ...clientData, contacts: newContacts });
  };

  const updateContact = (index, field, value) => {
    const newContacts = clientData.contacts.map((c, i) => {
      if (i === index) {
        if (field === 'isPrimary' && value === true) {
          // If setting this one to primary, others must be false
          return { ...c, [field]: value };
        }
        return { ...c, [field]: value };
      }
      if (field === 'isPrimary' && value === true) {
        return { ...c, isPrimary: false };
      }
      return c;
    });
    setClientData({ ...clientData, contacts: newContacts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDuplicate.nit) return; // Note: email check removed as it's now per-contact and client email is legacy
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
              <h3 className="font-display text-xl font-black tracking-tight text-zinc-900">
                {initialData?.id ? 'Editar cliente maestro' : 'Registrar nuevo cliente'}
              </h3>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2">Empresa / Razón Social</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Sunpartners SAS"
                  value={clientData.razon_social}
                  onChange={e => setClientData({ ...clientData, razon_social: e.target.value })}
                  className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2">Tipo</label>
                  <select
                    value={clientData.documentType}
                    onChange={e => setClientData({ ...clientData, documentType: e.target.value })}
                    className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                  >
                    <option value="NIT">NIT</option>
                    <option value="CC">C.C</option>
                    <option value="OTHER">OTRO</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2">Documento / ID</label>
                  <input
                    required
                    type="text"
                    placeholder={clientData.documentType === 'NIT' ? "900.123.456-1" : "Número de ID"}
                    value={clientData.nit_id}
                    onChange={e => handleNitChange(e.target.value)}
                    className={`w-full border-2 ${isDuplicate.nit ? 'border-brand-alert' : 'border-zinc-100'} rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2">Dirección fiscal</label>
                <input
                  required
                  type="text"
                  placeholder="Dirección para facturación"
                  value={clientData.direccion_fiscal}
                  onChange={e => setClientData({ ...clientData, direccion_fiscal: e.target.value })}
                  className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                />
              </div>
              <div className="flex items-center justify-between p-3 border-2 border-zinc-100 rounded-lg bg-zinc-50/50">
                <div>
                   <p className="text-[10px] font-black tracking-widest text-zinc-900 leading-none">Exento de IVA</p>
                   <p className="text-[9px] font-bold text-zinc-400 mt-1">Habilitar para clientes internacionales</p>
                </div>
                <button
                  type="button"
                  onClick={() => setClientData({ ...clientData, isTaxExempt: !clientData.isTaxExempt })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${clientData.isTaxExempt ? 'bg-primary' : 'bg-zinc-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${clientData.isTaxExempt ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2">Ciudad</label>
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
              <div>
                <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2">Referido por</label>
                <input
                  type="text"
                  placeholder="Persona o empresa que refirió"
                  value={clientData.referidoPor}
                  onChange={e => setClientData({ ...clientData, referidoPor: e.target.value })}
                  className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                />
              </div>
            </div>
            <div className="border-t border-zinc-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-black tracking-widest text-zinc-900 uppercase">Contactos Responsables</h4>
                <button
                  type="button"
                  onClick={addContact}
                  className="text-primary hover:text-primary-hover flex items-center gap-1 text-[10px] font-black tracking-widest"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Añadir Contacto
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {clientData.contacts.map((contact, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${contact.isPrimary ? 'border-primary/20 bg-primary/5' : 'border-zinc-100 bg-zinc-50'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4">
                        <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Nombre Completo *</label>
                        <input
                          required
                          type="text"
                          placeholder="Ej: Juan Pérez"
                          value={contact.name}
                          onChange={e => updateContact(idx, 'name', e.target.value)}
                          className="w-full border-2 border-white rounded-lg p-2 font-bold outline-none focus:border-primary transition-all text-[11px]"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Email</label>
                        <input
                          type="email"
                          placeholder="juan@empresa.com"
                          value={contact.email || ''}
                          onChange={e => updateContact(idx, 'email', e.target.value)}
                          className="w-full border-2 border-white rounded-lg p-2 font-bold outline-none focus:border-primary transition-all text-[11px]"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Teléfono</label>
                        <input
                          type="text"
                          placeholder="+57..."
                          value={contact.phone || ''}
                          onChange={e => updateContact(idx, 'phone', e.target.value)}
                          className="w-full border-2 border-white rounded-lg p-2 font-bold outline-none focus:border-primary transition-all text-[11px]"
                        />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-center pb-1">
                        <button
                          type="button"
                          onClick={() => removeContact(idx)}
                          className="text-zinc-300 hover:text-red-500 transition-colors"
                          title="Eliminar contacto"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Cargo / Rol</label>
                        <input
                          type="text"
                          placeholder="Ej: Dir. Logística"
                          value={contact.role || ''}
                          onChange={e => updateContact(idx, 'role', e.target.value)}
                          className="w-full border-2 border-white rounded-lg p-2 font-bold outline-none focus:border-primary transition-all text-[11px]"
                        />
                      </div>
                      <div className="md:col-span-8 flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => updateContact(idx, 'isPrimary', true)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest transition-all ${contact.isPrimary ? 'bg-primary text-white' : 'bg-white text-zinc-400 border border-zinc-200 hover:bg-zinc-50'}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {contact.isPrimary ? 'check_circle' : 'circle'}
                          </span>
                          CONTACTO PRINCIPAL
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2">Referido por</label>
                <input
                  type="text"
                  placeholder="Persona o empresa que refirió"
                  value={clientData.referidoPor}
                  onChange={e => setClientData({ ...clientData, referidoPor: e.target.value })}
                  className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2">Observaciones</label>
                <textarea
                  placeholder="Notas adicionales sobre el cliente..."
                  value={clientData.observaciones}
                  onChange={e => setClientData({ ...clientData, observaciones: e.target.value })}
                  className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs h-12 resize-none"
                ></textarea>
              </div>
            </div>

            {(isDuplicate.nit || error) && (
              <div className={`p-4 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${error ? 'bg-red-50 border-2 border-red-100' : 'bg-[#FBAE17]/10 border-2 border-brand-alert'}`}>
                <span className={`material-symbols-outlined ${error ? 'text-red-500' : 'text-brand-alert'}`}>
                  {error ? 'cloud_off' : 'warning'}
                </span>
                <p className={`text-[11px] font-bold ${error ? 'text-red-700' : 'text-zinc-900'}`}>
                  {error || 'Este NIT ya se encuentra registrado en el sistema. Por favor, verifícalo en el directorio.'}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 rounded-lg border-2 border-zinc-100 text-[11px] font-black tracking-widest hover:bg-zinc-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || (isDuplicate.nit && !initialData?.id)}
                className="bg-primary text-white px-10 py-3 rounded-lg text-[11px] font-black tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : (initialData?.id ? 'Actualizar cliente' : 'Guardar cliente')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewClientModal;
