import { useMemo } from 'react';

interface ContractRendererProps {
  content: string;
  showLetterhead?: boolean;
  className?: string;
}

export function ContractRenderer({ content, showLetterhead = true, className = '' }: ContractRendererProps) {
  const renderedContent = useMemo(() => {
    // Split content into lines
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        elements.push(<div key={index} className="h-3" />);
        return;
      }

      // Main title (first line with CONTRATO)
      if (trimmedLine.includes('CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS')) {
        elements.push(
          <h1 key={index} className="text-center font-bold text-base text-primary mb-4 leading-tight">
            {trimmedLine}
          </h1>
        );
        return;
      }

      // Clause titles (numbered with CLÁUSULA)
      if (/^\d+\.\s*CLÁUSULA/.test(trimmedLine)) {
        elements.push(
          <h2 key={index} className="font-bold text-sm text-orange-600 mt-6 mb-2">
            {trimmedLine}
          </h2>
        );
        return;
      }

      // Sub-items (like 1.1, 2.1, etc.)
      if (/^\d+\.\d+\s/.test(trimmedLine)) {
        elements.push(
          <p key={index} className="text-sm mb-2 pl-4 text-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // List items with letters (a), b), etc.)
      if (/^[a-z]\)/.test(trimmedLine)) {
        elements.push(
          <p key={index} className="text-sm mb-1 pl-8 text-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Bullet points
      if (trimmedLine.startsWith('•')) {
        elements.push(
          <p key={index} className="text-sm mb-2 pl-4 text-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Roman numerals (I), II))
      if (/^I+\)/.test(trimmedLine)) {
        elements.push(
          <p key={index} className="text-sm mb-3 font-medium text-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Signature lines
      if (trimmedLine.startsWith('_')) {
        elements.push(
          <div key={index} className="border-t border-foreground w-64 mt-8 mb-1 mx-auto" />
        );
        return;
      }

      // Company name after signature
      if (trimmedLine.includes('WEB MARCAS PATENTES EIRELI') || trimmedLine.includes('CNPJ:') || trimmedLine.includes('CPF:')) {
        elements.push(
          <p key={index} className="text-xs text-center text-muted-foreground mb-4">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Date line
      if (trimmedLine.startsWith('São Paulo,')) {
        elements.push(
          <p key={index} className="text-sm mt-6 mb-6 text-foreground">
            {trimmedLine}
          </p>
        );
        return;
      }

      // Regular paragraphs
      elements.push(
        <p key={index} className="text-sm mb-3 text-foreground leading-relaxed">
          {trimmedLine}
        </p>
      );
    });

    return elements;
  }, [content]);

  return (
    <div className={`bg-white text-foreground ${className}`}>
      {showLetterhead && (
        <div className="border-b-2 border-primary pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-primary">WebMarcas</h3>
              <p className="text-xs text-muted-foreground">Registro de Marcas e Patentes</p>
              <p className="text-xs text-muted-foreground">www.webmarcas.net</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>CNPJ: 39.528.012/0001-29</p>
              <p>Av. Brigadeiro Luís Antônio, 2696</p>
              <p>São Paulo - SP, CEP 01402-000</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="contract-content">
        {renderedContent}
      </div>
    </div>
  );
}

// Generate full HTML for printing/download
export function generateContractPrintHTML(
  content: string,
  brandName: string,
  clientName: string,
  clientCpf: string
): string {
  // Convert plain text to HTML with proper formatting
  const htmlContent = content
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<div style="height: 12px;"></div>';
      
      if (trimmed.includes('CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS')) {
        return `<h1 style="text-align: center; font-weight: bold; font-size: 14px; color: #0284c7; margin-bottom: 16px; line-height: 1.4;">${trimmed}</h1>`;
      }
      
      if (/^\d+\.\s*CLÁUSULA/.test(trimmed)) {
        return `<h2 style="font-weight: bold; font-size: 12px; color: #ea580c; margin-top: 20px; margin-bottom: 8px;">${trimmed}</h2>`;
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
      
      if (/^I+\)/.test(trimmed)) {
        return `<p style="font-size: 11px; margin-bottom: 12px; font-weight: 500;">${trimmed}</p>`;
      }
      
      if (trimmed.startsWith('_')) {
        return `<div style="border-top: 1px solid #000; width: 250px; margin: 32px auto 4px;"></div>`;
      }
      
      if (trimmed.includes('WEB MARCAS PATENTES EIRELI') || trimmed.includes('CNPJ:') || trimmed.includes('CPF:')) {
        return `<p style="font-size: 10px; text-align: center; color: #6b7280; margin-bottom: 16px;">${trimmed}</p>`;
      }
      
      if (trimmed.startsWith('São Paulo,')) {
        return `<p style="font-size: 11px; margin-top: 24px; margin-bottom: 24px;">${trimmed}</p>`;
      }
      
      return `<p style="font-size: 11px; margin-bottom: 12px; line-height: 1.6;">${trimmed}</p>`;
    })
    .join('\n');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato WebMarcas - ${brandName}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
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
      align-items: flex-start;
      border-bottom: 3px solid #0284c7; 
      padding-bottom: 16px; 
      margin-bottom: 24px; 
    }
    .logo-section h1 { 
      font-size: 24px; 
      color: #0284c7; 
      margin-bottom: 4px; 
    }
    .logo-section p { 
      color: #6b7280; 
      font-size: 11px; 
    }
    .contact-section {
      text-align: right;
      font-size: 10px;
      color: #6b7280;
    }
    .highlight { 
      background: #fef3c7; 
      padding: 12px; 
      border-radius: 4px; 
      margin: 16px 0; 
      border: 1px solid #f59e0b; 
      font-size: 10px; 
    }
    .footer { 
      margin-top: 40px; 
      text-align: center; 
      color: #6b7280; 
      font-size: 9px; 
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
    }
    @media print { 
      body { padding: 0; } 
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <h1>WebMarcas</h1>
      <p>Registro de Marcas e Patentes</p>
      <p>www.webmarcas.net</p>
    </div>
    <div class="contact-section">
      <p>CNPJ: 39.528.012/0001-29</p>
      <p>Av. Brigadeiro Luís Antônio, 2696</p>
      <p>São Paulo - SP, CEP 01402-000</p>
    </div>
  </div>
  
  <div class="highlight">
    Os termos deste instrumento aplicam-se apenas a contratações com negociações personalizadas, tratadas diretamente com a equipe comercial da Web Marcas e Patentes Eireli.<br/><br/>
    Os termos aqui celebrados são adicionais ao "Contrato de Prestação de Serviços e Gestão de Pagamentos e Outras Avenças" com aceite integral no momento do envio da Proposta.
  </div>
  
  <div class="content">
    ${htmlContent}
  </div>
  
  <div class="footer">
    <p>Contrato gerado automaticamente pelo sistema WebMarcas</p>
    <p>www.webmarcas.net | contato@webmarcas.net</p>
    <p>Data e hora da geração: ${new Date().toLocaleString('pt-BR')}</p>
  </div>
</body>
</html>`;
}

export default ContractRenderer;
