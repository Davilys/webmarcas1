import { useMemo } from 'react';
import webmarcasLogo from '@/assets/webmarcas-logo-new.png';
import { Shield, CheckCircle, Lock, Hash, Globe, Clock, AlertCircle } from 'lucide-react';

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

      {/* Digital Certification Section - shown when contract is signed or preview requested */}
      {(showCertificationSection || blockchainSignature?.hash) && (
        <div className="mt-8 p-6 bg-sky-50 border border-sky-200 rounded-lg print:bg-sky-50 print:border-sky-200">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-sky-100 rounded-full">
              <Shield className="h-6 w-6 text-sky-600" />
            </div>
            <h3 className="text-lg font-bold text-sky-800">
              CERTIFICAÇÃO DIGITAL E VALIDADE JURÍDICA
            </h3>
          </div>

          {/* Legal Text */}
          <p className="text-sm text-sky-700 mb-4 leading-relaxed">
            Este contrato foi assinado eletronicamente e possui validade jurídica, conforme a 
            legislação brasileira vigente, incluindo a Lei nº 14.063/2020 e a Medida Provisória 
            nº 2.200-2/2001.
          </p>

          <p className="text-sm text-sky-700 mb-3 font-medium">
            O documento conta com as seguintes camadas de segurança:
          </p>

          <ul className="text-sm text-sky-700 space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <Hash className="w-4 h-4 mt-0.5 flex-shrink-0 text-sky-500" />
              <span><strong>Hash SHA-256</strong> – Garante a integridade do conteúdo do contrato.</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-sky-500" />
              <span><strong>Registro em Blockchain</strong> – Prova imutável de existência e data (OpenTimestamps).</span>
            </li>
            <li className="flex items-start gap-2">
              <Globe className="w-4 h-4 mt-0.5 flex-shrink-0 text-sky-500" />
              <span><strong>Rastreamento de IP</strong> – Identificação do dispositivo que realizou a assinatura.</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-sky-500" />
              <span><strong>Timestamp</strong> – Data e hora exatas da assinatura sincronizadas via NTP.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-sky-500" />
              <span><strong>Prova criptográfica</strong> – Arquivo de verificação auditável externamente.</span>
            </li>
          </ul>

          {/* Signature Data Box with QR Code - only shown when actually signed */}
          {blockchainSignature?.hash ? (
            <div className="mt-4 flex gap-4 items-stretch">
              {/* Signature Data */}
              <div className="flex-1 p-4 bg-white border border-green-300 rounded-md shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-800">DADOS DA ASSINATURA ELETRÔNICA</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2 text-xs font-mono text-green-900 bg-green-50 p-3 rounded">
                  <div className="flex flex-wrap items-start gap-1">
                    <span className="font-bold whitespace-nowrap">Hash SHA-256:</span>
                    <span className="break-all text-[10px]">{blockchainSignature.hash}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Data/Hora:</span>
                    <span>{blockchainSignature.timestamp ? new Date(blockchainSignature.timestamp).toLocaleString('pt-BR') : '-'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Endereço IP:</span>
                    <span>{blockchainSignature.ipAddress || '-'}</span>
                  </div>
                  {blockchainSignature.txId && (
                    <div className="flex items-start gap-1">
                      <span className="font-bold whitespace-nowrap">ID da Transação:</span>
                      <span className="break-all">{blockchainSignature.txId}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Rede:</span>
                    <span>{blockchainSignature.network || 'Bitcoin (OpenTimestamps)'}</span>
                  </div>
                </div>
              </div>
              
              {/* QR Code */}
              <div className="flex-shrink-0 p-3 bg-white border border-green-300 rounded-md shadow-sm text-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/verificar-contrato?hash=${blockchainSignature.hash}`)}`}
                  alt="QR Code de Verificação"
                  className="w-24 h-24 mx-auto"
                />
                <p className="text-[9px] text-green-700 mt-2 font-medium">Escaneie para verificar</p>
                <p className="text-[8px] text-green-600">a autenticidade</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Aguardando assinatura eletrônica</span>
              </div>
              <p className="text-xs text-amber-600 mt-1">
                Após a assinatura, os dados criptográficos serão exibidos aqui.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-sky-200 text-center">
            <p className="text-xs text-sky-600 font-medium">
              Contrato gerado e assinado eletronicamente pelo sistema WebMarcas
            </p>
            <p className="text-xs text-sky-500 mt-1">
              www.webmarcas.net | contato@webmarcas.net
            </p>
            {blockchainSignature?.timestamp && (
              <p className="text-xs text-sky-600 mt-2 font-medium">
                Data e hora da assinatura: {new Date(blockchainSignature.timestamp).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Base64 logo for PDF generation (will be loaded dynamically)
const getLogoBase64 = async (): Promise<string> => {
  try {
    const response = await fetch('/src/assets/webmarcas-logo-new.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
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
    <svg width="180" height="48" viewBox="0 0 180 48" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="8" width="32" height="32" rx="6" fill="#0284c7"/>
      <text x="16" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">W</text>
      <text x="44" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#0284c7">Web</text>
      <text x="76" y="28" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#f97316">Marcas</text>
    </svg>
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
  
  ${showCertificationSection ? `
  <!-- Digital Certification Section -->
  <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #bfdbfe;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
      <h3 style="font-weight: bold; font-size: 14px; color: #0284c7; margin: 0;">CERTIFICAÇÃO DIGITAL E VALIDADE JURÍDICA</h3>
    </div>
    
    <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
      <p style="font-size: 11px; color: #0369a1; margin-bottom: 16px; line-height: 1.6;">
        Este contrato foi assinado eletronicamente e possui validade jurídica, conforme a 
        legislação brasileira vigente, incluindo a Lei nº 14.063/2020 e a Medida Provisória 
        nº 2.200-2/2001.
      </p>
      
      <p style="font-size: 11px; color: #0369a1; font-weight: 600; margin-bottom: 12px;">
        O documento conta com as seguintes camadas de segurança:
      </p>
      
      <div style="font-size: 10px; color: #0369a1; margin-bottom: 8px;">✦ <strong>Hash SHA-256</strong> – Garante a integridade do conteúdo do contrato.</div>
      <div style="font-size: 10px; color: #0369a1; margin-bottom: 8px;">🔗 <strong>Registro em Blockchain</strong> – Prova imutável de existência e data (OpenTimestamps).</div>
      <div style="font-size: 10px; color: #0369a1; margin-bottom: 8px;">📍 <strong>Rastreamento de IP</strong> – Identificação do dispositivo que realizou a assinatura.</div>
      <div style="font-size: 10px; color: #0369a1; margin-bottom: 8px;">🕐 <strong>Timestamp</strong> – Data e hora exatas da assinatura sincronizadas via NTP.</div>
      <div style="font-size: 10px; color: #0369a1; margin-bottom: 8px;">🔒 <strong>Prova criptográfica</strong> – Arquivo de verificação auditável externamente.</div>
    </div>
    
    ${blockchainSignature?.hash ? `
    <div style="display: flex; gap: 16px; align-items: flex-start;">
      <!-- Signature Data -->
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 16px; font-size: 10px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span style="font-weight: bold; color: #166534;">DADOS DA ASSINATURA ELETRÔNICA</span>
        </div>
        
        <div style="font-family: monospace; color: #166534; background: #dcfce7; padding: 12px; border-radius: 4px;">
          <div style="margin-bottom: 6px;"><strong>Hash SHA-256:</strong> <span style="font-size: 9px; word-break: break-all;">${blockchainSignature.hash}</span></div>
          <div style="margin-bottom: 6px;"><strong>Data/Hora:</strong> ${blockchainSignature.timestamp ? new Date(blockchainSignature.timestamp).toLocaleString('pt-BR') : '-'}</div>
          <div style="margin-bottom: 6px;"><strong>Endereço IP:</strong> ${blockchainSignature.ipAddress || '-'}</div>
          ${blockchainSignature.txId ? `<div style="margin-bottom: 6px;"><strong>ID da Transação:</strong> ${blockchainSignature.txId}</div>` : ''}
          <div><strong>Rede:</strong> ${blockchainSignature.network || 'Bitcoin (OpenTimestamps)'}</div>
        </div>
      </div>
      
      <!-- QR Code -->
      <div style="text-align: center; background: white; border: 1px solid #86efac; border-radius: 6px; padding: 12px;">
        <img 
          src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/verificar-contrato?hash=${blockchainSignature.hash}`)}" 
          alt="QR Code de Verificação"
          style="width: 120px; height: 120px;"
        />
        <p style="font-size: 8px; color: #166534; margin-top: 8px; font-weight: 500;">Escaneie para verificar</p>
        <p style="font-size: 7px; color: #16a34a; margin-top: 2px;">a autenticidade do contrato</p>
      </div>
    </div>
    ` : `
    <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 16px; font-size: 11px; color: #92400e;">
      <strong>⏳ Aguardando assinatura eletrônica</strong>
      <p style="font-size: 10px; margin-top: 4px;">Após a assinatura, os dados criptográficos serão exibidos aqui.</p>
    </div>
    `}
    
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #bae6fd; text-align: center;">
      <p style="font-size: 10px; color: #0284c7; font-weight: 500;">Contrato gerado e assinado eletronicamente pelo sistema WebMarcas</p>
      <p style="font-size: 10px; color: #0369a1; margin-top: 4px;">www.webmarcas.net | contato@webmarcas.net</p>
      ${blockchainSignature?.timestamp ? `<p style="font-size: 10px; color: #0284c7; font-weight: 500; margin-top: 8px;">Data e hora da assinatura: ${new Date(blockchainSignature.timestamp).toLocaleString('pt-BR')}</p>` : ''}
    </div>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>Contrato gerado e assinado eletronicamente pelo sistema WebMarcas</p>
    <p>www.webmarcas.net | contato@webmarcas.net</p>
    ${blockchainSignature?.timestamp ? `<p>Data e hora da assinatura: ${new Date(blockchainSignature.timestamp).toLocaleString('pt-BR')}</p>` : `<p>Data e hora da geração: ${new Date().toLocaleString('pt-BR')}</p>`}
  </div>
</body>
</html>`;
}

export default ContractRenderer;
