import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { IOrder, ICacamba } from '../interfaces';

export function downloadOrderPdf(order: IOrder) {
  const doc = new jsPDF();
  const fmt = (d?: string) => (d ? new Date(d).toLocaleString('pt-BR') : '-');

  const orderNumber =
    (order as any).numeroPedido ||
    (order as any).numero ||
    (order as any).orderNumber ||
    order._id;

  autoTable(doc, {
    head: [['Campo', 'Valor']],
    body: [
      ['Número do Pedido', String(orderNumber)],
      ['Tipo', order.type || '-'],
      ['Status', order.status || '-'],
      ['Cliente', (order as any).client?.clientName || (order as any).clientName || '-'],
      ['Contato', `${(order as any).contactName || ''} ${(order as any).contactNumber || ''}`.trim()],
      [
        'Endereço',
        `${(order as any).address || ''}, ${(order as any).addressNumber || ''} - ${(order as any).neighborhood || ''}`
      ],
      ['Motorista', (order as any).motorista?.username || '-'],
      ['Criado em', fmt(order.createdAt as any)],
      ['Finalizado em', fmt(order.updatedAt as any)]
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235] }
  });

  if (order.cacambas?.length) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Caçambas (Resumo)', 14, 18);

    // Campos solicitados: número, quando registrada, local, retirada/entrega
    autoTable(doc, {
      startY: 24,
      head: [['#', 'Número', 'Registrada em', 'Local', 'Tipo']],
      body: order.cacambas.map((c: ICacamba, i) => [
        String(i + 1),
        c.numero || '-',
        fmt(c.createdAt as any),
        c.local || '-',
        c.tipo || '-'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] }
    });

    // Detalhes individuais (apenas os campos solicitados)
    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Caçambas (Detalhes)', 14, y);
    y += 6;

    order.cacambas.forEach((c: ICacamba, index: number) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.text(`Caçamba ${index + 1}`, 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Campo', 'Valor']],
        body: [
          ['Número', c.numero || '-'],
          ['Registrada em', fmt(c.createdAt as any)],
          ['Local', c.local || '-'],
          ['Tipo', c.tipo || '-']
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14, right: 14 }
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    });
  }

  doc.save(`pedido_${orderNumber}.pdf`);
}