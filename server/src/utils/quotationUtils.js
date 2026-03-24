const calculateTotals = (items, services) => {
  const subtotalItems = (items || []).reduce((acc, item) => acc + (item.cantidad * (item.precio_pactado || 0)), 0);
  const subtotalServices = (services || []).reduce((acc, svc) => acc + (svc.cantidad * (svc.precio_pactado || 0)), 0);
  const subtotal = subtotalItems + subtotalServices;
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return { subtotal, iva, total };
};

module.exports = { calculateTotals };
