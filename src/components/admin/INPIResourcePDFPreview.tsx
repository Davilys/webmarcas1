import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoWebmarcas from '@/assets/webmarcas-logo-new.png';
import jsPDF from 'jspdf';

interface ResourceData {
  id: string;
  brand_name: string | null;
  process_number: string | null;
  ncl_class: string | null;
  holder: string | null;
  approved_at: string | null;
}

interface INPIResourcePDFPreviewProps {
  resource: ResourceData;
  content: string;
}

// Function to clean markdown formatting from text
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')     // Remove *italic*
    .replace(/__([^_]+)__/g, '$1')     // Remove __bold__
    .replace(/_([^_]+)_/g, '$1')       // Remove _italic_
    .replace(/`([^`]+)`/g, '$1')       // Remove `code`
    .replace(/#{1,6}\s*/g, '')         // Remove # headings
    .trim();
};

export function INPIResourcePDFPreview({ resource, content }: INPIResourcePDFPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const cleanedContent = cleanMarkdown(content);

  const approvalDate = resource.approved_at 
    ? format(new Date(resource.approved_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o documento.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recurso Administrativo - ${resource.brand_name || 'WebMarcas'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&display=swap');
            @page { margin: 2.5cm; size: A4; }
            body { font-family: 'Crimson Pro', Georgia, serif; font-size: 12pt; line-height: 1.8; color: #1a1a1a; }
            .letterhead { margin-bottom: 40px; border-top: 8px solid #0088cc; padding-top: 20px; }
            .logo-container img { width: 80px; height: 80px; }
            .content { text-align: justify; margin-top: 30px; }
            .content h2 { font-weight: 600; color: #0066aa; font-size: 13pt; margin-top: 20px; margin-bottom: 10px; }
            .content p { margin-bottom: 14px; text-indent: 2cm; }
            .signature { margin-top: 60px; text-align: center; }
            .signature-name { font-weight: 600; color: #0066aa; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 25;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Header decoration - blue gradient bar
      pdf.setFillColor(0, 136, 204);
      pdf.rect(0, 0, pageWidth, 6, 'F');
      pdf.setFillColor(0, 102, 170);
      pdf.rect(0, 6, pageWidth, 2, 'F');
      yPos = 18;

      // Company name
      pdf.setFontSize(22);
      pdf.setTextColor(0, 102, 170);
      pdf.text('WEBMARCAS', margin, yPos + 8);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Propriedade Intelectual e Registro de Marcas', margin, yPos + 15);

      // Separator
      yPos = 45;
      pdf.setDrawColor(0, 136, 204);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos = 55;

      // Content
      pdf.setFontSize(11);
      pdf.setTextColor(30, 30, 30);
      
      const paragraphs = cleanedContent.split('\n\n').filter(p => p.trim());
      
      for (const paragraph of paragraphs) {
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = margin;
        }
        
        const trimmedParagraph = paragraph.trim();
        
        // Check if it's a heading (all caps or starts with Roman numerals)
        const isHeading = /^(I{1,4}V?\.?\s|V?I{0,4}\.?\s|[A-Z][A-Z\s]{5,}$|DO[S]?\s|DA[S]?\s|CONCLUS|PEDIDO|FATOS|FUNDAMENT)/i.test(trimmedParagraph);
        
        if (isHeading && trimmedParagraph.length < 80) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 102, 170);
          pdf.text(trimmedParagraph, margin, yPos);
          pdf.setFont('helvetica', 'normal');
          yPos += 10;
        } else {
          pdf.setFontSize(11);
          pdf.setTextColor(30, 30, 30);
          const lines = pdf.splitTextToSize(trimmedParagraph, contentWidth);
          
          for (const line of lines) {
            if (yPos > pageHeight - 30) {
              pdf.addPage();
              yPos = margin;
            }
            pdf.text(line, margin, yPos);
            yPos += 6;
          }
          yPos += 4;
        }
      }

      // Signature
      if (yPos > pageHeight - 70) {
        pdf.addPage();
        yPos = margin;
      }
      
      yPos += 15;
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Termos em que,', pageWidth / 2, yPos, { align: 'center' });
      pdf.text('Pede deferimento.', pageWidth / 2, yPos + 8, { align: 'center' });
      pdf.text(`São Paulo, ${approvalDate}`, pageWidth / 2, yPos + 20, { align: 'center' });
      
      yPos += 40;
      pdf.setDrawColor(0, 102, 170);
      pdf.setLineWidth(0.5);
      pdf.line(pageWidth / 2 - 35, yPos, pageWidth / 2 + 35, yPos);
      
      yPos += 6;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 102, 170);
      pdf.text('Davilys Danques de Oliveira Cunha', pageWidth / 2, yPos, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Procurador', pageWidth / 2, yPos + 6, { align: 'center' });
      pdf.text('CPF 393.239.118-79', pageWidth / 2, yPos + 12, { align: 'center' });

      // Footer on each page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const footerY = pageHeight - 12;
        pdf.setDrawColor(0, 136, 204);
        pdf.setLineWidth(0.5);
        pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Av. Brigadeiro Luiz Antônio, 2696 | (11) 9 1112-0225 | juridico@webmarcas.net | www.webmarcas.net', pageWidth / 2, footerY, { align: 'center' });
      }

      pdf.save(`Recurso_${resource.brand_name?.replace(/\s+/g, '_') || 'INPI'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Parse content for display
  const renderContent = () => {
    return cleanedContent.split('\n\n').filter(p => p.trim()).map((paragraph, idx) => {
      const trimmed = paragraph.trim();
      const isHeading = /^(I{1,4}V?\.?\s|V?I{0,4}\.?\s|[A-Z][A-Z\s]{5,}$|DO[S]?\s|DA[S]?\s|CONCLUS|PEDIDO|FATOS|FUNDAMENT)/i.test(trimmed);
      
      if (isHeading && trimmed.length < 80) {
        return <h2 key={idx} className="text-base font-semibold mt-6 mb-3" style={{ color: '#0066aa' }}>{trimmed}</h2>;
      }
      return <p key={idx} className="mb-4 text-justify" style={{ textIndent: '2cm' }}>{trimmed}</p>;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 justify-end print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
        <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
          {isGeneratingPDF ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      <div 
        ref={printRef}
        className="bg-white text-gray-900 shadow-2xl mx-auto overflow-hidden rounded-lg"
        style={{ width: '210mm', minHeight: '297mm', fontFamily: "Georgia, serif", fontSize: '12pt', lineHeight: '1.8' }}
      >
        {/* Header gradient bar */}
        <div className="w-full h-2" style={{ background: 'linear-gradient(90deg, #0088cc 0%, #0066aa 50%, #004488 100%)' }} />

        <div className="px-16 py-10">
          {/* Letterhead */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              <img 
                src={logoWebmarcas} 
                alt="WebMarcas" 
                className="object-contain"
                style={{ width: '75px', height: '75px' }} 
              />
              <div>
                <h1 className="text-2xl font-bold tracking-wide" style={{ color: '#0066aa' }}>WEBMARCAS</h1>
                <p className="text-sm text-gray-500 mt-1">Propriedade Intelectual e Registro de Marcas</p>
              </div>
            </div>
            <div className="text-right text-xs text-gray-400 mt-2">
              <p>CNPJ: 00.000.000/0001-00</p>
            </div>
          </div>

          {/* Separator */}
          <div className="w-full h-0.5 mb-8" style={{ background: 'linear-gradient(90deg, #0088cc, #0066aa, transparent)' }} />

          {/* Content */}
          <div className="text-justify" style={{ color: '#1a1a1a' }}>
            {renderContent()}
          </div>

          {/* Signature */}
          <div className="mt-16 text-center">
            <p className="mb-4" style={{ color: '#374151' }}>Termos em que,</p>
            <p className="mb-4" style={{ color: '#374151' }}>Pede deferimento.</p>
            <p className="mb-10" style={{ color: '#374151' }}>São Paulo, {approvalDate}</p>
            <div className="mt-10">
              <div className="w-52 h-0.5 mx-auto mb-3" style={{ background: '#0066aa' }} />
              <p className="font-semibold text-base" style={{ color: '#0066aa' }}>Davilys Danques de Oliveira Cunha</p>
              <p className="text-sm text-gray-600">Procurador</p>
              <p className="text-sm text-gray-500">CPF 393.239.118-79</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-4" style={{ borderTop: '2px solid #0088cc' }}>
            <div className="flex justify-center gap-6 text-xs text-gray-500 flex-wrap">
              <span>📍 Av. Brigadeiro Luiz Antônio, 2696</span>
              <span>📞 (11) 9 1112-0225</span>
              <span>✉️ juridico@webmarcas.net</span>
              <span>🌐 www.webmarcas.net</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
