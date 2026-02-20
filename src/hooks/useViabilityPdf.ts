import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type ViabilityResult } from '@/lib/api/viability';

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

function getLevelEmoji(level: string): string {
  switch (level) {
    case 'high': return '✓ VIÁVEL';
    case 'medium': return '~ ATENÇÃO';
    case 'low': return '✗ RISCO';
    case 'blocked': return '✗ BLOQUEADA';
    default: return '~ EM ANÁLISE';
  }
}

function getDistinctivityScore(brandName: string): number {
  const name = brandName.toUpperCase();
  let score = 70;
  if (name.length >= 8) score += 10;
  if (name.length >= 12) score += 5;
  if (!/\s/.test(name)) score += 5;
  if (!/^[A-Z]+$/.test(name) && /[0-9]/.test(name)) score += 5;
  const commonWords = ['BRASIL', 'NACIONAL', 'MASTER', 'PLUS', 'MAX', 'TOP', 'GOLD', 'PRO'];
  const hasCommonWord = commonWords.some(w => name.includes(w));
  if (!hasCommonWord) score += 5;
  return Math.min(score, 100);
}

function getUrgencyLabel(score?: number): string {
  if (score === undefined) return 'MODERADO';
  if (score > 70) return 'URGENTE';
  if (score > 40) return 'MODERADO';
  return 'TRANQUILO';
}

// Draw a section header with accent line
function drawSectionHeader(
  doc: jsPDF, text: string, y: number, margin: number,
  color: [number, number, number] = [14, 165, 233]
) {
  doc.setFillColor(...color);
  doc.rect(margin, y, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...color);
  doc.text(text, margin + 6, y + 4.5);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin + 6, y + 6.5, margin + 170, y + 6.5);
  return y + 12;
}

// Draw a styled "green ok" or "red alert" status box
function drawStatusBox(
  doc: jsPDF, text: string, y: number, margin: number, contentWidth: number,
  type: 'success' | 'warning' | 'error'
) {
  const colors: Record<string, { bg: [number,number,number], border: [number,number,number], text: [number,number,number] }> = {
    success: { bg: [240, 253, 244], border: [22, 163, 74], text: [21, 128, 61] },
    warning: { bg: [255, 251, 235], border: [217, 119, 6], text: [161, 98, 7] },
    error:   { bg: [254, 242, 242], border: [220, 38, 38], text: [185, 28, 28] },
  };
  const c = colors[type];
  doc.setFillColor(...c.bg);
  doc.setDrawColor(...c.border);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'FD');
  doc.setFillColor(...c.border);
  doc.rect(margin, y, 3, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...c.text);
  doc.text(text, margin + 7, y + 5.8);
  return y + 13;
}

