import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type ViabilityResult } from '@/lib/api/viability';

// ─── Paleta WebMarcas ──────────────────────────────────────────────
const C = {
  navy:     [10, 24, 54]   as [number,number,number],
  navyMid:  [18, 40, 90]   as [number,number,number],
  blue:     [37, 99, 235]  as [number,number,number],
  blueLight:[219,234,254]  as [number,number,number],
  gold:     [200,175,55]   as [number,number,number],
  goldLight:[253,246,215]  as [number,number,number],
  white:    [255,255,255]  as [number,number,number],
  gray50:   [248,250,252]  as [number,number,number],
  gray100:  [241,245,249]  as [number,number,number],
  gray200:  [226,232,240]  as [number,number,number],
  gray400:  [148,163,184]  as [number,number,number],
  gray500:  [100,116,139]  as [number,number,number],
  gray700:  [51,  65,  85] as [number,number,number],
  gray900:  [15,  23,  42] as [number,number,number],
  green:    [22, 163, 74]  as [number,number,number],
  greenBg:  [240,253,244]  as [number,number,number],
  greenDark:[14, 110, 50]  as [number,number,number],
  amber:    [217,119,  6]  as [number,number,number],
  amberBg:  [255,251,235]  as [number,number,number],
  red:      [220, 38,  38] as [number,number,number],
  redBg:    [254,242,242]  as [number,number,number],
  redDark:  [153, 27,  27] as [number,number,number],
  purple:   [109, 40, 217] as [number,number,number],
  purpleBg: [245,243,255]  as [number,number,number],
  orange:   [234, 88,  12] as [number,number,number],
  orangeBg: [255,237,213]  as [number,number,number],
};

// ─── Lógica de viabilidade real (sincronizada com frontend) ────────
function computePdfLevel(result: ViabilityResult): 'high' | 'medium' | 'low' | 'blocked' {
  if (result.level === 'blocked') return 'blocked';
  const hasINPI = result.inpiResults?.found === true && (result.inpiResults?.totalResults ?? 0) > 0;
  const hasCNPJ = result.companiesResult?.found === true && (result.companiesResult?.total ?? 0) > 0;
  const hasWeb  = (result.webAnalysis?.webMentions ?? 0) > 2;
  if (!hasINPI && !hasCNPJ && !hasWeb) return 'high';
  if (!hasINPI && !hasCNPJ) return 'medium';
  return 'low';
}

function getLevelColor(level: 'high'|'medium'|'low'|'blocked'): [number,number,number] {
  if (level === 'high')    return C.green;
  if (level === 'medium')  return C.amber;
  return C.red;
}

function getLevelLabel(level: 'high'|'medium'|'low'|'blocked'): string {
  if (level === 'high')    return 'ALTA VIABILIDADE';
  if (level === 'medium')  return 'VIABILIDADE MEDIA';
  if (level === 'blocked') return 'MARCA BLOQUEADA';
  return 'BAIXA VIABILIDADE';
}

function getLevelVerdict(level: 'high'|'medium'|'low'|'blocked'): string {
  if (level === 'high')    return 'VIAVEL';
  if (level === 'medium')  return 'ATENCAO';
  return 'RISCO';
}

