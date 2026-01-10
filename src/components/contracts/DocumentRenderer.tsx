import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import webmarcasLogo from '@/assets/webmarcas-logo.png';
import davilysSignature from '@/assets/davilys-signature.png';

// Função para gerar URL de verificação dinâmica baseada no domínio atual
const getVerificationUrl = (hash: string, baseUrl?: string) => {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/verificar-contrato?hash=${hash}`;
};

// Função para obter o host atual para exibição
const getCurrentHost = () => {
  return typeof window !== 'undefined' ? window.location.host : 'webmarcas.lovable.app';
};

interface BlockchainSignature {
  hash: string;
  timestamp: string;
  txId: string;
  network: string;
  ipAddress: string;
}

interface DocumentRendererProps {
  documentType: 'procuracao' | 'distrato_multa' | 'distrato_sem_multa' | 'contract';
  content: string;
  clientSignature?: string | null;
  blockchainSignature?: BlockchainSignature;
  showCertificationSection?: boolean;
  signatoryName?: string;
  signatoryCpf?: string;
  signatoryCnpj?: string;
}

export function DocumentRenderer({
  documentType,
  content,
  clientSignature,
  blockchainSignature,
  showCertificationSection = false,
  signatoryName,
  signatoryCpf,
  signatoryCnpj,
}: DocumentRendererProps) {
  const documentTitle = useMemo(() => {
    switch (documentType) {
      case 'procuracao':
        return 'PROCURAÇÃO';
      case 'distrato_multa':
        return 'Acordo de Distrato de Parceria - Anexo I';
      case 'distrato_sem_multa':
        return 'Acordo de Distrato de Parceria - Anexo I';
      case 'contract':
        return 'CONTRATO';
      default:
        return 'DOCUMENTO';
    }
  }, [documentType]);

  // Detectar se o conteúdo é HTML completo
  const isHtmlDocument = useMemo(() => {
    const trimmedContent = content.trim();
    return trimmedContent.startsWith('<!DOCTYPE') || 
           trimmedContent.startsWith('<html') ||
           (trimmedContent.startsWith('<') && trimmedContent.includes('</'));
  }, [content]);

  const legalNotice = useMemo(() => {
    if (documentType === 'distrato_multa' || documentType === 'distrato_sem_multa') {
      return `Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.

Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.`;
    }
    return null;
  }, [documentType]);

  const formattedContent = useMemo(() => {
    // Remove {contract_signature} placeholder from content
    return content.replace(/\{contract_signature\}/g, '').trim();
  }, [content]);

  // URL de verificação dinâmica
  const verificationUrl = blockchainSignature?.hash 
    ? getVerificationUrl(blockchainSignature.hash) 
    : '';

  return (
    <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden">
      {/* Header with Logo and Gradient Bar */}
      <div className="bg-white p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <img 
            src={webmarcasLogo} 
            alt="WebMarcas" 
            className="h-12 object-contain"
          />
          <div className="text-right text-sm text-gray-600">
            <p>www.webmarcas.net</p>
            <p>contato@webmarcas.net</p>
          </div>
        </div>
        {/* Gradient Bar */}
        <div className="h-2 rounded-full bg-gradient-to-r from-orange-400 via-yellow-400 to-yellow-300" />
      </div>

      {/* Document Title */}
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold text-blue-700 text-center mb-6">
          {documentTitle}
        </h1>

        {/* Legal Notice Box */}
        {legalNotice && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6 text-sm text-gray-700 italic">
            {legalNotice.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className={idx > 0 ? 'mt-3' : ''}>
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* Document Content */}
        {isHtmlDocument ? (
          <div 
            className="prose prose-sm max-w-none text-justify leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        ) : (
          <div className="prose prose-sm max-w-none text-justify leading-relaxed">
            {formattedContent.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4 text-gray-800">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* Signatures Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-8">
            Por estarem justas e contratadas, as partes assinam o presente de igual teor e forma, de forma digital válido juridicamente.
          </p>

          <div className="grid grid-cols-2 gap-8">
            {/* Contractor Signature (WebMarcas/Davilys) */}
            <div className="text-center">
              <p className="text-sm font-semibold mb-2">Assinatura autorizada:</p>
              <p className="text-sm text-gray-700 mb-4">
                WebMarcas Patentes - CNPJ/MF sob o nº 39.528.012/0001-29
              </p>
              <div className="border-b-2 border-black mx-auto w-64 pb-2 min-h-[4rem]">
                {documentType === 'procuracao' ? (
                  // Procuração: Mostrar assinatura manuscrita do Davilys
                  <img 
                    src={davilysSignature} 
                    alt="Assinatura WebMarcas"
                    className="h-16 mx-auto object-contain"
                  />
                ) : (
                  // Distrato/Contrato: Apenas texto indicando assinatura digital
                  <div className="flex items-center justify-center h-16">
                    <span className="text-blue-600 font-medium text-sm">
                      ✓ Assinado Digitalmente
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {documentType === 'procuracao' 
                  ? 'Davilys Danques de Oliveira Cunha'
                  : 'Certificação Digital - Lei 14.063/2020'
                }
              </p>
            </div>

            {/* Client Signature */}
            <div className="text-center">
              <p className="text-sm font-semibold mb-2">Contratante:</p>
              <p className="text-sm text-gray-700 mb-4">
                {signatoryName || 'Nome do Representante'}
                {signatoryCnpj && ` - CNPJ sob o nº ${signatoryCnpj}`}
                {signatoryCpf && `, CPF sob o n⁰ ${signatoryCpf}`}
              </p>
              <div className="border-b-2 border-black mx-auto w-64 pb-2 min-h-[4rem]">
                {clientSignature ? (
                  <img 
                    src={clientSignature} 
                    alt="Assinatura do Cliente"
                    className="h-16 mx-auto object-contain"
                  />
                ) : (
                  <p className="text-gray-400 italic text-sm py-4">
                    Aguardando assinatura...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Digital Certification Section with QR Code */}
        {(showCertificationSection || blockchainSignature?.hash) && blockchainSignature && (
          <div className="mt-12 pt-8 border-t-2 border-blue-600">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                CERTIFICAÇÃO DIGITAL E VALIDADE JURÍDICA
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Hash SHA-256</p>
                    <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                      {blockchainSignature.hash}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Data/Hora da Assinatura</p>
                    <p className="text-sm">{blockchainSignature.timestamp}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">ID da Transação</p>
                    <p className="text-xs font-mono">{blockchainSignature.txId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Rede Blockchain</p>
                    <p className="text-sm">{blockchainSignature.network}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">IP do Signatário</p>
                    <p className="text-sm">{blockchainSignature.ipAddress}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white rounded border">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-3">QR Code de Verificação</p>
                  <QRCodeSVG 
                    value={verificationUrl}
                    size={120}
                    level="M"
                    includeMargin={true}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Escaneie para verificar
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-4 italic text-center">
                Este documento foi assinado eletronicamente e possui validade jurídica conforme 
                Lei 14.063/2020 e MP 2.200-2/2001.
              </p>
              <p className="text-xs text-blue-700 mt-2 text-center font-medium">
                Verifique a autenticidade em: {getCurrentHost()}/verificar-contrato
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-100 px-8 py-4 border-t text-center text-xs text-gray-500">
        <p>WebMarcas Patentes - CNPJ: 39.528.012/0001-29</p>
        <p>Av. Prestes Maia, 241 - Centro, São Paulo - SP, CEP: 01031-001</p>
        <p>Tel: (11) 4200-1656 | contato@webmarcas.net</p>
      </div>
    </div>
  );
}

// Convert image to base64 for PDF generation
export async function getSignatureBase64(): Promise<string> {
  try {
    const response = await fetch(davilysSignature);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

export function generateDocumentPrintHTML(
  documentType: 'procuracao' | 'distrato_multa' | 'distrato_sem_multa' | 'contract',
  content: string,
  clientSignature: string | null,
  blockchainSignature?: BlockchainSignature,
  signatoryName?: string,
  signatoryCpf?: string,
  signatoryCnpj?: string,
  davilysSignatureBase64?: string,
  baseUrl?: string
): string {
  let documentTitle = 'DOCUMENTO';
  if (documentType === 'procuracao') {
    documentTitle = 'PROCURAÇÃO';
  } else if (documentType === 'contract') {
    documentTitle = 'CONTRATO';
  } else if (documentType === 'distrato_multa' || documentType === 'distrato_sem_multa') {
    documentTitle = 'Acordo de Distrato de Parceria - Anexo I';
  }

  const legalNotice = (documentType === 'distrato_multa' || documentType === 'distrato_sem_multa')
    ? `<div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #374151; font-style: italic;">
        <p>Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.</p>
        <p style="margin-top: 12px;">Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.</p>
      </div>`
    : '';

  const formattedContent = content
    .replace(/\{contract_signature\}/g, '')
    .split('\n\n')
    .map(p => `<p style="margin-bottom: 16px; text-align: justify;">${p}</p>`)
    .join('');

  // URL de verificação dinâmica
  const verificationBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://webmarcas.lovable.app');
  const verificationUrl = blockchainSignature?.hash 
    ? `${verificationBaseUrl}/verificar-contrato?hash=${blockchainSignature.hash}`
    : '';

  // Gerar QR Code como imagem usando API do Google Charts
  const qrCodeUrl = blockchainSignature?.hash 
    ? `https://chart.googleapis.com/chart?cht=qr&chs=150x150&chl=${encodeURIComponent(verificationUrl)}&choe=UTF-8`
    : '';

  const certificationSection = blockchainSignature?.hash
    ? `<div style="margin-top: 48px; padding-top: 32px; border-top: 2px solid #1E40AF;">
        <div style="background: #EFF6FF; border-radius: 8px; padding: 24px;">
          <h3 style="font-size: 18px; font-weight: bold; color: #1E3A8A; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span style="color: #16A34A;">✓</span>
            CERTIFICAÇÃO DIGITAL E VALIDADE JURÍDICA
          </h3>
          <div style="display: flex; gap: 24px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 280px;">
              <p style="font-size: 12px; font-weight: 600; color: #6B7280;">HASH SHA-256</p>
              <p style="font-size: 10px; font-family: monospace; background: white; padding: 8px; border-radius: 4px; word-break: break-all;">
                ${blockchainSignature.hash}
              </p>
              <p style="font-size: 12px; font-weight: 600; color: #6B7280; margin-top: 12px;">DATA/HORA</p>
              <p style="font-size: 14px;">${blockchainSignature.timestamp}</p>
              <p style="font-size: 12px; font-weight: 600; color: #6B7280; margin-top: 12px;">ID TRANSAÇÃO</p>
              <p style="font-size: 10px; font-family: monospace;">${blockchainSignature.txId}</p>
              <p style="font-size: 12px; font-weight: 600; color: #6B7280; margin-top: 12px;">REDE BLOCKCHAIN</p>
              <p style="font-size: 14px;">${blockchainSignature.network}</p>
              <p style="font-size: 12px; font-weight: 600; color: #6B7280; margin-top: 12px;">IP SIGNATÁRIO</p>
              <p style="font-size: 14px;">${blockchainSignature.ipAddress}</p>
            </div>
            <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 180px;">
              <p style="font-size: 12px; font-weight: 600; color: #6B7280; margin-bottom: 8px;">QR CODE VERIFICAÇÃO</p>
              <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <img src="${qrCodeUrl}" alt="QR Code Verificação" style="width: 120px; height: 120px;" />
              </div>
              <p style="font-size: 10px; color: #6B7280; margin-top: 8px;">
                Escaneie para verificar
              </p>
            </div>
          </div>
          <p style="font-size: 12px; color: #4B5563; margin-top: 16px; font-style: italic; text-align: center;">
            Documento com validade jurídica conforme Lei 14.063/2020 e MP 2.200-2/2001.
          </p>
          <p style="font-size: 12px; color: #1D4ED8; margin-top: 8px; text-align: center; font-weight: 500;">
            Verifique a autenticidade em: ${verificationBaseUrl}/verificar-contrato
          </p>
        </div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle} - WebMarcas</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      @page { margin: 1cm; }
    }
    body { font-family: Arial, sans-serif; color: #1F2937; line-height: 1.6; }
  </style>
</head>
<body>
  <div style="max-width: 800px; margin: 0 auto; background: white; padding: 32px;">
    <!-- Header -->
    <div style="border-bottom: 2px solid #E5E7EB; padding-bottom: 16px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 24px; font-weight: bold; color: #1E40AF;">WebMarcas</div>
        <div style="text-align: right; font-size: 12px; color: #6B7280;">
          <p>www.webmarcas.net</p>
          <p>contato@webmarcas.net</p>
        </div>
      </div>
      <div style="height: 8px; margin-top: 16px; border-radius: 4px; background: linear-gradient(to right, #FB923C, #FACC15, #FDE047);"></div>
    </div>

    <!-- Title -->
    <h1 style="text-align: center; color: #1E40AF; font-size: 24px; margin-bottom: 24px;">
      ${documentTitle}
    </h1>

    ${legalNotice}

    <!-- Content -->
    <div style="font-size: 14px; color: #374151;">
      ${formattedContent}
    </div>

    <!-- Signatures -->
    <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #E5E7EB;">
      <p style="font-size: 14px; color: #4B5563; margin-bottom: 32px;">
        Por estarem justas e contratadas, as partes assinam o presente de igual teor e forma, de forma digital válido juridicamente.
      </p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
        <div style="text-align: center;">
          <p style="font-size: 14px; font-weight: 600;">Assinatura autorizada:</p>
          <p style="font-size: 12px; color: #4B5563;">WebMarcas Patentes - CNPJ/MF sob o nº 39.528.012/0001-29</p>
          <div style="border-bottom: 2px solid black; width: 256px; margin: 16px auto; padding-bottom: 8px; min-height: 64px; display: flex; align-items: center; justify-content: center;">
            ${documentType === 'procuracao' && davilysSignatureBase64 
              ? `<img src="${davilysSignatureBase64}" alt="Assinatura" style="height: 64px; object-fit: contain;">`
              : '<span style="color: #2563EB; font-weight: 500; font-size: 14px;">✓ Assinado Digitalmente</span>'
            }
          </div>
          <p style="font-size: 10px; color: #6B7280;">
            ${documentType === 'procuracao' 
              ? 'Davilys Danques de Oliveira Cunha'
              : 'Certificação Digital - Lei 14.063/2020'
            }
          </p>
        </div>
        
        <div style="text-align: center;">
          <p style="font-size: 14px; font-weight: 600;">Contratante:</p>
          <p style="font-size: 12px; color: #4B5563;">
            ${signatoryName || 'Nome do Representante'}
            ${signatoryCnpj ? ` - CNPJ sob o nº ${signatoryCnpj}` : ''}
            ${signatoryCpf ? `, CPF sob o n⁰ ${signatoryCpf}` : ''}
          </p>
          <div style="border-bottom: 2px solid black; width: 256px; margin: 16px auto; padding-bottom: 8px; min-height: 64px;">
            ${clientSignature ? `<img src="${clientSignature}" alt="Assinatura Cliente" style="height: 64px; object-fit: contain;">` : '<p style="color: #9CA3AF; font-style: italic; padding: 16px 0;">Aguardando assinatura...</p>'}
          </div>
        </div>
      </div>
    </div>

    ${certificationSection}

    <!-- Footer -->
    <div style="margin-top: 48px; padding-top: 16px; border-top: 1px solid #E5E7EB; text-align: center; font-size: 12px; color: #6B7280;">
      <p>WebMarcas Patentes - CNPJ: 39.528.012/0001-29</p>
      <p>Av. Prestes Maia, 241 - Centro, São Paulo - SP, CEP: 01031-001</p>
      <p>Tel: (11) 4200-1656 | contato@webmarcas.net</p>
    </div>
  </div>
</body>
</html>`;
}
