import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { calculateLineTotal, calculateTotals } from './quotationUtils';

export const generateQuotationPDF = (quotation) => {
  const doc = new jsPDF();

  // Totals Calculation
  const { subtotal, iva, total } = calculateTotals(quotation.items, quotation.services, quotation.client.isTaxExempt);

  // Header - Premium Style
  doc.setFillColor(24, 24, 27); // Zinc-900
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SUNPARTNERS', 15, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ESTÁNDAR DE EXCELENCIA EN EVENTOS', 15, 26);

  doc.setFontSize(12);
  doc.text('COTIZACIÓN CORPORATIVA', 140, 20);
  doc.setFontSize(9);
  doc.text(`ID: #Q-${quotation.id.substring(0, 6).toUpperCase()}`, 140, 26);
  doc.text(`FECHA EMISIÓN: ${new Date().toLocaleDateString('es-CO')}`, 140, 31);

  // Client & Event Details
  doc.setTextColor(39, 39, 42); // Zinc-900
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL CLIENTE', 15, 55);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`EMPRESA: ${quotation.client.razon_social}`, 15, 62);
  doc.text(`${quotation.client.documentType || 'NIT'}: ${quotation.client.nit_id || 'PENDIENTE'}`, 15, 67);
  doc.text(`CONTACTO: ${quotation.client.responsable || 'N/A'}`, 15, 72);
  doc.text(`UBICACIÓN: ${quotation.ubicacion}`, 15, 77);

  doc.setFont('helvetica', 'bold');
  doc.text('LOGÍSTICA DEL EVENTO', 120, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(`MONTAJE: ${new Date(quotation.montaje_inicio).toLocaleString()}`, 120, 62);
  doc.text(`EVENTO: ${new Date(quotation.evento_inicio).toLocaleString()}`, 120, 67);
  doc.text(`DESMONTAJE: ${new Date(quotation.desmontaje_inicio).toLocaleString()}`, 120, 72);

  // Items Table
  const tableData = [
    ...(quotation.items || []).map(item => [
      `${item.inventory.nombre.toUpperCase()}\n(${item.cantidad} UNIDADES X ${item.dias} DÍAS)`,
      `Clase ${item.clase_asignada}`,
      item.cantidad,
      `$ ${item.precio_pactado.toLocaleString()}${item.dias > 1 ? ` (+ $ ${item.precio_dia_adicional.toLocaleString()} adic)` : ''}`,
      `$ ${calculateLineTotal(item).toLocaleString()}`
    ]),
    ...(quotation.services || []).map(svc => [
      `${svc.descripcion.toUpperCase()}\n(${svc.cantidad} UNIDADES X ${svc.dias} DÍAS)`,
      svc.tipo,
      svc.cantidad,
      `$ ${svc.precio_pactado.toLocaleString()}${svc.dias > 1 ? ` (+ $ ${svc.precio_dia_adicional.toLocaleString()} adic)` : ''}`,
      `$ ${calculateLineTotal(svc).toLocaleString()}`
    ])
  ];

  doc.autoTable({
    startY: 90,
    head: [['Descripción del Servicio / Equipo', 'Tipo', 'Cant.', 'Vlr. Unitario', 'Subtotal']],
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
  doc.text('TOTAL GENERAL:', 130, finalY + 26);
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

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text('Sunpartners S.A.S • Nit: 901.456.789-2 • Bogotá, Colombia', 105, 285, { align: 'center' });

  doc.save(`Cotizacion_Sunpartners_${quotation.client.razon_social.replace(/\s+/g, '_')}.pdf`);
};
