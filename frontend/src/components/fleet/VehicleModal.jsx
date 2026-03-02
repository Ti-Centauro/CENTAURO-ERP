import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import api, { createFleet, updateFleet } from '../../services/api';
import { formatDateUTC } from '../../utils/formatters';
import MaintenanceTab from '../assets/MaintenanceTab';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';
import ConfirmModal from '../shared/ConfirmModal';

const VehicleModal = ({ vehicle, insurances = [], onClose, onSuccess, canEdit, onDelete }) => {
  const [modalTab, setModalTab] = useState('details');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    license_plate: '',
    model: '',
    brand: '',
    year: new Date().getFullYear(),
    color: '',
    fuel_type: '',
    odometer: '',
    cnpj: '',
    status: 'ACTIVE',
    insurance_id: '',
    deactivation_date: ''
  });

  const [fuelCosts, setFuelCosts] = useState([]);
  const [tollCosts, setTollCosts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, type: null });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        license_plate: vehicle.license_plate || '',
        model: vehicle.model || '',
        brand: vehicle.brand || '',
        year: vehicle.year || '',
        color: vehicle.color || '',
        fuel_type: vehicle.fuel_type || '',
        odometer: vehicle.odometer || '',
        cnpj: vehicle.cnpj || '',
        status: vehicle.status || 'ACTIVE',
        insurance_id: vehicle.insurance_id || '',
        deactivation_date: vehicle.deactivation_date || ''
      });
      loadCosts();
    }
  }, [vehicle]);

  // Handle Escape Key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadCosts = async () => {
    if (!vehicle) return;
    try {
      const [fuelRes, tollRes] = await Promise.all([
        api.get(`/assets/fleet/${vehicle.id}/fuel`),
        api.get(`/assets/fleet/${vehicle.id}/tolls`)
      ]);
      setFuelCosts(fuelRes.data);
      setTollCosts(tollRes.data);
    } catch (error) {
      console.error("Error loading vehicle costs", error);
    }
  };

  const loadTollCosts = async () => {
    if (!vehicle) return;
    try {
      const res = await api.get(`/assets/fleet/${vehicle.id}/tolls`);
      setTollCosts(res.data);
    } catch (error) { console.error(error); }
  };

  const handleDeleteRequest = (id, type) => {
    setConfirmDelete({ open: true, id, type });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id || !confirmDelete.type) return;
    try {
      if (confirmDelete.type === 'fuel') {
        await api.delete(`/assets/fleet/fuel/${confirmDelete.id}`);
        loadCosts();
      } else if (confirmDelete.type === 'toll') {
        await api.delete(`/assets/fleet/tolls/${confirmDelete.id}`);
        loadTollCosts();
      }
      setConfirmDelete({ open: false, id: null, type: null });
    } catch (error) {
      alert('Erro ao excluir registro');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Preparar payload enviando null caso a data esteja vazia
    const payload = { ...formData };
    if (!payload.deactivation_date) {
      payload.deactivation_date = null;
    }
    if (payload.odometer === '') {
      payload.odometer = null;
    } else if (payload.odometer !== null) {
      payload.odometer = parseInt(payload.odometer, 10);
    }

    try {
      if (vehicle) {
        await updateFleet(vehicle.id, payload);
      } else {
        await createFleet(payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erro ao salvar veículo';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'cnpj') {
      value = formatCNPJ(value);
    }
    setFormData({ ...formData, [field]: value });
  };

  const FUEL_TYPES = [
    { value: 'Gasolina', label: 'Gasolina' },
    { value: 'Alcool', label: 'Álcool' },
    { value: 'Flex', label: 'Flex' },
    { value: 'Diesel', label: 'Diesel' }
  ];

  const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Ativo' },
    { value: 'MAINTENANCE', label: 'Manutenção' }
  ];

  return (
    <div className="fleet-form-modal">
      <div className="fleet-form card" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3>{vehicle ? 'Editar Veículo' : 'Cadastrar Veículo'}</h3>
          {vehicle && canEdit && (
            <button
              type="button"
              className="btn-icon-small danger"
              onClick={onDelete}
              title="Excluir Veículo"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {vehicle && (
          <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
            {['details', 'maintenance', 'fuel', 'tolls'].map(t => (
              <button key={t} onClick={() => setModalTab(t)} style={{
                padding: '0.5rem 0', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: modalTab === t ? '2px solid #0284c7' : '2px solid transparent',
                color: modalTab === t ? '#0284c7' : '#64748b', fontWeight: modalTab === t ? 600 : 500
              }}>
                {{ details: 'Dados', maintenance: 'Manutenções', fuel: 'Combustível', tolls: 'Pedágios' }[t]}
              </button>
            ))}
          </div>
        )}

        {modalTab === 'details' && (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <Input label="Placa *" value={formData.license_plate} onChange={handleChange('license_plate')} required placeholder="ABC-1234" />
              <Input label="Modelo *" value={formData.model} onChange={handleChange('model')} required />
              <Input label="Marca *" value={formData.brand} onChange={handleChange('brand')} required />
              <Input label="Ano *" type="number" value={formData.year} onChange={handleChange('year')} required />
              <Input label="Cor" value={formData.color} onChange={handleChange('color')} />
              <Select label="Combustível" value={formData.fuel_type} onChange={handleChange('fuel_type')} options={FUEL_TYPES} placeholder="Selecione..." />
              <Input label="KM Atual" type="number" value={formData.odometer} onChange={handleChange('odometer')} />
              <Input label="CNPJ" value={formData.cnpj} onChange={handleChange('cnpj')} maxLength={18} />
              <Select label="Status *" value={formData.status} onChange={handleChange('status')} options={STATUS_OPTIONS} required />
              <Select
                label="Seguro"
                value={formData.insurance_id}
                onChange={handleChange('insurance_id')}
                placeholder="Sem seguro"
                wrapperClassName="full-width"
              >
                {insurances.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.insurance_company} - {i.policy_number} {i.validity ? `(Vencimento: ${formatDateUTC(i.validity)})` : ''}
                  </option>
                ))}
              </Select>
              <Input label="Data de Baixa (Opcional)" type="date" value={formData.deactivation_date || ''} onChange={handleChange('deactivation_date')} wrapperClassName="full-width" />
            </div>
            <div className="form-actions">
              <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
              {canEdit && <Button variant="primary" type="submit" isLoading={loading}>Salvar</Button>}
            </div>
          </form>
        )}

        {modalTab === 'maintenance' && (
          <div>
            <MaintenanceTab vehicle={{ id: vehicle.id, odometer: formData.odometer }} onUpdate={onSuccess} canEdit={canEdit} />
            <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        )}

        {modalTab === 'fuel' && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <h3>Histórico de Abastecimento</h3>
            {fuelCosts.length === 0 ? <p className="text-gray-500">Sem registros.</p> : (
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th align="left">Mês</th>
                    <th align="right">Litros</th>
                    <th align="right">KM</th>
                    <th align="right">KM/L</th>
                    <th align="right">Valor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fuelCosts.map((c, i) => {
                    const km_l = c.liters > 0 ? (c.km_driven / c.liters).toFixed(2) : '-';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0' }}>{new Date(c.competence_date).toLocaleDateString()}</td>
                        <td align="right">{c.liters ? `${c.liters} L` : '-'}</td>
                        <td align="right">{c.km_driven ? `${c.km_driven}` : '-'}</td>
                        <td align="right">{km_l}</td>
                        <td align="right">R$ {c.total_cost}</td>
                        <td align="right">
                          {canEdit && <button onClick={() => handleDeleteRequest(c.id, 'fuel')} className="btn-icon-small danger"><Trash2 size={14} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        )}

        {modalTab === 'tolls' && (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <h3>Histórico de Pedágio</h3>
            {tollCosts.length === 0 ? <p className="text-gray-500">Sem registros.</p> : (
              <table style={{ width: '100%', fontSize: '0.9rem' }}>
                <thead><tr><th align="left">Mês</th><th align="right">Valor</th><th></th></tr></thead>
                <tbody>
                  {tollCosts.map(tc => (
                    <tr key={tc.id}>
                      <td style={{ padding: '8px 0' }}>{new Date(tc.competence_date).toLocaleDateString()}</td>
                      <td align="right">R$ {tc.total_cost}</td>
                      <td align="right">
                        {canEdit && <button onClick={() => handleDeleteRequest(tc.id, 'toll')} className="btn-icon-small danger"><Trash2 size={14} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmDelete.open}
          onClose={() => setConfirmDelete({ open: false, id: null, type: null })}
          onConfirm={handleConfirmDelete}
          title="Excluir Registro"
          message="Tem certeza que deseja excluir este registro de custo? Esta ação não pode ser desfeita."
        />
      </div>
    </div>
  );
};

export default VehicleModal;
