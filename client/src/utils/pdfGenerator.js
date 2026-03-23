import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateQuotationPDF = (quotation) => {
  const doc = new jsPDF();
  const total = quotation.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  // Logo Placeholder (Sunpartners)
  doc.setFillColor(18, 174, 226); // Primary Blue
  doc.rect(15, 15, 10, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(39, 39, 42); // Zinc-900
  doc.text('SUNPARTNERS', 30, 23);
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122); // Zinc-500
  doc.text('CONTRASTE ESTRUCTURAL', 30, 27);

  // Header Info
  doc.setFontSize(10);
  doc.setTextColor(39, 39, 42);
  doc.text('COTIZACIÓN MAESTRO', 150, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NÚMERO: #${quotation.id.substring(0, 8).toUpperCase()}`, 150, 25);
  doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 150, 29);

  // Client Info
  doc.setDrawColor(228, 228, 231); // Zinc-200
  doc.line(15, 35, 195, 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CLIENTE:', 15, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(quotation.client.nombre, 45, 45);
  doc.text(`NIT/CC: ${quotation.client.identificacion || 'N/A'}`, 45, 50);
  doc.text(`TEL: ${quotation.client.telefono || 'N/A'}`, 45, 55);

  doc.setFont('helvetica', 'bold');
  doc.text('EVENTO:', 120, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(`INICIO: ${new Date(quotation.start_date).toLocaleDateString()}`, 145, 45);
  doc.text(`FIN: ${new Date(quotation.end_date).toLocaleDateString()}`, 145, 50);

  // Items Table
  const tableData = quotation.items.map(item => [
    item.inventoryItem.nombre,
    `Clase ${item.clase_asignada}`,
    item.quantity,
    `$ ${item.unitPrice.toLocaleString()}`,
    `$ ${(item.unitPrice * item.quantity).toLocaleString()}`
  ]);

  doc.autoTable({
    startY: 65,
    head: [['Descripción', 'Calidad', 'Cant.', 'Vlr. Unitario', 'Total']],
    body: tableData,
    headStyles: { fillColor: [39, 39, 42], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [63, 63, 70] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { left: 15, right: 15 }
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Financials
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL COTIZACIÓN:', 140, finalY + 5);
  doc.setFontSize(14);
  doc.setTextColor(18, 174, 226);
  doc.text(`$ ${total.toLocaleString()}`, 140, finalY + 12);

  // Footer / Terms
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.setFont('helvetica', 'italic');
  doc.text('Esta cotización es válida por 15 días. Sujeta a disponibilidad de inventario al momento de la reserva.', 15, 280);
  doc.text('Sunpartners S.A.S - Conectando estructuras, creando experiencias.', 15, 285);

  doc.save(`Cotizacion_${quotation.client.nombre.replace(/\s+/g, '_')}_${quotation.id.substring(0,4)}.pdf`);
};
