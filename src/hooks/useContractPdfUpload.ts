import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Dynamic imports for heavy libraries
let jsPDF: any = null;
let html2canvas: any = null;

async function loadPdfLibraries() {
  if (!jsPDF) {
    const jsPDFModule = await import('jspdf');
    jsPDF = jsPDFModule.jsPDF;
  }
  if (!html2canvas) {
    const html2canvasModule = await import('html2canvas');
    html2canvas = html2canvasModule.default;
  }
}

interface UploadResult {
  success: boolean;
  publicUrl?: string;
  documentId?: string;
  error?: string;
}

interface GeneratePdfOptions {
  contractId: string;
  contractHtml: string;
  brandName: string;
  documentType?: string;
  userId?: string;
  processId?: string;
}

/**
 * Generates a PDF from HTML content and uploads it to storage.
 * This creates a real PDF file that can be viewed and downloaded.
 */
export async function generateAndUploadContractPdf(
  options: GeneratePdfOptions
): Promise<UploadResult> {
  const { contractId, contractHtml, brandName, documentType, userId, processId } = options;

  try {
    console.log('Starting PDF generation for contract:', contractId);

    // Load libraries dynamically
    await loadPdfLibraries();

    // Create a temporary container for the HTML
    const container = document.createElement('div');
    container.innerHTML = contractHtml;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    container.style.padding = '40px';
    document.body.appendChild(container);

    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // 10mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add pages if content is too tall
    let yOffset = 10;
    const maxPageHeight = pageHeight - 20; // 10mm margin on top and bottom

    if (imgHeight <= maxPageHeight) {
      // Single page
      pdf.addImage(imgData, 'JPEG', 10, yOffset, imgWidth, imgHeight);
    } else {
      // Multiple pages
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const pageImgHeight = Math.min(remainingHeight, maxPageHeight);
        const canvasSliceHeight = (pageImgHeight * canvas.width) / imgWidth;

        // Create a slice of the canvas
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = canvasSliceHeight;
        const sliceCtx = sliceCanvas.getContext('2d');
        
        if (sliceCtx) {
          sliceCtx.drawImage(
            canvas, 
            0, sourceY, canvas.width, canvasSliceHeight,
            0, 0, canvas.width, canvasSliceHeight
          );

          const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.9);
          
          if (sourceY > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(sliceImgData, 'JPEG', 10, 10, imgWidth, pageImgHeight);
        }

        sourceY += canvasSliceHeight;
        remainingHeight -= pageImgHeight;
      }
    }

    // Convert PDF to base64
    const pdfBase64 = pdf.output('datauristring');
    
    console.log('PDF generated, uploading...');

    // Upload to backend
    const fileName = `Contrato_${brandName.replace(/\s+/g, '_')}_${Date.now()}`;
    
    const { data, error } = await supabase.functions.invoke('upload-signed-contract-pdf', {
      body: {
        contractId,
        documentType: documentType || 'contrato',
        pdfBase64,
        fileName,
        userId,
        processId,
        contractHtml,
      },
    });

    if (error) {
      console.error('Error uploading PDF:', error);
      return {
        success: false,
        error: error.message || 'Erro ao fazer upload do PDF',
      };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || 'Erro desconhecido ao fazer upload',
      };
    }

    console.log('PDF uploaded successfully:', data.data);

    return {
      success: true,
      publicUrl: data.data.publicUrl,
      documentId: data.data.documentId,
    };
  } catch (error: any) {
    console.error('Error generating/uploading PDF:', error);
    return {
      success: false,
      error: error.message || 'Erro ao gerar PDF',
    };
  }
}

/**
 * Generates PDF HTML content with all certification data
 */
