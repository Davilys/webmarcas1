import { toast } from 'sonner';
import { generateDocumentPrintHTML, getSignatureBase64 } from '@/components/contracts/DocumentRenderer';

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
 * Generates a PDF from contract HTML using html2canvas + jsPDF
 * This is the same method used in the admin panel (ContractDetailSheet)
 */
export async function downloadUnifiedContractPDF(options: UnifiedContractDownloadOptions): Promise<void> {
  const {
    content,
    documentType,
    subject,
    signatoryName,
    signatoryCpf,
    signatoryCnpj,
    clientSignature,
    blockchainSignature,
  } = options;

  // Dynamic imports to avoid bundle issues
  const [html2canvasModule, jspdfModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);
  const html2canvas = html2canvasModule.default;
  const { jsPDF } = jspdfModule;

  // Load signature base64 for procuracao documents
  let signatureBase64: string | undefined;
  if (documentType === 'procuracao') {
    signatureBase64 = await getSignatureBase64();
  }

  // Generate the same HTML used in the admin panel
  const printHtml = generateDocumentPrintHTML(
    documentType,
    content,
    clientSignature || null,
    blockchainSignature,
    signatoryName,
    signatoryCpf,
    signatoryCnpj,
    signatureBase64,
    typeof window !== 'undefined' ? window.location.origin : ''
  );

  // Create hidden container for rendering
  const container = document.createElement('div');
  container.innerHTML = printHtml;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.background = 'white';
  document.body.appendChild(container);

  try {
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(container, { 
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
    });
    
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

    // Generate filename
    const sanitizedSubject = subject.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const filename = `${sanitizedSubject || 'contrato'}.pdf`;
    
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Opens a print dialog with the contract HTML
 */
export async function printUnifiedContract(options: UnifiedContractDownloadOptions): Promise<void> {
  const {
    content,
    documentType,
    signatoryName,
    signatoryCpf,
    signatoryCnpj,
    clientSignature,
    blockchainSignature,
  } = options;

  // Load signature base64 for procuracao documents
  let signatureBase64: string | undefined;
  if (documentType === 'procuracao') {
    signatureBase64 = await getSignatureBase64();
  }

  const printHtml = generateDocumentPrintHTML(
    documentType,
    content,
    clientSignature || null,
    blockchainSignature,
    signatoryName,
    signatoryCpf,
    signatoryCnpj,
    signatureBase64,
    typeof window !== 'undefined' ? window.location.origin : ''
  );

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  } else {
    toast.error('Não foi possível abrir a janela de impressão');
  }
}

/**
 * Hook for unified contract download with loading state
 */
export function useUnifiedContractDownload() {
  const download = async (options: UnifiedContractDownloadOptions): Promise<boolean> => {
    try {
      await downloadUnifiedContractPDF(options);
      toast.success('PDF baixado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
      return false;
    }
  };

  const print = async (options: UnifiedContractDownloadOptions): Promise<boolean> => {
    try {
      await printUnifiedContract(options);
      return true;
    } catch (error) {
      console.error('Error printing contract:', error);
      toast.error('Erro ao imprimir. Tente novamente.');
      return false;
    }
  };

  return { download, print };
}
