import { useState, useEffect } from 'react';
import { Plus, Trash2, Wrench, MapPin, User, Edit, LayoutGrid, List, Search } from 'lucide-react';
import { getTools, createTool, deleteTool, updateTool, getCollaborators, getProjects } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/shared/ConfirmModal';
import SearchableSelect from '../components/shared/SearchableSelect';
import './Tools.css';

const Tools = () => {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('tools', 'edit');

  const [tools, setTools] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // View & Search State
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    serial_number: '',
    current_holder: '',
    current_location: '',
    status: 'AVAILABLE',
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showForm && !showConfirmModal) {
        setShowForm(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm, showConfirmModal]);

  useEffect(() => {
    loadData();
  }, []);

  // Sync Location if Holder is Almoxarifado
  useEffect(() => {
    if (formData.current_holder === 'Almoxarifado') {
      setFormData(prev => {
        if (prev.current_location !== 'Almoxarifado') {
          return { ...prev, current_location: 'Almoxarifado' };
        }
        return prev;
      });
    }
  }, [formData.current_holder]);

  const loadData = async () => {
    try {
      const [toolsRes, collabsRes, projectsRes] = await Promise.all([
        getTools(),
        getCollaborators(),
        getProjects()
      ]);
      setTools(toolsRes.data);
      setCollaborators(collabsRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTools = async () => {
    try {
      const response = await getTools();
      setTools(response.data);
    } catch (error) {
      console.error('Error loading tools:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTool(editingId, formData);
      } else {
        await createTool(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        serial_number: '',
        current_holder: '',
        current_location: '',
        status: 'AVAILABLE',
      });
      loadTools();
    } catch (error) {
      console.error('Error saving tool:', error);
      alert('Erro ao salvar ferramenta: ' + error.response?.data?.detail);
    }
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setShowConfirmModal(true);
  };

  const handleEdit = (tool) => {
    setFormData({
      name: tool.name,
      serial_number: tool.serial_number,
      current_holder: tool.current_holder,
      current_location: tool.current_location || '',
      status: tool.status,
    });
    setEditingId(tool.id);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteTool(itemToDelete);
      setShowConfirmModal(false);
      setItemToDelete(null);
      setShowForm(false);
      loadTools();
    } catch (error) {
      console.error('Error deleting tool:', error);
      alert('Erro ao excluir ferramenta');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      AVAILABLE: { bg: '#10b98115', color: '#10b981' },
      IN_USE: { bg: '#3b82f615', color: '#3b82f6' },
      MAINTENANCE: { bg: '#f59e0b15', color: '#f59e0b' },
    };
    return colors[status] || colors.AVAILABLE;
  };

  const getStatusLabel = (status) => {
    const labels = {
      AVAILABLE: 'Disponível',
      IN_USE: 'Em Uso',
      MAINTENANCE: 'Manutenção',
    };
    return labels[status] || status;
  };

  const holderOptions = [
    { value: 'Almoxarifado', label: 'Almoxarifado' },
    ...collaborators.map(c => ({ value: c.name, label: c.name }))
  ];

  const locationOptions = [
    { value: 'Almoxarifado', label: 'Almoxarifado' },
    { value: 'Escritório', label: 'Escritório' },
    ...projects.map(p => ({ value: p.name, label: p.name }))
  ];

  // Filtering Logic
  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tools">
      <header className="tools-header">
        <div>
          <h1>Gestão de Ferramentas</h1>
          <p>Rastreamento de ferramentas e equipamentos</p>
        </div>

        <div className="tools-header-actions">
          {/* Search Box */}
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome ou patrimônio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Visualização em Grade"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="Visualização em Lista"
            >
              <List size={20} />
            </button>
          </div>

          {canEdit && (
            <button className="btn btn-primary" onClick={() => {
              setEditingId(null);
              setFormData({
                name: '',
                serial_number: '',
                current_holder: '',
                current_location: '',
                status: 'AVAILABLE',
              });
              setShowForm(true);
            }}>
              <Plus size={20} />
              Nova Ferramenta
            </button>
          )}
        </div>
      </header>

      {showForm && (
        <div className="tools-form-modal">
          <div className="tools-form card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>{editingId ? 'Editar Ferramenta' : 'Cadastrar Ferramenta'}</h3>
              {editingId && canEdit && (
                <button
                  type="button"
                  className="btn-icon-small danger"
                  onClick={() => handleDelete(editingId)}
                  title="Excluir Ferramenta"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="label">Nome *</label>
                  <input
                    type="text"
                    name="name"
                    className="input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Alicate de Crimpagem"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Patrimônio *</label>
                  <input
                    type="text"
                    name="serial_number"
                    className="input"
                    value={formData.serial_number}
                    onChange={handleChange}
                    required
                    placeholder="SN123456"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Com Quem Está *</label>
                  <SearchableSelect
                    name="current_holder"
                    value={formData.current_holder}
                    onChange={handleChange}
                    options={holderOptions}
                    placeholder="Selecione ou digite..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Onde Está (Opcional)</label>
                  <SearchableSelect
                    name="current_location"
                    value={formData.current_location}
                    onChange={handleChange}
                    options={locationOptions}
                    placeholder="Selecione ou digite..."
                  />
                </div>
                <div className="form-group">
                  <label className="label">Status *</label>
                  <select
                    name="status"
                    className="input"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="AVAILABLE">Disponível</option>
                    <option value="IN_USE">Em Uso</option>
                    <option value="MAINTENANCE">Manutenção</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                {canEdit && (
                  <button type="submit" className="btn btn-primary">
                    Salvar Ferramenta
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Carregando ferramentas...</div>
      ) : filteredTools.length === 0 ? (
        <div className="empty-state card">
          {searchTerm ? (
            <>
              <Search size={48} color="#94a3b8" />
              <p>Nenhuma ferramenta encontrada para "{searchTerm}".</p>
            </>
          ) : (
            <>
              <Wrench size={48} color="#94a3b8" />
              <p>Nenhuma ferramenta cadastrada ainda.</p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="tools-grid">
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  className="tool-card card clickable"
                  onClick={() => handleEdit(tool)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="tool-card-header">
                    <div className="tool-icon">
                      <Wrench size={24} />
                    </div>
                    <span
                      className="status-badge"
                      style={getStatusColor(tool.status)}
                    >
                      {getStatusLabel(tool.status)}
                    </span>
                  </div>
                  <h3 className="tool-name">{tool.name}</h3>
                  <p className="tool-serial">Patrimônio: {tool.serial_number}</p>
                  <div className="tool-details">
                    <div className="detail-item">
                      <User size={16} color="#64748b" />
                      <div>
                        <span className="detail-label">Com quem:</span>
                        <span className="detail-value">{tool.current_holder}</span>
                      </div>
                    </div>
                    {tool.current_location && (
                      <div className="detail-item">
                        <MapPin size={16} color="#64748b" />
                        <div>
                          <span className="detail-label">Onde:</span>
                          <span className="detail-value">{tool.current_location}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="tools-list">
              <table className="tools-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Nome</th>
                    <th>Patrimônio</th>
                    <th>Com Quem</th>
                    <th>Onde</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTools.map(tool => (
                    <tr key={tool.id} onClick={() => handleEdit(tool)}>
                      <td>
                        <span className="status-badge" style={getStatusColor(tool.status)}>
                          {getStatusLabel(tool.status)}
                        </span>
                      </td>
                      <td><strong>{tool.name}</strong></td>
                      <td style={{ fontFamily: 'monospace' }}>{tool.serial_number}</td>
                      <td>{tool.current_holder}</td>
                      <td>{tool.current_location || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta ferramenta? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default Tools;