export function generateSignedContractHtml(
  content: string,
  brandName: string,
  clientName: string,
  clientCpf: string,
  blockchainSignature?: {
    hash?: string;
    timestamp?: string;
    txId?: string;
    network?: string;
    ipAddress?: string;
  }
): string {
  const htmlContent = content
    .split('\n')
    .filter(line => !line.includes('CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS'))
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<div style="height: 12px;"></div>';
      
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
      
      if (trimmed.match(/^_+$/)) return '';
      
      if (trimmed === 'CONTRATADA:' || trimmed === 'CONTRATANTE:') {
        return `<p style="font-size: 11px; font-weight: bold; text-align: center; margin-top: 24px; margin-bottom: 4px;">${trimmed}</p>`;
      }
      
      if (trimmed.startsWith('São Paulo,')) {
        return `<p style="font-size: 11px; margin-top: 24px; margin-bottom: 24px;">${trimmed}</p>`;
      }
      
      return `<p style="font-size: 11px; margin-bottom: 12px; line-height: 1.6;">${trimmed}</p>`;
    })
    .join('\n');

  const certificationSection = blockchainSignature?.hash ? `
    <div style="margin-top: 32px; padding: 20px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <span style="font-weight: bold; color: #166534; font-size: 14px;">✓ CONTRATO ASSINADO DIGITALMENTE</span>
      </div>
      
      <div style="font-family: monospace; color: #166534; background: #dcfce7; padding: 12px; border-radius: 4px; font-size: 10px;">
        <div style="margin-bottom: 6px;"><strong>Hash SHA-256:</strong> ${blockchainSignature.hash}</div>
        <div style="margin-bottom: 6px;"><strong>Data/Hora:</strong> ${blockchainSignature.timestamp ? new Date(blockchainSignature.timestamp).toLocaleString('pt-BR') : '-'}</div>
        <div style="margin-bottom: 6px;"><strong>Endereço IP:</strong> ${blockchainSignature.ipAddress || '-'}</div>
        ${blockchainSignature.txId ? `<div style="margin-bottom: 6px;"><strong>ID da Transação:</strong> ${blockchainSignature.txId}</div>` : ''}
        <div><strong>Rede:</strong> ${blockchainSignature.network || 'Bitcoin (OpenTimestamps)'}</div>
      </div>
      
      <p style="font-size: 10px; color: #166534; margin-top: 12px;">
        Verifique a autenticidade em: ${window.location.origin}/verificar-contrato?hash=${blockchainSignature.hash}
      </p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato WebMarcas - ${brandName}</title>
  <style>
    body { 
      font-family: 'Segoe UI', sans-serif; 
      line-height: 1.6; 
      color: #1a1a2e; 
      background: white; 
      padding: 40px; 
      font-size: 11px; 
      max-width: 800px;
      margin: 0 auto;
    }
    .header { 
      display: flex; 
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 16px;
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
    .highlight-box { 
      background: #fef3c7; 
      padding: 16px; 
      border-radius: 4px; 
      margin-bottom: 24px; 
      border: 1px solid #f59e0b; 
    }
  </style>
</head>
<body>
  <div class="header">
    <span style="font-size: 24px; font-weight: bold; color: #0284c7;">WebMarcas</span>
    <span style="color: #0284c7; font-size: 14px;">www.webmarcas.net</span>
  </div>
  
  <div class="gradient-bar"></div>
  
  <h1 class="main-title">Acordo do Contrato - Anexo I</h1>
  
  <div class="contract-title-box">
    <p style="font-weight: 600; font-size: 12px;">CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORAMENTO PARA REGISTRO DE MARCA JUNTO AO INPI</p>
  </div>
  
  <div class="highlight-box">
    <p style="margin-bottom: 8px;">Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas.</p>
    <p>Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de Pagamentos e Outras Avenças".</p>
  </div>
  
  <div>
    ${htmlContent}
  </div>
  
  ${certificationSection}
  
  <div style="margin-top: 40px; text-align: center; color: #6b7280; font-size: 9px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
    <p>Contrato gerado e assinado eletronicamente pelo sistema WebMarcas</p>
    <p>www.webmarcas.net | contato@webmarcas.net</p>
  </div>
</body>
</html>`;
}
