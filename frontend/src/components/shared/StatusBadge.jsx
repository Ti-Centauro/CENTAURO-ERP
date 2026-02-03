import React from 'react';

const StatusBadge = ({ status, type = 'default' }) => {
  // Map statuses to colors
  const getStatusColor = (status) => {
    const s = status?.toUpperCase();

    // Core Statuses
    if (['ACTIVE', 'ATIVO', 'VALID', 'VÁLIDO', 'COMPLETED', 'CONCLUÍDO', 'PAID', 'PAGO', 'APPROVED', 'APROVADO'].includes(s)) {
      return { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' }; // Green
    }
    if (['INACTIVE', 'INATIVO', 'EXPIRED', 'VENCIDO', 'REJECTED', 'REJEITADO', 'CANCELED', 'CANCELADO'].includes(s)) {
      return { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' }; // Red
    }
    if (['PENDING', 'PENDENTE', 'PROCESSING', 'PROCESSANDO', 'MAINTENANCE', 'MANUTENÇÃO', 'ON_HOLD'].includes(s)) {
      return { bg: '#fef9c3', color: '#854d0e', border: '#fde047' }; // Yellow
    }
    if (['DRAFT', 'RASCUNHO'].includes(s)) {
      return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }; // Gray
    }

    // Default
    return { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
  };

  const style = getStatusColor(status);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: 'nowrap'
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
