import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, FileText, CheckCircle, AlertTriangle, Clock,
  GraduationCap, Award, Star, Shield, TrendingUp, UserCheck
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api, {
  createCollaborator, updateCollaborator,
  getCertifications, createCertification, deleteCertification,
  getCollaboratorEducation, createCollaboratorEducation, deleteCollaboratorEducation,
  getCollaboratorReviews, createCollaboratorReview, deleteCollaboratorReview, getCollaboratorPerformance
} from '../../services/api';
import { Clock as ClockIcon } from 'lucide-react';

const CollaboratorModal = ({
  collaborator,
  onClose,
  onSuccess,
  roles,
  teams,
  canEdit
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  // General Form Data
  const [formData, setFormData] = useState({
    registration_number: '',
    name: '',
    cpf: '',
    rg: '',
    email: '',
    phone: '',
    salary: '',
    role_id: '',
    team_ids: [],
    cnh_number: '',
    cnh_category: '',
    cnh_validity: '',
  });

  // Sub-lists State
  const [certifications, setCertifications] = useState([]);
  const [educationList, setEducationList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [performanceStats, setPerformanceStats] = useState(null);

  // Sub-forms State
  const [certFormData, setCertFormData] = useState({ name: '', type: 'NR', validity: '' });
  const [eduFormData, setEduFormData] = useState({
    type: 'ACADEMIC', institution: '', course_name: '', conclusion_date: '', attachment_url: ''
  });
  const [reviewFormData, setReviewFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    score_technical: 5, score_safety: 5, score_punctuality: 5, comments: ''
  });

  // Initialization
  useEffect(() => {
    if (collaborator) {
      setFormData({
        registration_number: collaborator.registration_number || '',
        name: collaborator.name,
        cpf: collaborator.cpf || '',
        rg: collaborator.rg || '',
        email: collaborator.email || '',
        phone: collaborator.phone || '',
        salary: collaborator.salary || '',
        role_id: collaborator.role_id || '',
        team_ids: collaborator.teams?.map(t => t.id) || [],
        cnh_number: collaborator.cnh_number || '',
        cnh_category: collaborator.cnh_category || '',
        cnh_validity: collaborator.cnh_validity || '',
      });
      loadSubData();
    }
  }, [collaborator]);

  const loadSubData = async () => {
    if (!collaborator) return;
    try {
      const [certs, edu, reviews, perf] = await Promise.all([
        getCertifications(collaborator.id),
        getCollaboratorEducation(collaborator.id),
        getCollaboratorReviews(collaborator.id),
        getCollaboratorPerformance(collaborator.id)
      ]);
      setCertifications(certs.data);
      setEducationList(edu.data);
      setReviewsList(reviews.data);
      setPerformanceStats(perf.data);
    } catch (error) {
      console.error('Error loading sub-data:', error);
    }
  };

  // Formatters
  const formatCPF = (v) => v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').substr(0, 14);
  const formatPhone = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').substr(0, 15);
  const formatRG = (v) => v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4').substr(0, 12);
  const formatMoney = (v) => {
    const numbers = v.replace(/\D/g, '');
    if (!numbers) return '';
    return (parseFloat(numbers) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const getValidityStatus = (dateString) => {
    const diff = new Date(dateString) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { color: '#ef4444', text: 'Vencido', icon: AlertTriangle };
    if (days <= 60) return { color: '#f59e0b', text: 'Vence em breve', icon: Clock };
    return { color: '#10b981', text: 'Válido', icon: CheckCircle };
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'cpf') formatted = formatCPF(value);
    else if (name === 'phone') formatted = formatPhone(value);
    else if (name === 'rg') formatted = formatRG(value);
    else if (name === 'salary') formatted = formatMoney(value);

    setFormData(prev => ({ ...prev, [name]: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        role_id: formData.role_id ? parseInt(formData.role_id) : null,
        team_ids: formData.team_ids || [],
        cnh_validity: formData.cnh_validity || null,
      };

      if (collaborator) {
        await updateCollaborator(collaborator.id, payload);
      } else {
        await createCollaborator(payload);
      }
      onSuccess();
    } catch (error) {
      alert('Erro ao salvar colaborador');
    } finally {
      setLoading(false);
    }
  };

  const handleSubSubmit = async (e, type) => {
    e.preventDefault();
    if (!collaborator) return;
    try {
      if (type === 'certification') {
        await createCertification({ ...certFormData, collaborator_id: collaborator.id });
        setCertFormData({ name: '', type: 'NR', validity: '' });
        const res = await getCertifications(collaborator.id);
        setCertifications(res.data);
      } else if (type === 'education') {
        await createCollaboratorEducation({ ...eduFormData, collaborator_id: collaborator.id });
        setEduFormData({ type: 'ACADEMIC', institution: '', course_name: '', conclusion_date: '', attachment_url: '' });
        const res = await getCollaboratorEducation(collaborator.id);
        setEducationList(res.data);
      } else if (type === 'review') {
        await createCollaboratorReview({ ...reviewFormData, collaborator_id: collaborator.id });
        setReviewFormData({ date: new Date().toISOString().split('T')[0], score_technical: 5, score_safety: 5, score_punctuality: 5, comments: '' });
        const [rev, perf] = await Promise.all([getCollaboratorReviews(collaborator.id), getCollaboratorPerformance(collaborator.id)]);
        setReviewsList(rev.data);
        setPerformanceStats(perf.data);
      }
    } catch (error) {
      alert(`Erro ao salvar ${type}`);
    }
  };

  return (
    <div className="clients-form-modal">
      <div className="clients-form card" style={{ maxWidth: '1100px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>{collaborator ? 'Editar Colaborador' : 'Cadastrar Colaborador'}</h3>

          <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
            {['general', 'certifications', 'education', 'performance'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                disabled={!collaborator && tab !== 'general'}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: !collaborator && tab !== 'general' ? 'not-allowed' : 'pointer',
                  background: activeTab === tab ? 'white' : 'transparent',
                  color: !collaborator && tab !== 'general' ? '#ccc' : activeTab === tab ? '#0f172a' : '#64748b',
                  fontWeight: activeTab === tab ? '600' : '500',
                  boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {{ general: 'Geral', certifications: 'Certificações', education: 'Formação', performance: 'Desempenho' }[tab]}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'general' && (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="label">Matrícula</label>
                <input name="registration_number" className="input" value={formData.registration_number} onChange={handleChange} placeholder="000000" />
              </div>
              <div className="form-group">
                <label className="label">Nome *</label>
                <input name="name" className="input" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="label">CPF</label>
                <input name="cpf" className="input" value={formData.cpf} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="label">RG</label>
                <input name="rg" className="input" value={formData.rg} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="label">Cargo *</label>
                <select name="role_id" className="input" value={formData.role_id} onChange={handleChange} required>
                  <option value="">Selecione...</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Times</label>
                <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {teams.map(team => (
                    <label key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.team_ids.includes(team.id)}
                        onChange={(e) => {
                          if (e.target.checked) setFormData(p => ({ ...p, team_ids: [...p.team_ids, team.id] }));
                          else setFormData(p => ({ ...p, team_ids: p.team_ids.filter(id => id !== team.id) }));
                        }}
                      />
                      {team.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input name="email" className="input" value={formData.email} onChange={handleChange} type="email" />
              </div>
              <div className="form-group">
                <label className="label">Telefone</label>
                <input name="phone" className="input" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="label">Salário</label>
                <input name="salary" className="input" value={formData.salary} onChange={handleChange} />
              </div>
            </div>

            <h4 style={{ margin: '1rem 0', borderBottom: '1px solid #eee' }}>Dados CNH</h4>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group"><label className="label">Número</label><input name="cnh_number" className="input" value={formData.cnh_number} onChange={handleChange} /></div>
              <div className="form-group"><label className="label">Categoria</label><input name="cnh_category" className="input" value={formData.cnh_category} onChange={handleChange} /></div>
              <div className="form-group">
                <label className="label">Validade</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="date" className="input" name="cnh_validity" value={formData.cnh_validity} onChange={handleChange} />
                  {formData.cnh_validity && <div title={getValidityStatus(formData.cnh_validity).text} style={{ color: getValidityStatus(formData.cnh_validity).color }}><getValidityStatus(formData.cnh_validity).icon size={20} /></div>}
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              {canEdit && <button type="submit" className="btn btn-primary" disabled={loading}>Salvar</button>}
            </div>
          </form>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div>
            <form onSubmit={e => handleSubSubmit(e, 'certification')} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                <div className="form-group"><label className="label">Nome</label><input className="input" value={certFormData.name} onChange={e => setCertFormData({ ...certFormData, name: e.target.value })} required /></div>
                <div className="form-group"><label className="label">Tipo</label><select className="input" value={certFormData.type} onChange={e => setCertFormData({ ...certFormData, type: e.target.value })}><option value="NR">NR</option><option value="ASO">ASO</option><option value="TRAINING">Treino</option></select></div>
                <div className="form-group"><label className="label">Validade</label><input type="date" className="input" value={certFormData.validity} onChange={e => setCertFormData({ ...certFormData, validity: e.target.value })} required /></div>
                {canEdit && <button type="submit" className="btn btn-primary"><Plus size={18} /></button>}
              </div>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {certifications.map(cert => (
                <div key={cert.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><strong>{cert.type}:</strong> {cert.name} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({new Date(cert.validity).toLocaleDateString()})</span></div>
                  {canEdit && <button className="btn-icon-small danger" onClick={async () => { await deleteCertification(cert.id); loadSubData(); }}><Trash2 size={16} /></button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <div>
            <form onSubmit={e => handleSubSubmit(e, 'education')} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                <div className="form-group"><label className="label">Tipo</label><select className="input" value={eduFormData.type} onChange={e => setEduFormData({ ...eduFormData, type: e.target.value })}><option value="ACADEMIC">Acadêmico</option><option value="TECHNICAL">Técnico</option><option value="CERTIFICATION">Certificação</option></select></div>
                <div className="form-group"><label className="label">Instituição</label><input className="input" value={eduFormData.institution} onChange={e => setEduFormData({ ...eduFormData, institution: e.target.value })} required /></div>
                <div className="form-group"><label className="label">Curso</label><input className="input" value={eduFormData.course_name} onChange={e => setEduFormData({ ...eduFormData, course_name: e.target.value })} required /></div>
                <div className="form-group"><label className="label">Conclusão</label><input type="date" className="input" value={eduFormData.conclusion_date} onChange={e => setEduFormData({ ...eduFormData, conclusion_date: e.target.value })} required /></div>
                {canEdit && <button type="submit" className="btn btn-primary"><Plus size={18} /></button>}
              </div>
            </form>
            {educationList.map(edu => (
              <div key={edu.id} style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <div><GraduationCap size={16} style={{ display: 'inline', marginRight: '8px' }} /><strong>{edu.course_name}</strong> - {edu.institution}</div>
                {canEdit && <button className="btn-icon-small danger" onClick={async () => { await deleteCollaboratorEducation(edu.id); loadSubData(); }}><Trash2 size={16} /></button>}
              </div>
            ))}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {[{ l: 'Técnica', v: performanceStats?.avg_technical }, { l: 'Segurança', v: performanceStats?.avg_safety }, { l: 'Pontualidade', v: performanceStats?.avg_punctuality }, { l: 'Geral', v: performanceStats?.avg_general }].map((s, i) => (
                <div key={i} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{s.v?.toFixed(1) || '-'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* Chart omitted for brevity but logic exists in original... adding basic chart */}
            {reviewsList.length > 0 && (
              <div style={{ height: '200px', marginBottom: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reviewsList.map(r => ({ name: new Date(r.date).toLocaleDateString(), t: r.score_technical, s: r.score_safety, p: r.score_punctuality }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis domain={[0, 5]} fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="t" stroke="#f59e0b" dot={false} />
                    <Line type="monotone" dataKey="s" stroke="#10b981" dot={false} />
                    <Line type="monotone" dataKey="p" stroke="#3b82f6" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {canEdit && (
              <form onSubmit={e => handleSubSubmit(e, 'review')} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Nova Avaliação</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  <input type="date" className="input" value={reviewFormData.date} onChange={e => setReviewFormData({ ...reviewFormData, date: e.target.value })} />
                  {['score_technical', 'score_safety', 'score_punctuality'].map(f => (
                    <select key={f} className="input" value={reviewFormData[f]} onChange={e => setReviewFormData({ ...reviewFormData, [f]: parseInt(e.target.value) })}>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  ))}
                </div>
                <textarea className="input" rows="2" style={{ marginTop: '0.5rem', width: '100%' }} placeholder="Obs..." value={reviewFormData.comments} onChange={e => setReviewFormData({ ...reviewFormData, comments: e.target.value })} />
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>Adicionar</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorModal;
