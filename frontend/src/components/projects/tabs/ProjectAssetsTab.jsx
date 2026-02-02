import React, { useState } from 'react';
import { Wrench, Truck, Plus, Trash2, Calendar } from 'lucide-react';
import { addProjectTool, removeProjectTool, addProjectVehicle, removeProjectVehicle } from '../../../services/api';
import { formatDateUTC } from '../../../utils/formatters';

const ProjectAssetsTab = ({ project, projectTools, projectVehicles, availableTools, availableVehicles, canEdit, onUpdate }) => {
  // Tools State
  const [showToolForm, setShowToolForm] = useState(false);
  const [toolFormData, setToolFormData] = useState({ tool_id: '', start_date: '', end_date: '', include_weekends: false });

  // Vehicles State
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleFormData, setVehicleFormData] = useState({ vehicle_id: '', start_date: '', end_date: '', include_weekends: false });

  const getToolName = (id) => availableTools.find(t => t.id === id)?.name || 'Desconhecido';
  const getVehicleName = (id) => {
    const v = availableVehicles.find(v => v.id === id);
    return v ? `${v.model} - ${v.license_plate}` : 'Desconhecido';
  };

  const handleAddTool = async (e) => {
    e.preventDefault();
    try {
      await addProjectTool(project.id, { ...toolFormData, project_id: project.id });
      setShowToolForm(false);
      setToolFormData({ tool_id: '', start_date: '', end_date: '', include_weekends: false });
      onUpdate();
    } catch (err) { alert('Erro ao adicionar ferramenta: ' + err.message); }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      await addProjectVehicle(project.id, { ...vehicleFormData, project_id: project.id });
      setShowVehicleForm(false);
      setVehicleFormData({ vehicle_id: '', start_date: '', end_date: '', include_weekends: false });
      onUpdate();
    } catch (err) { alert('Erro ao adicionar veículo: ' + err.message); }
  };

  const handleRemoveTool = async (id) => {
    if (!confirm('Remover ferramenta?')) return;
    try { await removeProjectTool(id); onUpdate(); } catch (e) { alert('Erro: ' + e.message); }
  }

  const handleRemoveVehicle = async (id) => {
    if (!confirm('Remover veículo?')) return;
    try { await removeProjectVehicle(id); onUpdate(); } catch (e) { alert('Erro: ' + e.message); }
  }

  // Sub-tabs State
  const [activeSubTab, setActiveSubTab] = useState('tools');

  return (
    <div className="tab-content" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Sub-tabs Navigation */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveSubTab('tools')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: activeSubTab === 'tools' ? '#e0f2fe' : 'transparent',
            color: activeSubTab === 'tools' ? '#0284c7' : '#64748b',
            fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Wrench size={18} /> Ferramentas
        </button>
        <button
          onClick={() => setActiveSubTab('vehicles')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: activeSubTab === 'vehicles' ? '#e0f2fe' : 'transparent',
            color: activeSubTab === 'vehicles' ? '#0284c7' : '#64748b',
            fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <Truck size={18} /> Veículos
        </button>
      </div>

      {/* TOOLS SECTION */}
      {activeSubTab === 'tools' && (
        <div className="resource-section">
          <div className="tab-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>Gerenciar Ferramentas</h3>
            {canEdit && <button className="btn btn-primary btn-sm" onClick={() => setShowToolForm(!showToolForm)}><Plus size={16} /> Adicionar</button>}
          </div>

          {showToolForm && (
            <form onSubmit={handleAddTool} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem' }}>Ferramenta</label>
                <select value={toolFormData.tool_id} onChange={e => setToolFormData({ ...toolFormData, tool_id: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <option value="">Selecione...</option>
                  {availableTools.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              {/* Dates... simplified for brevity but essential */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input type="date" value={toolFormData.start_date} onChange={e => setToolFormData({ ...toolFormData, start_date: e.target.value })} style={{ flex: 1, padding: '0.5rem' }} />
                <input type="date" value={toolFormData.end_date} onChange={e => setToolFormData({ ...toolFormData, end_date: e.target.value })} style={{ flex: 1, padding: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowToolForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
              </div>
            </form>
          )}

          <div className="resource-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {projectTools.map(pt => (
              <div key={pt.id} className="resource-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Wrench size={20} color="#64748b" />
                  <div>
                    <strong style={{ display: 'block', color: '#334155' }}>{getToolName(pt.tool_id)}</strong>
                    {pt.start_date && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{formatDateUTC(pt.start_date)} - {formatDateUTC(pt.end_date)}</span>}
                  </div>
                </div>
                {canEdit && <button className="btn-icon-small danger" onClick={() => handleRemoveTool(pt.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>}
              </div>
            ))}
            {projectTools.length === 0 && !showToolForm && <p className="empty-message" style={{ textAlign: 'center', color: '#94a3b8' }}>Nenhuma ferramenta alocada.</p>}
          </div>
        </div>
      )}

      {/* VEHICLES SECTION */}
      {activeSubTab === 'vehicles' && (
        <div className="resource-section">
          <div className="tab-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>Gerenciar Veículos</h3>
            {canEdit && <button className="btn btn-primary btn-sm" onClick={() => setShowVehicleForm(!showVehicleForm)}><Plus size={16} /> Adicionar</button>}
          </div>

          {showVehicleForm && (
            <form onSubmit={handleAddVehicle} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem' }}>Veículo</label>
                <select value={vehicleFormData.vehicle_id} onChange={e => setVehicleFormData({ ...vehicleFormData, vehicle_id: e.target.value })} required style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                  <option value="">Selecione...</option>
                  {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.model} - {v.license_plate}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input type="date" value={vehicleFormData.start_date} onChange={e => setVehicleFormData({ ...vehicleFormData, start_date: e.target.value })} required style={{ flex: 1, padding: '0.5rem' }} />
                <input type="date" value={vehicleFormData.end_date} onChange={e => setVehicleFormData({ ...vehicleFormData, end_date: e.target.value })} required style={{ flex: 1, padding: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowVehicleForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
              </div>
            </form>
          )}

          <div className="resource-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {projectVehicles.map(pv => (
              <div key={pv.id} className="resource-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Truck size={20} color="#64748b" />
                  <div>
                    <strong style={{ display: 'block', color: '#334155' }}>{getVehicleName(pv.vehicle_id)}</strong>
                    {pv.start_date && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{formatDateUTC(pv.start_date)} - {formatDateUTC(pv.end_date)}</span>}
                  </div>
                </div>
                {canEdit && <button className="btn-icon-small danger" onClick={() => handleRemoveVehicle(pv.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>}
              </div>
            ))}
            {projectVehicles.length === 0 && !showVehicleForm && <p className="empty-message" style={{ textAlign: 'center', color: '#94a3b8' }}>Nenhum veículo alocado.</p>}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectAssetsTab;
