import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type ViabilityResult } from '@/lib/api/viability';

// Import logo as base64 - we'll use the URL approach
const WEBMARCAS_LOGO_URL = '/favicon.png';

function toBase64FromUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

function getLevelColor(level: string): [number, number, number] {
  switch (level) {
    case 'high': return [22, 163, 74];
    case 'medium': return [217, 119, 6];
    case 'low': return [220, 38, 38];
    case 'blocked': return [127, 29, 29];
    default: return [100, 116, 139];
  }
}

function getLevelLabel(level: string): string {
  switch (level) {
    case 'high': return 'ALTA VIABILIDADE';
    case 'medium': return 'VIABILIDADE MÉDIA';
    case 'low': return 'BAIXA VIABILIDADE';
    case 'blocked': return 'MARCA BLOQUEADA';
    default: return 'ANÁLISE CONCLUÍDA';
  }
}

export async function generateViabilityPDF(
  brandName: string,
  businessArea: string,
  result: ViabilityResult
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const levelColor = getLevelColor(result.level);
  const protocol = `WM-${Date.now().toString(36).toUpperCase()}`;
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── HEADER ──────────────────────────────────────────────────────────
  // Background azul escuro no topo
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo (tenta carregar, usa texto se falhar)
  try {
    const logoBase64 = await toBase64FromUrl(WEBMARCAS_LOGO_URL);
    if (logoBase64) doc.addImage(logoBase64, 'PNG', margin, 8, 28, 28);
  } catch { /* sem logo */ }

  // Empresa
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('WebMarcas', margin + 33, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('Registro Profissional de Marcas no INPI', margin + 33, 27);
  doc.text('www.webmarcas.net', margin + 33, 33);

  // Badge direita
  doc.setFillColor(14, 165, 233);
  doc.roundedRect(pageWidth - margin - 50, 12, 50, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('LAUDO TÉCNICO', pageWidth - margin - 25, 20, { align: 'center' });
  doc.text('VIABILIDADE DE MARCA', pageWidth - margin - 25, 25, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Análise Real | INPI + Web + Empresas BR', pageWidth - margin - 25, 29, { align: 'center' });

  let y = 53;

  // ── TÍTULO DO DOCUMENTO ─────────────────────────────────────────────
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 16, 'F');
  doc.setDrawColor(...levelColor);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin, y + 16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LAUDO TÉCNICO DE VIABILIDADE DE MARCA', margin + 5, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Protocolo: ${protocol}  |  Data: ${dateStr}`, margin + 5, y + 12);
  y += 22;

  // ── DADOS DA CONSULTA ────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(14, 165, 233);
  doc.text('1. IDENTIFICAÇÃO DA CONSULTA', margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [],
    body: [
      ['Nome da Marca', brandName.toUpperCase(), 'Ramo de Atividade', businessArea],
      ['Classes NCL', (result.classes || []).join(', ') || 'A definir', 'Data da Consulta', dateStr],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 35 },
      1: { textColor: [15, 23, 42], cellWidth: 55 },
      2: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 35 },
      3: { textColor: [15, 23, 42], cellWidth: 45 },
    },
    theme: 'plain',
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── RESULTADO PRINCIPAL ──────────────────────────────────────────────
  doc.setFillColor(...levelColor);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(getLevelLabel(result.level), margin + 5, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(result.title || '', margin + 5, y + 15);

  // Score de urgência
  if (result.urgencyScore !== undefined) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Score de Urgência: ${result.urgencyScore}/100`, pageWidth - margin - 5, y + 8, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(result.urgencyScore > 70 ? '🔴 URGENTE' : result.urgencyScore > 40 ? '🟡 MODERADO' : '🟢 TRANQUILO', pageWidth - margin - 5, y + 14, { align: 'right' });
  }
  y += 26;

  // Descrição
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  const descLines = doc.splitTextToSize(result.description || '', contentWidth);
  doc.text(descLines, margin, y);
  y += descLines.length * 4 + 6;

  // ── RESULTADOS INPI ──────────────────────────────────────────────────
  if (result.inpiResults) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(14, 165, 233);
    doc.text('2. ANÁLISE DA BASE DO INPI', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fonte: ${result.inpiResults.source}`, margin, y + 4);
    y += 9;

    if (result.inpiResults.conflicts.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Processo', 'Marca', 'Situação', 'Titular', 'País', 'Classe']],
        body: result.inpiResults.conflicts.slice(0, 8).map(c => [
          c.processo || '-', c.marca || '-', c.situacao || '-', c.titular || '-', c.pais || '-', c.classe || '-'
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        theme: 'striped',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else {
      doc.setFillColor(240, 253, 244);
      doc.rect(margin, y, contentWidth, 10, 'F');
      doc.setTextColor(22, 163, 74);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('✓ Nenhuma colidência direta encontrada na base do INPI para esta marca.', margin + 4, y + 6);
      y += 16;
    }
  }

  // ── EMPRESAS BRASILEIRAS ─────────────────────────────────────────────
  if (result.companiesResult) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(14, 165, 233);
    doc.text('3. ANÁLISE DE COLIDÊNCIA EMPRESARIAL (Receita Federal)', margin, y);
    y += 6;

    if (result.companiesResult.companies.length > 0) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Razão Social', 'CNPJ', 'Status', 'Cidade/UF', 'Abertura']],
        body: result.companiesResult.companies.slice(0, 5).map(c => [
          c.name || '-', c.cnpj || '-', c.status || '-', `${c.city || '-'}/${c.state || '-'}`, c.opened || '-'
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 251, 235] },
        theme: 'striped',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else {
      doc.setFillColor(240, 253, 244);
      doc.rect(margin, y, contentWidth, 10, 'F');
      doc.setTextColor(22, 163, 74);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('✓ Nenhuma empresa com nome idêntico encontrada na Receita Federal.', margin + 4, y + 6);
      y += 16;
    }
  }

  // ── ANÁLISE WEB ──────────────────────────────────────────────────────
  if (result.webAnalysis) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(14, 165, 233);
    doc.text('4. ANÁLISE DE PRESENÇA WEB E MERCADO', margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [],
      body: [
        ['Google Meu Negócio / Maps', result.webAnalysis.googleMeuNegocio ? '🔴 DETECTADO' : '✅ Não detectado'],
        ['LinkedIn', result.webAnalysis.linkedin ? '🔴 DETECTADO' : '✅ Não detectado'],
        ['Menções na Web', `${result.webAnalysis.webMentions} referências encontradas`],
      ],
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [100, 116, 139], cellWidth: 70 },
        1: { textColor: [15, 23, 42] },
      },
      theme: 'plain',
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    if (result.webAnalysis.summary) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const summaryLines = doc.splitTextToSize(result.webAnalysis.summary, contentWidth);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 4 + 6;
    }
  }

  // ── LAUDO TÉCNICO COMPLETO ────────────────────────────────────────────
  // Verificar se precisa de nova página
  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(14, 165, 233);
  doc.text('5. PARECER TÉCNICO-JURÍDICO COMPLETO', margin, y);
  y += 6;

  if (result.laudo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    const laudoLines = doc.splitTextToSize(result.laudo, contentWidth);
    const lineHeight = 3.8;

    for (const line of laudoLines) {
      if (y > pageHeight - margin - 30) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += 6;
  }

  // ── URGÊNCIA BOX ────────────────────────────────────────────────────
  if (result.level !== 'blocked' && result.level !== 'high') {
    if (y > pageHeight - 40) { doc.addPage(); y = margin; }
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, contentWidth, 22, 'FD');
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('⚠️ ALERTA DE URGÊNCIA — O DONO DA MARCA É QUEM REGISTRA PRIMEIRO!', margin + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Conforme art. 129 da Lei 9.279/96 (Lei de Propriedade Industrial), o direito à marca é', margin + 4, y + 13);
    doc.text('adquirido pelo registro validamente expedido, tendo preferência quem primeiro o depositou.', margin + 4, y + 18);
    y += 28;
  }

  // ── FOOTER ───────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(15, 23, 42);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Protocolo: ${protocol}  |  WebMarcas — www.webmarcas.net  |  Documento gerado em ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 9, { align: 'center' });
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
    doc.setTextColor(71, 85, 105);
    doc.text('Este documento é um laudo técnico preliminar de viabilidade. Não substitui consulta jurídica especializada.', pageWidth / 2, pageHeight - 5, { align: 'center' });
  }

  // Salvar
  const fileName = `Laudo-Viabilidade-${brandName.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}.pdf`;
  doc.save(fileName);
}
