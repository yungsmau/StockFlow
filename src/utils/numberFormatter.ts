export const formatNumberWithSpaces = (num: number): string => {
  if (isNaN(num) || num === null) return "";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const parseNumberFromInput = (input: string): number => {
  const clean = input.replace(/[^0-9.]/g, "");
  return clean ? parseFloat(clean) : 0;
};
