import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { 
  Eye, Send, Mail, MoreVertical, Trash2, EyeOff, Copy, ExternalLink,
  FileText, Paperclip, MessageSquare, History, CheckSquare, StickyNote, FileStack, Save, 
  Link, Loader2, Shield, Clock, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DocumentRenderer, generateDocumentPrintHTML, getLogoBase64ForPDF } from '@/components/contracts/DocumentRenderer';

interface Contract {
  id: string;
  contract_number: string | null;
  subject: string | null;
  contract_value: number | null;
  start_date: string | null;
  end_date: string | null;
  signature_status: string | null;
  signed_at: string | null;
  visible_to_client: boolean | null;
  user_id: string | null;
  contract_html?: string | null;
  description?: string | null;
  contract_type_id: string | null;
  document_type?: string | null;
  signature_token?: string | null;
  signature_expires_at?: string | null;
  signatory_name?: string | null;
  signatory_cpf?: string | null;
  signatory_cnpj?: string | null;
  client_signature_image?: string | null;
  blockchain_hash?: string | null;
  blockchain_timestamp?: string | null;
  blockchain_tx_id?: string | null;
  blockchain_network?: string | null;
  signature_ip?: string | null;
}

interface ContractType {
  id: string;
  name: string;
}

interface AuditLog {
  id: string;
  event_type: string;
  event_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface ContractDetailSheetProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  contract: 'Contrato',
  procuracao: 'Procuração',
  distrato_multa: 'Distrato com Multa',
  distrato_sem_multa: 'Distrato sem Multa',
};

