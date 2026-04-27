import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateLineTotal, calculateTotals } from './quotationUtils';

export const generateQuotationPDF = (quotation) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Totals Calculation
  const { subtotal, iva, total } = calculateTotals(quotation.items, quotation.services, quotation.client.isTaxExempt);

  // 1. Header - Institutional Identity (v22.0)
  const logoUrl = '/logo_sp.png';
  try {
    // Increased logo size
    doc.addImage(logoUrl, 'PNG', 15, 10, 60, 24);
  } catch (e) {
    console.warn('Logo could not be loaded for PDF', e);
  }

  // Institutional Info (Top Left, under logo)
  doc.setTextColor(113, 113, 122); // Zinc-500
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('SUN PARTNERS GLOBAL LOGISTIC S.A.S. | NIT: 901480536-2', 15, 40);
  doc.setFont('helvetica', 'normal');
  doc.text('Cra. 15 No. 15-25, local 2, Cartagena de Indias.', 15, 43);
  doc.text('Cel: +57 301 400 4743 | sunpartnersco@gmail.com', 15, 46);
  doc.text('@sunpartners | www.sunpartners.com.co', 15, 49);

  // Title Area (Top Right)
  doc.setTextColor(24, 24, 27); // Zinc-900
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', 195, 18, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122); // Zinc-500
  doc.text(`REF: #Q-${(quotation?.id || 'REF').substring(0, 6).toUpperCase()}`, 195, 25, { align: 'right' });
  doc.text(`EMISIÓN: ${new Date().toLocaleDateString('es-CO')}`, 195, 29, { align: 'right' });

  // 2. Client & Logistics Grid
  let currentY = 58;
  doc.setDrawColor(244, 244, 245);
  doc.line(15, currentY, 195, currentY);

  currentY += 10;
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 15, currentY);
  doc.text('DATOS DEL EVENTO', 110, currentY);

  currentY += 6;
  doc.setFontSize(9); // v18.0: Smaller corporate name
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.text(quotation.client.razon_social, 15, currentY);

  // Logistics Section Alignment v22.0 (Fixed X Coordinate at 50mm offset from labelX)
  const labelX = 110;
  const dataX = 145; // Fixed coordinate for data alignment

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('NOMBRE DEL EVENTO: ', labelX, currentY);
  doc.setTextColor(84, 134, 161); // Sunpartners Blue

  const eventName = (quotation.nombre_evento || 'PROYECTO').toUpperCase();
  const eventNameLines = doc.splitTextToSize(eventName, 50);
  doc.text(eventNameLines, dataX, currentY);

  currentY += (eventNameLines.length > 1 ? (eventNameLines.length * 4) : 8); // dynamic spacing
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122);
  doc.text(`${quotation.client.documentType || 'NIT'}: ${quotation.client.nit_id || 'PENDIENTE'}`, 15, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text('LUGAR EVENTO: ', labelX, currentY);
  doc.setTextColor(84, 134, 161);
  doc.text((quotation.ubicacion || 'POR DEFINIR').toUpperCase(), dataX, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122);
  doc.text(`CIUDAD: ${quotation.client.ciudad || 'CARTAGENA, COL'}`, 15, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text('INICIO MONTAJE: ', labelX, currentY);
  doc.setTextColor(84, 134, 161);
  doc.text(new Date(quotation.montaje_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase(), dataX, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('INICIO EVENTO: ', labelX, currentY);
  doc.setTextColor(84, 134, 161);
  doc.text(new Date(quotation.evento_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase(), dataX, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('FIN DESMONTAJE: ', labelX, currentY);
  doc.setTextColor(84, 134, 161);
  doc.text(new Date(quotation.desmontaje_fin).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase(), dataX, currentY);

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
    doc.text('BY PROCAMPO DEL CARIBE S.A.S.', 15, 285);
  }

  const eventNameSafe = (quotation?.nombre_evento || 'Cotizacion').replace(/\s+/g, '_');
  const idSafe = (quotation?.id || 'REF').substring(0, 6).toUpperCase();
  const fileName = `Cotizacion_${eventNameSafe}_${idSafe}.pdf`;
  doc.save(fileName);
};
