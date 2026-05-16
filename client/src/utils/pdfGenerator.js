import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateLineTotal, calculateTotals } from './quotationUtils';

export const generateQuotationPDF = (quotation) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageHeight = doc.internal.pageSize.height; // 297mm for A4

  // v42.1: Layout Constants
  const GLOBAL_BOTTOM_MARGIN = 20;
  const TABLE_BOTTOM_MARGIN = 30;
  const TERMS_BLOCK_HEIGHT = 25;
  const ANCHOR_Y_TERMS = pageHeight - TERMS_BLOCK_HEIGHT - GLOBAL_BOTTOM_MARGIN; // ~252mm
  const TOTALS_PAYMENT_HEIGHT = 35;
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
  const refLabel = quotation?.consecutivo ? `SP-${quotation.consecutivo}` : `#Q-${(quotation?.id || 'REF').substring(0, 6).toUpperCase()}`;
  doc.text(`REF: ${refLabel}`, 15, 50);
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

  currentY += 15; // Mandatory offset (v36.1)
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

  currentY += 4;
  doc.text(`Email: ${quotation.client.email || 'PENDIENTE'}`, 15, currentY);

  currentY += 4;
  doc.text(`Teléfono: ${quotation.client.telefono || 'PENDIENTE'}`, 15, currentY);

  currentY += 4;
  doc.text(`Asesor: ${quotation.consultant?.nombre || 'SISTEMA'}`, 15, currentY);

  // Capture the end of Client block to ensure Logistics doesn't overlap
  const clientBlockEndY = currentY + 10;

  // Logistics Section Alignment v26.0 (Miniaturized Swiss Watch Look)
  const logisticsStartY = 68; // Target start
  currentY = Math.max(logisticsStartY, clientBlockEndY - 15); // Dynamic Y (v51.0: Prevent overlap while keeping v36.1 mandatory offset in mind)

  const labelX = 110;
  const dataX = 140; // Moved slightly to left to accommodate 7pt labels
  const dataColor = [39, 39, 42]; // Zinc-800 for harmonized values

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('Nombre del evento: ', labelX, currentY + 15); // +15px mandatory offset (v36.1)
  doc.setTextColor(dataColor);

  const eventName = (quotation.nombre_evento || 'PROYECTO');
  const eventNameLines = doc.splitTextToSize(eventName, 55);
  doc.text(eventNameLines, dataX, currentY + 15); // +15px mandatory offset (v36.1)

  currentY += 15; // Shift currentY to account for the offset

  currentY += (eventNameLines.length > 1 ? (eventNameLines.length * 3.5) : 5); // Tightened spacing
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122); // Harmonized label color
  doc.text('Lugar evento: ', labelX, currentY);
  doc.setTextColor(dataColor);
  doc.text((quotation.ubicacion || 'POR DEFINIR'), dataX, currentY);

  currentY += 5; // Tightened vertical spacing v26.0
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122); // Harmonized label color
  doc.text('Inicio montaje: ', labelX, currentY);
  doc.setTextColor(dataColor);
  doc.text(new Date(quotation.montaje_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), dataX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('Inicio evento: ', labelX, currentY);
  doc.setTextColor(dataColor);
  doc.text(new Date(quotation.evento_inicio).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), dataX, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(113, 113, 122);
  doc.text('Fin desmontaje: ', labelX, currentY);
  doc.setTextColor(dataColor);
  doc.text(new Date(quotation.desmontaje_fin).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }), dataX, currentY);

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
    startY: currentY + 25, // At least 25px after logistics (v36.1)
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
  let closingY = doc.lastAutoTable.finalY + 15;

  if (closingY + TOTALS_PAYMENT_HEIGHT > ANCHOR_Y_TERMS - 5) {
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
    doc.text(term, 15 + (col * colWidth), ANCHOR_Y_TERMS + 6 + (row * 3.5));
  });

  // 7. Footer removed (v42.1: Rodny prefers clean design)

  const eventNameSafe = (quotation?.nombre_evento || 'Cotizacion').replace(/\s+/g, '_');
  const idSafe = quotation?.consecutivo ? `SP-${quotation.consecutivo}` : (quotation?.id || 'REF').substring(0, 6).toUpperCase();
  const fileName = `Cotizacion_${eventNameSafe}_${idSafe}.pdf`;
  doc.save(fileName);
};

