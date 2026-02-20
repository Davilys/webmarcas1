import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Paperclip, Loader2, Search, Bold, Italic, Underline,
  List, Link, Image, AlignLeft, AlignCenter, AlignRight, Code,
  Sparkles, Clock, Users, ChevronDown, Check, ChevronsUpDown,
  Trash2, Eye, Calendar, Wand2, FileText, Tag, AtSign, Zap,
  Type, RotateCcw, User, Building, Scale, Plus, Hash, DollarSign,
  Shield, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Email } from '@/pages/admin/Emails';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface EmailComposeProps {
  onClose: () => void;
  replyTo?: Email | null;
  initialTo?: string;
  initialName?: string;
  initialBody?: string;
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
  | 'exigencia_merito' | 'envio_gru' | 'envio_protocolo' | 'indeferimento'
  | 'manifestacao_oposicao' | 'deferimento' | 'certificado' | 'renovacao'
  | 'distrato' | 'arquivamento' | 'debito_aberto';

const PUBLICATION_TYPES: { value: PublicationType; label: string; icon: string }[] = [
  { value: 'exigencia_merito', label: 'Exigência de Mérito', icon: '⚠️' },
  { value: 'envio_gru', label: 'Envio de GRU Federal', icon: '📋' },
  { value: 'envio_protocolo', label: 'Envio de Protocolo', icon: '📄' },
  { value: 'indeferimento', label: 'Indeferimento', icon: '❌' },
  { value: 'manifestacao_oposicao', label: 'Oposição', icon: '⚖️' },
  { value: 'deferimento', label: 'Deferimento', icon: '✅' },
  { value: 'certificado', label: 'Certificado', icon: '🏆' },
  { value: 'renovacao', label: 'Renovação', icon: '🔄' },
  { value: 'distrato', label: 'Distrato', icon: '📝' },
  { value: 'arquivamento', label: 'Arquivamento', icon: '🗄️' },
  { value: 'debito_aberto', label: 'Débito em Aberto', icon: '💰' },
];

const DYNAMIC_VARIABLES = [
  { key: '{{nome_cliente}}', label: 'Nome do Cliente', category: 'cliente', icon: User },
  { key: '{{nome_marca}}', label: 'Nome da Marca', category: 'processo', icon: Tag },
  { key: '{{numero_processo}}', label: 'Nº do Processo', category: 'processo', icon: Hash },
  { key: '{{status_processo}}', label: 'Status do Processo', category: 'processo', icon: Zap },
  { key: '{{admin_responsavel}}', label: 'Admin Responsável', category: 'admin', icon: Shield },
  { key: '{{link_pagamento}}', label: 'Link de Pagamento', category: 'financeiro', icon: DollarSign },
  { key: '{{email_cliente}}', label: 'Email do Cliente', category: 'cliente', icon: AtSign },
  { key: '{{empresa_cliente}}', label: 'Empresa do Cliente', category: 'cliente', icon: Building },
  { key: '{{data_hoje}}', label: 'Data Atual', category: 'sistema', icon: Calendar },
  { key: '{{link_portal}}', label: 'Link do Portal', category: 'sistema', icon: Globe },
];

const EMAIL_TEMPLATES: Record<PublicationType, { subject: string; body: string }> = {
  exigencia_merito: {
    subject: 'Exigência de Mérito – Processo {{numero_processo}}',
    body: `Prezado(a) {{nome_cliente}},\n\nInformamos que o INPI apresentou uma EXIGÊNCIA DE MÉRITO no processo de registro da marca {{nome_marca}}, nº {{numero_processo}}.\n\nEssa publicação indica que o examinador técnico do INPI identificou pontos que precisam ser complementados ou justificados antes de emitir o parecer final.\n\nO prazo para recurso já está aberto, e o não cumprimento dentro do período legal pode resultar no arquivamento definitivo do pedido.\n\nComo seus Procuradores e Representantes Legais, nosso departamento jurídico já está preparando o recurso técnico.\n\n**Custos e Prazos:**\n• Recurso à vista: R$ 1.195,00\n• Taxa federal (GRU – INPI): R$ 90,00\n\nAguardamos seu retorno.\n\nAtenciosamente,\nDepartamento Jurídico – WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
  envio_gru: {
    subject: 'GRU Federal INPI – Marca {{nome_marca}}',
    body: `Prezado(a) {{nome_cliente}},\n\nSegue a GRU federal do INPI referente ao processo de registro da marca {{nome_marca}}, nº {{numero_processo}}.\n\nA GRU vence no prazo informado no documento e não pode ser paga após o vencimento.\n\nSolicitamos:\n• Confirmação de recebimento\n• Envio do comprovante de pagamento\n• Envio do logotipo em arquivo JPG\n\nAtenciosamente,\nJurídico WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
  envio_protocolo: {
    subject: 'Protocolo de Registro – Marca {{nome_marca}}',
    body: `Prezado(a) {{nome_cliente}},\n\nÉ com grande satisfação que entregamos o protocolo de registro da marca {{nome_marca}}, nº {{numero_processo}}.\n\nO documento em anexo comprova que sua marca está devidamente depositada e segue em trâmite junto ao INPI.\n\nAtenciosamente,\nJurídico – WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
  indeferimento: {
    subject: 'Indeferimento Publicado – Processo {{numero_processo}}',
    body: `Prezado(a) {{nome_cliente}},\n\nNa qualidade de representantes legais, comunicamos o indeferimento publicado pelo INPI referente à marca {{nome_marca}}, nº {{numero_processo}}.\n\nEncontra-se aberto o prazo legal para interposição de recurso administrativo.\n\n**Custos desta fase:**\n• Recurso à vista: R$ 1.518,00\n• Taxa federal: R$ 350,00\n\nAguardamos seu retorno para regular prosseguimento dentro do prazo legal.\n\nAtenciosamente,\nDepartamento Jurídico – WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
  manifestacao_oposicao: {
    subject: 'Oposição Publicada – Processo {{numero_processo}}',
    body: `Prezado(a) {{nome_cliente}},\n\nInformamos que foi publicada oposição ao pedido de registro da marca {{nome_marca}}, processo nº {{numero_processo}}.\n\n**Custos desta fase:**\n• Recurso à vista: R$ 1.518,00\n• Taxa federal: R$ 90,00\n\nAguardamos sua confirmação para dar continuidade.\n\nAtenciosamente,\nJurídico – WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
  deferimento: {
    subject: 'Marca Deferida – {{nome_marca}} 🎉',
    body: `Prezado(a) {{nome_cliente}},\n\nInformamos que o pedido de registro da marca {{nome_marca}}, nº {{numero_processo}}, foi DEFERIDO pelo INPI. Parabéns!\n\nO processo agora aguarda o processamento da concessão do registro.\n\nAtenciosamente,\nJurídico WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
  certificado: {
    subject: 'Certificado de Registro Emitido – {{nome_marca}} 🏆',
    body: `Prezado(a) {{nome_cliente}},\n\nSeu certificado de registro da marca {{nome_marca}}, nº {{numero_processo}}, foi emitido.\n\nO documento está disponível na sua área do cliente: {{link_portal}}\n\nA proteção é válida por 10 anos em todo território nacional.\n\nParabéns pelo registro!\n\nJurídico WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
  renovacao: {
    subject: 'Renovação do Registro – {{nome_marca}}',
    body: `Prezado(a) {{nome_cliente}},\n\nO registro da marca {{nome_marca}}, nº {{numero_processo}}, está próximo do prazo de renovação.\n\nA renovação garante mais 10 anos de proteção.\n\nEstamos à disposição para iniciar o procedimento.\n\nJurídico WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
  distrato: {
    subject: 'Distrato Contratual – Marca {{nome_marca}}',
    body: `Prezado(a) {{nome_cliente}},\n\nComunicamos o encerramento formal do contrato referente à marca {{nome_marca}}, processo nº {{numero_processo}}.\n\nPermaneçamos à disposição para esclarecimentos.\n\nAtenciosamente,\nJurídico WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
  arquivamento: {
    subject: 'Processo Arquivado – {{nome_marca}}',
    body: `Prezado(a) {{nome_cliente}},\n\nComunicamos que o processo de registro da marca {{nome_marca}}, nº {{numero_processo}}, foi arquivado pelo INPI.\n\nCaso deseje protocolar novo pedido de registro, nossa equipe está à disposição.\n\nAtenciosamente,\nJurídico WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
  debito_aberto: {
    subject: 'Notificação de Débito – Regularização Imediata',
    body: `Prezado(a) {{nome_cliente}},\n\nComunicamos a existência de débito em aberto referente aos serviços contratados.\n\nLink para pagamento: {{link_pagamento}}\n\nSolicitamos regularização imediata para evitar medidas administrativas cabíveis.\n\nAguardamos retorno urgente.\n\nJurídico WebMarcas\njuridico@webmarcas.net | (11) 91112-0225`,
  },
};

function replaceTemplateVariables(text: string, client: ClientWithProcess | null): string {
  if (!client) return text;
  const today = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
  return text
    .replace(/\{\{nome_cliente\}\}/g, client.full_name || '')
    .replace(/\{\{nome_marca\}\}/g, client.brand_name || '')
    .replace(/\{\{numero_processo\}\}/g, client.process_number || '')
    .replace(/\{\{email_cliente\}\}/g, client.email || '')
    .replace(/\{\{data_hoje\}\}/g, today)
    .replace(/\{\{link_portal\}\}/g, 'https://webmarcas1.lovable.app/cliente');
}

export function EmailCompose({ onClose, replyTo, initialTo, initialName, initialBody }: EmailComposeProps) {
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [to, setTo] = useState(replyTo?.from_email || initialTo || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState(
    initialBody
      ? initialBody
      : replyTo
      ? `\n\n---\nEm resposta a:\n${replyTo.body_text?.slice(0, 500)}`
      : initialName ? `Prezado(a) ${initialName},\n\n` : ''
  );

  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');
  const [isProcessualMode, setIsProcessualMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithProcess | null>(null);
  const [publicationType, setPublicationType] = useState<PublicationType | ''>('');
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [lgpdOptIn, setLgpdOptIn] = useState(true);

  // Debounce search to avoid firing a query on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  type ProfileRow = { id: string; full_name: string | null; email: string; phone: string | null };
  type ProcessRow = { user_id: string | null; brand_name: string; process_number: string | null };

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients-with-processes', debouncedSearch],
    queryFn: async () => {
      // Paginated fetch — loads all matching profiles in batches of 1000
      const allProfiles: ProfileRow[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        if (debouncedSearch.trim()) {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`)
            .range(offset, offset + batchSize - 1);
          if (error) throw error;
          if (data && data.length > 0) {
            allProfiles.push(...data);
            offset += batchSize;
            if (data.length < batchSize) hasMore = false;
          } else {
            hasMore = false;
          }
        } else {
          // No search: load 200 most recent clients as default list
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone')
            .order('created_at', { ascending: false })
            .limit(200);
          if (error) throw error;
          if (data) allProfiles.push(...data);
          hasMore = false;
        }
      }

      // Fetch processes in batches of 100 (PostgREST IN limit)
      const profileIds = allProfiles.map(p => p.id);
      const allProcesses: ProcessRow[] = [];
      for (let i = 0; i < profileIds.length; i += 100) {
        const batch = profileIds.slice(i, i + 100);
        const { data: processBatch } = await supabase
          .from('brand_processes')
          .select('user_id, brand_name, process_number')
          .in('user_id', batch);
        if (processBatch) allProcesses.push(...processBatch);
      }

      // Build final client map
      const clientsMap = new Map<string, ClientWithProcess>();
      allProfiles.forEach(profile => {
        const process = allProcesses.find(p => p.user_id === profile.id);
        clientsMap.set(profile.id, {
          id: profile.id,
          full_name: profile.full_name || '',
          email: profile.email,
          brand_name: process?.brand_name || undefined,
          process_number: process?.process_number || undefined,
        });
      });
      return Array.from(clientsMap.values());
    },
    enabled: isProcessualMode,
  });

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

  const insertVariable = useCallback((variable: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newBody = body.slice(0, start) + variable + body.slice(end);
    setBody(newBody);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + variable.length;
        textareaRef.current.selectionEnd = start + variable.length;
        textareaRef.current.focus();
      }
    }, 10);
    setShowVariables(false);
  }, [body]);

  const applyFormat = useCallback((format: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = body.slice(start, end);
    let formatted = selected;
    if (format === 'bold') formatted = `**${selected}**`;
    if (format === 'italic') formatted = `_${selected}_`;
    if (format === 'underline') formatted = `__${selected}__`;
    if (format === 'list') formatted = selected.split('\n').map(l => `• ${l}`).join('\n');
    if (format === 'h1') formatted = `# ${selected}`;
    if (format === 'h2') formatted = `## ${selected}`;
    const newBody = body.slice(0, start) + formatted + body.slice(end);
    setBody(newBody);
  }, [body]);

  const generateWithAI = async () => {
    if (!subject) { toast.error('Adicione um assunto para gerar com IA'); return; }
    setIsAIGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-ai-assistant', {
        body: {
          action: 'compose',
          messages: [{
            role: 'user',
            content: `Escreva um email profissional com o seguinte assunto: "${subject}". ${selectedClient ? `Cliente: ${selectedClient.full_name}. Marca: ${selectedClient.brand_name || 'N/A'}. Processo: ${selectedClient.process_number || 'N/A'}.` : ''} ${body ? `Contexto atual: ${body.slice(0, 300)}` : ''}. Responda apenas com o corpo do email, pronto para uso.`,
          }],
        },
      });
      if (error) throw new Error(error.message);
      const aiText = data?.content || '';
      if (!aiText) throw new Error('Resposta vazia');
      setBody(aiText);
      toast.success('✨ Email gerado com IA!');
    } catch (err) {
      toast.error('Erro ao gerar com IA. Verifique sua conexão.');
      console.error('AI compose error:', err);
    } finally {
      setIsAIGenerating(false);
    }
    try {
      const context = selectedClient
        ? `Cliente: ${selectedClient.full_name}, Marca: ${selectedClient.brand_name || 'N/A'}, Processo: ${selectedClient.process_number || 'N/A'}`
        : 'Email genérico para cliente de escritório de marcas e patentes';
      const { data, error } = await supabase.functions.invoke('chat-support', {
        body: {
          message: `Escreva um email profissional em português brasileiro para um escritório de registro de marcas e patentes (WebMarcas). Assunto: "${subject}". Contexto: ${context}. O email deve ser jurídico, formal, empático e persuasivo. Use variáveis {{nome_cliente}}, {{nome_marca}} onde apropriado. Inclua assinatura da WebMarcas. Retorne apenas o corpo do email, sem assunto.`,
          conversationId: 'ai-email-gen',
          isAdmin: true,
        },
      });
      if (error) throw error;
      if (data?.response) setBody(data.response);
      else toast.info('IA não retornou conteúdo. Tente novamente.');
    } catch {
      toast.error('Erro ao gerar com IA. Verifique sua conexão.');
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 10MB.'); return; }
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const fileName = `email-attachments/${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
      setAttachments(prev => [...prev, { name: file.name, url: publicUrl, size: file.size, type: file.type }]);
      toast.success(`${file.name} anexado!`);
    } catch {
      toast.error('Erro ao anexar arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  const sendEmail = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single();
      const fromEmail = profile?.email || user.email || 'admin@webmarcas.com.br';
      const htmlBody = body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');

      const response = await supabase.functions.invoke('send-email', {
        body: {
          to: to.split(',').map(e => e.trim()),
          cc: cc ? cc.split(',').map(e => e.trim()) : undefined,
          bcc: bcc ? bcc.split(',').map(e => e.trim()) : undefined,
          subject,
          body,
          html: `<div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; padding: 32px; color: #1a1a1a; line-height: 1.7;">${htmlBody}</div>`,
          attachments: attachments.map(a => ({ url: a.url, filename: a.name })),
        },
      });
      if (response.error) throw response.error;

      await supabase.from('email_logs').insert({
        from_email: fromEmail,
        to_email: to,
        cc_emails: cc ? cc.split(',').map(e => e.trim()) : null,
        bcc_emails: bcc ? bcc.split(',').map(e => e.trim()) : null,
        subject,
        body,
        html_body: htmlBody,
        status: 'sent',
        trigger_type: isProcessualMode ? 'processual' : 'manual',
        sent_by: user.id,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Email enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['emails', 'sent'] });
      onClose();
    },
    onError: () => toast.error('Erro ao enviar email. Verifique as configurações.'),
  });

  const handleSend = () => {
    if (!to.trim()) { toast.error('Informe pelo menos um destinatário'); return; }
    if (!subject.trim()) { toast.error('Informe o assunto do email'); return; }
    sendEmail.mutate();
  };

  const renderPreview = () => {
    const htmlBody = body
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size:1.5rem;font-weight:bold;margin:16px 0 8px;">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size:1.2rem;font-weight:bold;margin:12px 0 6px;">$1</h2>')
      .replace(/^• (.*$)/gm, '<li style="margin:4px 0;">$1</li>')
      .replace(/\n/g, '<br/>');
    return (
      <div
        className="p-6 bg-white dark:bg-card rounded-lg border border-border text-sm leading-relaxed"
        style={{ fontFamily: 'Georgia, serif' }}
        dangerouslySetInnerHTML={{ __html: htmlBody }}
      />
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const variableCategories = ['cliente', 'processo', 'financeiro', 'admin', 'sistema'];
  const categoryLabels: Record<string, string> = {
    cliente: '👤 Cliente', processo: '📋 Processo',
    financeiro: '💰 Financeiro', admin: '🛡️ Admin', sistema: '⚙️ Sistema',
  };

  return (
    <div className="h-full flex flex-col bg-background rounded-xl border border-border/60 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Send className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{replyTo ? 'Responder Email' : 'Novo Email'}</h3>
            <p className="text-[10px] text-muted-foreground">Compositor Enterprise</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <button
            onClick={() => setIsProcessualMode(!isProcessualMode)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all",
              isProcessualMode
                ? "bg-primary/10 border-primary/30 text-primary font-medium"
                : "border-border/50 text-muted-foreground hover:bg-muted/50"
            )}
          >
            <Scale className="h-3.5 w-3.5" />
            Modo Processual
          </button>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted/50 flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Compose Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Processual Mode Banner */}
          <AnimatePresence>
            {isProcessualMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-primary/20 bg-primary/5 px-4 py-3 flex-shrink-0"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-primary uppercase tracking-wider block mb-1">
                      Cliente / Processo
                    </label>
                    <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-8 text-xs" size="sm">
                          {selectedClient ? (
                            <span className="flex items-center gap-2 truncate">
                              <User className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="truncate">{selectedClient.full_name}</span>
                              {selectedClient.brand_name && (
                                <Badge variant="secondary" className="text-[9px] py-0 px-1">{selectedClient.brand_name}</Badge>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Buscar cliente...</span>
                          )}
                          <ChevronsUpDown className="h-3 w-3 ml-1 flex-shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput placeholder="Nome, email ou marca..." value={searchQuery} onValueChange={setSearchQuery} />
                          <CommandList>
                            {isLoadingClients ? (
                              <div className="flex items-center justify-center py-4 gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Buscando clientes...</span>
                              </div>
                            ) : (
                              <>
                                <CommandEmpty>Nenhum cliente encontrado</CommandEmpty>
                                <CommandGroup>
                                  {clients.map(client => (
                                    <CommandItem key={client.id} onSelect={() => { setSelectedClient(client); setClientSearchOpen(false); }} className="cursor-pointer">
                                      <div className="flex flex-col">
                                        <span className="font-medium text-sm">{client.full_name}</span>
                                        <span className="text-xs text-muted-foreground">{client.email}</span>
                                        {client.brand_name && (
                                          <span className="text-[10px] text-primary">Marca: {client.brand_name} {client.process_number && `· Proc: ${client.process_number}`}</span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-primary uppercase tracking-wider block mb-1">
                      Tipo de Publicação / Fase
                    </label>
                    <Select value={publicationType} onValueChange={(v) => setPublicationType(v as PublicationType)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecionar fase..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PUBLICATION_TYPES.map(pt => (
                          <SelectItem key={pt.value} value={pt.value} className="text-xs">
                            {pt.icon} {pt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recipients */}
          <div className="border-b border-border/50 flex-shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
              <span className="text-xs text-muted-foreground w-8 flex-shrink-0">Para:</span>
              <Input
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="destinatario@email.com, outro@email.com"
                className="border-0 shadow-none focus-visible:ring-0 h-7 text-sm px-0"
              />
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setShowCc(!showCc)} className={cn("text-[10px] px-2 py-0.5 rounded border transition-colors", showCc ? "bg-primary/10 border-primary/30 text-primary" : "border-border/30 text-muted-foreground hover:bg-muted/40")}>Cc</button>
                <button onClick={() => setShowBcc(!showBcc)} className={cn("text-[10px] px-2 py-0.5 rounded border transition-colors", showBcc ? "bg-primary/10 border-primary/30 text-primary" : "border-border/30 text-muted-foreground hover:bg-muted/40")}>Cco</button>
              </div>
            </div>
            {showCc && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
                <span className="text-xs text-muted-foreground w-8 flex-shrink-0">Cc:</span>
                <Input value={cc} onChange={e => setCc(e.target.value)} placeholder="cc@email.com" className="border-0 shadow-none focus-visible:ring-0 h-7 text-sm px-0" />
              </div>
            )}
            {showBcc && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
                <span className="text-xs text-muted-foreground w-8 flex-shrink-0">Cco:</span>
                <Input value={bcc} onChange={e => setBcc(e.target.value)} placeholder="cco@email.com" className="border-0 shadow-none focus-visible:ring-0 h-7 text-sm px-0" />
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="text-xs text-muted-foreground w-8 flex-shrink-0">Assunto:</span>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Assunto do email..."
                className="border-0 shadow-none focus-visible:ring-0 h-7 text-sm px-0 font-medium"
              />
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/30 bg-muted/20 flex-shrink-0 flex-wrap">
            {[
              { icon: Bold, action: 'bold', title: 'Negrito' },
              { icon: Italic, action: 'italic', title: 'Itálico' },
              { icon: Underline, action: 'underline', title: 'Sublinhado' },
            ].map(({ icon: Icon, action, title }) => (
              <button key={action} onClick={() => applyFormat(action)} title={title}
                className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
            <div className="w-px h-5 bg-border/50 mx-0.5" />
            <button onClick={() => applyFormat('h1')} title="Título" className="h-7 px-2 rounded-md hover:bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">H1</button>
            <button onClick={() => applyFormat('h2')} title="Subtítulo" className="h-7 px-2 rounded-md hover:bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">H2</button>
            <button onClick={() => applyFormat('list')} title="Lista" className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <List className="h-3.5 w-3.5" />
            </button>
            <div className="w-px h-5 bg-border/50 mx-0.5" />

            {/* Variables button */}
            <Popover open={showVariables} onOpenChange={setShowVariables}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 h-7 px-2 rounded-md hover:bg-primary/10 text-[10px] font-medium text-primary border border-primary/20 transition-colors">
                  <Tag className="h-3 w-3" />
                  Variáveis
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2" align="start">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Inserir Variável Dinâmica</p>
                {variableCategories.map(cat => {
                  const vars = DYNAMIC_VARIABLES.filter(v => v.category === cat);
                  if (!vars.length) return null;
                  return (
                    <div key={cat} className="mb-2">
                      <p className="text-[9px] text-muted-foreground px-1 mb-1">{categoryLabels[cat]}</p>
                      {vars.map(v => {
                        const VIcon = v.icon;
                        return (
                          <button key={v.key} onClick={() => insertVariable(v.key)}
                            className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-muted/50 text-xs transition-colors">
                            <VIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium text-foreground">{v.label}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{v.key}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </PopoverContent>
            </Popover>

            <div className="w-px h-5 bg-border/50 mx-0.5" />

            {/* AI Generate */}
            <button onClick={generateWithAI} disabled={isAIGenerating}
              className="flex items-center gap-1 h-7 px-2 rounded-md bg-gradient-to-r from-purple-500/10 to-primary/10 border border-purple-500/20 text-[10px] font-medium text-purple-600 dark:text-purple-400 hover:from-purple-500/20 hover:to-primary/20 transition-all">
              {isAIGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Gerar com IA
            </button>

            {/* Attachment */}
            <label className="flex items-center gap-1 h-7 px-2 rounded-md hover:bg-muted cursor-pointer text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <Paperclip className="h-3 w-3" />
              Anexar
              <input type="file" className="hidden" onChange={handleFileUpload} accept="*/*" />
            </label>

            {/* Tabs */}
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => setActiveTab('compose')} className={cn("h-7 px-2 rounded-md text-[10px] font-medium transition-colors", activeTab === 'compose' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50")}>
                <Type className="h-3 w-3 inline mr-1" />Escrever
              </button>
              <button onClick={() => setActiveTab('preview')} className={cn("h-7 px-2 rounded-md text-[10px] font-medium transition-colors", activeTab === 'preview' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50")}>
                <Eye className="h-3 w-3 inline mr-1" />Preview
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'compose' ? (
              <textarea
                ref={textareaRef}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Escreva sua mensagem aqui...

Dica: Use **negrito**, _itálico_, {{nome_cliente}} para variáveis dinâmicas."
                className="w-full h-full resize-none border-0 bg-transparent px-4 py-3 text-sm leading-relaxed focus:outline-none placeholder:text-muted-foreground/50 font-['Georgia',serif]"
              />
            ) : (
              <ScrollArea className="h-full px-4 py-3">
                {renderPreview()}
              </ScrollArea>
            )}
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="border-t border-border/50 px-4 py-2 flex-shrink-0">
              <div className="flex flex-wrap gap-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-lg px-2.5 py-1.5 text-xs">
                    <Paperclip className="h-3 w-3 text-primary" />
                    <span className="max-w-32 truncate">{att.name}</span>
                    <span className="text-muted-foreground">{formatFileSize(att.size)}</span>
                    <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between flex-shrink-0 bg-muted/10">
            <div className="flex items-center gap-2">
              {/* Schedule toggle */}
              <button onClick={() => setIsScheduled(!isScheduled)}
                className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all",
                  isScheduled ? "bg-amber-500/10 border-amber-500/30 text-amber-600" : "border-border/50 text-muted-foreground hover:bg-muted/50")}>
                <Clock className="h-3.5 w-3.5" />
                {isScheduled ? 'Agendado' : 'Agendar'}
              </button>
              {isScheduled && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="text-xs border border-border/50 rounded-lg px-2 py-1 bg-background"
                />
              )}
              {/* LGPD */}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Shield className="h-3 w-3 text-emerald-500" />
                LGPD compliant
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-8">
                Cancelar
              </Button>
              <Button
                onClick={handleSend}
                disabled={sendEmail.isPending || !to.trim() || !subject.trim()}
                size="sm"
                className="gap-2 h-8 text-xs bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
              >
                {sendEmail.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {sendEmail.isPending ? 'Enviando...' : isScheduled ? 'Agendar Envio' : 'Enviar Agora'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
