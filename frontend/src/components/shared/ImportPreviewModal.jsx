import React from 'react';
import { AlertCircle, Check, X, FileText, AlertTriangle } from 'lucide-react';

const ImportPreviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  data,
  type = 'fuel', // 'fuel' or 'tolls'
  loading = false
}) => {
  if (!isOpen) return null;

  const { competence_label, preview = [], errors = [], total_found } = data;

  const totalCost = preview.reduce((acc, item) => acc + (parseFloat(item.total_cost) || 0), 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: '#e0f2fe', borderRadius: '8px', color: '#0284c7' }}>
              <FileText size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Importar {type === 'fuel' ? 'Combustível' : 'Pedágios'}</h2>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Referência: {competence_label}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span className="text-gray-500 text-sm">Registros Encontrados</span>
              <div className="text-2xl font-bold text-slate-800">{total_found} <span className="text-sm font-normal text-gray-400">veículos</span></div>
            </div>
            <div className="stat-card" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span className="text-gray-500 text-sm">Valor Total</span>
              <div className="text-2xl font-bold text-slate-800">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)}
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', color: '#dc2626', fontWeight: '600', marginBottom: '0.5rem' }}>
                <AlertTriangle size={18} />
                <span>Erros Encontrados ({errors.length})</span>
              </div>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#b91c1c', fontSize: '0.9rem', maxHeight: '100px', overflowY: 'auto' }}>
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <div className="table-container" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f1f5f9', color: '#475569' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Placa</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Veículo</th>
                  {type === 'fuel' && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Litros</th>}
                  {type === 'fuel' && <th style={{ padding: '0.75rem', textAlign: 'right' }}>KM</th>}
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Valor</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{row.license_plate}</td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>
                      {row.vehicle_model ? `${row.vehicle_brand} ${row.vehicle_model}` : '-'}
                    </td>
                    {type === 'fuel' && <td style={{ padding: '0.75rem', textAlign: 'right' }}>{row.liters ? `${row.liters} L` : '-'}</td>}
                    {type === 'fuel' && <td style={{ padding: '0.75rem', textAlign: 'right' }}>{row.km_driven || '-'}</td>}
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.total_cost)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {row.found ? <Check size={16} className="text-emerald-500 inline" /> : <AlertCircle size={16} className="text-red-500 inline" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={loading || preview.length === 0}>
            {loading ? 'Processando...' : 'Confirmar Importação'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPreviewModal;
