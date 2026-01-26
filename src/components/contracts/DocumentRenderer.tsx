import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import webmarcasLogo from '@/assets/webmarcas-logo-new.png';
import davilysSignature from '@/assets/davilys-signature.png';
import { ContractRenderer } from '@/components/contracts/ContractRenderer';

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
        return 'PROCURAÇÃO PARA REPRESENTAÇÃO JUNTO AO INPI';
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

  const documentSubtitle = useMemo(() => {
    if (documentType === 'procuracao') {
      return 'Instrumento Particular de Procuração para fins de Registro de Marca';
    }
    return null;
  }, [documentType]);

  // Detectar se o conteúdo é HTML completo (já possui estrutura própria)
  const isCompleteHtmlDocument = useMemo(() => {
    const trimmedContent = content.trim();
    // Verifica se já tem estrutura de documento completo
    return trimmedContent.startsWith('<!DOCTYPE') || 
           trimmedContent.startsWith('<html') ||
           // Verifica se tem estrutura de contrato completo (com header)
           trimmedContent.includes('gradient-bar') ||
           trimmedContent.includes('main-title') ||
           trimmedContent.includes('header-logo') ||
           // Verifica se é apenas HTML simples (parágrafos, divs)
           (trimmedContent.startsWith('<div') && trimmedContent.includes('</div>'));
  }, [content]);

  // Detectar se é HTML parcial (sem documento completo, apenas tags)
  const isHtmlContent = useMemo(() => {
    const trimmedContent = content.trim();
    return trimmedContent.startsWith('<') && trimmedContent.includes('</');
  }, [content]);

  const formattedContent = useMemo(() => {
    // Remove {contract_signature} placeholder from content
    return content.replace(/\{contract_signature\}/g, '').trim();
  }, [content]);

  // URL de verificação dinâmica
  const verificationUrl = blockchainSignature?.hash 
    ? getVerificationUrl(blockchainSignature.hash) 
    : '';
  
  // Função para extrair apenas o conteúdo do corpo (sem header duplicado)
  const extractBodyContent = (html: string): string => {
    let cleanedHtml = html;
    
    // Se o HTML tem estrutura de PDF gerado (com pdf-content), extrair apenas o conteúdo
    const pdfContentMatch = html.match(/<div class="pdf-content">([\s\S]*?)(?:<div class="pdf-footer">|<div class="pdf-blue-divider">|<div class="pdf-certification">|$)/i);
    if (pdfContentMatch) {
      cleanedHtml = pdfContentMatch[1];
    }
    
    // ESTRATÉGIA: Localizar onde começa o conteúdo real (após "Acordo do Contrato" ou box azul)
    // e remover tudo antes disso que seja header duplicado
    
    // Encontrar a posição do box azul (CONTRATO PARTICULAR...) que marca início do conteúdo real
    const blueBoxMatch = cleanedHtml.match(/<div[^>]*(?:background[^>]*#0ea5e9|background[^>]*rgb\(14,\s*165,\s*233\)|class="[^"]*highlight-box[^"]*")[^>]*>/i);
    
    if (blueBoxMatch && blueBoxMatch.index !== undefined) {
      // Remover tudo antes do box azul que seja parte do header duplicado
      const beforeBlueBox = cleanedHtml.substring(0, blueBoxMatch.index);
      const afterBlueBox = cleanedHtml.substring(blueBoxMatch.index);
      
      // Limpar a parte antes do box azul de elementos de header
      let cleanedBefore = beforeBlueBox
        // Remove qualquer coisa que contenha WebMarcas ou www.webmarcas
        .replace(/<[^>]*>[\s\S]*?WebMarcas[\s\S]*?<\/[^>]*>/gi, '')
        .replace(/<[^>]*>[\s\S]*?www\.webmarcas\.net[\s\S]*?<\/[^>]*>/gi, '')
        // Remove gradient bars
        .replace(/<div[^>]*style="[^"]*(?:linear-gradient|#f97316|#fbbf24)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        // Remove títulos CONTRATO e Acordo do Contrato
        .replace(/<h1[^>]*>[\s\S]*?CONTRATO[\s\S]*?<\/h1>/gi, '')
        .replace(/<h2[^>]*>[\s\S]*?CONTRATO[\s\S]*?<\/h2>/gi, '')
        .replace(/<h1[^>]*>[\s\S]*?Acordo do Contrato[\s\S]*?<\/h1>/gi, '')
        .replace(/<h2[^>]*>[\s\S]*?Acordo do Contrato[\s\S]*?<\/h2>/gi, '')
        // Remove imagens de logo
        .replace(/<img[^>]*>/gi, '')
        // Remove spans/links com WebMarcas ou URL
        .replace(/<span[^>]*>[\s\S]*?WebMarcas[\s\S]*?<\/span>/gi, '')
        .replace(/<a[^>]*>[\s\S]*?www\.webmarcas[\s\S]*?<\/a>/gi, '')
        // Limpar texto solto
        .replace(/WebMarcas/gi, '')
        .replace(/www\.webmarcas\.net/gi, '')
        // Limpar divs vazios
        .replace(/<div[^>]*>\s*<\/div>/gi, '')
        .replace(/<div[^>]*>\s*<\/div>/gi, '');
      
      cleanedHtml = cleanedBefore + afterBlueBox;
    } else {
      // Fallback: usar regex para limpar elementos comuns de header
      cleanedHtml = cleanedHtml
        // Remove elementos com classes PDF específicas
        .replace(/<div[^>]*class="[^"]*pdf-header[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*pdf-gradient-bar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<h1[^>]*class="[^"]*pdf-main-title[^"]*"[^>]*>[\s\S]*?<\/h1>/gi, '')
        // Remove blocos com WebMarcas + URL + gradient
        .replace(/<div[^>]*>[\s\S]*?WebMarcas[\s\S]*?www\.webmarcas\.net[\s\S]*?<\/div>\s*<div[^>]*style="[^"]*linear-gradient[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        // Remove gradient bars
        .replace(/<div[^>]*style="[^"]*linear-gradient[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*style="[^"]*background[^"]*#f97316[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        // Remove imagens de logo
        .replace(/<img[^>]*webmarcas[^>]*\/?>/gi, '')
        .replace(/<img[^>]*alt="WebMarcas"[^>]*\/?>/gi, '')
        // Remove spans e links com WebMarcas ou URL
        .replace(/<span[^>]*>\s*WebMarcas\s*<\/span>/gi, '')
        .replace(/<a[^>]*>\s*www\.webmarcas\.net\s*<\/a>/gi, '')
        .replace(/<span[^>]*>\s*www\.webmarcas\.net\s*<\/span>/gi, '')
        // Remove títulos CONTRATO e Acordo do Contrato
        .replace(/<h1[^>]*>\s*CONTRATO\s*<\/h1>/gi, '')
        .replace(/<h2[^>]*>\s*CONTRATO\s*<\/h2>/gi, '')
        .replace(/<h1[^>]*>\s*Acordo do Contrato[\s\S]*?<\/h1>/gi, '')
        .replace(/<h2[^>]*>\s*Acordo do Contrato[\s\S]*?<\/h2>/gi, '')
        // Remove textos isolados
        .replace(/WebMarcas<\/span>/gi, '')
        .replace(/www\.webmarcas\.net/gi, '')
        // Remove divs com class header ou gradient-bar
        .replace(/<div[^>]*class="[^"]*header[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class="[^"]*gradient-bar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    }
    
    // Limpeza final - remove divs vazios em múltiplas passadas
    cleanedHtml = cleanedHtml
      .replace(/<div[^>]*>\s*<\/div>/gi, '')
      .replace(/<div[^>]*>\s*<\/div>/gi, '')
      .replace(/<div[^>]*>\s*<\/div>/gi, '')
      .trim();
      
    return cleanedHtml;
  };

  // Se for documento HTML completo, adiciona cabeçalho correto com logo real
  if (isCompleteHtmlDocument) {
    const bodyContent = extractBodyContent(formattedContent);
    
    return (
      <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden">
        {/* Header correto com Logo real */}
        <div className="bg-white p-6">
          <div className="flex items-center justify-between pb-3">
            <img 
              src={webmarcasLogo} 
              alt="WebMarcas" 
              className="h-12 object-contain"
            />
            <a 
              href="https://www.webmarcas.net" 
              className="text-sm font-medium"
              style={{ color: '#0EA5E9' }}
            >
              www.webmarcas.net
            </a>
          </div>
          {/* Gradient Bar */}
          <div className="h-2 w-full rounded-sm" style={{ background: 'linear-gradient(90deg, #f97316, #fbbf24)' }} />
        </div>

        {/* Conteúdo do documento */}
        <div className="px-8 py-6">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: bodyContent }}
          />
        </div>
        
        {/* Digital Certification Section - Sempre no final para documentos assinados */}
        {(showCertificationSection || blockchainSignature?.hash) && blockchainSignature && (
          <div className="mx-6 mb-6">
            <div className="mt-8 pt-8 border-t-2 border-blue-600">
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
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-100 px-8 py-4 border-t text-center text-xs text-gray-500">
          <p>WebMarcas Patentes - CNPJ: 39.528.012/0001-29</p>
          <p>Av. Prestes Maia, 241 - Centro, São Paulo - SP, CEP: 01031-001</p>
        <p>Tel: (11) 91112-0225 | juridico@webmarcas.net</p>
        </div>
      </div>
    );
  }

  const legalNotice = useMemo(() => {
    if (documentType === 'procuracao') {
      return 'Pelo presente instrumento particular de PROCURAÇÃO, o(a) outorgante abaixo identificado(a) nomeia e constitui como seu bastante PROCURADOR o(a) Sr(a). Davilys Danques de Oliveira Cunha, para representá-lo(a) de forma exclusiva junto ao INSTITUTO NACIONAL DA PROPRIEDADE INDUSTRIAL – INPI, podendo praticar todos os atos necessários, legais e administrativos relacionados ao pedido, acompanhamento, defesa e manutenção do registro de marca, inclusive apresentação de requerimentos, cumprimento de exigências, interposição de recursos e recebimento de notificações.';
    }
    if (documentType === 'distrato_multa' || documentType === 'distrato_sem_multa') {
      return `Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.

Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.`;
    }
    return null;
  }, [documentType]);

  // Contrato (texto puro): renderizar com o mesmo layout do modelo padrão (ContractRenderer)
  if (documentType === 'contract' && !isHtmlContent) {
    return (
      <ContractRenderer
        content={formattedContent}
        showLetterhead
        className="rounded-lg shadow-lg overflow-hidden"
        showCertificationSection={showCertificationSection}
        blockchainSignature={blockchainSignature?.hash ? {
          hash: blockchainSignature.hash,
          timestamp: blockchainSignature.timestamp,
          txId: blockchainSignature.txId,
          network: blockchainSignature.network,
          ipAddress: blockchainSignature.ipAddress,
        } : undefined}
      />
    );
  }

  return (
    <div className="bg-white text-black rounded-lg shadow-lg overflow-hidden">
      {/* Header with Logo and Gradient Bar (igual ao modelo) */}
      <div className="bg-white p-6 border-b">
        <div className="flex items-center justify-between pb-3">
          <img 
            src={webmarcasLogo} 
            alt="WebMarcas" 
            className="h-12 object-contain"
          />
          <div className="text-right text-sm text-gray-600">
            <p>www.webmarcas.net</p>
            <p>juridico@webmarcas.net</p>
          </div>
        </div>
        {/* Gradient Bar */}
        <div className="h-2 w-full rounded-sm" style={{ background: 'linear-gradient(90deg, #f97316, #fbbf24)' }} />
      </div>

      {/* Document Title */}
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold text-blue-700 text-center mb-2">
          {documentTitle}
        </h1>
        {documentSubtitle && (
          <p className="text-base text-gray-600 text-center mb-6 italic">
            {documentSubtitle}
          </p>
        )}

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
        {isHtmlContent ? (
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
        <p>Tel: (11) 91112-0225 | juridico@webmarcas.net</p>
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

// Helper function to convert imported logo to base64
export async function getLogoBase64ForPDF(): Promise<string> {
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
  baseUrl?: string,
  logoBase64?: string
): string {
  let documentTitle = 'DOCUMENTO';
  let documentSubtitle = '';
  if (documentType === 'procuracao') {
    documentTitle = 'PROCURAÇÃO PARA REPRESENTAÇÃO JUNTO AO INPI';
    documentSubtitle = 'Instrumento Particular de Procuração para fins de Registro de Marca';
  } else if (documentType === 'contract') {
    documentTitle = 'CONTRATO';
  } else if (documentType === 'distrato_multa' || documentType === 'distrato_sem_multa') {
    documentTitle = 'Acordo de Distrato de Parceria - Anexo I';
  }

  const legalNotice = (documentType === 'distrato_multa' || documentType === 'distrato_sem_multa')
    ? `<div class="legal-notice">
        <p>Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.</p>
        <p style="margin-top: 12px;">Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.</p>
      </div>`
    : '';

  // Limpar o conteúdo de headers duplicados antes de formatar
  const cleanContent = (html: string): string => {
    let cleaned = html;
    
    // Se for HTML, remover elementos de header que já existem
    if (html.includes('<') && html.includes('>')) {
      cleaned = cleaned
        // Remove elementos de header
        .replace(/<div[^>]*class="[^"]*(?:header|pdf-header)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        // Remove gradient bars
        .replace(/<div[^>]*class="[^"]*(?:gradient-bar|pdf-gradient-bar)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*style="[^"]*(?:linear-gradient|#f97316|#fbbf24)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        // Remove títulos duplicados
        .replace(/<h1[^>]*class="[^"]*(?:document-title|main-title|pdf-main-title)[^"]*"[^>]*>[\s\S]*?<\/h1>/gi, '')
        .replace(/<h1[^>]*>\s*(?:CONTRATO|Acordo do Contrato[^<]*)\s*<\/h1>/gi, '')
        .replace(/<h2[^>]*>\s*(?:CONTRATO|Acordo do Contrato[^<]*)\s*<\/h2>/gi, '')
        // Remove imagens de logo
        .replace(/<img[^>]*(?:header-logo|webmarcas|alt="WebMarcas")[^>]*\/?>/gi, '')
        // Remove spans/links com WebMarcas ou URL
        .replace(/<span[^>]*>\s*WebMarcas\s*<\/span>/gi, '')
        .replace(/<a[^>]*>\s*www\.webmarcas\.net\s*<\/a>/gi, '')
        .replace(/<span[^>]*>\s*www\.webmarcas\.net\s*<\/span>/gi, '')
        .replace(/<div[^>]*class="[^"]*header-url[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
        // Remove divs de container que envolvem o header
        .replace(/<div[^>]*class="[^"]*document-container[^"]*"[^>]*>/gi, '')
        // Limpar divs vazios
        .replace(/<div[^>]*>\s*<\/div>/gi, '')
        .replace(/<div[^>]*>\s*<\/div>/gi, '');
    }
    
    return cleaned.replace(/\{contract_signature\}/g, '').trim();
  };
  
  const cleanedContent = cleanContent(content);
  
  // Verificar se o conteúdo é HTML ou texto puro
  const isHtmlContent = cleanedContent.includes('<') && cleanedContent.includes('>') && 
                        (cleanedContent.includes('<p') || cleanedContent.includes('<div') || cleanedContent.includes('<span'));
  
  const formattedContent = isHtmlContent 
    ? cleanedContent
    : cleanedContent
        .split('\n\n')
        .map(p => `<p class="content-paragraph">${p}</p>`)
        .join('');

  // URL de verificação dinâmica
  const verificationBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://webmarcas.lovable.app');
  const verificationUrl = blockchainSignature?.hash 
    ? `${verificationBaseUrl}/verificar-contrato?hash=${blockchainSignature.hash}`
    : '';

  // Gerar QR Code como imagem usando API do QRServer (Google Charts foi descontinuado)
  const qrCodeUrl = blockchainSignature?.hash 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`
    : '';

  const certificationSection = blockchainSignature?.hash
    ? `<div class="certification-section">
        <div class="certification-box">
          <h3 class="certification-title">
            <span style="color: #16A34A;">✓</span>
            CERTIFICAÇÃO DIGITAL E VALIDADE JURÍDICA
          </h3>
          <div class="certification-content">
            <div class="certification-data">
              <p class="cert-label">HASH SHA-256</p>
              <p class="cert-hash">${blockchainSignature.hash}</p>
              <p class="cert-label">DATA/HORA</p>
              <p class="cert-value">${blockchainSignature.timestamp}</p>
              <p class="cert-label">ID TRANSAÇÃO</p>
              <p class="cert-hash">${blockchainSignature.txId}</p>
              <p class="cert-label">REDE BLOCKCHAIN</p>
              <p class="cert-value">${blockchainSignature.network}</p>
              <p class="cert-label">IP SIGNATÁRIO</p>
              <p class="cert-value">${blockchainSignature.ipAddress}</p>
            </div>
            <div class="certification-qr">
              <p class="cert-label">QR CODE VERIFICAÇÃO</p>
              <div class="qr-box">
                <img src="${qrCodeUrl}" alt="QR Code Verificação" style="width: 120px; height: 120px;" />
              </div>
              <p class="qr-text">Escaneie para verificar</p>
            </div>
          </div>
          <p class="cert-legal">
            Documento com validade jurídica conforme Lei 14.063/2020 e MP 2.200-2/2001.
          </p>
          <p class="cert-verify">
            Verifique a autenticidade em: ${verificationBaseUrl}/verificar-contrato
          </p>
        </div>
      </div>`
    : '';

  // Logo: usar base64 se fornecido, senão usar fallback SVG
  const logoSrc = logoBase64 || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNTAiPjxyZWN0IGZpbGw9IiMxZTNhNWYiIHdpZHRoPSIyMDAiIGhlaWdodD0iNTAiLz48dGV4dCB4PSIxMCIgeT0iMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmYiPldlYk1hcmNhczwvdGV4dD48L3N2Zz4=';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=210mm, initial-scale=1.0">
  <title>${documentTitle} - WebMarcas</title>
  <style>
    /* PDF/Print-specific settings - Fixed A4 layout */
    @page { 
      size: A4; 
      margin: 20mm; 
    }
    
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    html, body {
      width: 210mm;
      min-height: 297mm;
    }
    
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      color: #1F2937 !important; 
      line-height: 1.6; 
      background: white !important;
      font-size: 11px;
      max-width: 210mm;
      margin: 0 auto;
    }
    
    .document-container {
      max-width: 170mm;
      margin: 0 auto;
      background: white !important;
      padding: 0;
    }
    
    /* Header with logo */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 0;
      page-break-inside: avoid;
    }
    
    .header-logo {
      height: 48px;
      width: auto;
      object-fit: contain;
    }
    
    .header-url {
      text-align: right;
      font-size: 14px;
    }
    
    .header-url a {
      color: #0EA5E9 !important;
      text-decoration: none;
      font-weight: 500;
    }
    
    /* Gradient bar */
    .gradient-bar {
      height: 8px;
      width: 100%;
      background: linear-gradient(90deg, #f97316, #fbbf24) !important;
      border-radius: 4px;
      margin-bottom: 24px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Document title */
    .document-title {
      text-align: center;
      color: #1E40AF !important;
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .document-subtitle {
      text-align: center;
      color: #4B5563 !important;
      font-size: 14px;
      font-style: italic;
      margin-bottom: 24px;
    }
    
    /* Legal notice */
    .legal-notice {
      background: #FFFBEB !important;
      border: 1px solid #FCD34D !important;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      font-size: 12px;
      color: #374151 !important;
      font-style: italic;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Content paragraphs */
    .content-paragraph {
      margin-bottom: 16px;
      text-align: justify;
      font-size: 12px;
      color: #374151 !important;
    }
    
    /* Signatures section */
    .signatures-section {
      margin-top: 48px;
      padding-top: 32px;
      border-top: 1px solid #E5E7EB;
      page-break-inside: avoid;
    }
    
    .signatures-intro {
      font-size: 12px;
      color: #4B5563 !important;
      margin-bottom: 32px;
    }
    
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-box h4 {
      font-size: 13px;
      font-weight: 600;
      color: #1F2937 !important;
    }
    
    .signature-box .details {
      font-size: 11px;
      color: #4B5563 !important;
    }
    
    .signature-line {
      border-bottom: 2px solid black;
      width: 200px;
      margin: 16px auto;
      padding-bottom: 8px;
      min-height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .signature-line img {
      height: 64px;
      object-fit: contain;
    }
    
    .digital-signature {
      color: #2563EB !important;
      font-weight: 500;
      font-size: 12px;
    }
    
    .awaiting-signature {
      color: #9CA3AF !important;
      font-style: italic;
      padding: 16px 0;
    }
    
    .signature-caption {
      font-size: 10px;
      color: #6B7280 !important;
    }
    
    /* Certification section */
    .certification-section {
      margin-top: 48px;
      padding-top: 32px;
      border-top: 2px solid #1E40AF !important;
      page-break-inside: avoid;
    }
    
    .certification-box {
      background: #EFF6FF !important;
      border-radius: 8px;
      padding: 24px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .certification-title {
      font-size: 16px;
      font-weight: bold;
      color: #1E3A8A !important;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .certification-content {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    
    .certification-data {
      flex: 1;
      min-width: 280px;
    }
    
    .certification-qr {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 150px;
    }
    
    .cert-label {
      font-size: 10px;
      font-weight: 600;
      color: #6B7280 !important;
      margin-top: 12px;
      margin-bottom: 2px;
    }
    
    .cert-label:first-child {
      margin-top: 0;
    }
    
    .cert-hash {
      font-size: 9px;
      font-family: monospace;
      background: white !important;
      padding: 8px;
      border-radius: 4px;
      word-break: break-all;
      color: #1F2937 !important;
    }
    
    .cert-value {
      font-size: 12px;
      color: #1F2937 !important;
    }
    
    .qr-box {
      background: white !important;
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin: 8px 0;
    }
    
    .qr-text {
      font-size: 9px;
      color: #6B7280 !important;
    }
    
    .cert-legal {
      font-size: 11px;
      color: #4B5563 !important;
      margin-top: 16px;
      font-style: italic;
      text-align: center;
    }
    
    .cert-verify {
      font-size: 11px;
      color: #1D4ED8 !important;
      margin-top: 8px;
      text-align: center;
      font-weight: 500;
    }
    
    /* Footer */
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      font-size: 10px;
      color: #6B7280 !important;
    }
    
    /* Print media query - reinforce colors */
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      body {
        padding: 0;
      }
      
      .gradient-bar,
      .legal-notice,
      .certification-box {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="document-container">
    <!-- Header -->
    <div class="header">
      <img src="${logoSrc}" alt="WebMarcas" class="header-logo" />
      <div class="header-url">
        <a href="https://www.webmarcas.net" style="color: #0EA5E9 !important; text-decoration: none; font-weight: 500;">www.webmarcas.net</a>
      </div>
    </div>
    
    <!-- Gradient Bar -->
    <div class="gradient-bar"></div>
    
    <!-- Title -->
    <h1 class="document-title">${documentTitle}</h1>
    ${documentSubtitle ? `<p class="document-subtitle">${documentSubtitle}</p>` : ''}

    ${legalNotice}

    <!-- Content -->
    <div class="document-content">
      ${formattedContent}
    </div>

    <!-- Signatures -->
    <div class="signatures-section">
      <p class="signatures-intro">
        Por estarem justas e contratadas, as partes assinam o presente de igual teor e forma, de forma digital válido juridicamente.
      </p>
      
      <div class="signatures-grid">
        <div class="signature-box">
          <h4>Assinatura autorizada:</h4>
          <p class="details">WebMarcas Patentes - CNPJ/MF sob o nº 39.528.012/0001-29</p>
          <div class="signature-line">
            ${documentType === 'procuracao' && davilysSignatureBase64 
              ? `<img src="${davilysSignatureBase64}" alt="Assinatura">`
              : '<span class="digital-signature">✓ Assinado Digitalmente</span>'
            }
          </div>
          <p class="signature-caption">
            ${documentType === 'procuracao' 
              ? 'Davilys Danques de Oliveira Cunha'
              : 'Certificação Digital - Lei 14.063/2020'
            }
          </p>
        </div>
        
        <div class="signature-box">
          <h4>Contratante:</h4>
          <p class="details">
            ${signatoryName || 'Nome do Representante'}
            ${signatoryCnpj ? ` - CNPJ sob o nº ${signatoryCnpj}` : ''}
            ${signatoryCpf ? `, CPF sob o n⁰ ${signatoryCpf}` : ''}
          </p>
          <div class="signature-line">
            ${clientSignature 
              ? `<img src="${clientSignature}" alt="Assinatura Cliente">`
              : '<span class="awaiting-signature">Aguardando assinatura...</span>'
            }
          </div>
        </div>
      </div>
    </div>

    ${certificationSection}

    <!-- Footer -->
    <div class="footer">
      <p>WebMarcas Patentes - CNPJ: 39.528.012/0001-29</p>
      <p>Av. Prestes Maia, 241 - Centro, São Paulo - SP, CEP: 01031-001</p>
      <p>Tel: (11) 4200-1656 | contato@webmarcas.net</p>
    </div>
  </div>
</body>
</html>`;
}
