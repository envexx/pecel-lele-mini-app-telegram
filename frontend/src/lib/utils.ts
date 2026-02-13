export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'badge-pending';
    case 'processing': return 'badge-processing';
    case 'ready': return 'badge-ready';
    case 'completed': return 'badge-completed';
    case 'cancelled': return 'badge-completed';
    default: return 'badge-pending';
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'paid': return 'text-green-600';
    case 'unpaid': return 'text-red-600';
    case 'partial': return 'text-amber-600';
    default: return 'text-gray-600';
  }
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