export const generatePlannerPDF = (quotation, type = 'ROUTER') => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const isReport = type === 'REPORT';
  const planning = quotation.planning || {};

  // 1. Header
  const logoUrl = '/logo_sp.png';
  try {
    doc.addImage(logoUrl, 'PNG', 15, 10, 50, 20);
  } catch (e) {}

  doc.setTextColor(113, 113, 122);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('SUN PARTNERS GLOBAL LOGISTIC S.A.S. | OPERACIONES', 195, 13, { align: 'right' });

  doc.setTextColor(24, 24, 27);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(isReport ? 'REPORTE OPERATIVO Y PRESUPUESTO' : 'HOJA DE RUTA LOGÍSTICA', 15, 45);

  doc.setFontSize(8);
  const refLabel = quotation?.consecutivo ? `SP-${quotation.consecutivo}` : `#Q-${(quotation?.id || 'REF').substring(0, 6).toUpperCase()}`;
  doc.text(`PROYECTO: ${(quotation.nombre_evento || 'SIN NOMBRE').toUpperCase()}`, 15, 52);
  doc.text(`REFERENCIA: ${refLabel} | GENERADO: ${new Date().toLocaleString('es-CO')}`, 15, 57);

  // 2. Logistics Brief
  let currentY = 65;
  doc.setDrawColor(244, 244, 245);
  doc.line(15, currentY, 195, currentY);
  currentY += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS CRÍTICOS DE OPERACIÓN', 15, currentY);
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
  doc.text('1. INVENTARIO ASIGNADO AL EVENTO', 15, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [isReport ? ['Concepto', 'Descripción', 'Cant', 'Proveedor', 'Costo'] : ['Concepto', 'Descripción', 'Cant']],
    body: equipamiento.map(m => isReport ? [m.nombre, m.notas || '', m.cantidad, m.proveedor || '', `$ ${m.costo?.toLocaleString() || 0}`] : [m.nombre, m.notas || '', m.cantidad]),
    theme: 'grid',
    headStyles: { fillColor: [84, 134, 161], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    styles: { cellPadding: 2 }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // 4. Table B: PREPRODUCCION
  const blocks = [
    { id: 'HERRAMIENTAS', label: '2. OTRAS HERRAMIENTAS Y EQUIPOS DE PREPRODUCCIÓN' },
    { id: 'INSUMOS', label: '3. MATERIALES E INSUMOS' },
    { id: 'TRANSPORTE', label: '4. TRANSPORTE' }
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
        headStyles: { fillColor: [113, 113, 122], fontSize: 7 },
        bodyStyles: { fontSize: 7 },
        styles: { cellPadding: 2 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    }
  });

  // 5. Table 5: PERSONAL
  const personal = planning.personal || [];
  if (personal.length > 0) {
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text('5. PERSONAL ASIGNADO AL EVENTO', 15, currentY);
    autoTable(doc, {
      startY: currentY + 3,
      head: [isReport ? ['Cargo', 'Nombre', 'Montaje', 'Evento', 'Desmontaje', 'Total'] : ['Cargo', 'Nombre']],
      body: personal.map(p => isReport ? [p.cargo, p.nombre, `$ ${p.montaje?.toLocaleString() || 0}`, `$ ${p.evento?.toLocaleString() || 0}`, `$ ${p.desmontaje?.toLocaleString() || 0}`, `$ ${(p.montaje + p.evento + p.desmontaje).toLocaleString()}`] : [p.cargo, p.nombre]),
      theme: 'grid',
      headStyles: { fillColor: [251, 174, 23], textColor: [0,0,0], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      styles: { cellPadding: 2 }
    });
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 6. Table PRESUPUESTO (Only Report)
  if (isReport && planning.presupuesto) {
    if (currentY > 200) { doc.addPage(); currentY = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', 15, currentY);
    autoTable(doc, {
      startY: currentY + 3,
      head: [['Ítem', 'Montaje', 'Evento', 'Desmontaje', 'Total']],
      body: planning.presupuesto.map(r => [r.concepto, `$ ${r.montaje?.toLocaleString() || 0}`, `$ ${r.evento?.toLocaleString() || 0}`, `$ ${r.desmontaje?.toLocaleString() || 0}`, `$ ${(r.montaje + r.evento + r.desmontaje).toLocaleString()}`]),
      theme: 'grid',
      headStyles: { fillColor: [24, 24, 27], fontSize: 7 },
      bodyStyles: { fontSize: 7, fontStyle: 'bold' },
      styles: { cellPadding: 2 }
    });
    currentY = doc.lastAutoTable.finalY + 10;
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

  const fileName = `${type}_${refLabel}_${(quotation.nombre_evento || 'Evento').replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};