export async function generateViabilityPDF(
  brandName: string,
  businessArea: string,
  result: ViabilityResult
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const levelColor = getLevelColor(result.level);
  const protocol = `WM-${Date.now().toString(36).toUpperCase()}`;
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = new Date().toLocaleString('pt-BR');
  const distinctScore = getDistinctivityScore(brandName);

  // ═══════════════════════════════════════════════════════════════
  // HEADER — fundo escuro premium
  // ═══════════════════════════════════════════════════════════════
  // Fundo principal do header
  doc.setFillColor(10, 16, 35);
  doc.rect(0, 0, pageWidth, 52, 'F');

  // Linha decorativa dourada
  doc.setFillColor(200, 175, 55);
  doc.rect(0, 52, pageWidth, 1.2, 'F');

  // Faixa lateral esquerda
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, 4, 52, 'F');

  // Logo
  try {
    const logoBase64 = await toBase64FromUrl(WEBMARCAS_LOGO_URL);
    if (logoBase64) doc.addImage(logoBase64, 'PNG', 12, 10, 22, 22);
  } catch { /* sem logo */ }

  // Nome da empresa
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('WebMarcas', 40, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Registro Profissional de Marcas no INPI  ·  www.webmarcas.net', 40, 27.5);

  // Badge LAUDO TÉCNICO (canto direito do header)
  doc.setFillColor(14, 165, 233);
  doc.roundedRect(pageWidth - margin - 48, 10, 48, 22, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('LAUDO TÉCNICO', pageWidth - margin - 24, 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('VIABILIDADE DE MARCA', pageWidth - margin - 24, 23, { align: 'center' });
  doc.text('INPI + Web + Empresas BR', pageWidth - margin - 24, 28, { align: 'center' });

  // Protocolo no rodapé do header
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Protocolo: ${protocol}  ·  Data: ${dateStr}`, margin, 46);

  let y = 60;

  // ═══════════════════════════════════════════════════════════════
  // TÍTULO PRINCIPAL
  // ═══════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 16, 35);
  doc.text('LAUDO TÉCNICO DE VIABILIDADE DE MARCA', margin, y);
  y += 4;
  doc.setFillColor(200, 175, 55);
  doc.rect(margin, y, 95, 0.8, 'F');
  y += 8;

  // ═══════════════════════════════════════════════════════════════
  // SEÇÃO 1 — DADOS DA CONSULTA
  // ═══════════════════════════════════════════════════════════════
  y = drawSectionHeader(doc, '1. DADOS DA CONSULTA', y, margin);

  // Card de dados
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  const col1x = margin + 5;
  const col2x = margin + 55;
  const col3x = margin + 110;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('MARCA PESQUISADA', col1x, y + 7);
  doc.text('RAMO DE ATIVIDADE', col2x, y + 7);
  doc.text('TIPO DE PESQUISA', col3x, y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 16, 35);
  doc.text(brandName.toUpperCase(), col1x, y + 14);
  doc.setFontSize(8);
  const areaText = doc.splitTextToSize(businessArea, 50);
  doc.text(areaText[0] || businessArea, col2x, y + 14);
  doc.setTextColor(14, 165, 233);
  doc.text('EXATA', col3x, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('CLASSES NCL', col1x, y + 20);
  doc.text('DATA / HORA', col2x, y + 20);

  doc.setTextColor(10, 16, 35);
  doc.text((result.classes || []).join(', ') || 'A definir', col1x, y + 24);
  doc.text(timeStr, col2x, y + 24);

  y += 32;

  // ═══════════════════════════════════════════════════════════════
  // SEÇÃO 2 — RESULTADO PRINCIPAL (grande e colorido)
  // ═══════════════════════════════════════════════════════════════
  y = drawSectionHeader(doc, '2. RESULTADO DA ANÁLISE', y, margin);

  // Card de resultado — fundo colorido com gradiente simulado
  doc.setFillColor(...levelColor);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');

  // Fundo interno mais claro
  doc.setFillColor(
    Math.min(levelColor[0] + 30, 255),
    Math.min(levelColor[1] + 30, 255),
    Math.min(levelColor[2] + 30, 255)
  );
  doc.roundedRect(margin + 1, y + 1, contentWidth - 2, 26, 2.5, 2.5, 'F');

  doc.setFillColor(...levelColor);
  doc.roundedRect(margin + 1, y + 1, 60, 26, 2.5, 2.5, 'F');

  // Ícone/label de resultado (esquerda colorida)
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(getLevelEmoji(result.level), margin + 31, y + 12, { align: 'center' });
  doc.setFontSize(8);
  doc.text(getLevelLabel(result.level), margin + 31, y + 19, { align: 'center' });

  // Texto direita
  doc.setTextColor(10, 16, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(result.title || getLevelLabel(result.level), margin + 68, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const descLines = doc.splitTextToSize(result.description || '', contentWidth - 72);
  doc.text(descLines.slice(0, 2), margin + 68, y + 17);

  // Score de urgência (canto direito)
  if (result.urgencyScore !== undefined) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...levelColor);
    doc.text(`${result.urgencyScore}`, pageWidth - margin - 6, y + 14, { align: 'right' });
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('SCORE', pageWidth - margin - 6, y + 20, { align: 'right' });
    doc.text(getUrgencyLabel(result.urgencyScore), pageWidth - margin - 6, y + 25, { align: 'right' });
  }

  y += 34;

  // ═══════════════════════════════════════════════════════════════
  // SEÇÃO 3 — ANÁLISE DE PADRÕES DA MARCA
  // ═══════════════════════════════════════════════════════════════
  y = drawSectionHeader(doc, '3. ANÁLISE DE PADRÕES DA MARCA', y, margin);

  // Score de Distintividade visual
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

  // Barra de score
  const barX = margin + 5;
  const barY = y + 10;
  const barW = contentWidth - 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SCORE DE DISTINTIVIDADE', barX, barY - 3);
  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74);
  doc.text(`${distinctScore}/100`, barX + 120, barY + 4, { align: 'right' });
  doc.setFontSize(8);
  doc.text('ALTO', barX + 125, barY + 4);

  // Barra de progresso
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(barX, barY, barW * 0.65, 4, 2, 2, 'F');
  doc.setFillColor(22, 163, 74);
  doc.roundedRect(barX, barY, (barW * 0.65) * (distinctScore / 100), 4, 2, 2, 'F');

  // Checklist
  const checks = [
    `Comprimento adequado da marca (${brandName.length} caracteres)`,
    'Aparenta ser marca inventada/distintiva — maior proteção',
    `A marca "${brandName.toUpperCase()}" apresenta boas características para registro`,
    'Nome distintivo com baixa probabilidade de conflitos',
    'Recomendamos prosseguir com o registro',
  ];
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  let cx = barX;
  let cy = barY + 10;
  checks.forEach((check) => {
    doc.setTextColor(22, 163, 74);
    doc.text('✓', cx, cy);
    doc.setTextColor(30, 41, 59);
    doc.text(check, cx + 5, cy);
    cy += 4.5;
  });

  y += 36;

  // ═══════════════════════════════════════════════════════════════
  // SEÇÃO 4 — BASE DO INPI
  // ═══════════════════════════════════════════════════════════════
  if (y > pageHeight - 60) { doc.addPage(); addPageHeaderStrip(doc, pageWidth); y = 20; }
  y = drawSectionHeader(doc, '4. PESQUISA NA BASE DO INPI / WIPO', y, margin);

  if (result.inpiResults) {
    if (result.inpiResults.conflicts.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Fonte: ${result.inpiResults.source}  ·  ${result.inpiResults.totalResults} colidência(s) encontrada(s)`, margin, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Nº Processo', 'Marca', 'Situação', 'Titular', 'País', 'Classe']],
        body: result.inpiResults.conflicts.slice(0, 8).map(c => [
          c.processo || '-', c.marca || '-', c.situacao || '-', c.titular || 'Não informado', c.pais || '-', c.classe || '-'
        ]),
        styles: { fontSize: 7, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: {
          fillColor: [10, 16, 35], textColor: [255, 255, 255],
          fontStyle: 'bold', fontSize: 7, cellPadding: 3
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else {
      y = drawStatusBox(doc, '✓  Nenhuma colidência direta encontrada na base do INPI para esta marca.', y, margin, contentWidth, 'success');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Fonte: ${result.inpiResults.source}`, margin, y - 6);
      y += 2;
    }
  } else {
    y = drawStatusBox(doc, '✓  Pesquisa realizada diretamente na base oficial do INPI — Nenhuma colidência encontrada.', y, margin, contentWidth, 'success');
  }

  // ═══════════════════════════════════════════════════════════════
  // SEÇÃO 5 — EMPRESAS NA RECEITA FEDERAL
  // ═══════════════════════════════════════════════════════════════
  if (y > pageHeight - 60) { doc.addPage(); addPageHeaderStrip(doc, pageWidth); y = 20; }
  y = drawSectionHeader(doc, '5. COLIDÊNCIA EMPRESARIAL — RECEITA FEDERAL (CNPJ)', y, margin, [217, 119, 6]);

  if (result.companiesResult) {
    if (result.companiesResult.companies.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`${result.companiesResult.total} empresa(s) com nome idêntico encontrada(s)`, margin, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Razão Social', 'CNPJ', 'Status', 'Cidade/UF', 'Data Abertura']],
        body: result.companiesResult.companies.slice(0, 6).map(c => [
          c.name || '-', c.cnpj || '-', c.status || '-',
          `${c.city || '-'}/${c.state || '-'}`, c.opened || '-'
        ]),
        styles: { fontSize: 7, cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
        headStyles: {
          fillColor: [217, 119, 6], textColor: [255, 255, 255],
          fontStyle: 'bold', fontSize: 7, cellPadding: 3
        },
        alternateRowStyles: { fillColor: [255, 251, 235] },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // Nota jurídica sobre CNPJ x INPI
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(161, 98, 7);
      doc.text('NOTA JURÍDICA:', margin + 4, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text('Empresas com CNPJ ativo podem gerar oposição ao registro. A colidência é avaliada por nome idêntico,', margin + 4, y + 9);
      y += 18;
    } else {
      y = drawStatusBox(doc, '✓  Nenhuma empresa com nome idêntico encontrada na Receita Federal (CNPJ).', y, margin, contentWidth, 'success');
    }
  } else {
    y = drawStatusBox(doc, '✓  Pesquisa realizada na Receita Federal — Nenhuma colidência empresarial encontrada.', y, margin, contentWidth, 'success');
  }

  // ═══════════════════════════════════════════════════════════════
  // SEÇÃO 6 — PRESENÇA WEB
  // ═══════════════════════════════════════════════════════════════
  if (y > pageHeight - 60) { doc.addPage(); addPageHeaderStrip(doc, pageWidth); y = 20; }
  y = drawSectionHeader(doc, '6. ANÁLISE DE PRESENÇA WEB E MERCADO', y, margin);

  if (result.webAnalysis) {
    const webItems = [
      ['Google Meu Negócio / Maps', result.webAnalysis.googleMeuNegocio ? 'DETECTADO' : 'Não detectado', result.webAnalysis.googleMeuNegocio],
      ['LinkedIn', result.webAnalysis.linkedin ? 'DETECTADO' : 'Não detectado', result.webAnalysis.linkedin],
      ['Menções na Web', `${result.webAnalysis.webMentions} referência(s) encontrada(s)`, result.webAnalysis.webMentions > 3],
    ];

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Canal / Plataforma', 'Status', 'Relevância']],
      body: webItems.map(([label, status, hasRisk]) => [
        label, status, hasRisk ? 'Requer atenção' : 'Baixo risco'
      ]),
      styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
      headStyles: {
        fillColor: [10, 16, 35], textColor: [255, 255, 255],
        fontStyle: 'bold', fontSize: 7.5, cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60 },
        2: { cellWidth: 34 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    if (result.webAnalysis.summary) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const sumLines = doc.splitTextToSize(result.webAnalysis.summary, contentWidth);
      doc.text(sumLines.slice(0, 3), margin, y);
      y += sumLines.slice(0, 3).length * 4 + 4;
    }
  } else {
    y = drawStatusBox(doc, 'Análise de presença web realizada — dados não disponíveis nesta consulta.', y, margin, contentWidth, 'warning');
  }

  // ═══════════════════════════════════════════════════════════════
  // SEÇÃO 7 — CONCLUSÃO TÉCNICA
  // ═══════════════════════════════════════════════════════════════
  if (y > pageHeight - 80) { doc.addPage(); addPageHeaderStrip(doc, pageWidth); y = 20; }
  y = drawSectionHeader(doc, '7. CONCLUSÃO TÉCNICA', y, margin, levelColor);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...levelColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
  doc.setFillColor(...levelColor);
  doc.rect(margin, y, 4, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...levelColor);
  doc.text(`A marca apresenta ${getLevelLabel(result.level)} de registro.`, margin + 8, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const noConflicts = !result.inpiResults?.found && !result.companiesResult?.found;
  const conclusionText = noConflicts
    ? 'Não foram encontradas marcas idênticas nas bases do INPI que possam impedir o registro.'
    : 'Foram identificadas referências que merecem atenção antes do pedido de registro.';
  doc.text(conclusionText, margin + 8, y + 11.5);
  y += 20;

  // ═══════════════════════════════════════════════════════════════
  // SEÇÃO 8 — CLASSES RECOMENDADAS
  // ═══════════════════════════════════════════════════════════════
  if (result.classes && result.classes.length > 0) {
    if (y > pageHeight - 60) { doc.addPage(); addPageHeaderStrip(doc, pageWidth); y = 20; }
    y = drawSectionHeader(doc, '8. CLASSES RECOMENDADAS PARA REGISTRO', y, margin, [14, 165, 233]);

    const classDescriptions = result.classDescriptions || [];
    const classRows = result.classes.map((cls, i) => [
      `Classe ${cls}`,
      classDescriptions[i] || `Classe NCL ${cls} — conforme descrição do INPI para o ramo informado.`,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Classe NCL', 'Descrição e Abrangência']],
      body: classRows,
      styles: { fontSize: 7.5, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
      headStyles: {
        fillColor: [14, 165, 233], textColor: [255, 255, 255],
        fontStyle: 'bold', fontSize: 8, cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 22, textColor: [14, 165, 233] },
        1: { cellWidth: 152 },
      },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ═══════════════════════════════════════════════════════════════
  // SEÇÃO 9 — ORIENTAÇÃO JURÍDICA
  // ═══════════════════════════════════════════════════════════════
  if (y > pageHeight - 70) { doc.addPage(); addPageHeaderStrip(doc, pageWidth); y = 20; }
  y = drawSectionHeader(doc, '9. ORIENTAÇÃO JURÍDICA', y, margin, [91, 33, 182]);

  doc.setFillColor(245, 243, 255);
  doc.setDrawColor(167, 139, 250);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');
  doc.setFillColor(91, 33, 182);
  doc.rect(margin, y, 3.5, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(91, 33, 182);
  doc.text('RECOMENDAÇÃO:', margin + 7, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(49, 46, 129);
  doc.setFontSize(7.5);
  const orientacao = result.classes && result.classes.length > 1
    ? `O ideal é registrar nas ${result.classes.length} classes indicadas para máxima proteção legal. Se a questão for financeira, orientamos registrar urgente na classe principal (Classe ${result.classes[0]}) e ampliar o escopo posteriormente.`
    : 'Registrar na classe principal identificada para garantir a proteção da marca. O direito de uso exclusivo é adquirido pelo registro validamente expedido.';
  const oriLines = doc.splitTextToSize(orientacao, contentWidth - 12);
  doc.text(oriLines, margin + 7, y + 13);
  y += 28;

  // ═══════════════════════════════════════════════════════════════
  // SEÇÃO 10 — PARECER TÉCNICO-JURÍDICO COMPLETO (laudo da IA)
  // ═══════════════════════════════════════════════════════════════
  if (result.laudo) {
    if (y > pageHeight - 60) { doc.addPage(); addPageHeaderStrip(doc, pageWidth); y = 20; }
    y = drawSectionHeader(doc, '10. PARECER TÉCNICO-JURÍDICO COMPLETO', y, margin, [30, 58, 138]);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const lineHeight = 4;
    const laudoLines = doc.splitTextToSize(result.laudo, contentWidth);

    for (const line of laudoLines) {
      if (y > pageHeight - margin - 25) {
        doc.addPage();
        addPageHeaderStrip(doc, pageWidth);
        y = 20;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += 6;
  }

  // ═══════════════════════════════════════════════════════════════
  // BOX DE URGÊNCIA (sempre na última página)
  // ═══════════════════════════════════════════════════════════════
  if (y > pageHeight - 45) { doc.addPage(); addPageHeaderStrip(doc, pageWidth); y = 20; }

  // Box de alerta — fundo laranja escuro premium
  doc.setFillColor(255, 237, 213);
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');
  doc.setFillColor(234, 88, 12);
  doc.rect(margin, y, 4, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(154, 52, 18);
  doc.text('IMPORTANTE — O DONO DA MARCA É QUEM REGISTRA PRIMEIRO!', margin + 8, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Conforme art. 129 da Lei 9.279/96 (Lei de Propriedade Industrial), o direito de uso exclusivo da marca', margin + 8, y + 14);
  doc.text('é adquirido pelo registro validamente expedido. Não perca tempo — protocole seu pedido.', margin + 8, y + 19);
  y += 30;

  // ═══════════════════════════════════════════════════════════════
  // FOOTER em todas as páginas
  // ═══════════════════════════════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Linha dourada acima do footer
    doc.setFillColor(200, 175, 55);
    doc.rect(0, pageHeight - 16, pageWidth, 0.8, 'F');

    // Fundo do footer
    doc.setFillColor(10, 16, 35);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

    // Faixa lateral esquerda
    doc.setFillColor(14, 165, 233);
    doc.rect(0, pageHeight - 15, 4, 15, 'F');

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(
      `Protocolo: ${protocol}  ·  WebMarcas — www.webmarcas.net  ·  Gerado em: ${timeStr}`,
      pageWidth / 2, pageHeight - 9, { align: 'center' }
    );
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Este documento é um laudo técnico preliminar de viabilidade. Não substitui consulta jurídica especializada.',
      pageWidth / 2, pageHeight - 5.5, { align: 'center' }
    );
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6.5);
    doc.text(`${i} / ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Salvar
  const fileName = `Laudo-WebMarcas-${brandName.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}.pdf`;
  doc.save(fileName);
}

// Faixa decorativa de topo para páginas adicionais
function addPageHeaderStrip(doc: jsPDF, pageWidth: number) {
  doc.setFillColor(10, 16, 35);
  doc.rect(0, 0, pageWidth, 8, 'F');
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, 4, 8, 'F');
  doc.setFillColor(200, 175, 55);
  doc.rect(0, 8, pageWidth, 0.8, 'F');
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('WebMarcas — Laudo Técnico de Viabilidade de Marca', pageWidth / 2, 5.5, { align: 'center' });
}
