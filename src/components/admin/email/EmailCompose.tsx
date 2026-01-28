import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Send, Paperclip, Loader2, Search, Scale, Check, ChevronsUpDown, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Email } from '@/pages/admin/Emails';

interface EmailComposeProps {
  onClose: () => void;
  replyTo?: Email | null;
}

interface ClientWithProcess {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  brand_name?: string;
  process_number?: string;
}

type PublicationType = 
  | 'exigencia_merito'
  | 'envio_gru'
  | 'envio_protocolo'
  | 'indeferimento'
  | 'manifestacao_oposicao'
  | 'deferimento'
  | 'certificado'
  | 'renovacao'
  | 'distrato'
  | 'arquivamento'
  | 'debito_aberto';

const PUBLICATION_TYPES: { value: PublicationType; label: string }[] = [
  { value: 'exigencia_merito', label: 'Exigência de Mérito' },
  { value: 'envio_gru', label: 'Envio de GRU Federal' },
  { value: 'envio_protocolo', label: 'Envio de Protocolo' },
  { value: 'indeferimento', label: 'Indeferimento' },
  { value: 'manifestacao_oposicao', label: 'Manifestação à Oposição' },
  { value: 'deferimento', label: 'Deferimento' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'renovacao', label: 'Renovação' },
  { value: 'distrato', label: 'Distrato' },
  { value: 'arquivamento', label: 'Arquivamento' },
  { value: 'debito_aberto', label: 'Débito em Aberto' },
];

