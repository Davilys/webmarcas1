import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoCircular from '@/assets/webmarcas-logo-circular.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface INPIResourcePDFPreviewProps {
  resource: {
    id: string;
    brand_name: string | null;
    process_number: string | null;
    ncl_class: string | null;
    holder: string | null;
    approved_at: string | null;
  };
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
            @page {
              margin: 2.5cm 2.5cm;
              size: A4;
            }
            body {
              font-family: 'Crimson Pro', 'Georgia', 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.8;
              color: #1a1a1a;
              background: #fff;
              margin: 0;
              padding: 0;
            }
            .letterhead {
              position: relative;
              margin-bottom: 40px;
            }
            .letterhead-decoration {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 8px;
              background: linear-gradient(90deg, #1a365d 0%, #2d4a7c 50%, #4a6fa5 100%);
            }
            .logo-container {
              text-align: left;
              padding-top: 20px;
            }
            .logo-container img {
              width: 80px;
              height: 80px;
            }
            .content {
              text-align: justify;
              margin-top: 30px;
            }
            .content h1, .content h2 {
              font-weight: 600;
              margin-top: 24px;
              margin-bottom: 12px;
              color: #1a365d;
            }
            .content h1 {
              text-align: center;
              font-size: 14pt;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .content h2 {
              font-size: 12pt;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
            }
            .content p {
              margin-bottom: 14px;
              text-indent: 2cm;
            }
            .content p:first-of-type {
              text-indent: 0;
            }
            .signature {
              margin-top: 60px;
              text-align: center;
            }
            .signature p {
              margin: 8px 0;
            }
            .signature-name {
              font-weight: 600;
              font-size: 13pt;
              color: #1a365d;
            }
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 15px 0;
              border-top: 2px solid #1a365d;
              font-size: 9pt;
              color: #4a5568;
              display: flex;
              justify-content: center;
              gap: 30px;
            }
            .footer-item {
              display: flex;
              align-items: center;
              gap: 6px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleDownloadPDF = async () => {
    const printContent = printRef.current;
    if (!printContent) return;

    setIsGeneratingPDF(true);

    try {
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      // Calculate how many pages we need
      const pageHeight = pdfHeight * (imgWidth / pdfWidth);
      let heightLeft = imgHeight;
      let position = 0;
      
      // First page
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= pageHeight;
      
      // Add more pages if needed
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pageHeight;
      }

      pdf.save(`Recurso_${resource.brand_name?.replace(/\s+/g, '_') || 'INPI'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Format the content with proper paragraphs
  const formatContent = (text: string) => {
    return text
      .split('\n\n')
      .map((paragraph, idx) => {
        // Check if it's a heading (Roman numerals or all caps)
        if (paragraph.match(/^(I{1,3}V?\.?\s|V?I{0,3}\.?\s|[A-Z][A-Z\s]+$)/)) {
          return `<h2 key="${idx}">${paragraph}</h2>`;
        }
        return `<p key="${idx}">${paragraph.replace(/\n/g, '<br/>')}</p>`;
      })
      .join('');
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
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

      {/* PDF Preview - Professional Legal Letterhead */}
      <div 
        ref={printRef}
        className="bg-white text-gray-900 shadow-2xl mx-auto overflow-hidden"
        style={{ 
          width: '210mm', 
          minHeight: '297mm',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: '12pt',
          lineHeight: '1.8',
        }}
      >
        {/* Decorative Header Bar */}
        <div 
          className="w-full h-2"
          style={{ 
            background: 'linear-gradient(90deg, #1a365d 0%, #2d4a7c 50%, #4a6fa5 100%)'
          }}
        />

        {/* Content Area with Margins */}
        <div className="px-16 py-10">
          {/* Letterhead with Logo */}
          <div className="flex items-start justify-between mb-10">
            <div className="flex items-center gap-4">
              <img 
                src={logoCircular} 
                alt="WebMarcas" 
                className="object-contain"
                style={{ width: '70px', height: '70px' }}
              />
              <div>
                <h1 
                  className="text-xl font-semibold tracking-wide"
                  style={{ color: '#1a365d', fontFamily: "'Georgia', serif" }}
                >
                  WEBMARCAS
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Propriedade Intelectual e Registro de Marcas
                </p>
              </div>
            </div>
            {/* Decorative Lines */}
            <div className="text-right">
              <div 
                className="w-24 h-1 ml-auto mb-2"
                style={{ background: '#1a365d' }}
              />
              <div 
                className="w-16 h-1 ml-auto"
                style={{ background: '#4a6fa5' }}
              />
            </div>
          </div>

          {/* Subtle Separator */}
          <div 
            className="w-full h-px mb-8"
            style={{ background: 'linear-gradient(90deg, transparent, #cbd5e0, transparent)' }}
          />

          {/* Content */}
          <div 
            className="text-justify"
            style={{ 
              textAlign: 'justify',
              color: '#1a1a1a'
            }}
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
          />

          {/* Signature */}
          <div className="mt-16 text-center">
            <p className="mb-6" style={{ color: '#374151' }}>Termos em que,</p>
            <p className="mb-6" style={{ color: '#374151' }}>Pede deferimento.</p>
            <p className="mb-10" style={{ color: '#374151' }}>São Paulo, {approvalDate}</p>
            <div className="mt-12">
              <div 
                className="w-48 h-px mx-auto mb-3"
                style={{ background: '#1a365d' }}
              />
              <p 
                className="font-semibold text-base"
                style={{ color: '#1a365d' }}
              >
                Davilys Danques de Oliveira Cunha
              </p>
              <p className="text-sm text-gray-600">Procurador</p>
              <p className="text-sm text-gray-500">CPF 393.239.118-79</p>
            </div>
          </div>

          {/* Footer */}
          <div 
            className="mt-20 pt-4"
            style={{ borderTop: '2px solid #1a365d' }}
          >
            <div className="flex justify-center gap-8 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Av. Brigadeiro Luiz Antônio, 2696</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>(11) 9 1112-0225</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>juridico@webmarcas.net</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>www.webmarcas.net</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
