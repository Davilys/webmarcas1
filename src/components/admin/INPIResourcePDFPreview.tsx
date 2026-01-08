import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoCircular from '@/assets/webmarcas-logo-circular.png';
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

export function INPIResourcePDFPreview({ resource, content }: INPIResourcePDFPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
            .letterhead { margin-bottom: 40px; border-top: 8px solid #1a365d; padding-top: 20px; }
            .logo-container img { width: 80px; height: 80px; }
            .content { text-align: justify; margin-top: 30px; }
            .content h1, .content h2 { font-weight: 600; color: #1a365d; }
            .content h1 { text-align: center; font-size: 14pt; text-transform: uppercase; }
            .content p { margin-bottom: 14px; text-indent: 2cm; }
            .signature { margin-top: 60px; text-align: center; }
            .signature-name { font-weight: 600; color: #1a365d; }
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

      // Header decoration
      pdf.setFillColor(26, 54, 93);
      pdf.rect(0, 0, pageWidth, 8, 'F');
      yPos = 20;

      // Logo and company name
      pdf.setFontSize(18);
      pdf.setTextColor(26, 54, 93);
      pdf.text('WEBMARCAS', margin + 25, yPos + 5);
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Propriedade Intelectual e Registro de Marcas', margin + 25, yPos + 12);

      // Separator
      yPos = 45;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos = 55;

      // Content
      pdf.setFontSize(12);
      pdf.setTextColor(30, 30, 30);
      
      const paragraphs = content.split('\n\n');
      
      for (const paragraph of paragraphs) {
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = margin;
        }
        
        const isHeading = paragraph.match(/^(I{1,3}V?\.?\s|V?I{0,3}\.?\s|[A-Z][A-Z\s]+$)/);
        
        if (isHeading) {
          pdf.setFontSize(13);
          pdf.setTextColor(26, 54, 93);
          pdf.text(paragraph.trim(), margin, yPos);
          yPos += 10;
        } else {
          pdf.setFontSize(11);
          pdf.setTextColor(30, 30, 30);
          const lines = pdf.splitTextToSize(paragraph.trim(), contentWidth);
          pdf.text(lines, margin, yPos);
          yPos += lines.length * 6 + 6;
        }
      }

      // Signature
      if (yPos > pageHeight - 80) {
        pdf.addPage();
        yPos = margin;
      }
      
      yPos += 20;
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Termos em que,', pageWidth / 2, yPos, { align: 'center' });
      pdf.text('Pede deferimento.', pageWidth / 2, yPos + 8, { align: 'center' });
      pdf.text(`São Paulo, ${approvalDate}`, pageWidth / 2, yPos + 16, { align: 'center' });
      
      yPos += 35;
      pdf.setDrawColor(26, 54, 93);
      pdf.line(pageWidth / 2 - 30, yPos, pageWidth / 2 + 30, yPos);
      
      yPos += 8;
      pdf.setFontSize(12);
      pdf.setTextColor(26, 54, 93);
      pdf.text('Davilys Danques de Oliveira Cunha', pageWidth / 2, yPos, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      pdf.text('Procurador', pageWidth / 2, yPos + 6, { align: 'center' });
      pdf.text('CPF 393.239.118-79', pageWidth / 2, yPos + 12, { align: 'center' });

      // Footer
      const footerY = pageHeight - 15;
      pdf.setDrawColor(26, 54, 93);
      pdf.setLineWidth(0.5);
      pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Av. Brigadeiro Luiz Antônio, 2696 | (11) 9 1112-0225 | juridico@webmarcas.net | www.webmarcas.net', pageWidth / 2, footerY, { align: 'center' });

      pdf.save(`Recurso_${resource.brand_name?.replace(/\s+/g, '_') || 'INPI'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
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
        className="bg-white text-gray-900 shadow-2xl mx-auto overflow-hidden"
        style={{ width: '210mm', minHeight: '297mm', fontFamily: "Georgia, serif", fontSize: '12pt', lineHeight: '1.8' }}
      >
        <div className="w-full h-2" style={{ background: 'linear-gradient(90deg, #1a365d 0%, #2d4a7c 50%, #4a6fa5 100%)' }} />

        <div className="px-16 py-10">
          <div className="flex items-start justify-between mb-10">
            <div className="flex items-center gap-4">
              <img src={logoCircular} alt="WebMarcas" style={{ width: '70px', height: '70px' }} />
              <div>
                <h1 className="text-xl font-semibold tracking-wide" style={{ color: '#1a365d' }}>WEBMARCAS</h1>
                <p className="text-xs text-gray-500 mt-1">Propriedade Intelectual e Registro de Marcas</p>
              </div>
            </div>
            <div className="text-right">
              <div className="w-24 h-1 ml-auto mb-2" style={{ background: '#1a365d' }} />
              <div className="w-16 h-1 ml-auto" style={{ background: '#4a6fa5' }} />
            </div>
          </div>

          <div className="w-full h-px mb-8" style={{ background: 'linear-gradient(90deg, transparent, #cbd5e0, transparent)' }} />

          <div className="text-justify" style={{ color: '#1a1a1a' }}>
            {content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.match(/^(I{1,3}V?\.?\s|V?I{0,3}\.?\s|[A-Z][A-Z\s]+$)/)) {
                return <h2 key={idx} className="text-base font-semibold mt-6 mb-3" style={{ color: '#1a365d' }}>{paragraph}</h2>;
              }
              return <p key={idx} className="mb-4" style={{ textIndent: '2cm' }}>{paragraph}</p>;
            })}
          </div>

          <div className="mt-16 text-center">
            <p className="mb-6" style={{ color: '#374151' }}>Termos em que,</p>
            <p className="mb-6" style={{ color: '#374151' }}>Pede deferimento.</p>
            <p className="mb-10" style={{ color: '#374151' }}>São Paulo, {approvalDate}</p>
            <div className="mt-12">
              <div className="w-48 h-px mx-auto mb-3" style={{ background: '#1a365d' }} />
              <p className="font-semibold text-base" style={{ color: '#1a365d' }}>Davilys Danques de Oliveira Cunha</p>
              <p className="text-sm text-gray-600">Procurador</p>
              <p className="text-sm text-gray-500">CPF 393.239.118-79</p>
            </div>
          </div>

          <div className="mt-20 pt-4" style={{ borderTop: '2px solid #1a365d' }}>
            <div className="flex justify-center gap-8 text-xs text-gray-500">
              <span>Av. Brigadeiro Luiz Antônio, 2696</span>
              <span>(11) 9 1112-0225</span>
              <span>juridico@webmarcas.net</span>
              <span>www.webmarcas.net</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
