import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Calendar, ArrowRight, Check } from 'lucide-react';
import { getPendingTasks, completeProposalTask, getProposal } from '../../services/api';

const CrmTaskWidget = ({ onOpenProposal }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await getPendingTasks();
      setTasks(res.data);
    } catch (error) {
      console.error("Error loading CRM tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await completeProposalTask(taskId);
      // Optimistic update or reload
      loadTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      alert("Erro ao concluir tarefa");
    }
  };

  const handleOpenProposal = async (proposalId) => {
    if (onOpenProposal) {
      // Verify if we need to fetch the full proposal first.
      // The parent (Dashboard) might expect a full proposal object or just an ID.
      // If ProposalModal expects a full object, we should fetch it here, OR 
      // pass the ID to Dashboard and let it fetch/handle.
      // Let's try fetching here to pass a full object to onOpenProposal, 
      // assuming Dashboard just passes it to ProposalModal.
      try {
        const res = await getProposal(proposalId);
        onOpenProposal(res.data);
      } catch (error) {
        console.error("Error fetching proposal details:", error);
        alert("Erro ao abrir proposta.");
      }
    }
  };

  if (loading) return <div className="widget-loading">Carregando tarefas...</div>;

  return (
    <div className="dashboard-widget crm-tasks-widget" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <div className="widget-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
          <CheckCircle size={20} color="#3b82f6" />
          Tarefas CRM (Follow-up)
        </h3>
        <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
          {tasks.length} pendentes
        </span>
      </div>

      <div className="widget-content">
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
            <CheckCircle size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p>Tudo em dia! Nenhuma tarefa pendente.</p>
          </div>
        ) : (
          <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
            {tasks.map(task => (
              <div
                key={task.id}
                className="task-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${task.is_overdue ? '#ef4444' : '#22c55e'}`,
                  background: '#f8fafc',
                  transition: 'all 0.2s'
                }}
              >
                {/* Check Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleComplete(task.id); }}
                  title="Concluir Tarefa"
                  style={{
                    minWidth: '24px', height: '24px',
                    borderRadius: '50%', border: '1px solid #cbd5e1',
                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#cbd5e1'
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.color = '#22c55e'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#cbd5e1'; }}
                >
                  <Check size={14} />
                </button>

                {/* Info */}
                <div
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => handleOpenProposal(task.proposal_id)}
                >
                  <div style={{ fontWeight: 500, color: '#334155', fontSize: '0.9rem' }}>{task.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{task.client_name}</span>
                    <span>{task.proposal_title}</span>
                  </div>
                </div>

                {/* Date */}
                <div style={{ textAlign: 'right', minWidth: '70px' }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: task.is_overdue ? '#dc2626' : '#16a34a',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px'
                  }}>
                    {task.is_overdue && <AlertCircle size={10} />}
                    {new Date(task.due_date).toLocaleDateString('pt-BR').slice(0, 5)}
                  </div>
                  {task.recurrence_days && (
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      Repete {task.recurrence_days}d
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="widget-footer" style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
        <button
          style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%' }}
          onClick={() => window.location.href = '/commercial'}
        >
          Ver todas as propostas <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default CrmTaskWidget;
