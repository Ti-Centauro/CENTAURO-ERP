import { useState, useEffect } from 'react';
import { X, PackageCheck, AlertTriangle } from 'lucide-react';
import { withdrawPurchase } from '../../services/api';

const WithdrawalModal = ({ request, onClose, onUpdate }) => {
  const [items, setItems] = useState([]);
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (request?.items) {
      const activeItems = request.items
        .filter(i => i.status !== 'cancelled')
        .map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          quantity_withdrawn: item.quantity_withdrawn || 0,
          remaining: item.quantity - (item.quantity_withdrawn || 0),
          withdraw_qty: 0,
          withdraw_all: false,
        }));
      setItems(activeItems);
    }
  }, [request]);

  const handleToggleAll = (index) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const newAll = !item.withdraw_all;
      return {
        ...item,
        withdraw_all: newAll,
        withdraw_qty: newAll ? item.remaining : 0,
      };
    }));
  };

  const handleQtyChange = (index, value) => {
    const qty = Math.max(0, Math.min(parseInt(value) || 0, items[index].remaining));
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        withdraw_qty: qty,
        withdraw_all: qty >= item.remaining,
      };
    }));
  };

  const isPartial = () => {
    return items.some(item => {
      const afterWithdraw = item.quantity_withdrawn + item.withdraw_qty;
      return afterWithdraw < item.quantity;
    });
  };

  const hasAnyWithdrawal = () => {
    return items.some(item => item.withdraw_qty > 0);
  };

  const handleSubmit = async () => {
    setError('');

    if (!hasAnyWithdrawal()) {
      setError('Selecione ao menos um item para retirada.');
      return;
    }

    if (isPartial() && !observation.trim()) {
      setError('Observação é obrigatória para retiradas parciais.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        observation: observation.trim() || null,
        items: items
          .filter(i => i.withdraw_qty > 0)
          .map(i => ({ item_id: i.id, quantity: i.withdraw_qty })),
      };
      await withdrawPurchase(request.id, payload);
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error withdrawing:', err);
      setError(err.response?.data?.detail || 'Erro ao registrar retirada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Styles
  const overlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1100,
  };
  const modal = {
    backgroundColor: '#fff', borderRadius: '12px', width: '95%', maxWidth: '750px',
    maxHeight: '85vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
  };
  const header = {
    padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  };
  const headerTitle = {
    margin: 0, fontSize: '1.15rem', color: '#1e293b',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
  };
  const content = {
    padding: '1.5rem', overflowY: 'auto', flex: 1,
  };
  const footer = {
    padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0',
    display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem',
    backgroundColor: '#f8fafc', borderRadius: '0 0 12px 12px',
  };
  const table = {
    width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem',
  };
  const th = {
    backgroundColor: '#f8fafc', padding: '0.6rem 0.75rem', textAlign: 'left',
    fontWeight: 600, color: '#64748b', borderBottom: '2px solid #e2e8f0',
    fontSize: '0.8rem',
  };
  const td = {
    padding: '0.6rem 0.75rem', borderBottom: '1px solid #f1f5f9',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={header}>
          <h3 style={headerTitle}>
            <PackageCheck size={22} color="#3b82f6" />
            Registrar Retirada — Solicitação #{request?.id}
          </h3>
          <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.5rem', borderRadius: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={content}>
          {/* Info banner */}
          <div style={{
            padding: '0.75rem 1rem', backgroundColor: '#eff6ff', borderRadius: '8px',
            marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            border: '1px solid #bfdbfe', fontSize: '0.85rem', color: '#1e40af',
          }}>
            <PackageCheck size={18} />
            Selecione os itens e quantidades que estão sendo retirados para a obra.
          </div>

          {/* Items table */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={{ ...th, width: '5%', textAlign: 'center' }}>✓</th>
                  <th style={{ ...th, width: '40%' }}>Item / Material</th>
                  <th style={{ ...th, width: '12%', textAlign: 'center' }}>Pedido</th>
                  <th style={{ ...th, width: '15%', textAlign: 'center' }}>Já Retirado</th>
                  <th style={{ ...th, width: '13%', textAlign: 'center' }}>Restante</th>
                  <th style={{ ...th, width: '15%', textAlign: 'center' }}>Retirar</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const fullyWithdrawn = item.remaining <= 0;
                  const rowStyle = fullyWithdrawn
                    ? { ...td, backgroundColor: '#f0fdf4', opacity: 0.7 }
                    : td;

                  return (
                    <tr key={item.id} style={fullyWithdrawn ? { opacity: 0.6 } : {}}>
                      <td style={{ ...rowStyle, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={item.withdraw_all}
                          onChange={() => handleToggleAll(index)}
                          disabled={fullyWithdrawn}
                          style={{ width: '16px', height: '16px', cursor: fullyWithdrawn ? 'not-allowed' : 'pointer' }}
                        />
                      </td>
                      <td style={rowStyle}>
                        <div style={{ fontWeight: 500, color: '#1e293b' }}>{item.description}</div>
                        {fullyWithdrawn && (
                          <span style={{
                            fontSize: '0.7rem', color: '#16a34a', fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px',
                          }}>
                            ✓ Totalmente retirado
                          </span>
                        )}
                      </td>
                      <td style={{ ...rowStyle, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                      <td style={{ ...rowStyle, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: '12px',
                          backgroundColor: item.quantity_withdrawn > 0 ? '#fef3c7' : '#f1f5f9',
                          color: item.quantity_withdrawn > 0 ? '#92400e' : '#64748b',
                          fontWeight: 600, fontSize: '0.8rem',
                        }}>
                          {item.quantity_withdrawn}
                        </span>
                      </td>
                      <td style={{ ...rowStyle, textAlign: 'center', fontWeight: 600, color: '#3b82f6' }}>
                        {item.remaining}
                      </td>
                      <td style={{ ...rowStyle, textAlign: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          max={item.remaining}
                          value={item.withdraw_qty}
                          onChange={(e) => handleQtyChange(index, e.target.value)}
                          disabled={fullyWithdrawn}
                          style={{
                            width: '70px', padding: '0.35rem 0.5rem', textAlign: 'center',
                            border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem',
                            backgroundColor: fullyWithdrawn ? '#f1f5f9' : '#fff',
                            fontWeight: 600,
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Observation */}
          <div style={{ marginTop: '1.25rem' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem',
            }}>
              Observação
              {isPartial() && hasAnyWithdrawal() && (
                <span style={{
                  fontSize: '0.7rem', color: '#dc2626', fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                }}>
                  <AlertTriangle size={12} /> Obrigatória (retirada parcial)
                </span>
              )}
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Informe detalhes sobre a retirada, itens faltantes, etc..."
              rows={3}
              style={{
                width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0',
                borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              marginTop: '0.75rem', padding: '0.65rem 1rem', backgroundColor: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626',
              fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footer}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !hasAnyWithdrawal()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PackageCheck size={18} />
            {loading ? 'Registrando...' : 'Confirmar Retirada'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalModal;
