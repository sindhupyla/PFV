export function formatMoney(amount: number | undefined, decimals: number = 2): string {
  if (amount === undefined || isNaN(amount)) {
    return '0.00';
  }
  
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}