const EMAIL_TEMPLATES: Record<PublicationType, { subject: string; body: string }> = {
  exigencia_merito: {
    subject: 'Exigência de Mérito – Processo {{numero_processo}}',
    body: `Prezado(a) {{nome_cliente}},

Informamos que o INPI apresentou uma **EXIGÊNCIA DE MÉRITO** no processo de registro da marca **{{marca}}**, nº **{{numero_processo}}**.

Essa publicação indica que o examinador técnico do INPI identificou pontos que precisam ser complementados ou justificados antes de emitir o parecer final sobre o pedido.

Trata-se de uma fase de análise técnica aprofundada, na qual o órgão solicita esclarecimentos ou documentos para confirmar se a marca atende plenamente aos requisitos legais de registro.

O prazo para recurso já está aberto, e o não cumprimento dentro do período legal pode resultar no arquivamento definitivo do pedido.

Como seus Procuradores e Representantes Legais, nosso departamento jurídico já está preparando o recurso técnico para atender às exigências apontadas.

**Custos e Prazos:**
Recurso à vista: **R$ 1.195,00**
Taxa federal (GRU – INPI): **R$ 90,00 por processo**

A falta de resposta dentro do prazo pode resultar na perda do processo.

Documentos anexos: andamento do processo, publicações da RPI e prazos legais.

Aguardamos seu retorno para dar continuidade ao procedimento e garantir a manutenção do pedido ativo.

Atenciosamente,
Departamento Jurídico – WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
  envio_gru: {
    subject: 'GRU Federal INPI – Marca {{marca}}',
    body: `Prezado(a) {{nome_cliente}},

Segue a **GRU federal do INPI** referente ao processo de registro da marca **{{marca}}**, nº **{{numero_processo}}**.

Essa taxa é o comprovante de que seu cadastro foi realizado junto ao órgão federal. A GRU só pode ser gerada após o cadastro no INPI, garantindo que seu registro está em andamento.

A GRU vence no prazo informado no documento e não pode ser paga após o vencimento.

Após o pagamento, no prazo de até 48 horas, entregaremos o protocolo oficial. Esse prazo é necessário porque o pagamento é por boleto e leva tempo para constar como quitado no sistema do INPI.

Solicitamos:

• Confirmação de recebimento desta mensagem
• Envio do comprovante de pagamento
• Envio do logotipo em arquivo JPG

Assim poderemos dar continuidade ao processo.

Atenciosamente,
Jurídico WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
  envio_protocolo: {
    subject: 'Protocolo de Registro – Marca {{marca}}',
    body: `Prezado(a) {{nome_cliente}},

É com grande satisfação que entregamos o **protocolo de registro** da marca **{{marca}}**, nº **{{numero_processo}}**.

O documento em anexo comprova que sua marca está devidamente depositada e segue em trâmite junto ao INPI.

Ressaltamos que nossa equipe está acompanhando cada etapa do seu processo.

Estamos muito felizes por fazer parte deste novo capítulo da história da sua marca.

Permanecemos à disposição para quaisquer dúvidas.

Atenciosamente,
Jurídico – WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
  indeferimento: {
    subject: 'Indeferimento Publicado – Processo {{numero_processo}}',
    body: `Prezado(a) {{nome_cliente}},

Na qualidade de representantes legais do processo de registro da marca **{{marca}}**, nº **{{numero_processo}}**, comunicamos o **indeferimento publicado pelo INPI**.

O julgamento do recurso depende do examinador do INPI, contudo a interposição do recurso é a única via administrativa para tentar reverter a decisão e evitar o arquivamento definitivo.

Encontra-se aberto o prazo legal para interposição de recurso administrativo. O não cumprimento resultará no arquivamento definitivo do processo.

**Custos desta fase:**
Recurso à vista: **R$ 1.518,00**
Taxa federal: **R$ 350,00**

Aguardamos seu retorno para regular prosseguimento dentro do prazo legal.

Atenciosamente,
Departamento Jurídico – WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
  manifestacao_oposicao: {
    subject: 'Oposição Publicada – Processo {{numero_processo}}',
    body: `Prezado(a) {{nome_cliente}},

Informamos que foi publicada **oposição ao pedido de registro da marca {{marca}}**, processo nº **{{numero_processo}}**.

Dentro do prazo legal, apresentaremos as alegações cabíveis, fundamentadas no princípio da especialidade e na inexistência de risco de confusão ao consumidor.

**Custos desta fase:**
Recurso à vista: **R$ 1.518,00**
Taxa federal: **R$ 90,00**

Aguardamos sua confirmação para dar continuidade.

Atenciosamente,
Jurídico – WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
  deferimento: {
    subject: 'Marca Deferida – {{marca}}',
    body: `Prezado(a) {{nome_cliente}},

Informamos que o pedido de registro da marca **{{marca}}**, nº **{{numero_processo}}**, foi **DEFERIDO pelo INPI**. Parabéns!

O processo agora aguarda o processamento da concessão do registro, conforme os trâmites do órgão.

Assim que o certificado estiver disponível, entraremos em contato.

Atenciosamente,
Jurídico WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
  certificado: {
    subject: 'Certificado de Registro Emitido – {{marca}}',
    body: `Prezado(a) {{nome_cliente}},

Seu certificado de registro da marca **{{marca}}**, nº **{{numero_processo}}**, foi emitido.

O documento está disponível na sua área do cliente.

A proteção é válida por 10 anos em todo território nacional.

Parabéns pelo registro!

Jurídico WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
  renovacao: {
    subject: 'Renovação do Registro – {{marca}}',
    body: `Prezado(a) {{nome_cliente}},

O registro da marca **{{marca}}**, nº **{{numero_processo}}**, está próximo do prazo de renovação.

A renovação garante mais 10 anos de proteção.

Estamos à disposição para iniciar o procedimento.

Jurídico WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
  distrato: {
    subject: 'Distrato Contratual – Marca {{marca}}',
    body: `Prezado(a) {{nome_cliente}},

Comunicamos o encerramento formal do contrato referente à marca **{{marca}}**, processo nº **{{numero_processo}}**.

Conforme cláusulas contratuais, informamos que eventuais multas ou valores em aberto devem ser regularizados.

Permanecemos à disposição para esclarecimentos.

Atenciosamente,
Jurídico WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
  arquivamento: {
    subject: 'Processo Arquivado – {{marca}}',
    body: `Prezado(a) {{nome_cliente}},

Comunicamos que o processo de registro da marca **{{marca}}**, nº **{{numero_processo}}**, foi **arquivado** pelo INPI.

O arquivamento ocorreu devido à ausência de manifestação dentro do prazo legal estabelecido.

Caso deseje protocolar novo pedido de registro, nossa equipe está à disposição.

Atenciosamente,
Jurídico WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
  debito_aberto: {
    subject: 'Notificação de Débito – Regularização Imediata',
    body: `Prezado(a) {{nome_cliente}},

Comunicamos a existência de débito em aberto referente aos serviços contratados.

Solicitamos regularização imediata para evitar medidas administrativas cabíveis.

Aguardamos retorno urgente.

Jurídico WebMarcas
juridico@webmarcas.net | (11) 91112-0225`
  },
};

function replaceTemplateVariables(text: string, client: ClientWithProcess | null): string {
  if (!client) return text;
  
  return text
    .replace(/\{\{nome_cliente\}\}/g, client.full_name || '')
    .replace(/\{\{marca\}\}/g, client.brand_name || '')
    .replace(/\{\{numero_processo\}\}/g, client.process_number || '');
}

export function EmailCompose({ onClose, replyTo }: EmailComposeProps) {
  const queryClient = useQueryClient();
  
  // Standard email state
  const [to, setTo] = useState(replyTo?.from_email || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState(
    replyTo
      ? `\n\n---\nEm resposta a:\n${replyTo.body_text?.slice(0, 500)}`
      : ''
  );

  // Processual mode state
  const [isProcessualMode, setIsProcessualMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithProcess | null>(null);
  const [publicationType, setPublicationType] = useState<PublicationType | ''>('');
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch clients with their processes
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-with-processes', searchQuery],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(50);

      if (profilesError) throw profilesError;

      // Fetch processes for these profiles
      const profileIds = profiles?.map(p => p.id) || [];
      const { data: processes, error: processesError } = await supabase
        .from('brand_processes')
        .select('user_id, brand_name, process_number')
        .in('user_id', profileIds);

      if (processesError) throw processesError;

      // Also search by brand name
      const { data: processesByBrand } = await supabase
        .from('brand_processes')
        .select('user_id, brand_name, process_number')
        .ilike('brand_name', `%${searchQuery}%`)
        .limit(20);

      // Get profiles for brand matches
      const brandUserIds = processesByBrand?.map(p => p.user_id).filter(Boolean) || [];
      const { data: brandProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .in('id', brandUserIds);

      // Combine results
      const clientsMap = new Map<string, ClientWithProcess>();

      profiles?.forEach(profile => {
        const process = processes?.find(p => p.user_id === profile.id);
        clientsMap.set(profile.id, {
          id: profile.id,
          full_name: profile.full_name || '',
          email: profile.email,
          phone: profile.phone || undefined,
          brand_name: process?.brand_name || undefined,
          process_number: process?.process_number || undefined,
        });
      });

      processesByBrand?.forEach(process => {
        if (process.user_id && !clientsMap.has(process.user_id)) {
          const profile = brandProfiles?.find(p => p.id === process.user_id);
          if (profile) {
            clientsMap.set(process.user_id, {
              id: process.user_id,
              full_name: profile.full_name || '',
              email: profile.email,
              phone: profile.phone || undefined,
              brand_name: process.brand_name || undefined,
              process_number: process.process_number || undefined,
            });
          }
        }
      });

      return Array.from(clientsMap.values());
    },
    enabled: isProcessualMode,
  });

  // Update email content when client or publication type changes
  useEffect(() => {
    if (isProcessualMode && selectedClient && publicationType) {
      const template = EMAIL_TEMPLATES[publicationType];
      if (template) {
        setSubject(replaceTemplateVariables(template.subject, selectedClient));
        setBody(replaceTemplateVariables(template.body, selectedClient));
        setTo(selectedClient.email);
      }
    }
  }, [isProcessualMode, selectedClient, publicationType]);

  // Reset when toggling mode
  useEffect(() => {
    if (!isProcessualMode) {
      setSelectedClient(null);
      setPublicationType('');
      if (!replyTo) {
        setTo('');
        setSubject('');
        setBody('');
      }
    }
  }, [isProcessualMode, replyTo]);

  const sendEmail = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const fromEmail = profile?.email || user.email || 'admin@webmarcas.com.br';

      const response = await supabase.functions.invoke('send-email', {
        body: {
          to: to.split(',').map(e => e.trim()),
          cc: cc ? cc.split(',').map(e => e.trim()) : undefined,
          subject,
          body,
          html: `<div style="font-family: sans-serif; white-space: pre-wrap;">${body}</div>`,
        },
      });

      if (response.error) throw response.error;

      await supabase.from('email_logs').insert({
        from_email: fromEmail,
        to_email: to,
        cc_emails: cc ? cc.split(',').map(e => e.trim()) : null,
        subject,
        body,
        html_body: `<div style="font-family: sans-serif; white-space: pre-wrap;">${body}</div>`,
        status: 'sent',
        trigger_type: isProcessualMode ? 'processual' : 'manual',
        sent_by: user.id,
      });

      return response.data;
    },
    onSuccess: () => {
      toast.success('Email enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['emails', 'sent'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error sending email:', error);
      toast.error('Erro ao enviar email. Verifique as configurações.');
    },
  });

  const handleSend = () => {
    if (!to.trim()) {
      toast.error('Informe pelo menos um destinatário');
      return;
    }
    if (!subject.trim()) {
      toast.error('Informe o assunto do email');
      return;
    }
    if (isProcessualMode && !publicationType) {
      toast.error('Selecione o tipo de publicação/fase');
      return;
    }
    sendEmail.mutate();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isProcessualMode ? (
              <>
                <Scale className="h-5 w-5 text-primary" />
                Comunicação Processual INPI
              </>
            ) : (
              replyTo ? 'Responder Email' : 'Novo Email'
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Mode Toggle */}
        {!replyTo && (
          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="processual-mode"
              checked={isProcessualMode}
              onCheckedChange={setIsProcessualMode}
            />
            <Label htmlFor="processual-mode" className="text-sm cursor-pointer">
              Modo: Comunicação Processual INPI
            </Label>
          </div>
        )}
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-auto p-4 space-y-4">
        {isProcessualMode ? (
          <>
            {/* Client Search */}
            <div className="grid gap-2">
              <Label>Cliente / Marca</Label>
              <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientSearchOpen}
                    className="w-full justify-between h-auto min-h-10 py-2"
                  >
                    {selectedClient ? (
                      <div className="flex flex-col items-start text-left">
                        <span className="font-medium">{selectedClient.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedClient.brand_name && `Marca: ${selectedClient.brand_name}`}
                          {selectedClient.process_number && ` | Processo: ${selectedClient.process_number}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Buscar cliente...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Buscar por nome, marca ou email..." 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      {clientsLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                          Buscando...
                        </div>
                      ) : clients.length === 0 ? (
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.id}
                              onSelect={() => {
                                setSelectedClient(client);
                                setClientSearchOpen(false);
                              }}
                              className="flex items-start gap-2 py-2"
                            >
                              <User className="h-4 w-4 mt-0.5 shrink-0" />
                              <div className="flex flex-col">
                                <span className="font-medium">{client.full_name}</span>
                                <span className="text-xs text-muted-foreground">{client.email}</span>
                                {client.brand_name && (
                                  <span className="text-xs text-primary">
                                    Marca: {client.brand_name}
                                    {client.process_number && ` | #${client.process_number}`}
                                  </span>
                                )}
                              </div>
                              {selectedClient?.id === client.id && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Publication Type */}
            <div className="grid gap-2">
              <Label>Tipo de Publicação / Fase *</Label>
              <Select 
                value={publicationType} 
                onValueChange={(v) => setPublicationType(v as PublicationType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fase processual..." />
                </SelectTrigger>
                <SelectContent>
                  {PUBLICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Email Preview */}
            <div className="grid gap-2">
              <Label htmlFor="to">Para</Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={!!selectedClient}
                className={cn(selectedClient && "bg-muted")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cc">Cc (opcional)</Label>
              <Input
                id="cc"
                placeholder="email@exemplo.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="grid gap-2 flex-1">
              <Label htmlFor="body">Mensagem</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[300px] resize-none"
              />
            </div>
          </>
        ) : (
          // Standard email mode
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="to">Para</Label>
              <Input
                id="to"
                placeholder="email@exemplo.com (separe múltiplos com vírgula)"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cc">Cc (opcional)</Label>
              <Input
                id="cc"
                placeholder="email@exemplo.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Assunto do email"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="grid gap-2 flex-1">
              <Label htmlFor="body">Mensagem</Label>
              <Textarea
                id="body"
                placeholder="Escreva sua mensagem..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[300px] resize-none"
              />
            </div>
          </div>
        )}
      </CardContent>

      <Separator />

      <div className="p-4 flex items-center justify-between flex-shrink-0">
        <Button variant="outline" size="sm" className="gap-2">
          <Paperclip className="h-4 w-4" />
          Anexar arquivo
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sendEmail.isPending}
            className="gap-2"
          >
            {sendEmail.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar
          </Button>
        </div>
      </div>
    </Card>
  );
}
