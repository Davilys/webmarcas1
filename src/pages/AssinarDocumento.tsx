import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SignaturePad } from '@/components/signature/SignaturePad';
import { DocumentRenderer, generateDocumentPrintHTML, getSignatureBase64 } from '@/components/contracts/DocumentRenderer';
import { toast } from 'sonner';
import { Loader2, Download, Printer, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import webmarcasLogo from '@/assets/webmarcas-logo.png';

interface ContractData {
  id: string;
  subject: string | null;
  contract_html: string | null;
  document_type: string | null;
  signatory_name: string | null;
  signatory_cpf: string | null;
  signatory_cnpj: string | null;
  signature_status: string | null;
  signature_expires_at: string | null;
  client_signature_image: string | null;
  contractor_signature_image: string | null;
  blockchain_hash: string | null;
  blockchain_timestamp: string | null;
  blockchain_tx_id: string | null;
  blockchain_network: string | null;
  signature_ip: string | null;
}

export default function AssinarDocumento() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    if (token) {
      fetchContract();
    }
  }, [token]);

  const fetchContract = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use edge function to fetch contract by token (bypasses RLS)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-contract-by-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ token }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || 'Documento não encontrado');
        return;
      }

      setContract(result.contract);
      
      if (result.contract.signature_status === 'signed') {
        setSigned(true);
      }
    } catch (err) {
      console.error('Error fetching contract:', err);
      setError('Erro ao carregar documento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!contract || !signature || !acceptedTerms) {
      toast.error('Por favor, aceite os termos e desenhe sua assinatura');
      return;
    }

    setSigning(true);
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sign-contract-blockchain`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            contractId: contract.id,
            contractHtml: contract.contract_html,
            signatureImage: signature,
            signatureToken: token,
            deviceInfo,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erro ao assinar documento');
      }

      toast.success('Documento assinado com sucesso!');
      setSigned(true);
      
      // Refresh contract data
      fetchContract();
    } catch (err: any) {
      console.error('Error signing:', err);
      toast.error(err.message || 'Erro ao assinar documento');
    } finally {
      setSigning(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!contract) return;

    // Load signature base64 for procuracao documents
    let signatureBase64: string | undefined;
    if (contract.document_type === 'procuracao') {
      signatureBase64 = await getSignatureBase64();
    }

    const html = generateDocumentPrintHTML(
      (contract.document_type as any) || 'procuracao',
      contract.contract_html || '',
      contract.client_signature_image,
      contract.blockchain_hash ? {
        hash: contract.blockchain_hash,
        timestamp: contract.blockchain_timestamp || '',
        txId: contract.blockchain_tx_id || '',
        network: contract.blockchain_network || '',
        ipAddress: contract.signature_ip || '',
      } : undefined,
      contract.signatory_name || undefined,
      contract.signatory_cpf || undefined,
      contract.signatory_cnpj || undefined,
      signatureBase64
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handlePrint = () => {
    handleDownloadPDF();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-lg text-gray-600">Carregando documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Documento não encontrado</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            O link pode ter expirado ou o documento já foi assinado.
          </p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={webmarcasLogo} alt="WebMarcas" className="h-10" />
          <div className="text-sm text-gray-500">
            Sistema de Assinatura Digital
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {signed ? (
          /* Success State */
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <CheckCircle className="h-20 w-20 mx-auto text-green-500 mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Documento Assinado com Sucesso!
              </h1>
              <p className="text-gray-600">
                Seu documento foi assinado eletronicamente e registrado em blockchain.
              </p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
              <Button onClick={handleDownloadPDF} size="lg">
                <Download className="h-5 w-5 mr-2" />
                Baixar PDF
              </Button>
              <Button variant="outline" onClick={handlePrint} size="lg">
                <Printer className="h-5 w-5 mr-2" />
                Imprimir
              </Button>
            </div>

            {contract.blockchain_hash && (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Certificação Digital
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Hash SHA-256:</p>
                    <p className="font-mono text-xs break-all bg-white p-2 rounded mt-1">
                      {contract.blockchain_hash}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Data/Hora:</p>
                    <p className="mt-1">{contract.blockchain_timestamp}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">ID Transação:</p>
                    <p className="font-mono text-xs mt-1">{contract.blockchain_tx_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Rede:</p>
                    <p className="mt-1">{contract.blockchain_network}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Verifique a autenticidade em:{' '}
                  <a 
                    href={`/verificar-contrato?hash=${contract.blockchain_hash}`}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    webmarcas.com.br/verificar-contrato
                  </a>
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Signing State */
          <>
            <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-900">
                  {contract.subject || 'Documento para Assinatura'}
                </h1>
                <p className="text-gray-600 mt-1">
                  Leia atentamente o documento abaixo e assine eletronicamente.
                </p>
              </div>

              {/* Document Preview */}
              <div className="p-6">
                <DocumentRenderer
                  documentType={(contract.document_type as any) || 'procuracao'}
                  content={contract.contract_html || ''}
                  clientSignature={null}
                  signatoryName={contract.signatory_name || undefined}
                  signatoryCpf={contract.signatory_cpf || undefined}
                  signatoryCnpj={contract.signatory_cnpj || undefined}
                />
              </div>
            </div>

            {/* Signature Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Assinatura Eletrônica
              </h2>

              {/* Terms Acceptance */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  />
                  <Label 
                    htmlFor="accept-terms" 
                    className="text-sm text-gray-700 cursor-pointer leading-relaxed"
                  >
                    Declaro que li e concordo com todos os termos e condições deste documento. 
                    Reconheço que esta assinatura eletrônica tem validade jurídica conforme 
                    Lei 14.063/2020 e MP 2.200-2/2001.
                  </Label>
                </div>
              </div>

              {/* Signature Pad */}
              <div className="mb-6">
                <Label className="block mb-3 font-medium">
                  Desenhe sua assinatura no campo abaixo:
                </Label>
                <SignaturePad 
                  onSignatureChange={setSignature}
                  width={600}
                  height={200}
                />
              </div>

              {/* Sign Button */}
              <div className="flex justify-center">
                <Button 
                  size="lg"
                  onClick={handleSign}
                  disabled={!acceptedTerms || !signature || signing}
                  className="min-w-[200px]"
                >
                  {signing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Assinando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Assinar Documento
                    </>
                  )}
                </Button>
              </div>

              {/* Legal Notice */}
              <p className="text-xs text-center text-gray-500 mt-6">
                Ao clicar em "Assinar Documento", sua assinatura será registrada em blockchain, 
                capturando data/hora, endereço IP e informações do dispositivo para garantir 
                a validade jurídica do documento.
              </p>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>WebMarcas Patentes - CNPJ: 39.528.012/0001-29</p>
          <p>Av. Prestes Maia, 241 - Centro, São Paulo - SP</p>
          <p className="mt-2">
            Dúvidas? Entre em contato: (11) 4200-1656 | contato@webmarcas.com.br
          </p>
        </div>
      </footer>
    </div>
  );
}
