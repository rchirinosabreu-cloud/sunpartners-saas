const calculateLineTotal = (item) => {
  const cant = parseInt(item.cantidad || 0);
  const dias = parseInt(item.dias || 1);
  const v1 = parseFloat(item.precio_pactado || 0);
  const vExtra = parseFloat(item.precio_dia_adicional || 0);
  return (cant * v1) + (cant * (Math.max(0, dias - 1)) * vExtra);
};

const calculateTotals = (items, services) => {
  const subtotalItems = (items || []).reduce((acc, item) => acc + calculateLineTotal(item), 0);
  const subtotalServices = (services || []).reduce((acc, svc) => acc + calculateLineTotal(svc), 0);
  const subtotal = subtotalItems + subtotalServices;
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return { subtotal, iva, total };
};

module.exports = { calculateTotals, calculateLineTotal };
