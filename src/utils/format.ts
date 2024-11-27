export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('si-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount);
}; 