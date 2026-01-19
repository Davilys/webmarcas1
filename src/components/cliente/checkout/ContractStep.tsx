import { useState, useCallback } from "react";
import { ArrowLeft, Loader2, Download, Printer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContractTemplate, replaceContractVariables } from "@/hooks/useContractTemplate";
import { ContractRenderer, generateContractPrintHTML } from "@/components/contracts/ContractRenderer";
import { downloadUnifiedContractPDF, printUnifiedContract } from "@/hooks/useUnifiedContractDownload";
import type { PersonalData } from "./PersonalDataStep";
import type { BrandData } from "./BrandDataStep";
import { toast } from "sonner";

interface ContractStepProps {
  personalData: PersonalData;
  brandData: BrandData;
  paymentMethod: string;
  paymentValue: number;
  onSubmit: (contractHtml: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function ContractStep({
  personalData,
  brandData,
  paymentMethod,
  paymentValue,
  onSubmit,
  onBack,
  isSubmitting,
}: ContractStepProps) {
  const [accepted, setAccepted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  // Busca o template "Contrato Padrão - Registro de Marca INPI" do banco de dados
  const { template, isLoading } = useContractTemplate('Contrato Padrão - Registro de Marca INPI');

  const getProcessedContract = useCallback(() => {
    if (!template) return '';
    return replaceContractVariables(template.content, {
      personalData,
      brandData,
      paymentMethod
    });
  }, [template, personalData, brandData, paymentMethod]);

  const printContract = async () => {
    try {
      const contractContent = getProcessedContract();
      await printUnifiedContract({
        content: contractContent,
        documentType: 'contract',
        subject: brandData.brandName,
        signatoryName: personalData.fullName,
        signatoryCpf: personalData.cpf,
      });
    } catch (error) {
      console.error('Error printing contract:', error);
      toast.error("Não foi possível abrir a janela de impressão.");
    }
  };

  const downloadContract = async () => {
    setIsDownloading(true);
    try {
      const contractContent = getProcessedContract();
      await downloadUnifiedContractPDF({
        content: contractContent,
        documentType: 'contract',
        subject: brandData.brandName,
        signatoryName: personalData.fullName,
        signatoryCpf: personalData.cpf,
      });
      // Print dialog opened - no success toast needed
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error("Erro ao abrir visualização do contrato.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = () => {
    if (!accepted) {
      toast.error("Por favor, leia e aceite o contrato para continuar.");
      return;
    }
    // Generate the full contract HTML with all data
    const contractContent = getProcessedContract();
    const fullContractHtml = generateContractPrintHTML(
      contractContent,
      brandData.brandName,
      personalData.fullName,
      personalData.cpf
    );
    onSubmit(fullContractHtml);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPaymentDescription = () => {
    switch (paymentMethod) {
      case 'avista':
        return 'À Vista (PIX)';
      case 'cartao6x':
        return 'Cartão 6x de R$ 199,00';
      case 'boleto3x':
        return 'Boleto 3x de R$ 399,00';
      default:
        return 'Pagamento';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando contrato...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Contrato Digital</h2>
        <p className="text-muted-foreground">
          Revise e aceite o contrato para finalizar o registro.
        </p>
      </div>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Marca</p>
              <p className="font-semibold">{brandData.brandName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Titular</p>
              <p className="font-semibold">{personalData.fullName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pagamento</p>
              <p className="font-semibold">{getPaymentDescription()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-primary">{formatCurrency(paymentValue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={printContract} className="flex-1">
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
        <Button variant="outline" size="sm" onClick={downloadContract} disabled={isDownloading} className="flex-1">
          {isDownloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Baixar PDF
        </Button>
      </div>

      {/* Contract Content */}
      <Card className="overflow-hidden border-2">
        <ScrollArea className="h-[400px]">
          <div className="p-4">
            <ContractRenderer 
              content={getProcessedContract()} 
              showLetterhead={true}
              showCertificationSection={false}
            />
          </div>
        </ScrollArea>
      </Card>

      {/* Accept Checkbox */}
      <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg border">
        <Checkbox
          id="accept"
          checked={accepted}
          onCheckedChange={(checked) => setAccepted(!!checked)}
        />
        <Label htmlFor="accept" className="text-sm leading-relaxed cursor-pointer">
          Li e aceito os termos do contrato de prestação de serviços.
          Declaro que todas as informações fornecidas são verdadeiras e que
          autorizo a WebMarcas a prosseguir com o registro da marca junto ao INPI.
        </Label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1"
          disabled={!accepted || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Finalizar e Pagar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
