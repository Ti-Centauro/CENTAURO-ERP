import React, { useState } from 'react';
import { Users, Plus, Trash2, Calendar } from 'lucide-react';
import { addProjectCollaborator, removeProjectCollaborator } from '../../../services/api';
// Note: api.js redirects to operational.js which exports these.
import { formatDateUTC } from '../../../utils/formatters';

const ProjectTeamTab = ({ project, projectCollaborators, availableCollaborators, canEdit, onUpdate }) => {
  const [showCollabForm, setShowCollabForm] = useState(false);
  const [collabFormData, setCollabFormData] = useState({
    collaborator_id: '',
    role: '',
    start_date: '',
    end_date: '',
    include_weekends: false
  });

  const getCollaboratorName = (id) => {
    const c = availableCollaborators.find(col => col.id === id);
    return c ? (c.name || c.user?.name || c.email) : 'Desconhecido';
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    try {
      await addProjectCollaborator(project.id, { ...collabFormData, project_id: project.id });
      setShowCollabForm(false);
      setCollabFormData({
        collaborator_id: '',
        role: '',
        start_date: '',
        end_date: '',
        include_weekends: false
      });
      onUpdate();
    } catch (error) {
      alert('Erro ao adicionar colaborador: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRemoveCollaborator = async (id) => {
    if (!confirm('Remover este colaborador do projeto?')) return;
    try {
      await removeProjectCollaborator(id);
      onUpdate();
    } catch (error) {
      alert('Erro ao remover: ' + error.message);
    }
  };

  return (
    <div className="tab-content" style={{ padding: '1rem' }}>
      <div className="tab-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Colaboradores Alocados</h3>
        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCollabForm(!showCollabForm)}>
            <Plus size={16} /> Adicionar
          </button>
        )}
      </div>

      {showCollabForm && (
        <form className="resource-form" onSubmit={handleAddCollaborator} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Colaborador</label>
            <select
              value={collabFormData.collaborator_id}
              onChange={(e) => setCollabFormData({ ...collabFormData, collaborator_id: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            >
              <option value="">Selecione...</option>
              {availableCollaborators.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.role}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Função</label>
            <input
              type="text"
              placeholder="Ex: Motorista"
              value={collabFormData.role}
              onChange={(e) => setCollabFormData({ ...collabFormData, role: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Data Início</label>
              <input
                type="date"
                value={collabFormData.start_date}
                onChange={(e) => setCollabFormData({ ...collabFormData, start_date: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Data Fim</label>
              <input
                type="date"
                value={collabFormData.end_date}
                onChange={(e) => setCollabFormData({ ...collabFormData, end_date: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
            <label htmlFor="collab-weekends" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.875rem' }}>Incluir Finais de Semana e Feriados</label>
            <input
              type="checkbox"
              checked={collabFormData.include_weekends}
              onChange={(e) => setCollabFormData({ ...collabFormData, include_weekends: e.target.checked })}
              id="collab-weekends"
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCollabForm(false)}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="resource-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {projectCollaborators.map(pc => (
          <div key={pc.id} className="resource-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <div className="resource-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Users size={20} color="#64748b" />
              <div>
                <strong style={{ display: 'block', color: '#334155' }}>{getCollaboratorName(pc.collaborator_id)}</strong>
                {pc.role && <span className="resource-role" style={{ fontSize: '0.85rem', color: '#64748b' }}>{pc.role}</span>}
                {pc.start_date && (
                  <div className="resource-dates" style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Calendar size={12} />
                    {formatDateUTC(pc.start_date)}
                    {pc.end_date && ` - ${formatDateUTC(pc.end_date)}`}
                  </div>
                )}
              </div>
            </div>
            {canEdit && (
              <button
                className="btn-icon-small danger"
                onClick={() => handleRemoveCollaborator(pc.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {projectCollaborators.length === 0 && !showCollabForm && (
          <p className="empty-message" style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>Nenhum colaborador alocado neste projeto.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectTeamTab;