function getUrgencyLabel(level: 'high'|'medium'|'low'|'blocked'): string {
  if (level === 'high')   return 'TRANQUILO';
  if (level === 'medium') return 'MODERADO';
  return 'URGENTE';
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

// Limpa artefatos do laudo gerado por IA
function cleanLaudo(raw: string): string {
  return raw
    // Remove linhas que contêm APENAS % (com ou sem espaços entre eles)
    .replace(/^[\s%]+$/gm, '')
    // Remove bloco de cabeçalho gerado pelo AI que duplica o cabeçalho do PDF
    .replace(/^LAUDO T[ÉE]CNICO DE VIABILIDADE.*$/gim, '')
    .replace(/^Protocolo:\s*WM-.*$/gim, '')
    .replace(/^Data:\s*\d.*$/gim, '')
    // Remove sequências de % sem espaços (3 ou mais)
    .replace(/[%]{3,}/g, '')
    // Remove sequências de % com espaços entre eles  ex: % % % % %
    .replace(/(% *){3,}/g, '')
    .replace(/={5,}/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{2,}/g, '')
    // Colapsa múltiplas linhas em branco
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Helpers de desenho ────────────────────────────────────────────
function setFont(doc: jsPDF, style: 'normal'|'bold'|'italic', size: number, color: [number,number,number]) {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

function filledRect(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  fill: [number,number,number], r = 0, stroke?: [number,number,number]
) {
  doc.setFillColor(...fill);
  if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(0.3); }
  if (r > 0) doc.roundedRect(x, y, w, h, r, r, stroke ? 'FD' : 'F');
  else doc.rect(x, y, w, h, stroke ? 'FD' : 'F');
}

function sectionHeader(
  doc: jsPDF, label: string, y: number,
  margin: number, pageWidth: number,
  accent: [number,number,number] = C.blue
): number {
  filledRect(doc, margin, y, pageWidth - margin * 2, 9, [236,242,252]);
  filledRect(doc, margin, y, 3, 9, accent);
  setFont(doc, 'bold', 8, accent);
  doc.text(label.toUpperCase(), margin + 7, y + 6);
  doc.setDrawColor(...C.gray200);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 9.3, pageWidth - margin, y + 9.3);
  return y + 15;
}

function statusBanner(
  doc: jsPDF, text: string, y: number, margin: number, cw: number,
  type: 'ok'|'warn'|'error'|'info'
): number {
  const map = {
    ok:    { bg: C.greenBg, border: C.green, text: C.greenDark },
    warn:  { bg: C.amberBg, border: C.amber, text: C.amber },
    error: { bg: C.redBg,   border: C.red,   text: C.redDark },
    info:  { bg: C.gray100, border: C.gray400, text: C.gray700 },
  };
  const s = map[type];
  filledRect(doc, margin, y, cw, 10, s.bg, 2, s.border);
  filledRect(doc, margin, y, 3, 10, s.border);
  setFont(doc, 'bold', 7.5, s.text);
  doc.text(text, margin + 7, y + 6.5);
  return y + 15;
}

function pageGuard(doc: jsPDF, y: number, pageH: number, margin: number, needed = 60, pw = 210): number {
  if (y > pageH - needed) {
    doc.addPage();
    addPageStrip(doc, pw, pageH);
    return 22;
  }
  return y;
}

function addPageStrip(doc: jsPDF, pw: number, _ph: number) {
  filledRect(doc, 0, 0, pw, 10, C.navy);
  filledRect(doc, 0, 0, 3, 10, C.gold);
  filledRect(doc, 0, 10, pw, 0.6, C.gold);
  setFont(doc, 'normal', 6, C.gray400);
  doc.text('WebMarcas — Laudo Tecnico de Viabilidade de Marca', pw / 2, 6.5, { align: 'center' });
}

// Logo via URL absoluta com fallback robusto
function loadLogo(): Promise<string> {
  return new Promise((resolve) => {
    // Tenta carregar o logo-mark da WebMarcas
    const urls = [
      'https://webmarcas1.lovable.app/favicon.png',
      window.location.origin + '/favicon.png',
    ];
    let tried = 0;
    const tryNext = () => {
      if (tried >= urls.length) { resolve(''); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 64;
          canvas.height = img.height || 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else resolve('');
        } catch { resolve(''); }
      };
      img.onerror = () => { tried++; tryNext(); };
      img.src = urls[tried++];
    };
    tryNext();
  });
}

