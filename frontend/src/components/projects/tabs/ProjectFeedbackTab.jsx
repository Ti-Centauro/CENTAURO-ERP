import React, { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { createProjectFeedback, deleteProjectFeedback } from '../../../services/api';
import { formatTimeAgo } from '../../../utils/formatters';

const ProjectFeedbackTab = ({ project, feedbacks, canEdit, onUpdate }) => {
  const [feedbackInput, setFeedbackInput] = useState('');
  const [feedbackType, setFeedbackType] = useState('INFO');

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackInput.trim()) return;
    try {
      await createProjectFeedback(project.id, {
        message: feedbackInput,
        type: feedbackType
      });
      setFeedbackInput('');
      onUpdate();
    } catch (error) {
      alert('Erro ao enviar feedback: ' + error.message);
    }
  };

  return (
    <div className="tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px', padding: '1rem' }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {feedbacks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto' }}>Nenhum feedback registrado.</p>
        ) : (
          feedbacks.map(fb => (
            <div key={fb.id} className="feedback-item" style={{ background: fb.type === 'ALERTA' ? '#fff7ed' : fb.type === 'BLOQUEIO' ? '#fef2f2' : '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '600' }}>
                  {(fb.author_name || 'U').charAt(0)}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>{fb.author_name || 'Usuário'}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• {formatTimeAgo(fb.created_at)}</span>
                {(fb.type === 'ALERTA' || fb.type === 'BLOQUEIO') && (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: '700',
                    color: fb.type === 'ALERTA' ? '#ea580c' : '#dc2626',
                    background: fb.type === 'ALERTA' ? '#ffedd5' : '#fee2e2',
                    padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto'
                  }}>
                    {fb.type}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.4' }}>
                {fb.message}
              </div>
            </div>
          ))
        )}
      </div>

      {canEdit && (
        <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <select value={feedbackType} onChange={(e) => setFeedbackType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <option value="INFO">Info</option>
            <option value="ALERTA">Alerta</option>
            <option value="BLOQUEIO">Bloqueio</option>
          </select>
          <textarea
            value={feedbackInput}
            onChange={e => setFeedbackInput(e.target.value)}
            placeholder="Digite uma atualização..."
            rows="1"
            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'none' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleFeedbackSubmit(e);
              }
            }}
          />
          <button type="submit" disabled={!feedbackInput.trim()} className="btn btn-primary" style={{ padding: '0 1rem' }}>
            <Send size={18} />
          </button>
        </form>
      )}
    </div>
  );
};

export default ProjectFeedbackTab;
