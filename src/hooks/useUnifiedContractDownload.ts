import webmarcasLogo from '@/assets/webmarcas-logo-new.png';

export interface BlockchainSignature {
  hash: string;
  timestamp: string;
  txId: string;
  network: string;
  ipAddress: string;
}

export interface UnifiedContractDownloadOptions {
  content: string;
  documentType: 'contract' | 'procuracao' | 'distrato_multa' | 'distrato_sem_multa';
  subject: string;
  signatoryName?: string;
  signatoryCpf?: string;
  signatoryCnpj?: string;
  clientSignature?: string | null;
  blockchainSignature?: BlockchainSignature;
}

/**
 * Converts the imported logo to base64 for embedding in HTML
 */
async function getLogoBase64(): Promise<string> {
  try {
    const response = await fetch(webmarcasLogo);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result && result.startsWith('data:')) {
          resolve(result);
        } else {
          reject(new Error('Invalid base64 result'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load logo:', error);
    // Fallback placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNTAiPjxyZWN0IGZpbGw9IiMxZTNhNWYiIHdpZHRoPSIyMDAiIGhlaWdodD0iNTAiLz48dGV4dCB4PSIxMCIgeT0iMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmYiPldlYk1hcmNhczwvdGV4dD48L3N2Zz4=';
  }
}

/**
 * Generates HTML that renders the contract content with proper formatting.
 * Uses the same formatting rules as ContractRenderer but generates pure HTML.
 */
function generateContractHTML(
  content: string,
  logoBase64: string,
  blockchainSignature?: BlockchainSignature
): string {
  // Format content with proper styling - matching ContractRenderer component exactly
  const formatContent = (text: string): string => {
    const lines = text.split('\n');
    return lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<div style="height: 12px;"></div>';
      
      // Clause titles - BLUE color as per design
      if (/^\d+\.\s*CLÁUSULA/.test(trimmed)) {
        return `<h2 style="font-weight: bold; font-size: 12px; color: #0284c7; margin-top: 20px; margin-bottom: 8px;">${trimmed}</h2>`;
      }
      
      // Sub-items (like 1.1, 2.1, etc.)
      if (/^\d+\.\d+\s/.test(trimmed)) {
        return `<p style="font-size: 11px; color: #1f2937; margin-bottom: 8px; padding-left: 16px;">${trimmed}</p>`;
      }
      
      // List items with letters (a), b), etc.)
      if (/^[a-z]\)/.test(trimmed)) {
        return `<p style="font-size: 11px; color: #1f2937; margin-bottom: 4px; padding-left: 32px;">${trimmed}</p>`;
      }
      
      // Bullet points
      if (trimmed.startsWith('•')) {
        return `<p style="font-size: 11px; color: #1f2937; margin-bottom: 8px; padding-left: 16px;">${trimmed}</p>`;
      }
      
      // Roman numerals (I), II))
      if (/^I+\)/.test(trimmed)) {
        return `<p style="font-size: 11px; color: #1f2937; margin-bottom: 12px; font-weight: 500;">${trimmed}</p>`;
      }
      
      // Skip manual signature lines
      if (trimmed.match(/^_+$/)) {
        return '';
      }
      
      // Party identification headers
      if (trimmed === 'CONTRATADA:' || trimmed === 'CONTRATANTE:') {
        return `<p style="font-size: 11px; font-weight: bold; text-align: center; color: #1f2937; margin-top: 24px; margin-bottom: 4px;">${trimmed}</p>`;
      }
      
      // Company/client details
      if (trimmed.includes('WEB MARCAS PATENTES EIRELI') || 
          trimmed.startsWith('CNPJ:') || 
          trimmed.startsWith('CPF:') ||
          trimmed.startsWith('CPF/CNPJ:')) {
        return `<p style="font-size: 10px; text-align: center; color: #6b7280; margin-bottom: 4px;">${trimmed}</p>`;
      }
      
      // Date line
      if (trimmed.startsWith('São Paulo,')) {
        return `<p style="font-size: 11px; color: #1f2937; margin-top: 24px; margin-bottom: 24px;">${trimmed}</p>`;
      }
      
      // Regular paragraphs
      return `<p style="font-size: 11px; color: #1f2937; margin-bottom: 12px; line-height: 1.6;">${trimmed}</p>`;
    }).join('\n');
  };

  // Build certification section if blockchain data exists
  let certificationSection = '';
  if (blockchainSignature?.hash) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${window.location.origin}/verificar-contrato?hash=${blockchainSignature.hash}`)}`;
    
    certificationSection = `
      <div style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; color: #6b7280; font-size: 9px;">
        <p>Contrato gerado e assinado eletronicamente pelo sistema WebMarcas</p>
        <p>www.webmarcas.net | contato@webmarcas.net</p>
        <p>Data e hora da geração: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
      
      <div style="height: 4px; width: 100%; background: #0284c7; margin: 16px 0;"></div>
      
      <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <div style="width: 32px; height: 32px; background: #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 20px; height: 20px; color: white;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 style="font-size: 18px; font-weight: bold; color: #0284c7; margin: 0;">CERTIFICAÇÃO DIGITAL E VALIDADE JURÍDICA</h3>
        </div>
        
        <div style="display: flex; gap: 24px; align-items: flex-start;">
          <div style="flex: 1;">
            <div style="margin-bottom: 16px;">
              <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1f2937; margin-bottom: 4px;">HASH SHA-256</p>
              <div style="background: white; padding: 12px; border-radius: 4px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 10px; word-break: break-all; color: #1f2937;">
                ${blockchainSignature.hash}
              </div>
            </div>
            
            <div style="margin-bottom: 16px;">
              <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1f2937; margin-bottom: 4px;">DATA/HORA DA ASSINATURA</p>
              <p style="font-size: 11px; color: #1f2937; margin: 0;">${blockchainSignature.timestamp || '-'}</p>
            </div>
            
            ${blockchainSignature.txId ? `
            <div style="margin-bottom: 16px;">
              <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1f2937; margin-bottom: 4px;">ID DA TRANSAÇÃO</p>
              <p style="font-size: 11px; font-family: monospace; word-break: break-all; color: #1f2937; margin: 0;">${blockchainSignature.txId}</p>
            </div>
            ` : ''}
            
            <div style="margin-bottom: 16px;">
              <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1f2937; margin-bottom: 4px;">REDE BLOCKCHAIN</p>
              <p style="font-size: 11px; color: #1f2937; margin: 0;">${blockchainSignature.network || 'Bitcoin (OpenTimestamps via a.pool.opentimestamps.org)'}</p>
            </div>
            
            ${blockchainSignature.ipAddress ? `
            <div>
              <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1f2937; margin-bottom: 4px;">IP DO SIGNATÁRIO</p>
              <p style="font-size: 11px; color: #1f2937; margin: 0;">${blockchainSignature.ipAddress}</p>
            </div>
            ` : ''}
          </div>
          
          <div style="flex-shrink: 0; text-align: center; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1f2937; margin-bottom: 12px;">QR CODE DE VERIFICAÇÃO</p>
            <img src="${qrUrl}" alt="QR Code" style="width: 128px; height: 128px;" />
            <p style="font-size: 9px; color: #6b7280; margin-top: 8px;">Escaneie para verificar</p>
          </div>
        </div>
        
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="font-size: 10px; font-style: italic; color: #6b7280; margin: 0;">
            Este documento foi assinado eletronicamente e possui validade jurídica conforme Lei 14.063/2020 e MP 2.200-2/2001.
          </p>
          <p style="font-size: 10px; color: #0284c7; margin-top: 8px;">${window.location.origin}/verificar-contrato</p>
        </div>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato WebMarcas</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      background: white; 
      padding: 30px; 
      font-size: 11px; 
      max-width: 800px;
      margin: 0 auto;
    }
    @media print { 
      body { padding: 0; } 
    }
  </style>
</head>
<body>
  <!-- Header with Logo and URL -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px;">
    <img src="${logoBase64}" alt="WebMarcas" style="height: 48px; object-fit: contain;" />
    <span style="color: #0284c7; font-weight: 500; font-size: 14px;">www.webmarcas.net</span>
  </div>
  
  <!-- Orange/Yellow Gradient Bar -->
  <div style="height: 8px; background: linear-gradient(90deg, #f97316, #fbbf24); border-radius: 2px; margin-bottom: 24px;"></div>
  
  <!-- Contract Content (from template) -->
  <div style="margin-top: 16px;">
    ${formatContent(content)}
  </div>
  
  ${certificationSection}
</body>
</html>
`;
}