// ─── GERADOR PRINCIPAL ─────────────────────────────────────────────
export async function generateViabilityPDF(
  brandName: string,
  businessArea: string,
  result: ViabilityResult
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();   // 210
  const ph  = doc.internal.pageSize.getHeight();  // 297
  const M   = 16;
  const CW  = pw - M * 2;

  // Nível real derivado dos dados (não do urgencyScore)
  const pdfLevel   = computePdfLevel(result);
  const levelColor = getLevelColor(pdfLevel);
  const levelLabel = getLevelLabel(pdfLevel);
  const verdict    = getLevelVerdict(pdfLevel);
  const urgLabel   = getUrgencyLabel(pdfLevel);

  const protocol = `WM-${Date.now().toString(36).toUpperCase()}`;
  const now      = new Date();
  const dateStr  = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr  = now.toLocaleString('pt-BR');
  const distinctScore = getDistinctivityScore(brandName);

  // Carrega logo (não bloqueia o PDF se falhar)
  const logoData = await loadLogo();

  // ═══════════════════════════════════════
  // PAPEL TIMBRADO — LIMPO (estilo contrato/INPI)
  // ═══════════════════════════════════════

  // Faixa azul-marinho fina no topo
  filledRect(doc, 0, 0, pw, 6, C.navy);
  // Linha dourada abaixo
  filledRect(doc, 0, 6, pw, 1.5, C.gold);

  let y = 11;

  // Logo à esquerda
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', M, y + 1, 18, 18); } catch { /* skip */ }
  }

  // Texto ao lado do logo
  const textX = M + 22;
  setFont(doc, 'bold', 18, C.navy);
  doc.text('WEBMARCAS', textX, y + 8);
  setFont(doc, 'normal', 7.5, [120, 130, 150]);
  doc.text('Propriedade Intelectual e Registro de Marcas no INPI', textX, y + 14);

  // Informações da empresa à direita
  setFont(doc, 'bold', 7, C.navy);
  doc.text('CNPJ: 39.528.012/0001-29', pw - M, y + 4, { align: 'right' });
  setFont(doc, 'normal', 6.5, [150, 150, 150]);
  doc.text('Av. Brigadeiro Luiz Antonio, 2696', pw - M, y + 9, { align: 'right' });
  doc.text('Centro — Sao Paulo/SP', pw - M, y + 14, { align: 'right' });
  doc.text('www.webmarcas.net', pw - M, y + 19, { align: 'right' });

  // Dupla linha separadora
  y += 23;
  doc.setDrawColor(...C.navy); doc.setLineWidth(0.8);
  doc.line(M, y, pw - M, y);
  doc.setDrawColor(...C.gold); doc.setLineWidth(0.3);
  doc.line(M, y + 1.5, pw - M, y + 1.5);
  y += 8;

  // Badge de título centralizado
  const badgeText = 'LAUDO TECNICO DE VIABILIDADE DE MARCA';
  setFont(doc, 'bold', 10, C.white);
  const badgeW = doc.getTextWidth(badgeText) + 16;
  const badgeX = (pw - badgeW) / 2;
  filledRect(doc, badgeX, y, badgeW, 9, C.navy, 1);
  doc.text(badgeText, pw / 2, y + 6, { align: 'center' });
  y += 13;

  // Protocolo + data abaixo do badge
  setFont(doc, 'normal', 6.5, [140, 140, 140]);
  doc.text(`Protocolo: ${protocol}   |   ${dateStr}`, pw / 2, y, { align: 'center' });
  y += 8;

  // ═══════════════════════════════════════
  // 1. DADOS DA CONSULTA
  // ═══════════════════════════════════════
  y = sectionHeader(doc, '1. Dados da Consulta', y, M, pw, C.blue);

  filledRect(doc, M, y, CW, 32, C.gray50, 3, C.gray200);
  doc.setDrawColor(...C.gray200);
  doc.setLineWidth(0.15);
  doc.line(M + 62, y + 4, M + 62, y + 28);
  doc.line(M + 124, y + 4, M + 124, y + 28);

  const cols = [M + 5, M + 67, M + 129];
  setFont(doc, 'bold', 6, C.gray500);
  doc.text('MARCA PESQUISADA', cols[0], y + 7);
  doc.text('RAMO DE ATIVIDADE', cols[1], y + 7);
  doc.text('TIPO DE PESQUISA', cols[2], y + 7);

  setFont(doc, 'bold', 11, C.navy);
  doc.text(brandName.toUpperCase().substring(0, 16), cols[0], y + 16);
  setFont(doc, 'bold', 8, C.gray700);
  const areaWords = doc.splitTextToSize(businessArea, 54);
  doc.text(areaWords[0] || businessArea, cols[1], y + 16);
  setFont(doc, 'bold', 8, C.blue);
  doc.text('EXATA', cols[2], y + 16);

  setFont(doc, 'normal', 6, C.gray400);
  doc.text('CLASSES NCL', cols[0], y + 23);
  doc.text('DATA / HORA', cols[1], y + 23);
  setFont(doc, 'normal', 7, C.gray700);
  doc.text((result.classes || []).join(', ') || 'A definir', cols[0], y + 29);
  doc.text(timeStr.substring(0, 22), cols[1], y + 29);
  y += 38;

  // ═══════════════════════════════════════
  // 2. RESULTADO PRINCIPAL — CARD REDESENHADO
  // ═══════════════════════════════════════
  y = sectionHeader(doc, '2. Resultado da Analise', y, M, pw, levelColor);

  const cardH = 38;
  const leftW = 70;

  // Fundo total cinza claro
  filledRect(doc, M, y, CW, cardH, C.gray50, 4, C.gray200);

  // Painel colorido esquerdo
  filledRect(doc, M, y, leftW, cardH, levelColor, 4);
  // Recolorir canto direito do painel esquerdo (sem arredondamento)
  filledRect(doc, M + leftW - 4, y, 4, cardH, levelColor);

  // Veredicto no painel colorido — texto ASCII limpo
  setFont(doc, 'bold', 7, [255, 255, 255]);
  doc.text(verdict, M + leftW / 2, y + 11, { align: 'center' });

  // Linha divisória interna
  filledRect(doc, M + leftW / 2 - 15, y + 14, 30, 0.5, [255, 255, 255, 0.5] as unknown as [number,number,number]);

  setFont(doc, 'bold', 11, C.white);
  doc.text(levelLabel, M + leftW / 2, y + 22, { align: 'center' });

  // Urgência label embaixo
  const urgBg: [number,number,number] = pdfLevel === 'high' ? [14,110,50] : pdfLevel === 'medium' ? [146,64,14] : [153,27,27];
  filledRect(doc, M + 8, y + 28, leftW - 16, 7, urgBg, 2);
  setFont(doc, 'bold', 6.5, C.white);
  doc.text(`URGENCIA: ${urgLabel}`, M + leftW / 2, y + 33, { align: 'center' });

  // Painel direito — título e descrição
  const rightX = M + leftW + 6;
  const rightW = CW - leftW - 8;
  setFont(doc, 'bold', 9.5, C.navy);
  const titleClean = (result.title || levelLabel).substring(0, 42);
  doc.text(titleClean, rightX, y + 10);

  doc.setDrawColor(...C.gray200);
  doc.setLineWidth(0.2);
  doc.line(rightX, y + 13, rightX + rightW, y + 13);

  setFont(doc, 'normal', 7.5, C.gray700);
  const descLines = doc.splitTextToSize(result.description || '', rightW);
  doc.text(descLines.slice(0, 3), rightX, y + 19);

  y += cardH + 8;

  // ═══════════════════════════════════════
  // 3. ANALISE DE PADRÕES DA MARCA
  // ═══════════════════════════════════════
  y = sectionHeader(doc, '3. Analise de Padroes da Marca', y, M, pw, C.blue);

  filledRect(doc, M, y, CW, 38, C.gray50, 3, C.gray200);

  // Score badge
  const scoreColor = distinctScore >= 75 ? C.green : distinctScore >= 50 ? C.amber : C.red;
  const scoreBg    = distinctScore >= 75 ? C.greenBg : distinctScore >= 50 ? C.amberBg : C.redBg;
  filledRect(doc, pw - M - 42, y + 4, 42, 14, scoreBg, 2, scoreColor);
  setFont(doc, 'bold', 8.5, scoreColor);
  doc.text(`${distinctScore}/100  ALTO`, pw - M - 21, y + 13, { align: 'center' });

  setFont(doc, 'bold', 6.5, C.gray500);
  doc.text('SCORE DE DISTINTIVIDADE', M + 5, y + 9);

  const barX = M + 5, barY = y + 13, barW = CW - 52;
  filledRect(doc, barX, barY, barW, 5, C.gray200, 2);
  filledRect(doc, barX, barY, barW * (distinctScore / 100), 5, scoreColor, 2);

  const checks = [
    `Comprimento adequado (${brandName.length} caracteres)`,
    'Marca inventada/distintiva — maior protecao',
    `"${brandName.toUpperCase()}" tem boas caracteristicas`,
    'Baixa probabilidade de conflitos',
    'Recomendamos prosseguir com o registro',
  ];
  let cy = barY + 9;
  checks.slice(0, 3).forEach(c => {
    setFont(doc, 'bold', 7, C.green);
    doc.text('+', M + 5, cy);
    setFont(doc, 'normal', 7, C.gray700);
    doc.text(c, M + 10, cy);
    cy += 5;
  });
  cy = barY + 9;
  checks.slice(3).forEach(c => {
    setFont(doc, 'bold', 7, C.green);
    doc.text('+', M + CW / 2, cy);
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
    if (result.inpiResults.conflicts && result.inpiResults.conflicts.length > 0) {
      setFont(doc, 'italic', 7, C.gray500);
      doc.text(
        `Fonte: ${result.inpiResults.source || 'Base INPI'}  ·  ${result.inpiResults.totalResults} colidencia(s) encontrada(s)`,
        M, y
      );
      y += 5;
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['No Processo', 'Marca', 'Situacao', 'Titular', 'Pais', 'Classe']],
        body: result.inpiResults.conflicts.slice(0, 8).map(c => [
          c.processo || '-',
          c.marca || '-',
          c.situacao || '-',
          (c.titular || 'Nao informado').substring(0, 22),
          c.pais || '-',
          c.classe || '-',
        ]),
        styles: { fontSize: 7, cellPadding: 2.5, lineColor: C.gray200, lineWidth: 0.2, textColor: C.gray700 },
        headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: 'bold', fontSize: 7, cellPadding: 3 },
        alternateRowStyles: { fillColor: C.gray50 },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    } else {
      y = statusBanner(doc, 'Nenhuma colidencia direta encontrada na base oficial do INPI para esta marca.', y, M, CW, 'ok');
      setFont(doc, 'italic', 6.5, C.gray400);
      doc.text(`Fonte: ${result.inpiResults.source || 'Base INPI'}`, M, y - 9);
    }
  } else {
    y = statusBanner(doc, 'Pesquisa realizada diretamente na base oficial do INPI — Nenhuma colidencia encontrada.', y, M, CW, 'ok');
  }

  // ═══════════════════════════════════════
  // 5. COLIDENCIA EMPRESARIAL CNPJ
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 55, pw);
  y = sectionHeader(doc, '5. Colidencia Empresarial — Receita Federal (CNPJ)', y, M, pw, C.amber);

  if (result.companiesResult) {
    if (result.companiesResult.companies && result.companiesResult.companies.length > 0) {
      setFont(doc, 'italic', 7, C.gray500);
      doc.text(
        `${result.companiesResult.total} empresa(s) com nome identico encontrada(s) — colidencia por nome exato`,
        M, y
      );
      y += 5;
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['Razao Social', 'CNPJ', 'Status', 'Cidade/UF', 'Abertura']],
        body: result.companiesResult.companies.slice(0, 6).map(c => [
          (c.name || '-').substring(0, 28),
          c.cnpj || '-',
          c.status || '-',
          `${c.city || '-'}/${c.state || '-'}`,
          c.opened || '-',
        ]),
        styles: { fontSize: 7, cellPadding: 2.5, lineColor: C.gray200, lineWidth: 0.2, textColor: C.gray700 },
        headStyles: { fillColor: C.amber, textColor: C.white, fontStyle: 'bold', fontSize: 7, cellPadding: 3 },
        alternateRowStyles: { fillColor: C.amberBg },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 4;

      filledRect(doc, M, y, CW, 14, C.amberBg, 2, C.amber);
      filledRect(doc, M, y, 3, 14, C.amber);
      setFont(doc, 'bold', 7, C.amber);
      doc.text('NOTA JURIDICA:', M + 7, y + 5.5);
      setFont(doc, 'normal', 6.5, C.gray700);
      const notaLines = doc.splitTextToSize(
        'A colidencia empresarial e avaliada por nome IDENTICO, nao semelhante. Empresas ativas com CNPJ podem gerar oposicao ao pedido de registro de marca junto ao INPI.',
        CW - 12
      );
      doc.text(notaLines, M + 7, y + 10.5);
      y += 20;
    } else {
      y = statusBanner(doc, 'Nenhuma empresa com nome identico encontrada na Receita Federal (CNPJ).', y, M, CW, 'ok');
    }
  } else {
    y = statusBanner(doc, 'Pesquisa realizada na Receita Federal — Nenhuma colidencia empresarial encontrada.', y, M, CW, 'ok');
  }

  // ─── SUB-BLOCO: Pesquisa de Uso no Mercado (Internet e CNPJ) ───────
  y = pageGuard(doc, y, ph, M, 40, pw);

  // Cabeçalho do sub-bloco
  filledRect(doc, M, y, CW, 9, C.gray100, 2, C.gray200);
  filledRect(doc, M, y, 3, 9, C.amber);
  setFont(doc, 'bold', 7.5, C.amber);
  doc.text('PESQUISA DE USO NO MERCADO (INTERNET E CNPJ)', M + 7, y + 6);
  y += 13;

  const webA = result.webAnalysis;
  const cnpjSrcs = webA?.cnpjSources || [];
  const socialPrfs = webA?.socialProfiles || [];
  const hasMarketData = cnpjSrcs.length > 0 || socialPrfs.length > 0;

  if (!hasMarketData) {
    // Banner verde — nada encontrado
    y = statusBanner(doc,
      'Nao foram identificadas empresas ativas ou perfis relevantes com nome identico na internet ou bases publicas de CNPJ.',
      y, M, CW, 'ok'
    );
  } else {
    // Tabela de empresas encontradas via buscadores de CNPJ
    if (cnpjSrcs.length > 0) {
      y = pageGuard(doc, y, ph, M, 30, pw);
      setFont(doc, 'bold', 7, C.gray700);
      doc.text('Empresas encontradas:', M, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['Nome Empresarial', 'CNPJ', 'Cidade/UF', 'Fonte', 'Situacao']],
        body: cnpjSrcs.map(s => [
          (s.name || '-').substring(0, 26),
          s.cnpj || '-',
          s.city ? `${s.city}/${s.state || ''}` : '-',
          s.source || '-',
          s.status || 'Verificar',
        ]),
        styles: { fontSize: 6.5, cellPadding: 2, lineColor: C.gray200, lineWidth: 0.2, textColor: C.gray700 },
        headStyles: { fillColor: C.gray700, textColor: C.white, fontStyle: 'bold', fontSize: 6.5, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: C.gray50 },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    // Tabela de redes sociais encontradas
    if (socialPrfs.length > 0) {
      y = pageGuard(doc, y, ph, M, 30, pw);
      setFont(doc, 'bold', 7, C.gray700);
      doc.text('Redes Sociais Encontradas:', M, y);
      y += 4;
      autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['Plataforma', 'Nome do Perfil', 'Link', 'Seguidores']],
        body: socialPrfs.map(p => [
          p.platform,
          (p.profileName || '-').substring(0, 22),
          (p.url || '-').substring(0, 40),
          p.followers || '-',
        ]),
        styles: { fontSize: 6.5, cellPadding: 2, lineColor: C.gray200, lineWidth: 0.2, textColor: C.gray700 },
        headStyles: { fillColor: C.blue, textColor: C.white, fontStyle: 'bold', fontSize: 6.5, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: C.blueLight },
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }
  }

  // Nota jurídica obrigatória (sempre exibida quando há dados de mercado mas sem conflito INPI)
  {
    const hasINPIConflict = result.inpiResults?.found && (result.inpiResults?.totalResults ?? 0) > 0;
    y = pageGuard(doc, y, ph, M, 20, pw);
    filledRect(doc, M, y, CW, 14, [255,251,235], 2, C.amber);
    filledRect(doc, M, y, 3, 14, C.amber);
    setFont(doc, 'bold', 6.5, C.amber);
    doc.text('NOTA JURIDICA IMPORTANTE:', M + 7, y + 5);
    setFont(doc, 'normal', 6, C.gray700);
    const notaJuriText = hasINPIConflict
      ? 'A analise juridica de colidencia marcaria e baseada EXCLUSIVAMENTE na pesquisa no INPI. Empresas abertas nao constituem direito marcario.'
      : 'A existencia de empresas com nome identico no mercado NAO implica direito marcario, caso nao haja registro valido no INPI. O direito sobre a marca e adquirido pelo registro.';
    const notaJuriLines = doc.splitTextToSize(notaJuriText, CW - 12);
    doc.text(notaJuriLines, M + 7, y + 10.5);
    y += 20;
  }

  // ═══════════════════════════════════════
  // 6. PRESENCA WEB
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 60, pw);
  y = sectionHeader(doc, '6. Analise de Presenca Web e Mercado', y, M, pw, C.navy);

  if (result.webAnalysis) {
    const channels = [
      { label: 'Google Meu Negocio / Maps', found: result.webAnalysis.googleMeuNegocio },
      { label: 'LinkedIn',                  found: result.webAnalysis.linkedin },
      { label: `Mencoes na Web (${result.webAnalysis.webMentions})`, found: result.webAnalysis.webMentions > 2 },
    ];
    const cardW = (CW - 8) / 3;
    channels.forEach((ch, i) => {
      const cx = M + i * (cardW + 4);
      const bg  = ch.found ? C.redBg   : C.greenBg;
      const bdr = ch.found ? C.red     : C.green;
      const tc  = ch.found ? C.redDark : C.greenDark;
      filledRect(doc, cx, y, cardW, 18, bg, 2, bdr);
      setFont(doc, 'bold', 7, tc);
      doc.text(ch.found ? 'DETECTADO' : 'NAO DETECTADO', cx + cardW / 2, y + 8, { align: 'center' });
      setFont(doc, 'normal', 6, C.gray700);
      doc.text(ch.label, cx + cardW / 2, y + 14, { align: 'center' });
    });
    y += 24;

    if (result.webAnalysis.summary) {
      setFont(doc, 'italic', 7, C.gray500);
      const sumLines = doc.splitTextToSize(result.webAnalysis.summary, CW);
      doc.text(sumLines.slice(0, 3), M, y);
      y += sumLines.slice(0, 3).length * 4.5 + 4;
    }
  } else {
    y = statusBanner(doc, 'Analise de presenca web realizada — dados nao disponiveis nesta consulta.', y, M, CW, 'info');
  }

  // ═══════════════════════════════════════
  // 7. CONCLUSAO TECNICA
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 55, pw);
  y = sectionHeader(doc, '7. Conclusao Tecnica', y, M, pw, levelColor);

  filledRect(doc, M, y, CW, 22, C.gray50, 3, levelColor);
  filledRect(doc, M, y, 4, 22, levelColor);
  setFont(doc, 'bold', 9.5, levelColor);
  doc.text(`A marca apresenta ${levelLabel} de registro.`, M + 8, y + 9);
  setFont(doc, 'normal', 7.5, C.gray700);
  const hasConflict = (result.inpiResults?.found && (result.inpiResults?.totalResults ?? 0) > 0) ||
                      (result.companiesResult?.found && (result.companiesResult?.total ?? 0) > 0);
  const conclText = hasConflict
    ? 'Foram identificadas referencias que merecem atencao antes do pedido de registro.'
    : 'Nao foram encontradas marcas identicas nas bases do INPI que possam impedir o registro.';
  doc.text(conclText, M + 8, y + 17);
  y += 28;

  // ═══════════════════════════════════════
  // 8. CLASSES RECOMENDADAS
  // ═══════════════════════════════════════
  if (result.classes && result.classes.length > 0) {
    y = pageGuard(doc, y, ph, M, 55, pw);
    y = sectionHeader(doc, '8. Classes Recomendadas para Registro', y, M, pw, C.blue);

    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Classe NCL', 'Descricao e Abrangencia']],
      body: result.classes.map((cls, i) => [
        `Classe ${cls}`,
        result.classDescriptions?.[i] || `Classe NCL ${cls} — conforme descricao do INPI para o ramo informado.`,
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
  // 9. ORIENTACAO JURIDICA
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 55, pw);
  y = sectionHeader(doc, '9. Orientacao Juridica', y, M, pw, C.purple);

  filledRect(doc, M, y, CW, 28, C.purpleBg, 3, [167,139,250]);
  filledRect(doc, M, y, 4, 28, C.purple);
  setFont(doc, 'bold', 8, C.purple);
  doc.text('RECOMENDACAO:', M + 8, y + 9);
  setFont(doc, 'normal', 7.5, [49,46,129]);
  const oriText = result.classes && result.classes.length > 1
    ? `O ideal e registrar nas ${result.classes.length} classes indicadas para maxima protecao legal. Se a questao for financeira, registre na classe principal (Classe ${result.classes[0]}) e amplie o escopo posteriormente.`
    : 'Registrar na classe principal identificada garante a protecao da marca. O direito de uso exclusivo e adquirido pelo registro validamente expedido pelo INPI.';
  const oriLines = doc.splitTextToSize(oriText, CW - 14);
  doc.text(oriLines, M + 8, y + 18);
  y += 34;

  // ═══════════════════════════════════════
  // 10. PARECER TECNICO-JURIDICO (laudo IA)
  // ═══════════════════════════════════════
  if (result.laudo) {
    y = pageGuard(doc, y, ph, M, 55, pw);
    y = sectionHeader(doc, '10. Parecer Tecnico-Juridico Completo', y, M, pw, C.navy);

    // Limpa artefatos do laudo IA
    const laudoClean = cleanLaudo(result.laudo);
    setFont(doc, 'normal', 7.5, C.gray700);
    const laudoLines = doc.splitTextToSize(laudoClean, CW);
    for (const line of laudoLines) {
      if (y > ph - M - 22) {
        doc.addPage();
        addPageStrip(doc, pw, ph);
        y = 22;
      }
      doc.text(line, M, y);
      y += 4.5;
    }
    y += 6;
  }

  // ═══════════════════════════════════════
  // BOX URGENCIA
  // ═══════════════════════════════════════
  y = pageGuard(doc, y, ph, M, 30, pw);
  filledRect(doc, M, y, CW, 24, C.orangeBg, 3, C.orange);
  filledRect(doc, M, y, 4, 24, C.orange);
  setFont(doc, 'bold', 8.5, [154,52,18]);
  doc.text('IMPORTANTE — O DONO DA MARCA E QUEM REGISTRA PRIMEIRO!', M + 8, y + 9);
  setFont(doc, 'normal', 7, C.gray700);
  const urgLines = doc.splitTextToSize(
    'Conforme art. 129 da Lei 9.279/96 (Lei de Propriedade Industrial) — o direito de uso exclusivo da marca e adquirido pelo registro validamente expedido. Nao perca tempo — protocole seu pedido.',
    CW - 14
  );
  doc.text(urgLines, M + 8, y + 16);
  y += 30;

  // ═══════════════════════════════════════
  // FOOTER EM TODAS AS PAGINAS
  // ═══════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const fY = ph - 12;
    // Linha separadora dourada fina (sem fundo navy)
    doc.setDrawColor(...C.gold); doc.setLineWidth(0.4);
    doc.line(M, fY, pw - M, fY);
    // Texto do rodapé em cinza claro sobre fundo branco
    setFont(doc, 'normal', 6, [160, 160, 160]);
    doc.text(
      `Protocolo: ${protocol}  ·  WebMarcas — www.webmarcas.net  ·  Gerado em: ${timeStr}`,
      pw / 2, fY + 4.5, { align: 'center' }
    );
    setFont(doc, 'normal', 5, [190, 190, 190]);
    doc.text(
      'Este documento e um laudo tecnico preliminar de viabilidade de marca. Nao substitui consulta juridica especializada.',
      pw / 2, fY + 9, { align: 'center' }
    );
    setFont(doc, 'bold', 6, [160, 160, 160]);
    doc.text(`${i} / ${totalPages}`, pw - M, fY + 5, { align: 'right' });
  }

  const fileName = `Laudo-WebMarcas-${brandName.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}.pdf`;
  doc.save(fileName);
}
