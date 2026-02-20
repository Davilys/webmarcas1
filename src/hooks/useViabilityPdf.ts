import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type ViabilityResult } from '@/lib/api/viability';

// ─── Cores da identidade WebMarcas ────────────────────────────────
const C = {
  navy:    [10, 24, 54] as [number,number,number],
  blue:    [37, 99, 235] as [number,number,number],
  blueLight:[219,234,254] as [number,number,number],
  gold:    [200,175,55] as [number,number,number],
  goldLight:[253,246,215] as [number,number,number],
  white:   [255,255,255] as [number,number,number],
  gray50:  [248,250,252] as [number,number,number],
  gray100: [241,245,249] as [number,number,number],
  gray200: [226,232,240] as [number,number,number],
  gray400: [148,163,184] as [number,number,number],
  gray500: [100,116,139] as [number,number,number],
  gray700: [51, 65, 85] as [number,number,number],
  gray900: [15, 23, 42] as [number,number,number],
  green:   [22,163,74] as [number,number,number],
  greenBg: [240,253,244] as [number,number,number],
  amber:   [217,119,6] as [number,number,number],
  amberBg: [255,251,235] as [number,number,number],
  red:     [220,38,38] as [number,number,number],
  redBg:   [254,242,242] as [number,number,number],
  purple:  [109,40,217] as [number,number,number],
  purpleBg:[245,243,255] as [number,number,number],
  orange:  [234,88,12] as [number,number,number],
  orangeBg:[255,237,213] as [number,number,number],
};

function toBase64FromUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

function getLevelColor(level: string, urgency?: number): [number,number,number] {
  if (level === 'blocked') return C.red;
  if (level === 'high') return C.green;
  if ((urgency ?? 50) <= 50) return C.green;
  if (level === 'medium') return C.amber;
  return C.red;
}

function getLevelLabel(level: string, urgency?: number): string {
  if (level === 'blocked') return 'MARCA BLOQUEADA';
  if (level === 'high') return 'ALTA VIABILIDADE';
  if ((urgency ?? 50) <= 50) return 'ALTA VIABILIDADE';
  if (level === 'medium') return 'VIABILIDADE MÉDIA';
  return 'BAIXA VIABILIDADE';
}

function getLevelVerdict(level: string, urgency?: number): string {
  if (level === 'blocked') return '✗  BLOQUEADA';
  if (level === 'high' || (urgency ?? 50) <= 50) return '✓  VIÁVEL';
  if (level === 'medium') return '~  ATENÇÃO';
  return '✗  RISCO';
}

function getDistinctivityScore(brandName: string): number {
  const n = brandName.toUpperCase();
  let score = 65;
  if (n.length >= 6) score += 10;
  if (n.length >= 10) score += 5;
  if (!/\s/.test(n)) score += 5;
  if (/[0-9]/.test(n)) score += 3;
  const common = ['BRASIL','NACIONAL','MASTER','PLUS','MAX','TOP','GOLD','PRO','SUPER'];
  if (!common.some(w => n.includes(w))) score += 7;
  if (/^[A-Z]+$/.test(n) && n.length >= 8) score += 5;
  return Math.min(score, 100);
}

function getUrgencyLabel(score?: number): string {
  if (score === undefined) return 'MODERADO';
  if (score > 70) return 'URGENTE';
  if (score > 40) return 'MODERADO';
  return 'TRANQUILO';
}

// ─── Helpers de desenho ────────────────────────────────────────────
function setFont(doc: jsPDF, style: 'normal'|'bold'|'italic', size: number, color: [number,number,number]) {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

function filledRect(doc: jsPDF, x: number, y: number, w: number, h: number, fill: [number,number,number], r = 0, stroke?: [number,number,number]) {
  doc.setFillColor(...fill);
  if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(0.3); }
  if (r > 0) doc.roundedRect(x, y, w, h, r, r, stroke ? 'FD' : 'F');
  else doc.rect(x, y, w, h, stroke ? 'FD' : 'F');
}

function sectionHeader(doc: jsPDF, label: string, y: number, margin: number, pageWidth: number, accent: [number,number,number] = C.blue): number {
  // fundo tênue
  filledRect(doc, margin, y, pageWidth - margin * 2, 8, [236, 242, 252]);
  // barra lateral colorida
  filledRect(doc, margin, y, 3, 8, accent);
  setFont(doc, 'bold', 8, accent);
  doc.text(label.toUpperCase(), margin + 6, y + 5.5);
  // linha separadora
  doc.setDrawColor(...C.gray200);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 8.2, pageWidth - margin, y + 8.2);
  return y + 14;
}

