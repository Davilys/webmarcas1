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
 * Generates a PDF from contract HTML using the same method as the admin panel.
 * Uses html2canvas + jsPDF with generateDocumentPrintHTML for consistent formatting.
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

  // Dynamic imports to avoid typechecker stack overflow
  const [html2canvasModule, jspdfModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);
  const html2canvas = html2canvasModule.default;
  const { jsPDF } = jspdfModule;

  // Get signature for procuracao type
  let davilysSignatureBase64: string | undefined;
  if (documentType === 'procuracao') {
    davilysSignatureBase64 = await getSignatureBase64();
  }

  // Generate HTML using the same function as admin
  const printHtml = generateDocumentPrintHTML(
    documentType,
    content,
    clientSignature || null,
    blockchainSignature,
    signatoryName,
    signatoryCpf,
    signatoryCnpj,
    davilysSignatureBase64,
    window.location.origin
  );

  // Create temporary container
  const container = document.createElement('div');
  container.innerHTML = printHtml;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm';
  container.style.background = 'white';
  document.body.appendChild(container);

  try {
    // Capture with html2canvas
    const canvas = await html2canvas(container, { 
      scale: 2,
      useCORS: true,
      logging: false,
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
    // Cleanup
    document.body.removeChild(container);
  }
}

/**
 * Opens a print preview window with the contract content.
 * Uses generateDocumentPrintHTML for consistent formatting.
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

  // Get signature for procuracao type
  let davilysSignatureBase64: string | undefined;
  if (documentType === 'procuracao') {
    davilysSignatureBase64 = await getSignatureBase64();
  }

  // Generate HTML using the same function as admin
  const printHtml = generateDocumentPrintHTML(
    documentType,
    content,
    clientSignature || null,
    blockchainSignature,
    signatoryName,
    signatoryCpf,
    signatoryCnpj,
    davilysSignatureBase64,
    window.location.origin
  );

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
