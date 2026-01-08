import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoCircular from '@/assets/webmarcas-logo-circular.png';

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
            @page {
              margin: 2.5cm 2cm;
              size: A4;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
            }
            .header {
              text-align: right;
              margin-bottom: 30px;
            }
            .header img {
              width: 60px;
              height: 60px;
            }
            .content {
              text-align: justify;
            }
            .content h1, .content h2, .content h3 {
              font-weight: bold;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .content h1 {
              text-align: center;
              font-size: 14pt;
            }
            .content p {
              margin-bottom: 12px;
              text-indent: 2cm;
            }
            .content p:first-of-type {
              text-indent: 0;
            }
            .signature {
              margin-top: 50px;
              text-align: center;
            }
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              display: flex;
              justify-content: space-around;
              align-items: center;
              padding: 20px 0;
              border-top: 1px solid #ccc;
              font-size: 10pt;
              color: #333;
            }
            .footer-item {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .footer-icon {
              width: 20px;
              height: 20px;
              background: #000;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = async () => {
    // Create a blob from the HTML content for download
    const printContent = printRef.current;
    if (!printContent) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Recurso Administrativo - ${resource.brand_name || 'WebMarcas'}</title>
          <style>
            @page { margin: 2.5cm 2cm; size: A4; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #000; }
            .header { text-align: right; margin-bottom: 30px; }
            .content { text-align: justify; }
            .signature { margin-top: 50px; text-align: center; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recurso_${resource.brand_name?.replace(/\s+/g, '_') || 'INPI'}_${format(new Date(), 'yyyy-MM-dd')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format the content with proper paragraphs
  const formatContent = (text: string) => {
    return text
      .split('\n\n')
      .map((paragraph, idx) => {
        // Check if it's a heading
        if (paragraph.match(/^(I{1,3}V?\.?\s|[A-Z\s]+$)/)) {
          return `<h2 key="${idx}" style="font-weight: bold; margin-top: 20px;">${paragraph}</h2>`;
        }
        return `<p key="${idx}">${paragraph}</p>`;
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
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download HTML
        </Button>
      </div>

      {/* PDF Preview */}
      <div 
        ref={printRef}
        className="bg-white text-black p-12 shadow-lg mx-auto"
        style={{ 
          width: '210mm', 
          minHeight: '297mm',
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '12pt',
          lineHeight: '1.6'
        }}
      >
        {/* Header with Logo */}
        <div className="text-right mb-8">
          <img 
            src={logoCircular} 
            alt="WebMarcas" 
            className="inline-block"
            style={{ width: '60px', height: '60px' }}
          />
        </div>

        {/* Content */}
        <div 
          className="text-justify"
          style={{ textAlign: 'justify' }}
          dangerouslySetInnerHTML={{ __html: formatContent(content) }}
        />

        {/* Signature */}
        <div className="mt-12 text-center">
          <p className="mb-8">Termos em que,</p>
          <p className="mb-8">Pede deferimento.</p>
          <p className="mb-12">São Paulo, {approvalDate}</p>
          <div className="mt-8">
            <p className="font-bold">Davilys Danques de Oliveira Cunha</p>
            <p>Procurador</p>
            <p>CPF 393.239.118-79</p>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="mt-16 pt-4 border-t border-gray-300 flex justify-around items-center text-xs text-gray-600"
          style={{ marginTop: '100px' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-[8px]">
              🏠
            </div>
            <span>Av. Brigadeiro Luiz Antônio 2696</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-[8px]">
              📞
            </div>
            <span>11 9 1112-0225</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-[8px]">
              ✉️
            </div>
            <span>juridico@webmarcas.net</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-[8px]">
              🌐
            </div>
            <span>www.webmarcas.net</span>
          </div>
        </div>
      </div>
    </div>
  );
}
