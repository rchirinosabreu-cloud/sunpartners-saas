import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateLineTotal, calculateTotals } from './quotationUtils';

export const generateQuotationPDF = (quotation) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Totals Calculation
  const { subtotal, iva, total } = calculateTotals(quotation.items, quotation.services, quotation.client.isTaxExempt);

  // 1. Header - Clean Sunpartners Style
  const logoUrl = '/logo_sp.png';
  try {
    doc.addImage(logoUrl, 'PNG', 15, 12, 40, 16);
  } catch (e) {
    console.warn('Logo could not be loaded for PDF', e);
  }

  doc.setTextColor(24, 24, 27); // Zinc-900
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPUESTA TÉCNICA Y COMERCIAL', 130, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122); // Zinc-500
  doc.text(`REF: #Q-${(quotation?.id || 'REF').substring(0, 6).toUpperCase()}`, 130, 25);
  doc.text(`EMISIÓN: ${new Date().toLocaleDateString('es-CO')}`, 130, 29);

  // 2. Event Title (Large, Black, Bold)
  doc.setTextColor(24, 24, 27);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const eventName = (quotation?.nombre_evento || 'Propuesta Comercial').toUpperCase();
  doc.text(eventName, 15, 45, { maxWidth: 180 });

  // 3. Client & Logistics Grid
  let currentY = 55;
  doc.setDrawColor(244, 244, 245);
  doc.line(15, currentY, 195, currentY);

  currentY += 10;
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.text('DESTINATARIO CORPORATIVO', 15, currentY);
  doc.text('CRONOGRAMA DETALLADO', 110, currentY);

  currentY += 6;
  doc.setFontSize(10);
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.text(quotation.client.razon_social, 15, currentY);

  doc.setFontSize(8);
  doc.text(`INICIO MONTAJE: ${new Date(quotation.montaje_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`, 110, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122);
  doc.text(`${quotation.client.documentType || 'NIT'}: ${quotation.client.nit_id || 'PENDIENTE'}`, 15, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(84, 134, 161); // Sunpartners Blue
  doc.text(`INICIO EVENTO: ${new Date(quotation.evento_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`, 110, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122);
  doc.text(`CIUDAD: ${quotation.client.ciudad || 'BOGOTÁ, COL'}`, 15, currentY);
  doc.text(`FIN DESMONTAJE: ${new Date(quotation.desmontaje_fin).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`, 110, currentY);

  // 4. Items Table - WYSIWYG mapping
  const tableData = [
    ...(quotation?.items || []).map(item => {
      const name = item.customName || item.inventory?.nombre_comercial || 'Ítem Personalizado';
      let description = `${name}\n(${item.cantidad} UNIDADES X ${item.dias} DÍAS)\nClase ${item.clase_asignada}`;

      // Dynamic Composition inclusions
      if (item.compositions?.length > 0) {
        const inclusions = item.compositions.map(c => `${c.quantity} ${c.warehouseItem?.nombre || c.nombre || 'Ítem'}`).join(', ');
        description += `\n(Incluye: ${inclusions})`;
      }
      // Catalog Item Composition inclusions
      else if (item.inventory?.compositions?.length > 0) {
        const inclusions = item.inventory.compositions.map(c => `${c.quantity} ${c.warehouseItem?.nombre || c.nombre || 'Ítem'}`).join(', ');
        description += `\n(Incluye: ${inclusions})`;
      }

      return [
        {
          content: description,
          styles: { fontStyle: 'bold' }
        },
        item.cantidad,
        item.dias,
        `$ ${item.precio_pactado.toLocaleString()}${item.dias > 1 ? `\nAdic: $ ${item.precio_dia_adicional.toLocaleString()}` : ''}`,
        `$ ${calculateLineTotal(item).toLocaleString()}`
      ];
    }),
    ...(quotation?.services || []).map(svc => [
      {
        content: `${svc.descripcion}\n(${svc.cantidad} UNIDADES X ${svc.dias} DÍAS)\n${svc.tipo} Especializado`,
        styles: { fontStyle: 'bold' }
      },
      svc.cantidad,
      svc.dias,
      `$ ${svc.precio_pactado.toLocaleString()}${svc.dias > 1 ? `\nAdic: $ ${svc.precio_dia_adicional.toLocaleString()}` : ''}`,
      `$ ${calculateLineTotal(svc).toLocaleString()}`
    ])
  ];

  autoTable(doc, {
    startY: currentY + 10,
    head: [['Descripción Técnica', 'Cant.', 'Días', 'Inversión Un.', 'Subtotal']],
    body: tableData,
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [24, 24, 27],
      fontSize: 8,
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [228, 228, 231]
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [63, 63, 70],
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontSize: 10, fontStyle: 'bold', textColor: [24, 24, 27] }
    },
    theme: 'plain',
    didDrawCell: (data) => {
      if (data.section === 'body') {
        doc.setDrawColor(244, 244, 245);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  // 5. Totals Block
  const summaryX = 130;
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.text('SUBTOTAL NETO', summaryX, finalY);
  doc.setTextColor(24, 24, 27);
  doc.text(`$ ${subtotal.toLocaleString()}`, 195, finalY, { align: 'right' });

  finalY += 6;
  doc.setTextColor(113, 113, 122);
  doc.text(quotation.client.isTaxExempt ? 'IVA (0% - EXENTO)' : 'IVA CAUSADO (19%)', summaryX, finalY);
  doc.setTextColor(24, 24, 27);
  doc.text(`$ ${iva.toLocaleString()}`, 195, finalY, { align: 'right' });

  finalY += 4;
  doc.setDrawColor(228, 228, 231);
  doc.line(summaryX, finalY, 195, finalY);

  finalY += 10;
  doc.setFontSize(10);
  doc.setTextColor(84, 134, 161); // Sunpartners Blue
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', summaryX, finalY);
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  doc.text(`$ ${total.toLocaleString()}`, 195, finalY, { align: 'right' });

  // 6. Terms & Conditions
  finalY += 20;
  if (finalY > 230) { doc.addPage(); finalY = 20; }

  doc.setFontSize(8);
  doc.setTextColor(84, 134, 161);
  doc.text('TÉRMINOS Y CONDICIONES LEGALES', 15, finalY);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);

  const terms = [
    "1. La reserva de equipos se confirma únicamente con el pago del 70% del valor total.",
    "2. Esta cotización tiene una vigencia de 24 horas a partir de su emisión.",
    "3. Precios sujetos a disponibilidad al momento de la formalización del pago.",
    "4. El cliente es responsable por cualquier daño, pérdida o robo de los equipos contratados.",
    "5. Sunpartners no se hace responsable por fallas eléctricas externas al equipamiento.",
    "6. Cancelaciones con menos de 48 horas incurren en una penalidad del 50%.",
    "7. Los horarios de montaje y desmontaje deben cumplirse estrictamente.",
    "8. No se permite el subarriendo ni traslado de equipos sin autorización previa.",
    "9. Personal técnico adicional será facturado según bitácora de obra.",
    "10. El saldo restante (30%) debe cancelarse antes del inicio del montaje."
  ];

  terms.forEach((term, i) => {
    doc.text(term, 15, finalY + 6 + (i * 4));
  });

  // 7. Footer (On every page) - Corporate Style
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(161, 161, 170); // Zinc-500
    doc.setFont('helvetica', 'bold');
    doc.text('BY PROCAMPO DEL CARIBE S.A.S.', 15, 280);

    doc.setFont('helvetica', 'normal');
    doc.text('Cra. 15 No. 15-25, Local 2, Cartagena de Indias.', 15, 284);
    doc.text('Móvil: +57 301 400 4743 | sunpartnersco@gmail.com', 15, 288);
  }

  const eventNameSafe = (quotation?.nombre_evento || 'Cotizacion').replace(/\s+/g, '_');
  const idSafe = (quotation?.id || 'REF').substring(0, 6).toUpperCase();
  const fileName = `Cotizacion_${eventNameSafe}_${idSafe}.pdf`;
  doc.save(fileName);
};
