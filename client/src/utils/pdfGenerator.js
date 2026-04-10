import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateLineTotal, calculateTotals } from './quotationUtils';

export const generateQuotationPDF = (quotation) => {
  const doc = new jsPDF();

  // Totals Calculation
  const { subtotal, iva, total } = calculateTotals(quotation.items, quotation.services, quotation.client.isTaxExempt);

  // Header - Premium Style (White for cleanliness)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 40, 'F');

  // Add Corporate Logo
  const logoUrl = '/assets/logo_sp.png';
  doc.addImage(logoUrl, 'PNG', 15, 12, 60, 24); // Scaled for corporate elegance

  // Add Legal NIT below logo
  doc.setTextColor(113, 113, 122);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('NIT. 901.480.536-2', 15, 38);

  doc.setTextColor(39, 39, 42); // Zinc-900
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPUESTA TÉCNICA Y COMERCIAL', 135, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`REF: #Q-${(quotation?.id || 'REF').substring(0, 6).toUpperCase()}`, 135, 25);
  doc.text(`EMISIÓN: ${new Date().toLocaleDateString('es-CO')}`, 135, 29);

  // Decorative line
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.5);
  doc.line(15, 42, 195, 42);

  // Client & Event Details
  doc.setTextColor(39, 39, 42); // Zinc-900
  doc.setFontSize(12); // Reduced from 14/22 to corporate level
  doc.setFont('helvetica', 'bold');
  doc.text((quotation?.nombre_evento || 'EVENTO SIN NOMBRE').toUpperCase(), 15, 55);

  doc.setFontSize(9);
  doc.text('DESTINATARIO CORPORATIVO', 15, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`EMPRESA: ${quotation?.client?.razon_social || 'N/A'}`, 15, 70);
  doc.text(`${(quotation?.client?.documentType || 'NIT').toUpperCase()}: ${quotation?.client?.nit_id || 'PENDIENTE'}`, 15, 74);
  doc.text(`CIUDAD: ${quotation.client.ciudad || 'BOGOTÁ, COL'}`, 15, 78);

  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES LOGÍSTICOS', 120, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`INICIO MONTAJE: ${new Date(quotation.montaje_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`, 120, 70);
  doc.text(`INICIO EVENTO: ${new Date(quotation.evento_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`, 120, 74);
  doc.text(`FIN DESMONTAJE: ${new Date(quotation.desmontaje_fin).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`, 120, 78);

  // Items Table
  const tableData = [
    ...(quotation?.items || []).map(item => [
      `${(item?.inventory?.nombre || 'EQUIPO').toUpperCase()}\n(${item.cantidad} UNIDADES X ${item.dias} DÍAS)`,
      `Clase ${item.clase_asignada}`,
      item.cantidad,
      `$ ${item.precio_pactado.toLocaleString()}${item.dias > 1 ? ` (+ $ ${item.precio_dia_adicional.toLocaleString()} adic)` : ''}`,
      `$ ${calculateLineTotal(item).toLocaleString()}`
    ]),
    ...(quotation?.services || []).map(svc => [
      `${(svc?.descripcion || 'SERVICIO').toUpperCase()}\n(${svc.cantidad} UNIDADES X ${svc.dias} DÍAS)`,
      svc.tipo,
      svc.cantidad,
      `$ ${svc.precio_pactado.toLocaleString()}${svc.dias > 1 ? ` (+ $ ${svc.precio_dia_adicional.toLocaleString()} adic)` : ''}`,
      `$ ${calculateLineTotal(svc).toLocaleString()}`
    ])
  ];

  autoTable(doc, {
    startY: 90,
    head: [['Descripción del Servicio / Equipamiento', 'Categoría', 'Cant.', 'Inversión Un.', 'Subtotal']],
    body: tableData,
    headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [63, 63, 70] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 15, right: 15 }
  });

  let finalY = doc.lastAutoTable.finalY + 15;

  // Financial Summary
  doc.setDrawColor(228, 228, 231);
  doc.line(130, finalY, 195, finalY);

  doc.setFontSize(9);
  doc.text('SUBTOTAL NETO:', 130, finalY + 10);
  doc.text(`$ ${subtotal.toLocaleString()}`, 165, finalY + 10);

  doc.text(quotation.client.isTaxExempt ? 'IVA (0% - Exento):' : 'IVA (19%):', 130, finalY + 16);
  doc.text(`$ ${iva.toLocaleString()}`, 165, finalY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', 130, finalY + 26);
  doc.setTextColor(18, 174, 226); // Sunpartners Blue
  doc.text(`$ ${total.toLocaleString()}`, 165, finalY + 26);

  // Terms & Conditions - Legal Shield
  if (finalY + 80 > 280) { doc.addPage(); finalY = 20; } else { finalY += 45; }

  doc.setTextColor(24, 24, 27);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TÉRMINOS Y CONDICIONES LEGALES', 15, finalY);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122);

  const terms = [
    "1. La reserva de equipos se confirma únicamente con el pago del 70% del valor total.",
    "2. Esta cotización tiene una vigencia de 24 horas a partir de su emisión.",
    "3. Precios sujetos a disponibilidad al momento de la formalización del pago.",
    "4. El cliente es responsable por cualquier daño, pérdida o robo de los equipos contratados.",
    "5. Sunpartners no se hace responsable por fallas eléctricas externas al equipamiento suministrado.",
    "6. Cancelaciones con menos de 48 horas de antelación incurren en una penalidad del 50%.",
    "7. Los horarios de montaje y desmontaje deben cumplirse estrictamente según lo pactado.",
    "8. No se permite el subarriendo ni traslado de equipos sin autorización previa por escrito.",
    "9. Personal técnico adicional será facturado según horas extra reportadas en bitácora.",
    "10. El saldo restante (30%) debe ser cancelado antes de iniciar el proceso de montaje en sitio."
  ];

  terms.forEach((term, i) => {
    doc.text(term, 15, finalY + 7 + (i * 4));
  });

  // Footer Functionality
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(244, 244, 245);
    doc.setLineWidth(0.3);
    doc.line(15, 280, 195, 280);

    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.setFont('helvetica', 'bold');
    doc.text('BY PROCAMPO DEL CARIBE S.A.S.', 15, 285);

    doc.setFont('helvetica', 'normal');
    doc.text('Cra. 15 No. 15-25, Local 2, Cartagena de Indias.', 15, 289);

    doc.text('Móvil: +57 301 400 4743 | sunpartnersco@gmail.com', 120, 285);
    doc.text('Social: @sunpartners', 120, 289);

    doc.text(`Página ${i} de ${pageCount}`, 195, 289, { align: 'right' });
  }

  const eventNameSafe = (quotation?.nombre_evento || 'Cotizacion').replace(/\s+/g, '_');
  const idSafe = (quotation?.id || 'REF').substring(0, 6).toUpperCase();
  const fileName = `Cotizacion_${eventNameSafe}_${idSafe}.pdf`;
  doc.save(fileName);
};
