import { useMemo } from 'react';
import webmarcasLogo from '@/assets/webmarcas-logo.png';

// Assinatura do Davilys em base64 (placeholder - será substituído pela imagem real)
const DAVILYS_SIGNATURE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAABkCAYAAAA8AQ3AAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAgVSURBVHhe7d1/rBVVHcfxy1OSJNM0NUxNszKtzB9paZqmaZn9MDVTyzRN0zRN0zRN0zRN0zRN0zRN0zRN0zRN0zQd5v4/z3xm3nDv5d6X8+Ge+76wFgvOzJk5c+acM3N+HDQAAAAAAAAAAAAAAAAAAAAAAAAAAACAbr59q72n3b3aA6rd97f7R7sP0O4D7e5W7e7W7oO0ux+z27W7e7V7P+3ud7f2wNrtvu2u1+5+dLu91g5Y9+52/2v3AXbvb3dvo92D2t2/7e5Xtwda+2Dtdm+lXYDdB9i9n927afc+drs/3O4D7N5Xu/u3u/+0+wC7D9DuPu3uU+0+wO79tbu/dg+q3f3rdu+j3ftrd/9p9wF2H6Dd+2h3v9p9gN0H2L2/dvdv9z7a3b929+92H2D3ftpd2u7+dbsP0O5+tbu/dver2+3+2+5+dLv91+5+dbt/271v3e7/tHsf3W6/tntf3e7/7O5Tt/t/u/eh2+2/dvel2/2f3X3odvuv3X1pd//a3Zdut//a3Y9ud/+63X3odvuv3ftqt//bvY+1+0C793O7z+2+Z7d7v+0+QLv70+0+ULsP0O5+dLv7te0+wO79tbsfbbcftbtP3e7/7N5Pt9v/7e5Lt9t/7d5Xu/3f7n3rdv9vd39rd/++3fvV7f7P7v1odze73f3pdvdv2+1/du+v3d2s3f3odvev291v3W7/sXtfu939ane/dbv91+7+1e7+bbv7r9vt/3b3p93dbLv71O3uX7e7f93ufut2+4/d+2q3/9ndv253v9pdaLf/2N2fbnez291v3e7+dLv71+7+1O7C2t2fbre/ud396na3293/7O5P7e5m7e5Pu7tZu/3N7n51u9vs7k+329+63f3odvev3f3odvu73f3pdjezbrf/2L2fdvej2+1vdven2+0/du+r3f5jd3+63f7S7f53u/er293Mut3+Ync/ut39aHd/dbv7pdvdz27X/+zeT7e7X7X/d+3ep263v3S7+9Ht7k+3279ud391u/ul2+3vdver2+1f3e7+dLv7pdvt73bvp93+0u3ut253P7rd/dXt9ne7+9Xtbna7+9Ht7le32+2/dvel292vbre/dLv7pdvd7Hb3p9vdL93uZrfbv+zev263v3S7+6Xb7e9276fb3S/dbv+xez/dbv/odvdLt7vZ7e5Pt7tZ7fYvu/fT7e6XbnezdrP7drer292sbne/dLub3e7+dLv7pdvdrN39aXez2t2fbrez2t0v3e5mdbv7pdvdrN39anez2t2fdrez2t0v3e5m7e5Xt7tZu/vT7W5mu/vV7W7W7v50u5u1u3/d7mbt7k+3u1m7+9ftbtbu/nW7m7W7f93uZu3uX7e7Wbv72+1u1u7+dbv/123323a3s9vdv253f7vd/Wh3N7vd/ep2+2+7+9ftbna7+9Xt7t92t7Pb3b9u97/b3c5ud/+63f3b7m52u/vZ7e7fdrezzW53P7vd/dvudrbb3c9ud/+2u53d7v51u/ux3e1st7u/3e5+bHc72+3ub7e7P9vdzu52+9vt7sd2t7Pd7n53u/ux3e1sdrd/3e7+bHc72+32v9vdj+1uZ7vd/e52N6vd7Wy323/d7v5sdzubdbv97XY3q93tbLfbv253M9vdzma72/9udzPb3c52u/3tdjez3e1stp+32+1s1u32t9vdzHa3s9l+2G63s9l+1O62s1n/2e22s9n+1u62s/1sdxu73fb/brd9v93tsH1t/2532/Z17S7d7rbN+tB2t23b57S7dPvYPrfd7bD9a7e7bfuadjfbj/a7bdu2z+12u227y+52O2yf1+7S7WL/2+22bZ/X7tLtY/vU7rZt+9x2l24X+89ut23bPrfb7bD9a/+7bbvPa3fpdrH/3e62bfu8drerxf61+23bts/tdnu0f+13t23bPq/d7dLtYv/a7bZt+7x2t8P2uf1v27Z9Xrvbpf2t/W+32/Z57W6X9q/Wbrfb/nfbjvaz/a/dpe2H+9+2o/1s/2t36faxfW072q/2u21H+9X+1+7S9rF9bDvav/a/dpe2j+xr29H+tN9tO9qP9r92t237z/6z7bD9Zr/bdtg+s/9sO2w/2e+2He0n+9u2o/1iP9t2tB/sZ9uO9oP9a9vRvrfPbDvar/arbUf72n6y7Wi/2k+2He1X+8m2o/1oP9l2tO/tK9uO9rV9ZdvR/rSvbDvat/aVbUf70r6y7Whf21e2He1b+8q2o/1pX9l2tG/tK9uO9rV9ZdvRvrWvbDvad/aVbUf7zv6y7Wi/2Ve2He0n+8u2o/1gX9l2tO/tL9uO9r39ZdvRfrC/bDval/aXbUf70/6y7Wi/2V+2He0n+8u2o/1sP9p2tO/sN9uO9qN9ZtvRfrTfbDva9/aVbUf72X6z7Wif2n+2He0r+9G2o/1q39l2tK/tM9uO9rN9ZtvRfrbPbDvaz/aZbUf72j6z7Wj/2W+2He1n+822o/1ov9l2tB/tN9uO9rN9ZtvRfrLvbDvaN/adbUf7xf6z7Wi/2I+2He1X+8+2o/1q/9l2tJ/tR9uO9ov9aNvRfrQ/bTvaj/afbUf70f6z7Wg/2p+2He1H+9O2o/1of9p2tB/tT9uO9qP9advRfrf/bDvad/afbUf7xf6z7Wh/2Z+2He0X+9O2o/1gP9p2tO/sP9uO9pP9aNvRvrffbDva9/abbUf70X6z7Wi/2H+2He0X+8+2o/1s/9l2tF/sP9uO9pf9Z9vR/rL/bDvar/afbUf7y/6z7Wi/2X+2He0v+8+2o/1t/9l2tL/tP9uOdqL9Z9vRTrL/bDvaKfafbUc7xf6z7Wgn2n+2He1E+8+2o51s/9l2tFPtP9uOdpr9Z9vRTrP/bDvaKfafbUc7xf6z7Wgn23+2He1k+8+2o51i/9l2tFPtP9uOdor9Z9vRTrH/bDvaSfafbUc7yf6z7Win2H+2He0U+8+2o51q/9l2tFPtP9uOdor9Z9vRTrL/bDvaSfafbUc7yf6z7Win2n+2He1U+8+2o53mAAAAAAAAAAAAAAAAAAAAAADY+/4HLWkCgE3rIAkAAAAASUVORK5CYII=';