/**
 * Generates a PDF from contract HTML using the same method as the admin panel.
 * Uses html2canvas + jsPDF for consistent formatting.
 */
export async function downloadUnifiedContractPDF(options: UnifiedContractDownloadOptions): Promise<void> {
  const {
    content,
    subject,
    blockchainSignature,
  } = options;

  // Dynamic imports
  const [html2canvasModule, jspdfModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);
  const html2canvas = html2canvasModule.default;
  const { jsPDF } = jspdfModule;

  // Get logo as base64
  const logoBase64 = await getLogoBase64();

  // Generate HTML matching ContractRenderer
  const printHtml = generateContractHTML(content, logoBase64, blockchainSignature);

  // Create temporary container
  const container = document.createElement('div');
  container.innerHTML = printHtml;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.background = 'white';
  document.body.appendChild(container);

  try {
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Capture with html2canvas
    const canvas = await html2canvas(container, { 
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
    });
    
    // Generate paginated PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download
    const filename = subject || 'contrato';
    pdf.save(`${filename.replace(/[^a-zA-Z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s-]/g, '')}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Opens a print preview window with the contract content.
 */
export async function printUnifiedContract(options: UnifiedContractDownloadOptions): Promise<void> {
  const {
    content,
    blockchainSignature,
  } = options;

  const logoBase64 = await getLogoBase64();
  const printHtml = generateContractHTML(content, logoBase64, blockchainSignature);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Não foi possível abrir a janela de impressão.');
  }

  printWindow.document.write(printHtml);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}
