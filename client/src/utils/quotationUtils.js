export const calculateLineTotal = (item) => {
  if (!item) return 0;
  const cant = parseInt(item.cantidad || 0);
  const dias = parseInt(item.dias || 1);
  const v1 = parseFloat(item.precio_pactado || 0);
  const vExtra = parseFloat(item.precio_dia_adicional || 0);
  return (cant * v1) + (cant * (Math.max(0, dias - 1)) * vExtra);
};
