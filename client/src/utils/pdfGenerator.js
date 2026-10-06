import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateLineTotal, calculateTotals } from './quotationUtils';

export const generateQuotationPDF = (quotation) => {
  // Compress PDF streams, including the full-resolution corporate PNG logo.
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
  const pageHeight = doc.internal.pageSize.height; // 297mm for A4

  // v42.1: Layout Constants
  const GLOBAL_BOTTOM_MARGIN = 20;
  const TABLE_BOTTOM_MARGIN = 30;
  const TERMS_BLOCK_HEIGHT = 25;
  const ANCHOR_Y_TERMS = pageHeight - TERMS_BLOCK_HEIGHT - GLOBAL_BOTTOM_MARGIN; // ~252mm
  const TOTALS_PAYMENT_HEIGHT = 35;
  const { subtotal, iva, total } = calculateTotals(quotation.items, quotation.services, quotation.client.isTaxExempt);

  // 1. Header - Institutional Symmetry (v25.0)
  const isNaturalPerson = quotation.client?.documentType === 'CC';
  const headerOffset = isNaturalPerson ? -30 : 0; // v60.5: Optimized vertical space for natural person

  if (!isNaturalPerson) {
    const logoUrl = '/logo_sp.png';
    try {
      // Logo on the top left
      doc.addImage(logoUrl, 'PNG', 15, 10, 60, 24);
    } catch (e) {
      console.warn('Logo could not be loaded for PDF', e);
    }
  }

  // Institutional Info (Top Right, aligned with logo)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');

  if (isNaturalPerson) {
    doc.setTextColor(0, 0, 0); // Pure Black
    doc.setFontSize(9);
    doc.text('Evelyn Pérez', 195, 45 + headerOffset, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('NIT: 22.793.894-1', 195, 50 + headerOffset, { align: 'right' });
    doc.text('+57 301 400 4743', 195, 55 + headerOffset, { align: 'right' });
  } else {
    doc.setTextColor(113, 113, 122); // Zinc-500
    doc.text('SUN PARTNERS GLOBAL LOGISTIC S.A.S. | NIT: 901480536-2', 195, 13, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('Cra. 15 No. 15-25, local 2, Cartagena de Indias.', 195, 17, { align: 'right' });
    doc.text('Cel: +57 301 400 4743 | sunpartnersco@gmail.com', 195, 21, { align: 'right' });
    doc.text('@sunpartners | www.sunpartners.com.co', 195, 25, { align: 'right' });
  }

  // Title Area (Below Logo, Left Side)
  doc.setTextColor(24, 24, 27); // Zinc-900
  doc.setFontSize(12); // Reduced size for elegance
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', 15, 45 + headerOffset);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0); // v60.2: Pure Black for high contrast
  const refLabel = quotation?.consecutivo ? `SP-${quotation.consecutivo}` : `#Q-${(quotation?.id || 'REF').substring(0, 6).toUpperCase()}`;
  doc.text(`REF: ${refLabel}`, 15, 50 + headerOffset);
  doc.text(`EMISIÓN: ${new Date().toLocaleDateString('es-CO')}`, 15, 54 + headerOffset);

  // 2. Client & Logistics Grid (v51.4: Symmetric Block System)
  const gridBaseY = 58 + headerOffset;
  doc.setDrawColor(244, 244, 245);
  doc.line(15, gridBaseY, 195, gridBaseY);

  // A. Left Column: CLIENTE
  let leftY = gridBaseY + 10;
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 15, leftY);

  leftY += 15; // Mandatory offset (v36.1)
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.text(quotation.client.razon_social, 15, leftY);

  leftY += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 113, 122);
  doc.text(`${quotation.client.documentType || 'NIT'}: ${quotation.client.nit_id || 'PENDIENTE'}`, 15, leftY);

  leftY += 4;
  const clientAddress = quotation.client.direccion_fiscal || 'DIRECCIÓN POR REGISTRAR';
  const addressLines = doc.splitTextToSize(clientAddress, 85);
  doc.text(addressLines, 15, leftY);

  leftY += (addressLines.length * 3.5);
  doc.text(`Ciudad: ${quotation.client.ciudad || 'PENDIENTE'}`, 15, leftY);

  leftY += 4;
  const primaryContact = quotation.clientContact || quotation.client.contacts?.find(c => c.isPrimary) || quotation.client.contacts?.[0];
  doc.text(`Email: ${quotation.contactEmail || primaryContact?.email || quotation.client.email || 'PENDIENTE'}`, 15, leftY);

  leftY += 4;
  doc.text(`Teléfono: ${quotation.contactPhone || primaryContact?.phone || quotation.client.telefono || 'PENDIENTE'}`, 15, leftY);

  leftY += 4;
  doc.text(`Responsable: ${quotation.contactName || primaryContact?.name || quotation.client.responsable || 'No asignado'}`, 15, leftY);

  // B. Right Column: DATOS DEL EVENTO (Symmetric Reset)
  let rightY = gridBaseY + 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('DATOS DEL EVENTO', 110, rightY);

  const labelX = 110;
  const dataX = 140;
  const dataColor = "#27272a"; // Zinc-800

  doc.text('Nombre del evento: ', labelX, rightY + 15); // +15px mandatory offset (v36.1)
  doc.setTextColor(dataColor);
  const eventName = (quotation.nombre_evento || 'PROYECTO');
  const eventNameLines = doc.splitTextToSize(eventName, 55);
  doc.text(eventNameLines, dataX, rightY + 15); // +15px mandatory offset (v36.1)

  rightY += 15;
  rightY += (eventNameLines.length > 1 ? (eventNameLines.length * 3.5) : 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('Lugar evento: ', labelX, rightY);
  doc.setTextColor(dataColor);
  doc.text((quotation.ubicacion || 'POR DEFINIR'), dataX, rightY);

  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('Inicio montaje: ', labelX, rightY);
  doc.setTextColor(dataColor);
  doc.text(new Date(quotation.montaje_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), dataX, rightY);

  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('Inicio evento: ', labelX, rightY);
  doc.setTextColor(dataColor);
  doc.text(new Date(quotation.evento_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), dataX, rightY);

  rightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('Fin desmontaje: ', labelX, rightY);
  doc.setTextColor(dataColor);
  doc.text(new Date(quotation.desmontaje_fin).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), dataX, rightY);

  // Final synchronization of Y axis for the next section
  let currentY = Math.max(leftY, rightY);

  // 4. Items Table - WYSIWYG mapping
  const tableData = [
    ...(quotation?.items || []).map(item => {
      const name = item.customName || item.inventory?.nombre_comercial || 'Ítem Personalizado';
      // v18.0: Clean description (no classes, no quality standards)
      let description = `${name}\n(${item.cantidad} UNIDADES X ${item.dias} DÍAS)`;

      // Dynamic Composition inclusions (v49.3: Simplified and styled via content styling if possible)
      let breakdown = '';
      if (item.description) {
        breakdown = `(${item.description})`;
      } else if (item.compositions?.length > 0) {
        const inclusions = item.compositions.map(c => `${c.quantity} ${c.componentCatalogItem?.nombre_comercial || c.warehouseItem?.nombre || c.nombre || 'Ítem'}`).join(', ');
        breakdown = `(Incluye: ${inclusions})`;
      } else if (item.inventory?.compositions?.length > 0) {
        const inclusions = item.inventory.compositions.map(c => `${c.quantity} ${c.componentCatalogItem?.nombre_comercial || c.warehouseItem?.nombre || c.nombre || 'Ítem'}`).join(', ');
        breakdown = `(Incluye: ${inclusions})`;
      }

      const mainText = `${name}\n(${item.cantidad} UNIDADES X ${item.dias} DÍAS)`;

      return [
        {
          content: breakdown ? `${mainText}\n${breakdown}` : mainText,
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
    startY: currentY + 15, // v60.2: Reduced from 25 to 15 to save space
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
    didDrawCell: (data) => {
      if (data.section === 'body') {
        doc.setDrawColor(244, 244, 245);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    },
    willDrawCell: (data) => {
      // v49.3: Discretely style the breakdown line if it exists
      if (data.section === 'body' && data.column.index === 0) {
        // Check if there's a breakdown line (usually starts with '(')
        const lastLine = data.cell.text[data.cell.text.length - 1];
        if (lastLine && lastLine.startsWith('(')) {
           // We can't easily change font size for JUST one line inside autoTable cell content
           // without full custom drawing.
           // But we can suggest the font change for the WHOLE cell if it has a breakdown.
           // To keep it informative but secondary as requested:
           doc.setFontSize(7);
           doc.setTextColor(100, 100, 110);
        } else {
           doc.setFontSize(8);
           doc.setTextColor(63, 63, 70);
        }
      }
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontSize: 10, fontStyle: 'bold', textColor: [24, 24, 27] }
    },
    margin: { bottom: TABLE_BOTTOM_MARGIN },
    theme: 'plain',
    didDrawCell: (data) => {
      if (data.section === 'body') {
        doc.setDrawColor(244, 244, 245);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  // 5. "Bloque de Cierre" Indivisible (v42.1)
  // Totals + Payment must jump together if they don't fit before the Terms anchor
  let closingY = doc.lastAutoTable.finalY + 10; // v60.2: Reduced margin

  // v60.2: Flexibilize page break logic. Only jump if really necessary.
  if (closingY + TOTALS_PAYMENT_HEIGHT > ANCHOR_Y_TERMS - 2) {
    doc.addPage();
    closingY = 25; // Start on new page with margin
  }

  // A. Totals
  const summaryX = 130;
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.text('SUBTOTAL NETO', summaryX, closingY);
  doc.setTextColor(24, 24, 27);
  doc.text(`$ ${subtotal.toLocaleString()}`, 195, closingY, { align: 'right' });

  closingY += 6;
  doc.setTextColor(113, 113, 122);
  doc.text(quotation.client.isTaxExempt ? 'IVA (0% - EXENTO)' : 'IVA CAUSADO (19%)', summaryX, closingY);
  doc.setTextColor(24, 24, 27);
  doc.text(`$ ${iva.toLocaleString()}`, 195, closingY, { align: 'right' });

  closingY += 4;
  doc.setDrawColor(228, 228, 231);
  doc.line(summaryX, closingY, 195, closingY);

  closingY += 10;
  doc.setFontSize(9);
  doc.setTextColor(84, 134, 161);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', summaryX, closingY);
  doc.setFontSize(14);
  doc.setTextColor(24, 24, 27);
  doc.text(`$ ${total.toLocaleString()}`, 195, closingY, { align: 'right' });

  // B. Forma de Pago Box
  const paymentY = closingY - 15;
  doc.setDrawColor(244, 244, 245);
  doc.setFillColor(250, 250, 251);
  doc.roundedRect(15, paymentY, 80, 15, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMA DE PAGO:', 20, paymentY + 6);
  doc.setTextColor(24, 24, 27);
  doc.text((quotation.pago_metodo || 'CONTADO').toUpperCase(), 20, paymentY + 11);

  // v60.3: Advisor re-location
  doc.setFontSize(7.5);
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.text(`Asesor: ${quotation.consultant?.nombre || 'SISTEMA'} | Cel: +57 301 400 4743`, 15, paymentY + 22);

  // 6. Terms & Conditions (v42.1: Absolute Anchoring at bottom)
  doc.setFontSize(8);
  doc.setTextColor(84, 134, 161);
  doc.setFont('helvetica', 'bold');
  doc.text('TÉRMINOS Y CONDICIONES LEGALES', 15, ANCHOR_Y_TERMS);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(161, 161, 170);

  const terms = [
    "1. La reserva de equipos se confirma con el pago del 70% del valor total.",
    "2. Esta cotización tiene una vigencia de 24 horas a partir de su emisión.",
    "3. Precios sujetos a disponibilidad al momento de formalizar el pago.",
    "4. El cliente es responsable por daños, pérdida o robo de equipos.",
    isNaturalPerson ? "5. No se responde por fallas eléctricas externas." : "5. Sunpartners no responde por fallas eléctricas externas.",
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
    doc.text(term, 15 + (col * colWidth), ANCHOR_Y_TERMS + 6 + (row * 3.5));
  });

  // 7. Footer removed (v42.1: Rodny prefers clean design)

  const eventNameSafe = (quotation?.nombre_evento || 'Cotizacion').replace(/\s+/g, '_');
  const idSafe = quotation?.consecutivo ? `SP-${quotation.consecutivo}` : (quotation?.id || 'REF').substring(0, 6).toUpperCase();
  const fileName = `Cotizacion_${eventNameSafe}_${idSafe}.pdf`;
  doc.save(fileName);
};

export const generatePlannerPDF = (quotation, type = 'ROUTER', overrides = {}) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const isReport = type === 'REPORT';

  // v52.2: Merge stored planning with live UI state overrides
  const planning = {
    ...(quotation.planning || {}),
    ...overrides
  };

  const getLinkedSubtotal = (rowId, materialsList) => {
    if (rowId === 'tra') return (materialsList || []).filter(m => m.category === 'TRANSPORTE').reduce((acc, m) => acc + (parseFloat(m.costo) || 0) * (parseInt(m.cantidad) || 1), 0);
    if (rowId === 'sub') return (materialsList || []).filter(m => m.category === 'EQUIPAMIENTO' && m.isExternal).reduce((acc, m) => acc + (parseFloat(m.costo) || 0) * (parseInt(m.cantidad) || 1), 0);
    if (rowId === 'mat') return (materialsList || []).filter(m => ['HERRAMIENTAS', 'INSUMOS'].includes(m.category)).reduce((acc, m) => acc + (parseFloat(m.costo) || 0) * (parseInt(m.cantidad) || 1), 0);
    return 0;
  };

  // 1. Header
  const logoUrl = '/logo_sp.png';
  try {
    doc.addImage(logoUrl, 'JPEG', 15, 10, 50, 20, undefined, 'FAST');
  } catch (e) {}

  doc.setTextColor(113, 113, 122);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('SUN PARTNERS GLOBAL LOGISTIC S.A.S. | OPERACIONES', 195, 13, { align: 'right' });

  doc.setTextColor(24, 24, 27);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const refLabel = quotation?.consecutivo ? `SS-${quotation.consecutivo}` : `#Q-${(quotation?.id || 'REF').substring(0, 6).toUpperCase()}`;
  doc.text(isReport ? refLabel : `REMISIÓN ${refLabel}`, 15, 45);

  doc.setFontSize(8);
  doc.text(`PROYECTO: ${(quotation.nombre_evento || 'SIN NOMBRE').toUpperCase()}`, 15, 52);
  doc.text(`GENERADO: ${new Date().toLocaleString('es-CO')}`, 15, 57);

  // 2. Logistics Brief
  let currentY = 65;
  doc.setDrawColor(244, 244, 245);
  doc.line(15, currentY, 195, currentY);
  currentY += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DE LA OPERACIÓN', 15, currentY);
  currentY += 6;

  const logisticsData = [
    ['LUGAR / VENUE:', (quotation.ubicacion || 'POR DEFINIR').toUpperCase()],
    ['INICIO MONTAJE:', new Date(quotation.montaje_inicio).toLocaleString('es-CO')],
    ['INICIO EVENTO:', new Date(quotation.evento_inicio).toLocaleString('es-CO')],
    ['FIN DESMONTAJE:', new Date(quotation.desmontaje_fin).toLocaleString('es-CO')]
  ];

  logisticsData.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], 55, currentY);
    currentY += 4;
  });

  // 3. Table 1: Inventario asignado
  currentY += 5;
  const materiales = planning.materiales || [];
  const equipamiento = materiales.filter(m => m.category === 'EQUIPAMIENTO');

  doc.setFont('helvetica', 'bold');
  doc.text('INVENTARIO ASIGNADO AL EVENTO', 15, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [isReport ? ['Concepto', 'Descripción', 'Cant', 'Proveedor', 'Costo'] : ['Concepto', 'Descripción', 'Cant']],
    body: equipamiento.map(m => isReport ? [m.nombre, m.notas || '', m.cantidad, m.proveedor || '', `$ ${m.costo?.toLocaleString() || 0}`] : [m.nombre, m.notas || '', m.cantidad]),
    theme: 'grid',
    headStyles: { fillColor: [84, 134, 161], textColor: [255, 255, 255], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    styles: { cellPadding: 2 }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // 4. Table B: PREPRODUCCION
  const blocks = [
    { id: 'HERRAMIENTAS', label: 'OTRAS HERRAMIENTAS Y EQUIPOS DE PREPRODUCCIÓN' },
    { id: 'INSUMOS', label: 'MATERIALES E INSUMOS' },
    { id: 'TRANSPORTE', label: 'TRANSPORTE' }
  ];

  blocks.forEach(block => {
    const items = materiales.filter(m => m.category === block.id);
    if (items.length > 0) {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text(block.label, 15, currentY);
      autoTable(doc, {
        startY: currentY + 3,
        head: [isReport ? ['Descripción', 'Cant', 'Proveedor', 'Costo'] : ['Descripción', 'Cant']],
        body: items.map(m => isReport ? [m.nombre, m.cantidad, m.proveedor || '', `$ ${m.costo?.toLocaleString() || 0}`] : [m.nombre, m.cantidad]),
        theme: 'grid',
        headStyles: { fillColor: [84, 134, 161], textColor: [255, 255, 255], fontSize: 7 },
        bodyStyles: { fontSize: 7 },
        styles: { cellPadding: 2 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }
  });

  // 5. Table 5: PERSONAL
  const personal = overrides.personal || planning.personal || [];
  if (personal.length > 0) {
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text('PERSONAL ASIGNADO AL EVENTO', 15, currentY);

    const personalBody = personal.map(p => {
      if (isReport) {
        return [
          p.cargo,
          p.nombre,
          `$ ${p.montaje?.toLocaleString() || 0}`,
          `$ ${p.evento?.toLocaleString() || 0}`,
          `$ ${p.desmontaje?.toLocaleString() || 0}`,
          `$ ${(p.montaje + p.evento + p.desmontaje).toLocaleString()}`
        ];
      } else {
        // v53.1: Option A - Indicator Visual (X) for operational use
        return [
          p.cargo,
          p.nombre,
          (p.montaje > 0 ? 'X' : ''),
          (p.evento > 0 ? 'X' : ''),
          (p.desmontaje > 0 ? 'X' : '')
        ];
      }
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [isReport ? ['Cargo', 'Nombre', 'Montaje', 'Evento', 'Desmontaje', 'Total'] : ['Cargo', 'Nombre', 'Mont.', 'Evt.', 'Desm.']],
      body: personalBody,
      theme: 'grid',
      headStyles: { fillColor: [84, 134, 161], textColor: [255,255,255], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      styles: { cellPadding: 2 },
      columnStyles: isReport ? {} : {
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' }
      }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 6. Table 6: VIATICOS (v53.0)
  const viaticos = overrides.viaticos || planning.viaticos || [];
  if (viaticos.length > 0) {
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text('VIÁTICOS', 15, currentY);

    const viaticosBody = viaticos.map(v => {
      if (isReport) {
        return [
          v.cargo,
          v.nombre,
          `$ ${v.montaje?.toLocaleString() || 0}`,
          `$ ${v.evento?.toLocaleString() || 0}`,
          `$ ${v.desmontaje?.toLocaleString() || 0}`,
          `$ ${(v.montaje + v.evento + v.desmontaje).toLocaleString()}`
        ];
      } else {
        // v53.1: Option A - Indicator Visual (X) for operational use
        return [
          v.cargo,
          v.nombre,
          (v.montaje > 0 ? 'X' : ''),
          (v.evento > 0 ? 'X' : ''),
          (v.desmontaje > 0 ? 'X' : '')
        ];
      }
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [isReport ? ['Cargo', 'Nombre', 'Montaje', 'Evento', 'Desmontaje', 'Total'] : ['Cargo', 'Nombre', 'Mont.', 'Evt.', 'Desm.']],
      body: viaticosBody,
      theme: 'grid',
      headStyles: { fillColor: [84, 134, 161], textColor: [255,255,255], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      styles: { cellPadding: 2 },
      columnStyles: isReport ? {} : {
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' }
      }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 6. Table PRESUPUESTO (Only Report)
  if (isReport && planning.presupuesto) {
    if (currentY > 200) { doc.addPage(); currentY = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', 15, currentY);

    const budgetBody = planning.presupuesto.map(r => {
      const linked = getLinkedSubtotal(r.id, planning.materiales);
      const rowTotal = linked + (parseFloat(r.montaje) || 0) + (parseFloat(r.evento) || 0) + (parseFloat(r.desmontaje) || 0);

      return [
        {
          content: r.concepto,
          styles: { fontStyle: 'bold' }
        },
        `$ ${r.montaje?.toLocaleString() || 0}`,
        `$ ${r.evento?.toLocaleString() || 0}`,
        `$ ${r.desmontaje?.toLocaleString() || 0}`,
        `$ ${rowTotal.toLocaleString()}`
      ];
    });

    // v52.2: Add Final Summary Row
    const totalValue = overrides.totalPresupuesto || budgetBody.reduce((acc, row) => acc + parseFloat(row[4].replace(/[^0-9.-]+/g, "")), 0);
    budgetBody.push([
      { content: 'TOTAL PRESUPUESTO OPERATIVO', colSpan: 4, styles: { halign: 'right', fillColor: [251, 174, 23], textColor: [0, 0, 0] } },
      { content: `$ ${totalValue.toLocaleString()}`, styles: { halign: 'right', fillColor: [251, 174, 23], textColor: [0, 0, 0], fontSize: 9 } }
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Ítem', 'Montaje', 'Evento', 'Desmontaje', 'Total']],
      body: budgetBody,
      theme: 'grid',
      headStyles: { fillColor: [251, 174, 23], textColor: [0,0,0], fontSize: 7 },
      bodyStyles: { fontSize: 7, fontStyle: 'bold' },
      styles: { cellPadding: 2 },
      columnStyles: {
        4: { halign: 'right' }
      },
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 6.5 OBSERVACIONES GENERALES (v55.0)
  if (planning.observaciones) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('OBSERVACIONES GENERALES', 15, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(63, 63, 70);
    const obsLines = doc.splitTextToSize(planning.observaciones, 180);
    doc.text(obsLines, 15, currentY);
    currentY += (obsLines.length * 4) + 10;
  }

  // 7. Footer: Control
  if (currentY > 250) { doc.addPage(); currentY = 20; }
  currentY += 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);

  const footerData = planning.footer || {};
  const sigX = [15, 80, 145];
  const labels = ['ELABORÓ', 'REVISÓ', 'VERIFICÓ'];
  const values = [footerData.elaboro, footerData.reviso, footerData.verifico];

  labels.forEach((label, i) => {
    doc.text(label, sigX[i], currentY);
    doc.line(sigX[i], currentY + 8, sigX[i] + 45, currentY + 8);
    doc.text(values[i] || '', sigX[i], currentY + 12);
  });

  const eventNameSafe = (quotation.nombre_evento || 'Evento').replace(/\s+/g, '_');
  const fileName = isReport ? `SS-${quotation.consecutivo || 'REF'}.pdf` : `REM-SS-${quotation.consecutivo || 'REF'}.pdf`;
  doc.save(fileName);
};