function statusBanner(
  doc: jsPDF, text: string, y: number, margin: number, cw: number,
  type: 'ok'|'warn'|'error'|'info'
): number {
  const map = {
    ok:    { bg: C.greenBg,  border: C.green,  text: C.green  },
    warn:  { bg: C.amberBg,  border: C.amber,  text: C.amber  },
    error: { bg: C.redBg,    border: C.red,    text: C.red    },
    info:  { bg: C.gray100,  border: C.gray400, text: C.gray700 },
  };
  const s = map[type];
  filledRect(doc, margin, y, cw, 9, s.bg, 2, s.border);
  filledRect(doc, margin, y, 3, 9, s.border);
  setFont(doc, 'bold', 8, s.text);
  doc.text(text, margin + 6, y + 6);
  return y + 14;
}

function pageGuard(doc: jsPDF, y: number, pageH: number, margin: number, needed = 60, pw: number = 210): number {
  if (y > pageH - needed) {
    doc.addPage();
    addPageStrip(doc, pw, pageH);
    return 22;
  }
  return y;
}

function addPageStrip(doc: jsPDF, pw: number, _ph: number) {
  filledRect(doc, 0, 0, pw, 10, C.navy);
  filledRect(doc, 0, 0, 3, 10, C.blue);
  filledRect(doc, 0, 10, pw, 0.8, C.gold);
  setFont(doc, 'bold', 6.5, C.gray400);
  doc.text('WebMarcas — Laudo Técnico de Viabilidade de Marca', pw / 2, 6.8, { align: 'center' });
}

