export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const formatCurrency = (num: number): string => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const formatPercentage = (num: number): string => {
  if (isNaN(num) || !isFinite(num)) return "0%";
  return `${num.toFixed(1)}%`;
};