export function ContractDetailSheet({ contract, open, onOpenChange, onUpdate }: ContractDetailSheetProps) {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    contract_value: '',
    start_date: '',
    end_date: '',
    description: '',
    contract_type_id: '',
    visible_to_client: true,
  });
  const [saving, setSaving] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [renewalHistory, setRenewalHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchContractTypes();
  }, []);

  useEffect(() => {
    if (contract) {
      setFormData({
        subject: contract.subject || '',
        contract_value: contract.contract_value?.toString() || '',
        start_date: contract.start_date || '',
        end_date: contract.end_date || '',
        description: contract.description || '',
        contract_type_id: contract.contract_type_id || '',
        visible_to_client: contract.visible_to_client ?? true,
      });
      fetchContractData(contract.id);
    }
  }, [contract]);

  const fetchContractTypes = async () => {
    const { data } = await supabase.from('contract_types').select('*');
    setContractTypes(data || []);
  };

  const fetchContractData = async (contractId: string) => {
    const [commentsRes, notesRes, tasksRes, attachmentsRes, renewalRes, auditRes] = await Promise.all([
      supabase.from('contract_comments').select('*').eq('contract_id', contractId).order('created_at', { ascending: false }),
      supabase.from('contract_notes').select('*').eq('contract_id', contractId).order('created_at', { ascending: false }),
      supabase.from('contract_tasks').select('*').eq('contract_id', contractId).order('due_date', { ascending: true }),
      supabase.from('contract_attachments').select('*').eq('contract_id', contractId).order('created_at', { ascending: false }),
      supabase.from('contract_renewal_history').select('*').eq('contract_id', contractId).order('renewed_at', { ascending: false }),
      supabase.from('signature_audit_log').select('*').eq('contract_id', contractId).order('created_at', { ascending: false }),
    ]);

    setComments(commentsRes.data || []);
    setNotes(notesRes.data || []);
    setTasks(tasksRes.data || []);
    setAttachments(attachmentsRes.data || []);
    setRenewalHistory(renewalRes.data || []);
    setAuditLogs(auditRes.data || []);
  };

  const handleSave = async () => {
    if (!contract) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          subject: formData.subject,
          contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          description: formData.description || null,
          contract_type_id: formData.contract_type_id || null,
          visible_to_client: formData.visible_to_client,
        })
        .eq('id', contract.id);

      if (error) throw error;
      toast.success('Contrato atualizado');
      onUpdate();
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error('Erro ao atualizar contrato');
    } finally {
      setSaving(false);
    }
  };

  const generateSignatureLink = async () => {
    if (!contract) return;
    setGeneratingLink(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-signature-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ contractId: contract.id, expiresInDays: 7, baseUrl: getProductionBaseUrl() }),
        }
      );

      const result = await response.json();
      
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Erro ao gerar link');
      }

      toast.success('Link de assinatura gerado!');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const sendSignatureRequest = async () => {
    if (!contract) return;
    setSendingRequest(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-signature-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ contractId: contract.id, channels: ['email', 'whatsapp'], baseUrl: getProductionBaseUrl() }),
        }
      );

      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success('Solicitação de assinatura enviada!');
        fetchContractData(contract.id);
      } else {
        throw new Error(result.error || 'Erro ao enviar solicitação');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar solicitação');
    } finally {
      setSendingRequest(false);
    }
  };

  // Always use the production domain for signature links (avoids broken links from Lovable preview)
  const getProductionBaseUrl = () => {
    const origin = window.location.origin;
    const isPreview = origin.includes('lovableproject.com') || origin.includes('lovable.app') || origin.includes('localhost');
    return isPreview ? 'https://webmarcas.net' : origin;
  };

  const copySignatureLink = () => {
    if (contract?.signature_token) {
      const url = `${getProductionBaseUrl()}/assinar/${contract.signature_token}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copiado!');
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      link_generated: 'Link gerado',
      link_accessed: 'Link acessado',
      signature_request_sent: 'Solicitação enviada',
      document_viewed: 'Documento visualizado',
      signature_drawn: 'Assinatura desenhada',
      contract_signed: 'Contrato assinado',
    };
    return labels[eventType] || eventType;
  };

  const openPreview = async (triggerPrint = false) => {
    if (!contract?.contract_html) {
      toast.error('Documento sem conteúdo');
      return;
    }

    // Get logo as base64 for proper rendering
    const logoBase64 = await getLogoBase64ForPDF();

    const printHtml = generateDocumentPrintHTML(
      (contract.document_type as any) || 'procuracao',
      contract.contract_html,
      contract.client_signature_image || null,
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
      undefined,
      window.location.origin,
      logoBase64
    );

    // Inject floating save button and print styles
    const enhancedHtml = printHtml.replace('</head>', `
      <style>
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        .save-pdf-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          gap: 10px;
        }
        .save-pdf-btn button {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
        }
        .save-pdf-btn button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        .btn-primary {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
        }
        .btn-secondary {
          background: #f1f5f9;
          color: #334155;
        }
      </style>
    </head>`).replace('<body', `<body><div class="save-pdf-btn no-print">
        <button class="btn-primary" onclick="window.print()">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Salvar como PDF
        </button>
        <button class="btn-secondary" onclick="window.close()">
          Fechar
        </button>
      </div><body`);

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(enhancedHtml);
      newWindow.document.close();
      
      // If triggered from download button, auto-open print dialog
      if (triggerPrint) {
        newWindow.onload = () => {
          setTimeout(() => newWindow.print(), 500);
        };
      }
    }
  };

  const downloadPDF = async () => {
    // Use browser's native print-to-PDF for real selectable text
    await openPreview(true);
  };

  const sendContractEmail = async () => {
    if (!contract) return;

    setSendingEmail(true);
    try {
      let clientEmail = '';
      let clientName = '';
      
      if (contract.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', contract.user_id)
          .single();
        clientEmail = profile?.email || '';
        clientName = profile?.full_name || '';
      }

      if (!clientEmail && contract.signatory_name) {
        // Tenta buscar por lead associado
        const { data: lead } = await supabase
          .from('leads')
          .select('email, full_name')
          .eq('full_name', contract.signatory_name)
          .single();
        clientEmail = lead?.email || '';
        clientName = lead?.full_name || '';
      }

      if (!clientEmail) {
        toast.error('Cliente sem email cadastrado');
        return;
      }

      // DIFERENCIAÇÃO POR STATUS DO CONTRATO
      if (contract.signature_status === 'signed') {
        // CONTRATO JÁ ASSINADO - Enviar confirmação com template rico
        const { data: template } = await supabase
          .from('email_templates')
          .select('subject, body')
          .eq('trigger_event', 'contract_signed')
          .eq('is_active', true)
          .single();
        
        if (!template) {
          toast.error('Template de email não encontrado');
          setSendingEmail(false);
          return;
        }
        
        const baseUrl = window.location.origin;
        const verificationUrl = contract.blockchain_hash 
          ? `${baseUrl}/verificar-contrato?hash=${contract.blockchain_hash}`
          : `${baseUrl}/cliente/documentos`;
        
        // Substituir variáveis no template
        const displayName = clientName || contract.signatory_name || 'Cliente';
        let emailBody = template.body
          .replace(/\{\{nome\}\}/g, displayName)
          .replace(/\{\{marca\}\}/g, contract.subject || '')
          .replace(/\{\{data_assinatura\}\}/g, contract.signed_at 
            ? format(new Date(contract.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
            : 'N/A')
          .replace(/\{\{hash_contrato\}\}/g, contract.blockchain_hash || 'N/A')
          .replace(/\{\{ip_assinatura\}\}/g, contract.signature_ip || 'N/A')
          .replace(/\{\{verification_url\}\}/g, verificationUrl)
          .replace(/\{\{app_url\}\}/g, baseUrl);
        
        let emailSubject = template.subject
          .replace(/\{\{nome\}\}/g, displayName)
          .replace(/\{\{marca\}\}/g, contract.subject || '');
        
        const response = await supabase.functions.invoke('send-email', {
          body: {
            to: [clientEmail],
            subject: emailSubject,
            body: emailBody.replace(/<[^>]*>/g, ''), // Plain text fallback
            html: emailBody,
          }
        });

        if (response.error) throw response.error;
        
      } else {
        // CONTRATO NÃO ASSINADO - Enviar link de assinatura
        const session = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-signature-request`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.data.session?.access_token}`,
            },
            body: JSON.stringify({ 
              contractId: contract.id, 
              channels: ['email'], 
              baseUrl: window.location.origin,
              overrideContact: { email: clientEmail, name: clientName || contract.signatory_name }
            }),
          }
        );
        
        const result = await response.json();
        
        if (!response.ok || result.error) {
          throw new Error(result.error || 'Erro ao enviar email');
        }
      }

      toast.success('Email enviado com sucesso!');
      setEmailDialogOpen(false);
      fetchContractData(contract.id);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.message || 'Erro ao enviar email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (!contract) return null;

  const signatureUrl = contract.signature_token 
    ? `${getProductionBaseUrl()}/assinar/${contract.signature_token}`
    : null;

  const isExpired = contract.signature_expires_at 
    ? new Date(contract.signature_expires_at) < new Date()
    : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">
                {contract.subject || `Contrato #${contract.contract_number}`}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {contract.document_type && contract.document_type !== 'contract' && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {DOCUMENT_TYPE_LABELS[contract.document_type] || contract.document_type}
                  </Badge>
                )}
                <Badge variant={contract.signature_status === 'signed' ? 'default' : 'destructive'}>
                  {contract.signature_status === 'signed' ? 'Assinado' : 'Não assinado'}
                </Badge>
                {contract.signed_at && (
                  <span className="text-xs text-muted-foreground">
                    Assinado em {format(new Date(contract.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => openPreview()}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => downloadPDF()}
                disabled={downloadingPdf}
                title="Download PDF"
              >
                {downloadingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEmailDialogOpen(true)}
                title="Enviar por Email"
              >
                <Mail className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openPreview()}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadPDF()}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar por Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Email Dialog */}
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {contract.signature_status === 'signed' 
                    ? 'Enviar Confirmação de Assinatura'
                    : 'Enviar Link de Assinatura'}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-3">
                {contract.signature_status === 'signed' ? (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Contrato já assinado
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          O cliente receberá um email de confirmação com os detalhes da assinatura e link para verificação.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          Contrato pendente de assinatura
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          O cliente receberá um email com o link para assinar o documento digitalmente.
                        </p>
                      </div>
                    </div>
                  </>
                )}
                <p className="text-sm text-muted-foreground">
                  Documento: "{contract.subject || contract.contract_number}"
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={sendContractEmail} disabled={sendingEmail}>
                  {sendingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      {contract.signature_status === 'signed' ? 'Enviar Confirmação' : 'Enviar Link'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Signature Link Section */}
          {contract.signature_status !== 'signed' && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Link de Assinatura</span>
                </div>
                {signatureUrl && !isExpired && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Expira em {format(new Date(contract.signature_expires_at!), 'dd/MM/yyyy', { locale: ptBR })}
                  </Badge>
                )}
                {isExpired && (
                  <Badge variant="destructive" className="text-xs">Expirado</Badge>
                )}
              </div>

              {signatureUrl && !isExpired ? (
                <div className="flex items-center gap-2">
                  <Input value={signatureUrl} readOnly className="font-mono text-xs flex-1" />
                  <Button variant="outline" size="icon" onClick={copySignatureLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={signatureUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isExpired ? 'O link expirou. Gere um novo link.' : 'Nenhum link gerado ainda.'}
                </p>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateSignatureLink}
                  disabled={generatingLink}
                >
                  {generatingLink ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  {signatureUrl ? 'Regenerar Link' : 'Gerar Link'}
                </Button>
                {signatureUrl && !isExpired && (
                  <Button 
                    size="sm"
                    onClick={sendSignatureRequest}
                    disabled={sendingRequest}
                  >
                    {sendingRequest ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar para Cliente
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Blockchain Certification */}
          {contract.signature_status === 'signed' && contract.blockchain_hash && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Certificação Digital</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-green-700 font-medium">Hash SHA-256</p>
                  <p className="font-mono text-xs truncate">{contract.blockchain_hash}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">Rede</p>
                  <p className="text-xs">{contract.blockchain_network}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">IP do Signatário</p>
                  <p className="text-xs">{contract.signature_ip}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">TX ID</p>
                  <p className="font-mono text-xs truncate">{contract.blockchain_tx_id}</p>
                </div>
              </div>
            </div>
          )}
        </SheetHeader>

        <Tabs defaultValue="info" className="mt-6">
          <TabsList className="grid grid-cols-8 w-full">
            <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
            <TabsTrigger value="contract" className="text-xs">Documento</TabsTrigger>
            <TabsTrigger value="attachments" className="text-xs">Anexos</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">Comentários</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Auditoria</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tarefas</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notas</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
          </TabsList>

          {/* Contract Information Tab */}
          <TabsContent value="info" className="space-y-6 mt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="trash" />
                <Label htmlFor="trash" className="text-sm flex items-center gap-1">
                  <Trash2 className="h-4 w-4" /> Lixeira
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="hide" 
                  checked={!formData.visible_to_client}
                  onCheckedChange={(checked) => setFormData({ ...formData, visible_to_client: !checked })}
                />
                <Label htmlFor="hide" className="text-sm flex items-center gap-1">
                  <EyeOff className="h-4 w-4" /> Ocultar do cliente
                </Label>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input disabled value={contract.signatory_name || 'Cliente vinculado'} />
              </div>

              <div className="space-y-2">
                <Label>Assunto *</Label>
                <Input 
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Assunto do contrato"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor do Contrato</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de contrato</Label>
                <Select 
                  value={formData.contract_type_id}
                  onValueChange={(value) => setFormData({ ...formData, contract_type_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input 
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input 
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </TabsContent>

          {/* Contract Content Tab */}
          <TabsContent value="contract" className="mt-6">
            <div className="border rounded-lg overflow-hidden">
              {contract.contract_html ? (
                <DocumentRenderer
                  documentType={(contract.document_type as any) || 'contract'}
                  content={contract.contract_html}
                  clientSignature={contract.client_signature_image}
                  signatoryName={contract.signatory_name || undefined}
                  signatoryCpf={contract.signatory_cpf || undefined}
                  signatoryCnpj={contract.signatory_cnpj || undefined}
                  showCertificationSection={contract.signature_status === 'signed'}
                  blockchainSignature={contract.blockchain_hash ? {
                    hash: contract.blockchain_hash,
                    timestamp: contract.blockchain_timestamp || '',
                    txId: contract.blockchain_tx_id || '',
                    network: contract.blockchain_network || '',
                    ipAddress: contract.signature_ip || '',
                  } : undefined}
                />
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum conteúdo de documento definido</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="mt-6">
            <div className="space-y-4">
              <Button variant="outline">
                <Paperclip className="h-4 w-4 mr-2" />
                Adicionar Anexo
              </Button>
              {attachments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum anexo</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{attachment.name}</span>
                      <Button variant="ghost" size="sm">Download</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-6">
            <div className="space-y-4">
              <Textarea placeholder="Adicionar comentário..." rows={3} />
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Comentar
              </Button>
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum comentário</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 border rounded-lg">
                      <p>{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(comment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="mt-6">
            {auditLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum registro de auditoria</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{getEventTypeLabel(log.event_type)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </span>
                    </div>
                    {log.ip_address && (
                      <p className="text-xs text-muted-foreground">IP: {log.ip_address}</p>
                    )}
                    {log.event_data && Object.keys(log.event_data).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">Ver detalhes</summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(log.event_data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <div className="space-y-4">
              <Button variant="outline">
                <CheckSquare className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma tarefa</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Checkbox checked={task.completed} />
                      <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-6">
            <div className="space-y-4">
              <Textarea placeholder="Adicionar nota..." rows={3} />
              <Button>
                <StickyNote className="h-4 w-4 mr-2" />
                Salvar Nota
              </Button>
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma nota</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 border rounded-lg">
                      <p>{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            {renewalHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum histórico de renovação</p>
            ) : (
              <div className="space-y-3">
                {renewalHistory.map((history) => (
                  <div key={history.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between">
                      <span>Renovação</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(history.renewed_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    {history.notes && <p className="text-sm mt-2">{history.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
