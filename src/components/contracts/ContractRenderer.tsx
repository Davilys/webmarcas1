import { useMemo } from 'react';
import webmarcasLogo from '@/assets/webmarcas-logo-new.png';
import { CheckCircle } from 'lucide-react';

export interface BlockchainSignature {
  hash?: string;
  timestamp?: string;
  txId?: string;
  network?: string;
  ipAddress?: string;
}

interface ContractRendererProps {
  content: string;
  showLetterhead?: boolean;
  className?: string;
  blockchainSignature?: BlockchainSignature;
  showCertificationSection?: boolean;
}

export function ContractRenderer({ 
  content, 
  showLetterhead = true, 
  className = '',
  blockchainSignature,
  showCertificationSection = false
}: ContractRendererProps) {
  const renderedContent = useMemo(() => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        elements.push(<div key={index} className="h-3" />);
        return;
      }

      // Skip the main title as it's in the letterhead now
      if (trimmedLine.includes('CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS')) {
        return;
      }

      // Clause titles - BLUE color as per design
      if (/^\d+\.\s*CLÁUSULA/.test(trimmedLine)) {
        elements.push(
          <h2 key={index} className="font-bold text-sm mt-6 mb-2" style={{ color: '#0284c7' }}>
            {trimmedLine}
          </h2>
        );
        return;
      }

      // Sub-items (like 1.1, 2.1, etc.)
      if (/^\d+\.\d+\s/.test(trimmedLine)) {
        elements.push(
          <p key={index} className="text-sm mb-2 pl-4 text-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // List items with letters (a), b), etc.)
      if (/^[a-z]\)/.test(trimmedLine)) {
        elements.push(
          <p key={index} className="text-sm mb-1 pl-8 text-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Bullet points
      if (trimmedLine.startsWith('•')) {
        elements.push(
          <p key={index} className="text-sm mb-2 pl-4 text-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Roman numerals (I), II))
      if (/^I+\)/.test(trimmedLine)) {
        elements.push(
          <p key={index} className="text-sm mb-3 font-medium text-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Skip signature lines - electronic contracts don't use manual signature lines
      if (trimmedLine.match(/^_+$/)) {
        return; // Don't render manual signature lines (______)
      }

      // Party identification headers (CONTRATADA:, CONTRATANTE:)
      if (trimmedLine === 'CONTRATADA:' || trimmedLine === 'CONTRATANTE:') {
        elements.push(
          <p key={index} className="text-xs font-bold text-center text-foreground mt-6 mb-1">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Company name and identification details (after party headers)
      if (trimmedLine.includes('WEB MARCAS PATENTES EIRELI') || 
          trimmedLine.startsWith('CNPJ:') || 
          trimmedLine.startsWith('CPF:') ||
          trimmedLine.startsWith('CPF/CNPJ:')) {
        elements.push(
          <p key={index} className="text-xs text-center text-muted-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Date line
      if (trimmedLine.startsWith('São Paulo,')) {
        elements.push(
          <p key={index} className="text-sm mt-6 mb-6 text-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Regular paragraphs
      elements.push(
        <p key={index} className="text-sm mb-3 text-foreground leading-relaxed">
          {trimmedLine}
        </p>
      );
    });

    return elements;
  }, [content]);

  return (
    <div className={`bg-white text-foreground ${className}`}>
      {showLetterhead && (
        <>
          {/* Header with Logo and URL */}
          <div className="flex items-center justify-between pb-3">
            <img 
              src={webmarcasLogo} 
              alt="WebMarcas" 
              className="h-12 object-contain"
            />
            <span className="text-sm font-medium" style={{ color: '#0284c7' }}>
              www.webmarcas.net
            </span>
          </div>
          
          {/* Orange/Yellow Gradient Bar */}
          <div 
            className="h-2 w-full rounded-sm mb-6"
            style={{ background: 'linear-gradient(90deg, #f97316, #fbbf24)' }}
          />
          
          {/* Blue Title */}
          <h1 
            className="text-center text-xl font-bold mb-4"
            style={{ color: '#0284c7' }}
          >
            Acordo do Contrato - Anexo I
          </h1>
          
          {/* Dark Blue Box with Contract Title */}
          <div 
            className="text-center py-3 px-4 rounded mb-4"
            style={{ backgroundColor: '#1e3a5f' }}
          >
            <p className="text-white font-semibold text-sm leading-tight">
              CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORAMENTO<br />
              PARA REGISTRO DE MARCA JUNTO AO INPI
            </p>
          </div>
          
          {/* Yellow Highlight Section */}
          <div 
            className="p-4 rounded mb-6 text-sm"
            style={{ 
              backgroundColor: '#fef3c7', 
              border: '1px solid #f59e0b' 
            }}
          >
            <p className="mb-2">
              Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.
            </p>
            <p>
              Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.
            </p>
          </div>
        </>
      )}
      
      <div className="contract-content">
        {renderedContent}
      </div>

      {/* Digital Certification Section - only shown when contract is SIGNED with blockchain data */}
      {blockchainSignature?.hash && (
        <div className="mt-8 print:mt-4">
          {/* Footer text before certification */}
          <div className="text-center py-4 text-xs text-muted-foreground border-t border-border">
            <p>Contrato gerado e assinado eletronicamente pelo sistema WebMarcas</p>
            <p>www.webmarcas.net | contato@webmarcas.net</p>
            <p>Data e hora da geração: {new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          {/* Blue divider line */}
          <div className="h-1 w-full bg-primary my-4" />
          
          {/* Certification Box */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
            {/* Header with checkmark */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-primary">
                CERTIFICAÇÃO DIGITAL E VALIDADE JURÍDICA
              </h3>
            </div>
            
            {/* Content Grid - Signature Data + QR Code */}
            <div className="flex gap-6 items-start">
              {/* Left: Signature Data */}
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-1">HASH SHA-256</p>
                  <div className="bg-white p-3 rounded border border-slate-200 font-mono text-xs break-all text-foreground">
                    {blockchainSignature.hash}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-1">DATA/HORA DA ASSINATURA</p>
                  <p className="text-sm text-foreground">
                    {blockchainSignature.timestamp || '-'}
                  </p>
                </div>
                
                {blockchainSignature.txId && (
                  <div>
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-1">ID DA TRANSAÇÃO</p>
                    <p className="text-sm font-mono text-foreground break-all">
                      {blockchainSignature.txId}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-1">REDE BLOCKCHAIN</p>
                  <p className="text-sm text-foreground">
                    {blockchainSignature.network || 'Bitcoin (OpenTimestamps via a.pool.opentimestamps.org)'}
                  </p>
                </div>
                
                {blockchainSignature.ipAddress && (
                  <div>
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-1">IP DO SIGNATÁRIO</p>
                    <p className="text-sm text-foreground">
                      {blockchainSignature.ipAddress}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Right: QR Code */}
              <div className="flex-shrink-0 text-center p-4 bg-white rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">QR CODE DE VERIFICAÇÃO</p>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${window.location.origin}/verificar-contrato?hash=${blockchainSignature.hash}`)}`}
                  alt="QR Code de Verificação"
                  className="w-32 h-32 mx-auto"
                />
                <p className="text-[10px] text-muted-foreground mt-2">Escaneie para verificar</p>
              </div>
            </div>
            
            {/* Legal footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <p className="text-xs text-muted-foreground italic">
                Este documento foi assinado eletronicamente e possui validade jurídica conforme Lei 14.063/2020 e MP 2.200-2/2001.
              </p>
              <p className="text-xs text-primary mt-2">
                Verifique a autenticidade em: {window.location.origin}/verificar-contrato
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Embedded WebMarcas logo as base64 for offline HTML rendering
// This ensures the logo displays correctly when the HTML is downloaded and opened locally
const WEBMARCAS_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAATgAAABQCAYAAACRM9k9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFzGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgOS4xLWMwMDIgNzkuYTZhNjM5NiwgMjAyNC8wMy8xMi0wNzozNToyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI1LjcgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wMS0wOFQxMDozNjoxMy0wMzowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDEtMDhUMTA6Mzg6MTEtMDM6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDEtMDhUMTA6Mzg6MTEtMDM6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjIwM2VjYmI0LTg2M2YtYjI0NC1iZjcxLTc5NjQzZmNjM2Q4ZiIgeG1wTU06RG9jdW1lbnRJRD0i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';

// Helper function to convert imported logo to base64 (for dynamic updates)
const getLogoBase64 = async (): Promise<string> => {
  try {
    // First try to use the imported logo
    const response = await fetch(webmarcasLogo);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    // Fallback to embedded base64
    return WEBMARCAS_LOGO_BASE64;
  }
};

// Generate full HTML for printing/download with the exact letterhead design
export function generateContractPrintHTML(
  content: string,
  brandName: string,
  clientName: string,
  clientCpf: string,
  blockchainSignature?: BlockchainSignature,
  showCertificationSection: boolean = true
): string {
  // Convert plain text to HTML with proper formatting
  const htmlContent = content
    .split('\n')
    .filter(line => !line.includes('CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS'))
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<div style="height: 12px;"></div>';
      
      // Clause titles in BLUE
      if (/^\d+\.\s*CLÁUSULA/.test(trimmed)) {
        return `<h2 style="font-weight: bold; font-size: 12px; color: #0284c7; margin-top: 20px; margin-bottom: 8px;">${trimmed}</h2>`;
      }
      
      if (/^\d+\.\d+\s/.test(trimmed)) {
        return `<p style="font-size: 11px; margin-bottom: 8px; padding-left: 16px;">${trimmed}</p>`;
      }
      
      if (/^[a-z]\)/.test(trimmed)) {
        return `<p style="font-size: 11px; margin-bottom: 4px; padding-left: 32px;">${trimmed}</p>`;
      }
      
      if (trimmed.startsWith('•')) {
        return `<p style="font-size: 11px; margin-bottom: 8px; padding-left: 16px;">${trimmed}</p>`;
      }
      
      if (/^I+\)/.test(trimmed)) {
        return `<p style="font-size: 11px; margin-bottom: 12px; font-weight: 500;">${trimmed}</p>`;
      }
      
        // Skip manual signature lines - electronic contracts don't use them
        if (trimmed.match(/^_+$/)) {
          return ''; // Don't render manual signature lines
        }
        
        // Party identification headers
        if (trimmed === 'CONTRATADA:' || trimmed === 'CONTRATANTE:') {
          return `<p style="font-size: 11px; font-weight: bold; text-align: center; margin-top: 24px; margin-bottom: 4px;">${trimmed}</p>`;
        }
        
        if (trimmed.includes('WEB MARCAS PATENTES EIRELI') || 
            trimmed.startsWith('CNPJ:') || 
            trimmed.startsWith('CPF:') ||
            trimmed.startsWith('CPF/CNPJ:')) {
          return `<p style="font-size: 10px; text-align: center; color: #6b7280; margin-bottom: 4px;">${trimmed}</p>`;
        }
        
        if (trimmed.startsWith('São Paulo,')) {
          return `<p style="font-size: 11px; margin-top: 24px; margin-bottom: 24px;">${trimmed}</p>`;
        }
        
        return `<p style="font-size: 11px; margin-bottom: 12px; line-height: 1.6;">${trimmed}</p>`;
    })
    .join('\n');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato WebMarcas - ${brandName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #1a1a2e; 
      background: white; 
      padding: 30px; 
      font-size: 11px; 
      max-width: 800px;
      margin: 0 auto;
    }
    .header { 
      display: flex; 
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
    }
    .header-logo {
      height: 48px;
    }
    .header-url {
      color: #0284c7;
      font-weight: 500;
      font-size: 14px;
    }
    .gradient-bar {
      height: 8px;
      background: linear-gradient(90deg, #f97316, #fbbf24);
      border-radius: 2px;
      margin-bottom: 20px;
    }
    .main-title {
      text-align: center;
      color: #0284c7;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 16px;
    }
    .contract-title-box {
      background-color: #1e3a5f;
      color: white;
      text-align: center;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    .contract-title-box p {
      font-weight: 600;
      font-size: 12px;
      line-height: 1.4;
    }
    .highlight-box { 
      background: #fef3c7; 
      padding: 16px; 
      border-radius: 4px; 
      margin-bottom: 24px; 
      border: 1px solid #f59e0b; 
      font-size: 11px;
      line-height: 1.5;
    }
    .highlight-box p {
      margin-bottom: 8px;
    }
    .highlight-box p:last-child {
      margin-bottom: 0;
    }
    .content {
      margin-top: 16px;
    }
    .footer { 
      margin-top: 40px; 
      text-align: center; 
      color: #6b7280; 
      font-size: 9px; 
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
    }
    @media print { 
      body { padding: 0; } 
    }
  </style>
</head>
<body>
  <!-- Header with Logo and URL -->
  <div class="header">
    <img src="${WEBMARCAS_LOGO_BASE64}" alt="WebMarcas" class="header-logo" />
    <span class="header-url">www.webmarcas.net</span>
  </div>
  
  <!-- Orange/Yellow Gradient Bar -->
  <div class="gradient-bar"></div>
  
  <!-- Blue Title -->
  <h1 class="main-title">Acordo do Contrato - Anexo I</h1>
  
  <!-- Dark Blue Box with Contract Title -->
  <div class="contract-title-box">
    <p>CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORAMENTO<br/>PARA REGISTRO DE MARCA JUNTO AO INPI</p>
  </div>
  
  <!-- Yellow Highlight Section -->
  <div class="highlight-box">
    <p>Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.</p>
    <p>Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.</p>
  </div>
  
  <div class="content">
    ${htmlContent}
  </div>
  
  ${blockchainSignature?.hash ? `
  <!-- Digital Certification Section - ONLY shown when signed -->
  <div style="margin-top: 32px;">
    <!-- Footer before certification -->
    <div style="text-align: center; padding: 16px 0; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280;">
      <p>Contrato gerado e assinado eletronicamente pelo sistema WebMarcas</p>
      <p>www.webmarcas.net | contato@webmarcas.net</p>
      <p>Data e hora da geração: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
    
    <!-- Blue divider line -->
    <div style="height: 4px; background: #0284c7; margin: 16px 0;"></div>
    
    <!-- Certification Box -->
    <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
      <!-- Header with checkmark -->
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
        <div style="width: 32px; height: 32px; background: #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <h3 style="font-size: 20px; font-weight: bold; color: #0284c7; margin: 0;">CERTIFICAÇÃO DIGITAL E VALIDADE JURÍDICA</h3>
      </div>
      
      <!-- Content Grid - Signature Data + QR Code -->
      <div style="display: flex; gap: 24px; align-items: flex-start;">
        <!-- Left: Signature Data -->
        <div style="flex: 1;">
          <div style="margin-bottom: 16px;">
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; margin-bottom: 6px;">HASH SHA-256</p>
            <div style="background: white; padding: 12px; border-radius: 4px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 11px; word-break: break-all; color: #1e293b;">
              ${blockchainSignature.hash}
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; margin-bottom: 6px;">DATA/HORA DA ASSINATURA</p>
            <p style="font-size: 13px; color: #1e293b;">${blockchainSignature.timestamp || '-'}</p>
          </div>
          
          ${blockchainSignature.txId ? `
          <div style="margin-bottom: 16px;">
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; margin-bottom: 6px;">ID DA TRANSAÇÃO</p>
            <p style="font-size: 13px; font-family: monospace; color: #1e293b; word-break: break-all;">${blockchainSignature.txId}</p>
          </div>
          ` : ''}
          
          <div style="margin-bottom: 16px;">
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; margin-bottom: 6px;">REDE BLOCKCHAIN</p>
            <p style="font-size: 13px; color: #1e293b;">${blockchainSignature.network || 'Bitcoin (OpenTimestamps via a.pool.opentimestamps.org)'}</p>
          </div>
          
          ${blockchainSignature.ipAddress ? `
          <div>
            <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; margin-bottom: 6px;">IP DO SIGNATÁRIO</p>
            <p style="font-size: 13px; color: #1e293b;">${blockchainSignature.ipAddress}</p>
          </div>
          ` : ''}
        </div>
        
        <!-- Right: QR Code -->
        <div style="flex-shrink: 0; text-align: center; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #1e293b; margin-bottom: 12px;">QR CODE DE VERIFICAÇÃO</p>
          <img 
            src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${window.location.origin}/verificar-contrato?hash=${blockchainSignature.hash}`)}" 
            alt="QR Code de Verificação"
            style="width: 140px; height: 140px;"
          />
          <p style="font-size: 10px; color: #64748b; margin-top: 8px;">Escaneie para verificar</p>
        </div>
      </div>
      
      <!-- Legal footer -->
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="font-size: 11px; color: #64748b; font-style: italic;">
          Este documento foi assinado eletronicamente e possui validade jurídica conforme Lei 14.063/2020 e MP 2.200-2/2001.
        </p>
        <p style="font-size: 11px; color: #0284c7; margin-top: 8px;">
          Verifique a autenticidade em: ${window.location.origin}/verificar-contrato
        </p>
      </div>
    </div>
  </div>
  ` : `
  <!-- Footer for unsigned contracts -->
  <div class="footer">
    <p>Contrato gerado e assinado eletronicamente pelo sistema WebMarcas</p>
    <p>www.webmarcas.net | contato@webmarcas.net</p>
    <p>Data e hora da geração: ${new Date().toLocaleString('pt-BR')}</p>
  </div>
  `}
</body>
</html>`;
}

export default ContractRenderer;
