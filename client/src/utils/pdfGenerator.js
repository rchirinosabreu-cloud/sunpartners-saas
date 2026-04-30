import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateLineTotal, calculateTotals } from './quotationUtils';

export const generateQuotationPDF = (quotation) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Totals Calculation
  const { subtotal, iva, total } = calculateTotals(quotation.items, quotation.services, quotation.client.isTaxExempt);

  // 1. Header - Institutional Symmetry (v25.0)
  const logoUrl = '/logo_sp.png';
  try {
    // Logo on the top left
    doc.addImage(logoUrl, 'PNG', 15, 10, 60, 24);
  } catch (e) {
    console.warn('Logo could not be loaded for PDF', e);
  }

  // Institutional Info (Top Right, aligned with logo)
  doc.setTextColor(113, 113, 122); // Zinc-500
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('SUN PARTNERS GLOBAL LOGISTIC S.A.S. | NIT: 901480536-2', 195, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Cra. 15 No. 15-25, local 2, Cartagena de Indias.', 195, 17, { align: 'right' });
  doc.text('Cel: +57 301 400 4743 | sunpartnersco@gmail.com', 195, 21, { align: 'right' });
  doc.text('@sunpartners | www.sunpartners.com.co', 195, 25, { align: 'right' });

  // Title Area (Below Logo, Left Side)
  doc.setTextColor(24, 24, 27); // Zinc-900
  doc.setFontSize(12); // Reduced size for elegance
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', 15, 45);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170); // Zinc-400 (Suttle grey)
  doc.text(`REF: #Q-${(quotation?.id || 'REF').substring(0, 6).toUpperCase()}`, 15, 50);
  doc.text(`EMISIÓN: ${new Date().toLocaleDateString('es-CO')}`, 15, 54);

  // 2. Client & Logistics Grid
  let currentY = 58;
  doc.setDrawColor(244, 244, 245);
  doc.line(15, currentY, 195, currentY);

  currentY += 10;
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 15, currentY);

  // v26.0: DATOS DEL EVENTO (Bold, 7pt)
  doc.setFontSize(7);
  doc.text('DATOS DEL EVENTO', 110, currentY);

  currentY += 8; // Increased spacing to prevent overlap with field titles (v33.0)
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.text(quotation.client.razon_social, 15, currentY);

  currentY += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122);
  doc.text(`${quotation.client.documentType || 'NIT'}: ${quotation.client.nit_id || 'PENDIENTE'}`, 15, currentY);

  currentY += 4;
  const clientAddress = quotation.client.direccion_fiscal || 'DIRECCIÓN POR REGISTRAR';
  const addressLines = doc.splitTextToSize(clientAddress, 85);
  doc.text(addressLines, 15, currentY);

  currentY += (addressLines.length * 3.5);
  doc.text(`Ciudad: ${quotation.client.ciudad || 'PENDIENTE'}`, 15, currentY);

  // Reset currentY for logistics alignement if address was long
  const logisticsStartY = 68; // Resetting to align with CLIENTE title + 10
  currentY = logisticsStartY;

  // Logistics Section Alignment v26.0 (Miniaturized Swiss Watch Look)
  const labelX = 110;
  const dataX = 140; // Moved slightly to left to accommodate 7pt labels

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('Nombre del evento: ', labelX, currentY);
  doc.setTextColor(84, 134, 161);

  const eventName = (quotation.nombre_evento || 'PROYECTO');
  const eventNameLines = doc.splitTextToSize(eventName, 55);
  doc.text(eventNameLines, dataX, currentY);

  currentY += (eventNameLines.length > 1 ? (eventNameLines.length * 3.5) : 5); // Tightened spacing
  doc.setFont('helvetica', 'bold');
  doc.text('Lugar evento: ', labelX, currentY);
  doc.setTextColor(84, 134, 161);
  doc.text((quotation.ubicacion || 'POR DEFINIR'), dataX, currentY);

  currentY += 5; // Tightened vertical spacing v26.0
  doc.setFont('helvetica', 'bold');
  doc.text('Inicio montaje: ', labelX, currentY);
  doc.setTextColor(84, 134, 161);
  doc.text(new Date(quotation.montaje_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), dataX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('Inicio evento: ', labelX, currentY);
  doc.setTextColor(84, 134, 161);
  doc.text(new Date(quotation.evento_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), dataX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('Fin desmontaje: ', labelX, currentY);
  doc.setTextColor(84, 134, 161);
  doc.text(new Date(quotation.desmontaje_fin).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), dataX, currentY);

  // 4. Items Table - WYSIWYG mapping
  const tableData = [
    ...(quotation?.items || []).map(item => {
      const name = item.customName || item.inventory?.nombre_comercial || 'Ítem Personalizado';
      // v18.0: Clean description (no classes, no quality standards)
      let description = `${name}\n(${item.cantidad} UNIDADES X ${item.dias} DÍAS)`;

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
        content: `${svc.descripcion.replace('Transporte Especializado', 'Transporte').trim()}\n(${svc.cantidad} UNIDADES X ${svc.dias} DÍAS)\n${svc.tipo.replace('Transporte Especializado', 'Transporte').trim()} ${svc.tipo.includes('Transporte') ? '' : 'Especializado'}`,
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
    head: [['Detalles del servicio', 'Cant.', 'Días', 'Inversión Un.', 'Subtotal']],
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
  doc.setFontSize(9); // v18.0: Smaller Total text
  doc.setTextColor(84, 134, 161); // Sunpartners Blue
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', summaryX, finalY);
  doc.setFontSize(14); // v18.0: Smaller total amount
  doc.setTextColor(24, 24, 27);
  doc.text(`$ ${total.toLocaleString()}`, 195, finalY, { align: 'right' });

  // Forma de Pago Box (v32.0)
  const paymentY = finalY - 15;
  doc.setDrawColor(244, 244, 245);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(15, paymentY, 80, 15, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMA DE PAGO:', 20, paymentY + 6);
  doc.setTextColor(24, 24, 27);
  doc.text((quotation.pago_metodo || 'CONTADO').toUpperCase(), 20, paymentY + 11);

  // 6. Terms & Conditions (v22.0: Fixed Anchor at bottom with 2 clean columns)
  const pageHeight = doc.internal.pageSize.height;
  const termsBlockHeight = 25; // Compacted for v22.0
  const footerReservedSpace = 15;
  const anchorY = pageHeight - termsBlockHeight - footerReservedSpace;

  // Page break logic: If current Y is too close to anchor, add page
  if (finalY > anchorY - 5) {
    doc.addPage();
  }

  doc.setFontSize(8);
  doc.setTextColor(84, 134, 161);
  doc.setFont('helvetica', 'bold');
  doc.text('TÉRMINOS Y CONDICIONES LEGALES', 15, anchorY);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);

  const terms = [
    "1. La reserva de equipos se confirma con el pago del 70% del valor total.",
    "2. Esta cotización tiene una vigencia de 24 horas a partir de su emisión.",
    "3. Precios sujetos a disponibilidad al momento de formalizar el pago.",
    "4. El cliente es responsable por daños, pérdida o robo de equipos.",
    "5. Sunpartners no responde por fallas eléctricas externas.",
    "6. Cancelaciones < 48h incurren en penalidad del 50%.",
    "7. Horarios de montaje y desmontaje deben cumplirse estrictamente.",
    "8. Prohibido subarriendo o traslado de equipos sin autorización.",
    "9. Personal técnico adicional facturado según bitácora.",
    "10. El saldo restante (30%) se cancela antes del montaje."
  ];

  const colWidth = 95;
  terms.forEach((term, i) => {
    const col = i < 5 ? 0 : 1;
    const row = i % 5;
    doc.text(term, 15 + (col * colWidth), anchorY + 6 + (row * 3.5));
  });

  // 7. Footer (v19.0: Two-column symmetry)
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor(161, 161, 170); // Zinc-500

    // Column Left: Company Name
    doc.setFont('helvetica', 'bold');
    // REMOVED: BY PROCAMPO DEL CARIBE S.A.S. (v32.0 branding cleanup)
  }

  const eventNameSafe = (quotation?.nombre_evento || 'Cotizacion').replace(/\s+/g, '_');
  const idSafe = (quotation?.id || 'REF').substring(0, 6).toUpperCase();
  const fileName = `Cotizacion_${eventNameSafe}_${idSafe}.pdf`;
  doc.save(fileName);
};
