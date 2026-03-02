export const formatDateUTC = (dateString) => {
  if (!dateString) return 'N/A';
  if (dateString.includes('T')) return new Date(dateString).toLocaleDateString('pt-BR');
  return new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR');
};

export const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
};

export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'agora mesmo';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `há ${diffInHours} horas`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `há ${diffInDays} dias`;

  return date.toLocaleDateString('pt-BR');
};

export const isDeactivated = (dateString) => {
  if (!dateString) return false;
  // Create date considering midnight of the local timezone to compare with today safely
  // dateString is typically 'YYYY-MM-DD'
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return targetDate <= today;
};