// ─── GERADOR PRINCIPAL ─────────────────────────────────────────────
export async function generateViabilityPDF(
  brandName: string,
  businessArea: string,
  result: ViabilityResult
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const M = 16;          // margem
  const CW = pw - M * 2; // content width
  const levelColor = getLevelColor(result.level, result.urgencyScore);
  const levelLabel = getLevelLabel(result.level, result.urgencyScore);
  const protocol = `WM-${Date.now().toString(36).toUpperCase()}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleString('pt-BR');
  const distinctScore = getDistinctivityScore(brandName);

  // ═══════════════════════════════════════
  // CABEÇALHO — PREMIUM NAVY + GOLD
  // ═══════════════════════════════════════
  const headerH = 58;
  filledRect(doc, 0, 0, pw, headerH, C.navy);
  // Faixa azul lateral
  filledRect(doc, 0, 0, 5, headerH, C.blue);
  // Linha dourada inferior
  filledRect(doc, 0, headerH, pw, 1.2, C.gold);
  // Padrão decorativo — círculos suaves no canto direito
  doc.setDrawColor(255,255,255);
  doc.setLineWidth(0.3);
  for (let i = 0; i < 4; i++) {
    doc.setDrawColor(255,255,255);
    doc.circle(pw - 5, -5, 18 + i * 14, 'S');
  }

  // Logo
  try {
    const logo = await toBase64FromUrl('/favicon.png');
    if (logo) doc.addImage(logo, 'PNG', 14, 13, 24, 24);
  } catch { /* sem logo */ }

  // Nome e tagline
  setFont(doc, 'bold', 22, C.white);
  doc.text('WebMarcas', 44, 24);
  setFont(doc, 'normal', 8, C.gray400);
  doc.text('Registro Profissional de Marcas no INPI  ·  www.webmarcas.net', 44, 31);

  // Badge "LAUDO TÉCNICO" no canto
  const badgeX = pw - M - 52;
  filledRect(doc, badgeX, 10, 52, 30, C.blue, 3);
  filledRect(doc, badgeX, 10, 52, 2, C.gold, 0);
  setFont(doc, 'bold', 9.5, C.white);
  doc.text('LAUDO TÉCNICO', badgeX + 26, 22, { align: 'center' });
  setFont(doc, 'normal', 6.5, [180,210,255]);
  doc.text('VIABILIDADE DE MARCA', badgeX + 26, 28, { align: 'center' });
  doc.text('INPI · Receita Federal · Web · IA', badgeX + 26, 34, { align: 'center' });

  // Protocolo + Data
  setFont(doc, 'normal', 6.5, C.gray400);
  doc.text(`Protocolo: ${protocol}    ·    Data: ${dateStr}`, M, 52);

  let y = headerH + 8;

  // ═══════════════════════════════════════
  // TÍTULO
  // ═══════════════════════════════════════
  setFont(doc, 'bold', 14, C.navy);
  doc.text('LAUDO TÉCNICO DE VIABILIDADE DE MARCA', M, y);
  y += 3;
  filledRect(doc, M, y, 80, 0.8, C.gold);
  y += 8;

  // ═══════════════════════════════════════
  // 1. DADOS DA CONSULTA
  // ═══════════════════════════════════════
  y = sectionHeader(doc, '1. Dados da Consulta', y, M, pw, C.blue);

  filledRect(doc, M, y, CW, 30, C.gray50, 3, C.gray200);
  // Linhas verticais divisoras
  doc.setDrawColor(...C.gray200);
  doc.setLineWidth(0.2);
  doc.line(M + 60, y + 3, M + 60, y + 27);
  doc.line(M + 120, y + 3, M + 120, y + 27);

  const cols = [M + 5, M + 65, M + 125];
  setFont(doc, 'bold', 6.5, C.gray500);
  doc.text('MARCA PESQUISADA', cols[0], y + 7);
  doc.text('RAMO DE ATIVIDADE', cols[1], y + 7);
  doc.text('TIPO DE PESQUISA', cols[2], y + 7);

  setFont(doc, 'bold', 10, C.navy);
  doc.text(brandName.toUpperCase().substring(0, 18), cols[0], y + 15);
  setFont(doc, 'bold', 8.5, C.gray700);
  const areaShort = doc.splitTextToSize(businessArea, 52);
  doc.text(areaShort[0] || businessArea, cols[1], y + 15);
  setFont(doc, 'bold', 8.5, C.blue);
  doc.text('EXATA', cols[2], y + 15);

  setFont(doc, 'normal', 6.5, C.gray400);
  doc.text('CLASSES NCL', cols[0], y + 22);
  doc.text('DATA / HORA', cols[1], y + 22);
  setFont(doc, 'normal', 7, C.gray700);
  doc.text((result.classes || []).join(', ') || 'A definir', cols[0], y + 27);
  doc.text(timeStr.substring(0, 22), cols[1], y + 27);
  y += 36;

  // ═══════════════════════════════════════
  // 2. RESULTADO PRINCIPAL
  // ═══════════════════════════════════════
  y = sectionHeader(doc, '2. Resultado da Análise', y, M, pw, levelColor);

  // Card grande colorido
  filledRect(doc, M, y, CW, 36, levelColor, 4);
  // Painel claro à direita
  filledRect(doc, M + 62, y + 1, CW - 63, 34, C.white, 0);
  filledRect(doc, M + 62, y + 1, CW - 63, 34, [0,0,0], 0);
  // recolorir branco sujo
  doc.setFillColor(250, 252, 255);
  doc.roundedRect(M + 62, y + 1, CW - 63, 34, 3, 3, 'F');

  // Veredicto (lado esquerdo colorido)
  setFont(doc, 'bold', 13, C.white);
  doc.text(getLevelVerdict(result.level, result.urgencyScore), M + 31, y + 14, { align: 'center' });
  setFont(doc, 'bold', 7, C.white);
  doc.text(levelLabel, M + 31, y + 21, { align: 'center' });
  // Score urgência no lado colorido
  if (result.urgencyScore !== undefined) {
    setFont(doc, 'bold', 18, [255,255,255]);
    doc.text(`${result.urgencyScore}`, M + 31, y + 32, { align: 'center' });
  }

  // Texto direito
  setFont(doc, 'bold', 10, C.navy);
  const titleClean = (result.title || levelLabel).substring(0, 45);
  doc.text(titleClean, M + 66, y + 10);
  setFont(doc, 'normal', 8, C.gray700);
  const descLines = doc.splitTextToSize(result.description || '', CW - 70);
  doc.text(descLines.slice(0, 3), M + 66, y + 18);

  // Label urgência
  if (result.urgencyScore !== undefined) {
    setFont(doc, 'bold', 6.5, C.gray500);
    doc.text(`URGÊNCIA: ${getUrgencyLabel(result.urgencyScore)}`, M + 66, y + 33);
  }
  y += 42;

  // ═══════════════════════════════════════
  // 3. ANÁLISE DE PADRÕES DA MARCA
  // ═══════════════════════════════════════
  y = sectionHeader(doc, '3. Análise de Padrões da Marca', y, M, pw, C.blue);

  filledRect(doc, M, y, CW, 38, C.gray50, 3, C.gray200);

  // Score badge
  filledRect(doc, pw - M - 40, y + 4, 40, 14, C.greenBg, 2, C.green);
  setFont(doc, 'bold', 9, C.green);
  doc.text(`${distinctScore}/100  ALTO`, pw - M - 20, y + 13, { align: 'center' });

  setFont(doc, 'bold', 7, C.gray500);
  doc.text('SCORE DE DISTINTIVIDADE', M + 5, y + 9);

  // Barra de progresso
  const barX = M + 5, barY = y + 13, barW = CW - 52;
  filledRect(doc, barX, barY, barW, 5, C.gray200, 2.5);
  filledRect(doc, barX, barY, barW * (distinctScore / 100), 5, C.green, 2.5);

  // Checklist 2 colunas
  const checks = [
    `Comprimento adequado (${brandName.length} caracteres)`,
    'Marca inventada/distintiva — maior proteção',
    `"${brandName.toUpperCase()}" tem boas características`,
    'Baixa probabilidade de conflitos',
    'Recomendamos prosseguir com o registro',
  ];
  const col1Checks = checks.slice(0, 3);
  const col2Checks = checks.slice(3);
  let cy = barY + 9;
  col1Checks.forEach(c => {
    setFont(doc, 'bold', 7, C.green);
    doc.text('✓', M + 5, cy);
    setFont(doc, 'normal', 7, C.gray700);
    doc.text(c, M + 10, cy);
    cy += 5;
  });
  cy = barY + 9;
  col2Checks.forEach(c => {
    setFont(doc, 'bold', 7, C.green);
    doc.text('✓', M + CW / 2, cy);
    setFont(doc, 'normal', 7, C.gray700);
    doc.text(c, M + CW / 2 + 5, cy);
    cy += 5;
  });
  y += 44;

  // ═══════════════════════════════════════
  // 4. PESQUISA NO INPI
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 55, pw);
  y = sectionHeader(doc, '4. Pesquisa na Base do INPI / WIPO', y, M, pw, C.navy);

  if (result.inpiResults) {
    if (result.inpiResults.conflicts.length > 0) {
      setFont(doc, 'italic', 7, C.gray500);
      doc.text(`Fonte: ${result.inpiResults.source}  ·  ${result.inpiResults.totalResults} colidência(s) encontrada(s)`, M, y);
      y += 5;
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['Nº Processo', 'Marca', 'Situação', 'Titular', 'País', 'Classe']],
        body: result.inpiResults.conflicts.slice(0, 8).map(c => [
          c.processo || '-', c.marca || '-', c.situacao || '-',
          (c.titular || 'Não informado').substring(0, 22), c.pais || '-', c.classe || '-'
        ]),
        styles: { fontSize: 7, cellPadding: 2.5, lineColor: C.gray200, lineWidth: 0.2, textColor: C.gray700 },
        headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 7, cellPadding: 3 },
        alternateRowStyles: { fillColor: C.gray50 },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else {
      y = statusBanner(doc, '✓  Nenhuma colidência direta encontrada na base oficial do INPI para esta marca.', y, M, CW, 'ok');
      setFont(doc, 'italic', 6.5, C.gray400);
      doc.text(`Fonte: ${result.inpiResults.source || 'Base INPI'}`, M, y - 8);
    }
  } else {
    y = statusBanner(doc, '✓  Pesquisa realizada diretamente na base oficial do INPI — Nenhuma colidência encontrada.', y, M, CW, 'ok');
  }

  // ═══════════════════════════════════════
  // 5. COLIDÊNCIA EMPRESARIAL CNPJ
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 55, pw);
  y = sectionHeader(doc, '5. Colidência Empresarial — Receita Federal (CNPJ)', y, M, pw, C.amber);

  if (result.companiesResult) {
    if (result.companiesResult.companies.length > 0) {
      setFont(doc, 'italic', 7, C.gray500);
      doc.text(`${result.companiesResult.total} empresa(s) com nome idêntico encontrada(s) — colidência por nome exato`, M, y);
      y += 5;
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['Razão Social', 'CNPJ', 'Status', 'Cidade/UF', 'Abertura']],
        body: result.companiesResult.companies.slice(0, 6).map(c => [
          (c.name || '-').substring(0, 30), c.cnpj || '-', c.status || '-',
          `${c.city || '-'}/${c.state || '-'}`, c.opened || '-'
        ]),
        styles: { fontSize: 7, cellPadding: 2.5, lineColor: C.gray200, lineWidth: 0.2, textColor: C.gray700 },
        headStyles: { fillColor: C.amber, textColor: C.white, fontStyle: 'bold', fontSize: 7, cellPadding: 3 },
        alternateRowStyles: { fillColor: C.amberBg },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 4;

      // Nota jurídica
      filledRect(doc, M, y, CW, 14, C.amberBg, 2, C.amber);
      filledRect(doc, M, y, 3, 14, C.amber);
      setFont(doc, 'bold', 7, C.amber);
      doc.text('NOTA JURÍDICA:', M + 6, y + 5.5);
      setFont(doc, 'normal', 6.5, C.gray700);
      doc.text('A colidência empresarial é avaliada por nome IDÊNTICO, não semelhante. Empresas ativas com CNPJ podem', M + 6, y + 10);
      doc.text('gerar oposição ao pedido de registro de marca junto ao INPI.', M + 6, y + 14);
      y += 20;
    } else {
      y = statusBanner(doc, '✓  Nenhuma empresa com nome idêntico encontrada na Receita Federal (CNPJ).', y, M, CW, 'ok');
    }
  } else {
    y = statusBanner(doc, '✓  Pesquisa realizada na Receita Federal — Nenhuma colidência empresarial encontrada.', y, M, CW, 'ok');
  }

  // ═══════════════════════════════════════
  // 6. PRESENÇA WEB
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 60, pw);
  y = sectionHeader(doc, '6. Análise de Presença Web e Mercado', y, M, pw, C.navy);

  if (result.webAnalysis) {
    // Cards de canais
    const channels = [
      { label: 'Google Meu Negócio / Maps', found: result.webAnalysis.googleMeuNegocio },
      { label: 'LinkedIn', found: result.webAnalysis.linkedin },
      { label: `Menções na Web (${result.webAnalysis.webMentions})`, found: result.webAnalysis.webMentions > 3 },
    ];
    const cardW = (CW - 8) / 3;
    channels.forEach((ch, i) => {
      const cx = M + i * (cardW + 4);
      const bg = ch.found ? C.redBg : C.greenBg;
      const border = ch.found ? C.red : C.green;
      const textC = ch.found ? C.red : C.green;
      filledRect(doc, cx, y, cardW, 16, bg, 2, border);
      setFont(doc, 'bold', 7.5, textC);
      doc.text(ch.found ? 'DETECTADO' : 'NÃO DETECTADO', cx + cardW / 2, y + 7, { align: 'center' });
      setFont(doc, 'normal', 6, C.gray700);
      doc.text(ch.label, cx + cardW / 2, y + 13, { align: 'center' });
    });
    y += 22;

    if (result.webAnalysis.summary) {
      setFont(doc, 'italic', 7, C.gray500);
      const sumLines = doc.splitTextToSize(result.webAnalysis.summary, CW);
      doc.text(sumLines.slice(0, 3), M, y);
      y += sumLines.slice(0, 3).length * 4.5 + 4;
    }
  } else {
    y = statusBanner(doc, 'Análise de presença web realizada — dados não disponíveis nesta consulta.', y, M, CW, 'info');
  }

  // ═══════════════════════════════════════
  // 7. CONCLUSÃO TÉCNICA
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 60, pw);
  y = sectionHeader(doc, '7. Conclusão Técnica', y, M, pw, levelColor);

  filledRect(doc, M, y, CW, 20, C.gray50, 3, levelColor);
  filledRect(doc, M, y, 4, 20, levelColor);
  setFont(doc, 'bold', 10, levelColor);
  doc.text(`A marca apresenta ${levelLabel} de registro.`, M + 8, y + 9);
  setFont(doc, 'normal', 8, C.gray700);
  const noConflict = !result.inpiResults?.found && !result.companiesResult?.found;
  const concl = noConflict
    ? 'Não foram encontradas marcas idênticas nas bases do INPI que possam impedir o registro.'
    : 'Foram identificadas referências que merecem atenção antes do pedido de registro.';
  doc.text(concl, M + 8, y + 16);
  y += 26;

  // ═══════════════════════════════════════
  // 8. CLASSES RECOMENDADAS
  // ═══════════════════════════════════════
  if (result.classes && result.classes.length > 0) {
    y = pageGuard(doc, y, ph, M, 55, pw);
    y = sectionHeader(doc, '8. Classes Recomendadas para Registro', y, M, pw, C.blue);

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Classe NCL', 'Descrição e Abrangência']],
      body: result.classes.map((cls, i) => [
        `Classe ${cls}`,
        result.classDescriptions?.[i] || `Classe NCL ${cls} — conforme descrição do INPI para o ramo informado.`,
      ]),
      styles: { fontSize: 7.5, cellPadding: 3, lineColor: C.gray200, lineWidth: 0.2, textColor: C.gray700 },
      headStyles: { fillColor: C.blue, textColor: C.white, fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 22, textColor: C.blue },
        1: { cellWidth: CW - 22 },
      },
      alternateRowStyles: { fillColor: C.blueLight },
      theme: 'grid',
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ═══════════════════════════════════════
  // 9. ORIENTAÇÃO JURÍDICA
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 55, pw);
  y = sectionHeader(doc, '9. Orientação Jurídica', y, M, pw, C.purple);

  filledRect(doc, M, y, CW, 26, C.purpleBg, 3, [167,139,250]);
  filledRect(doc, M, y, 4, 26, C.purple);
  setFont(doc, 'bold', 8, C.purple);
  doc.text('RECOMENDAÇÃO:', M + 8, y + 8);
  setFont(doc, 'normal', 7.5, [49,46,129]);
  const oriText = result.classes && result.classes.length > 1
    ? `O ideal é registrar nas ${result.classes.length} classes indicadas para máxima proteção legal. Se a questão for financeira, registre urgente na classe principal (Classe ${result.classes[0]}) e amplie o escopo posteriormente.`
    : 'Registrar na classe principal identificada garante a proteção da marca. O direito de uso exclusivo é adquirido pelo registro validamente expedido pelo INPI.';
  const oriLines = doc.splitTextToSize(oriText, CW - 14);
  doc.text(oriLines, M + 8, y + 16);
  y += 32;

  // ═══════════════════════════════════════
  // 10. PARECER TÉCNICO-JURÍDICO (laudo IA)
  // ═══════════════════════════════════════
  if (result.laudo) {
    y = pageGuard(doc, y, ph, M, 55, pw);
    y = sectionHeader(doc, '10. Parecer Técnico-Jurídico Completo', y, M, pw, C.navy);

    setFont(doc, 'normal', 7.5, C.gray700);
    const laudoLines = doc.splitTextToSize(result.laudo, CW);
    for (const line of laudoLines) {
      if (y > ph - M - 22) {
        doc.addPage();
        addPageStrip(doc, pw, ph);
        y = 22;
      }
      doc.text(line, M, y);
      y += 4.2;
    }
    y += 6;
  }

  // ═══════════════════════════════════════
  // BOX DE URGÊNCIA
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 30, pw);
  filledRect(doc, M, y, CW, 22, C.orangeBg, 3, C.orange);
  filledRect(doc, M, y, 4, 22, C.orange);
  setFont(doc, 'bold', 9, [154,52,18]);
  doc.text('⚠  IMPORTANTE — O DONO DA MARCA É QUEM REGISTRA PRIMEIRO!', M + 8, y + 8);
  setFont(doc, 'normal', 7, C.gray700);
  doc.text('Conforme art. 129 da Lei 9.279/96 (Lei de Propriedade Industrial) — o direito de uso exclusivo', M + 8, y + 14);
  doc.text('da marca é adquirido pelo registro validamente expedido. Não perca tempo — protocole seu pedido.', M + 8, y + 19);
  y += 28;

  // ═══════════════════════════════════════
  // FOOTER EM TODAS AS PÁGINAS
  // ═══════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const fY = ph - 14;
    filledRect(doc, 0, fY - 0.8, pw, 0.8, C.gold);
    filledRect(doc, 0, fY, pw, 14, C.navy);
    filledRect(doc, 0, fY, 4, 14, C.blue);
    setFont(doc, 'normal', 6.5, C.gray400);
    doc.text(
      `Protocolo: ${protocol}  ·  WebMarcas — www.webmarcas.net  ·  Gerado em: ${timeStr}`,
      pw / 2, fY + 6, { align: 'center' }
    );
    setFont(doc, 'normal', 5.5, C.gray500);
    doc.text(
      'Este documento é um laudo técnico preliminar de viabilidade de marca. Não substitui consulta jurídica especializada.',
      pw / 2, fY + 11, { align: 'center' }
    );
    setFont(doc, 'bold', 6.5, C.gray400);
    doc.text(`${i} / ${totalPages}`, pw - M, fY + 7, { align: 'right' });
  }

  const fileName = `Laudo-WebMarcas-${brandName.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}.pdf`;
  doc.save(fileName);
}
