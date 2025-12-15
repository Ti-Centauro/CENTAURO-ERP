import { useState, useEffect } from 'react';
import { Plus, Wrench, Calendar, DollarSign, Activity, FileText, Trash2, Edit, CheckSquare, Square, X } from 'lucide-react';
import { getVehicleMaintenances, createMaintenance, updateMaintenance, deleteMaintenance } from '../services/api';

const CATEGORIES_OPTIONS = ["Motor", "Freio", "Suspensão", "Pneus", "Elétrica", "Funilaria", "Óleo/Filtros", "Outros"];

const MaintenanceTab = ({ vehicle, onUpdate, canEdit = true }) => {
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    workshop_name: '',
    entry_date: '',
    exit_date: '',
    cost: '',
    odometer: '',
    maintenance_type: 'PREVENTIVA',
    categories: [], // Array of strings
    description: '',
  });

  useEffect(() => {
    if (vehicle) {
      loadMaintenances();
    }
  }, [vehicle]);

  const loadMaintenances = async () => {
    setLoading(true);
    try {
      const res = await getVehicleMaintenances(vehicle.id);
      setMaintenances(res.data);
    } catch (error) {
      console.error("Error loading maintenances", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      workshop_name: '',
      entry_date: new Date().toISOString().split('T')[0],
      exit_date: '',
      cost: '',
      odometer: vehicle.odometer || '',
      maintenance_type: 'PREVENTIVA',
      categories: [],
      description: '',
    });
    setEditingId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setFormData({
      workshop_name: item.workshop_name,
      entry_date: item.entry_date,
      exit_date: item.exit_date || '',
      cost: item.cost,
      odometer: item.odometer,
      maintenance_type: item.maintenance_type,
      categories: item.categories ? item.categories.split(',') : [],
      description: item.description || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta manutenção?")) {
      try {
        await deleteMaintenance(id);
        loadMaintenances();
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error("Error deleting", error);
        alert("Erro ao excluir");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        vehicle_id: vehicle.id,
        cost: parseFloat(formData.cost),
        odometer: parseInt(formData.odometer),
        categories: formData.categories.join(','), // Join for backend string
        exit_date: formData.exit_date || null
      };

      if (editingId) {
        await updateMaintenance(editingId, payload);
      } else {
        await createMaintenance(payload);
      }
      setShowForm(false);
      loadMaintenances();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error saving", error);
      alert("Erro ao salvar manutenção");
    }
  };

  const toggleCategory = (cat) => {
    setFormData(prev => {
      const exists = prev.categories.includes(cat);
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c !== cat) };
      } else {
        return { ...prev, categories: [...prev.categories, cat] };
      }
    });
  };

  // Calculate Total
  const totalCost = maintenances.reduce((acc, curr) => acc + (curr.cost || 0), 0);

  if (showForm) {
    return (
      <div className="maintenance-form-container">
        <div className="form-header-inline" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h4>{editingId ? 'Editar Manutenção' : 'Nova Manutenção'}</h4>
          <button type="button" className="btn-icon-small" onClick={() => setShowForm(false)}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="label">Oficina *</label>
              <input
                className="input"
                required
                value={formData.workshop_name}
                onChange={e => setFormData({ ...formData, workshop_name: e.target.value })}
                placeholder="Nome da Oficina"
              />
            </div>
            <div className="form-group">
              <label className="label">Tipo *</label>
              <select
                className="input"
                value={formData.maintenance_type}
                onChange={e => setFormData({ ...formData, maintenance_type: e.target.value })}
              >
                <option value="PREVENTIVA">Preventiva</option>
                <option value="CORRETIVA">Corretiva</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Data Entrada *</label>
              <input
                type="date"
                className="input"
                required
                value={formData.entry_date}
                onChange={e => setFormData({ ...formData, entry_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Data Saída</label>
              <input
                type="date"
                className="input"
                value={formData.exit_date}
                onChange={e => setFormData({ ...formData, exit_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">KM na Manutenção *</label>
              <input
                type="number"
                className="input"
                required
                value={formData.odometer}
                onChange={e => setFormData({ ...formData, odometer: e.target.value })}
                placeholder="Ex: 50000"
              />
            </div>
            <div className="form-group">
              <label className="label">Valor Total (R$) *</label>
              <input
                type="number"
                step="0.01"
                className="input"
                required
                value={formData.cost}
                onChange={e => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="label">Categorias</label>
              <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                {CATEGORIES_OPTIONS.map(cat => {
                  const isSelected = formData.categories.includes(cat);
                  return (
                    <div
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        background: isSelected ? '#e0f2fe' : '#f8fafc',
                        border: isSelected ? '1px solid #7dd3fc' : '1px solid #e2e8f0'
                      }}
                    >
                      {isSelected ? <CheckSquare size={16} color="#0284c7" /> : <Square size={16} color="#94a3b8" />}
                      <span style={{ fontSize: '0.85rem', color: isSelected ? '#0369a1' : '#64748b' }}>{cat}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="label">Descrição</label>
              <textarea
                className="input"
                rows="3"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes do serviço..."
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar Manutenção</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="maintenance-list">
      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="stats">
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Custo Total: </span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>
            R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {canEdit && (
          <button className="btn btn-primary small" onClick={handleAddNew}>
            <Plus size={16} /> Nova
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
              <th style={{ padding: '0.5rem' }}>Data</th>
              <th style={{ padding: '0.5rem' }}>Oficina</th>
              <th style={{ padding: '0.5rem' }}>Tipo</th>
              <th style={{ padding: '0.5rem' }}>Categoria</th>
              <th style={{ padding: '0.5rem' }}>KM</th>
              <th style={{ padding: '0.5rem' }}>Valor</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem', width: '80px' }}></th>
            </tr>
          </thead>
          <tbody>
            {maintenances.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  Nenhuma manutenção registrada.
                </td>
              </tr>
            ) : (
              maintenances.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.5rem' }}>{item.entry_date ? item.entry_date.split('-').reverse().join('/') : ''}</td>
                  <td style={{ padding: '0.5rem' }}>{item.workshop_name}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: item.maintenance_type === 'PREVENTIVA' ? '#dcfce7' : '#fee2e2',
                      color: item.maintenance_type === 'PREVENTIVA' ? '#166534' : '#991b1b'
                    }}>
                      {item.maintenance_type}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.categories}
                  </td>
                  <td style={{ padding: '0.5rem' }}>{item.odometer} km</td>
                  <td style={{ padding: '0.5rem' }}>R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {(() => {
                      const todayStr = new Date().toLocaleDateString('en-CA');
                      const entryDateStr = item.entry_date;
                      const exitDateStr = item.exit_date;

                      if (entryDateStr > todayStr) {
                        return (
                          <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} /> Agendado
                          </span>
                        );
                      }
                      if (!exitDateStr || exitDateStr > todayStr) {
                        return (
                          <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Activity size={14} /> Em andamento
                          </span>
                        );
                      }
                      return (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Concluído
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {canEdit && (
                        <>
                          <button className="btn-icon-small" onClick={() => handleEdit(item)} title="Editar">
                            <Edit size={16} />
                          </button>
                          <button className="btn-icon-small danger" onClick={() => handleDelete(item.id)} title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceTab;
