import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoWebmarcas from '@/assets/webmarcas-logo-new.png';
import signatureImage from '@/assets/davilys-signature.png';
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

const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s*/g, '')
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
            .letterhead { margin-bottom: 40px; border-top: 8px solid #1e3a5f; padding-top: 20px; }
            .logo-container img { width: 80px; height: 80px; }
            .content { text-align: justify; margin-top: 30px; }
            .content h2 { font-weight: 600; color: #1e3a5f; font-size: 13pt; margin-top: 20px; margin-bottom: 10px; }
            .content p { margin-bottom: 14px; text-indent: 2cm; }
            .signature { margin-top: 60px; text-align: center; }
            .signature-name { font-weight: 600; color: #1e3a5f; }
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

      // Header - dark blue bar (matching contract identity)
      pdf.setFillColor(30, 58, 95); // #1e3a5f
      pdf.rect(0, 0, pageWidth, 6, 'F');
      pdf.setFillColor(20, 45, 75);
      pdf.rect(0, 6, pageWidth, 2, 'F');
      yPos = 18;

      // Company name with identity colors
      pdf.setFontSize(22);
      pdf.setTextColor(30, 58, 95);
      pdf.text('WEBMARCAS', margin, yPos + 8);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Propriedade Intelectual e Registro de Marcas', margin, yPos + 15);
      
      // Right side info
      pdf.setFontSize(8);
      pdf.setTextColor(130, 130, 130);
      pdf.text('CNPJ: 39.528.012/0001-29', pageWidth - margin, yPos + 4, { align: 'right' });
      pdf.text('OAB/SP: Davilys D. O. Cunha', pageWidth - margin, yPos + 9, { align: 'right' });
      pdf.text('www.webmarcas.net', pageWidth - margin, yPos + 14, { align: 'right' });

      // Separator
      yPos = 45;
      pdf.setDrawColor(30, 58, 95);
      pdf.setLineWidth(0.8);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      pdf.setDrawColor(200, 175, 55); // Gold accent
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPos + 1.5, pageWidth - margin, yPos + 1.5);
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
        const isHeading = /^(I{1,4}V?\.?\s|V?I{0,4}\.?\s|[A-Z][A-Z\s]{5,}$|DO[S]?\s|DA[S]?\s|CONCLUS|PEDIDO|FATOS|FUNDAMENT|RECURSO)/i.test(trimmedParagraph);
        
        if (isHeading && trimmedParagraph.length < 100) {
          if (yPos > margin + 10) yPos += 4;
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 58, 95);
          
          const headingLines = pdf.splitTextToSize(trimmedParagraph, contentWidth);
          for (const line of headingLines) {
            if (yPos > pageHeight - 30) { pdf.addPage(); yPos = margin; }
            pdf.text(line, margin, yPos);
            yPos += 7;
          }
          
          // Underline for main headings
          if (trimmedParagraph.length < 60) {
            pdf.setDrawColor(200, 175, 55);
            pdf.setLineWidth(0.3);
            pdf.line(margin, yPos - 2, margin + 40, yPos - 2);
          }
          
          pdf.setFont('helvetica', 'normal');
          yPos += 3;
        } else {
          pdf.setFontSize(11);
          pdf.setTextColor(30, 30, 30);
          const lines = pdf.splitTextToSize(trimmedParagraph, contentWidth);
          
          for (const line of lines) {
            if (yPos > pageHeight - 30) { pdf.addPage(); yPos = margin; }
            pdf.text(line, margin, yPos);
            yPos += 6;
          }
          yPos += 4;
        }
      }

      // Signature block
      if (yPos > pageHeight - 80) { pdf.addPage(); yPos = margin; }
      
      yPos += 15;
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Termos em que,', pageWidth / 2, yPos, { align: 'center' });
      pdf.text('Pede deferimento.', pageWidth / 2, yPos + 8, { align: 'center' });
      pdf.text(`São Paulo, ${approvalDate}`, pageWidth / 2, yPos + 20, { align: 'center' });
      
      yPos += 40;
      pdf.setDrawColor(30, 58, 95);
      pdf.setLineWidth(0.5);
      pdf.line(pageWidth / 2 - 35, yPos, pageWidth / 2 + 35, yPos);
      
      yPos += 6;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 58, 95);
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
        
        // Double line footer
        pdf.setDrawColor(30, 58, 95);
        pdf.setLineWidth(0.5);
        pdf.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
        pdf.setDrawColor(200, 175, 55);
        pdf.setLineWidth(0.3);
        pdf.line(margin, footerY - 6.5, pageWidth - margin, footerY - 6.5);
        
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Av. Brigadeiro Luiz Antônio, 2696, Centro — São Paulo/SP — CEP 01402-000', pageWidth / 2, footerY - 2, { align: 'center' });
        pdf.text('Tel: (11) 9 1112-0225  |  juridico@webmarcas.net  |  www.webmarcas.net', pageWidth / 2, footerY + 2, { align: 'center' });
        
        // Page number
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);
        pdf.text(`${i}/${totalPages}`, pageWidth - margin, footerY - 2, { align: 'right' });
      }

      pdf.save(`Recurso_${resource.brand_name?.replace(/\s+/g, '_') || 'INPI'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderContent = () => {
    return cleanedContent.split('\n\n').filter(p => p.trim()).map((paragraph, idx) => {
      const trimmed = paragraph.trim();
      const isHeading = /^(I{1,4}V?\.?\s|V?I{0,4}\.?\s|[A-Z][A-Z\s]{5,}$|DO[S]?\s|DA[S]?\s|CONCLUS|PEDIDO|FATOS|FUNDAMENT|RECURSO)/i.test(trimmed);
      
      if (isHeading && trimmed.length < 100) {
        return (
          <h2 key={idx} className="text-base font-semibold mt-6 mb-3 pb-1" style={{ color: '#1e3a5f', borderBottom: '2px solid #c8af37' }}>
            {trimmed}
          </h2>
        );
      }
      return <p key={idx} className="mb-4 text-justify" style={{ textIndent: '2cm' }}>{trimmed}</p>;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 justify-end print:hidden">
        <Button variant="outline" onClick={handlePrint} className="gap-2 rounded-xl">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
        <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="gap-2 rounded-xl shadow-lg shadow-primary/15">
          {isGeneratingPDF ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
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
        {/* Header - matching contract identity #1e3a5f */}
        <div className="w-full" style={{ height: '8px', background: 'linear-gradient(90deg, #1e3a5f 0%, #2a5080 50%, #1e3a5f 100%)' }} />
        <div className="w-full" style={{ height: '3px', background: 'linear-gradient(90deg, #c8af37, #d4c050, #c8af37)' }} />

        <div className="px-16 py-10">
          {/* Letterhead */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-5">
              <img 
                src={logoWebmarcas} 
                alt="WebMarcas" 
                className="object-contain"
                style={{ width: '75px', height: '75px' }} 
              />
              <div>
                <h1 className="text-2xl font-bold tracking-wider" style={{ color: '#1e3a5f', letterSpacing: '0.15em' }}>WEBMARCAS</h1>
                <p className="text-sm mt-1" style={{ color: '#666' }}>Propriedade Intelectual e Registro de Marcas</p>
              </div>
            </div>
            <div className="text-right text-xs space-y-0.5" style={{ color: '#999' }}>
              <p className="font-medium" style={{ color: '#1e3a5f' }}>CNPJ: 39.528.012/0001-29</p>
              <p>Av. Brigadeiro Luiz Antônio, 2696</p>
              <p>Centro — São Paulo/SP</p>
              <p>juridico@webmarcas.net</p>
            </div>
          </div>

          {/* Double separator matching contract style */}
          <div className="w-full mb-8">
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #1e3a5f, #2a5080, #1e3a5f)' }} />
            <div style={{ height: '1px', marginTop: '2px', background: 'linear-gradient(90deg, transparent, #c8af37, transparent)' }} />
          </div>

          {/* Document title badge */}
          <div className="text-center mb-8">
            <div className="inline-block px-8 py-2 rounded-sm" style={{ backgroundColor: '#1e3a5f' }}>
              <span className="text-white font-semibold text-sm tracking-wider uppercase">
                Recurso Administrativo
              </span>
            </div>
            {resource.brand_name && (
              <p className="mt-3 text-base font-semibold" style={{ color: '#1e3a5f' }}>
                Marca: {resource.brand_name}
              </p>
            )}
            {resource.process_number && (
              <p className="text-sm" style={{ color: '#666' }}>
                Processo INPI nº {resource.process_number}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="text-justify" style={{ color: '#1a1a1a' }}>
            {renderContent()}
          </div>

          {/* Signature */}
          <div className="mt-16 text-center">
            <p className="mb-4" style={{ color: '#374151' }}>Termos em que,</p>
            <p className="mb-4" style={{ color: '#374151' }}>Pede deferimento.</p>
            <p className="mb-8" style={{ color: '#374151' }}>São Paulo, {approvalDate}</p>
            
            <div className="mt-6">
              {/* Signature image */}
              <div className="flex justify-center mb-2">
                <img 
                  src={signatureImage} 
                  alt="Assinatura" 
                  className="h-16 object-contain opacity-90"
                />
              </div>
              <div className="w-52 mx-auto mb-3" style={{ height: '2px', background: '#1e3a5f' }} />
              <p className="font-semibold text-base" style={{ color: '#1e3a5f' }}>Davilys Danques de Oliveira Cunha</p>
              <p className="text-sm" style={{ color: '#555' }}>Procurador</p>
              <p className="text-sm" style={{ color: '#777' }}>CPF 393.239.118-79</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-3" style={{ borderTop: '2px solid #1e3a5f' }}>
            <div className="mb-2" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #c8af37, transparent)' }} />
            <div className="flex justify-center gap-6 text-xs flex-wrap" style={{ color: '#888' }}>
              <span>📍 Av. Brigadeiro Luiz Antônio, 2696, Centro — São Paulo/SP</span>
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