interface BlockchainSignature {
  hash: string;
  timestamp: string;
  txId: string;
  network: string;
  ipAddress: string;
}

interface DocumentRendererProps {
  documentType: 'procuracao' | 'distrato_multa' | 'distrato_sem_multa';
  content: string;
  clientSignature?: string | null;
  contractorSignature?: string;
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
  contractorSignature = DAVILYS_SIGNATURE_BASE64,
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
      default:
        return 'DOCUMENTO';
    }
  }, [documentType]);

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
            <p>www.webmarcas.com.br</p>
            <p>contato@webmarcas.com.br</p>
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
        <div className="prose prose-sm max-w-none text-justify leading-relaxed">
          {formattedContent.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="mb-4 text-gray-800">
              {paragraph}
            </p>
          ))}
        </div>

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
              <div className="border-b-2 border-black mx-auto w-64 pb-2">
                {contractorSignature && (
                  <img 
                    src={contractorSignature} 
                    alt="Assinatura WebMarcas"
                    className="h-16 mx-auto object-contain"
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Davilys Danques de Oliveira Cunha
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

        {/* Digital Certification Section */}
        {(showCertificationSection || blockchainSignature?.hash) && blockchainSignature && (
          <div className="mt-12 pt-8 border-t-2 border-blue-600">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                CERTIFICAÇÃO DIGITAL E VALIDADE JURÍDICA
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
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
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Rede Blockchain</p>
                    <p className="text-sm">{blockchainSignature.network}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">IP do Signatário</p>
                    <p className="text-sm">{blockchainSignature.ipAddress}</p>
                  </div>
                  <div className="flex items-center justify-center p-4 bg-white rounded border">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">QR Code de Verificação</p>
                      <QRCodeSVG 
                        value={`${VERIFICATION_BASE_URL}?hash=${blockchainSignature.hash}`}
                        size={96}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 mt-4 italic">
                Este documento foi assinado eletronicamente e possui validade jurídica conforme 
                Lei 14.063/2020 e MP 2.200-2/2001. Verifique a autenticidade em: 
                webmarcas.com.br/verificar-contrato
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-100 px-8 py-4 border-t text-center text-xs text-gray-500">
        <p>WebMarcas Patentes - CNPJ: 39.528.012/0001-29</p>
        <p>Av. Prestes Maia, 241 - Centro, São Paulo - SP, CEP: 01031-001</p>
        <p>Tel: (11) 4200-1656 | contato@webmarcas.com.br</p>
      </div>
    </div>
  );
}

export function generateDocumentPrintHTML(
  documentType: 'procuracao' | 'distrato_multa' | 'distrato_sem_multa',
  content: string,
  clientSignature: string | null,
  contractorSignature: string,
  blockchainSignature?: BlockchainSignature,
  signatoryName?: string,
  signatoryCpf?: string,
  signatoryCnpj?: string
): string {
  const documentTitle = documentType === 'procuracao' 
    ? 'PROCURAÇÃO' 
    : 'Acordo de Distrato de Parceria - Anexo I';

  const legalNotice = documentType !== 'procuracao'
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

  const certificationSection = blockchainSignature?.hash
    ? `<div style="margin-top: 48px; padding-top: 32px; border-top: 2px solid #1E40AF;">
        <div style="background: #EFF6FF; border-radius: 8px; padding: 24px;">
          <h3 style="font-size: 18px; font-weight: bold; color: #1E3A8A; margin-bottom: 16px;">
            ✓ CERTIFICAÇÃO DIGITAL E VALIDADE JURÍDICA
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
              <p style="font-size: 12px; font-weight: 600; color: #6B7280;">HASH SHA-256</p>
              <p style="font-size: 10px; font-family: monospace; background: white; padding: 8px; border-radius: 4px; word-break: break-all;">
                ${blockchainSignature.hash}
              </p>
              <p style="font-size: 12px; font-weight: 600; color: #6B7280; margin-top: 12px;">DATA/HORA</p>
              <p style="font-size: 14px;">${blockchainSignature.timestamp}</p>
              <p style="font-size: 12px; font-weight: 600; color: #6B7280; margin-top: 12px;">ID TRANSAÇÃO</p>
              <p style="font-size: 10px; font-family: monospace;">${blockchainSignature.txId}</p>
            </div>
            <div>
              <p style="font-size: 12px; font-weight: 600; color: #6B7280;">REDE BLOCKCHAIN</p>
              <p style="font-size: 14px;">${blockchainSignature.network}</p>
              <p style="font-size: 12px; font-weight: 600; color: #6B7280; margin-top: 12px;">IP SIGNATÁRIO</p>
              <p style="font-size: 14px;">${blockchainSignature.ipAddress}</p>
            </div>
          </div>
          <p style="font-size: 12px; color: #4B5563; margin-top: 16px; font-style: italic;">
            Documento com validade jurídica conforme Lei 14.063/2020 e MP 2.200-2/2001.
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
          <p>www.webmarcas.com.br</p>
          <p>contato@webmarcas.com.br</p>
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
          <div style="border-bottom: 2px solid black; width: 256px; margin: 16px auto; padding-bottom: 8px;">
            ${contractorSignature ? `<img src="${contractorSignature}" alt="Assinatura" style="height: 64px; object-fit: contain;">` : ''}
          </div>
          <p style="font-size: 10px; color: #6B7280;">Davilys Danques de Oliveira Cunha</p>
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
      <p>Tel: (11) 4200-1656 | contato@webmarcas.com.br</p>
    </div>
  </div>
</body>
</html>`;
}
