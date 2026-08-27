export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'pending':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'cancelled':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-stone-100 text-stone-800 border-stone-200';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'Confirmé';
    case 'pending':
      return 'En attente';
    case 'completed':
      return 'Terminé';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};
