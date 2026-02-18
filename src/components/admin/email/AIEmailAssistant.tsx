import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Sparkles, Loader2, Copy, ChevronDown, ChevronUp, RefreshCw,
  Wand2, FileText, Briefcase, Heart, Zap, Brain, Scale,
  MessageSquare, X, CheckCircle2, RotateCcw, Lightbulb,
  AlertCircle, User, Hash, TrendingUp,
} from 'lucide-react';
import type { Email } from '@/pages/admin/Emails';

interface AIEmailAssistantProps {
  email: Email;
  onUseDraft: (text: string) => void;
  onClose: () => void;
}

type ToneMode = 'juridico' | 'comercial' | 'suporte' | 'curto' | 'livre' | 'formal' | 'amigavel';
type AIAction = 'reply' | 'improve' | 'summarize' | 'formal' | 'simple' | 'persuasive' | 'correct';

interface GeneratedReply {
  id: string;
  tone: ToneMode;
  content: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const TONE_CONFIG: Record<ToneMode, { label: string; icon: React.ElementType; color: string; prompt: string }> = {
  juridico: { label: 'Jurídico', icon: Scale, color: 'text-purple-500', prompt: 'Tom formal e técnico jurídico, linguagem de assessoria especializada em propriedade intelectual/marcas.' },
  comercial: { label: 'Comercial', icon: Briefcase, color: 'text-blue-500', prompt: 'Tom persuasivo, comercial, focado em conversão e benefícios para o cliente.' },
  suporte: { label: 'Suporte', icon: Heart, color: 'text-rose-500', prompt: 'Tom empático, explicativo, de suporte ao cliente, compreensivo e prestativo.' },
  curto: { label: 'Curto', icon: Zap, color: 'text-amber-500', prompt: 'Resposta curta e objetiva, máximo 3 linhas, direta ao ponto.' },
  livre: { label: 'IA Livre', icon: Brain, color: 'text-primary', prompt: 'Resposta contextual completa e natural, adaptada ao conteúdo do email recebido.' },
  formal: { label: 'Formal', icon: FileText, color: 'text-slate-500', prompt: 'Tom extremamente formal e profissional, como correspondência empresarial oficial.' },
  amigavel: { label: 'Amigável', icon: MessageSquare, color: 'text-emerald-500', prompt: 'Tom amigável, caloroso, próximo ao cliente, sem ser informal demais.' },
};

const AI_ACTIONS: { key: AIAction; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'reply', label: 'Gerar Resposta', icon: Sparkles, description: 'Criar resposta completa' },
  { key: 'improve', label: 'Melhorar Texto', icon: Wand2, description: 'Aprimorar qualidade' },
  { key: 'summarize', label: 'Resumir Email', icon: FileText, description: 'Resumo executivo' },
  { key: 'formal', label: 'Tornar Formal', icon: Scale, description: 'Linguagem formal' },
  { key: 'simple', label: 'Tornar Simples', icon: MessageSquare, description: 'Simplificar texto' },
  { key: 'persuasive', label: 'Mais Persuasivo', icon: TrendingUp, description: 'Aumentar impacto' },
  { key: 'correct', label: 'Corrigir Ortografia', icon: CheckCircle2, description: 'Correção automática' },
];

const SMART_REPLIES = [
  'Vou verificar e já te atualizo em breve.',
  'Olá! Seu processo está em andamento. Posso ajudar com mais detalhes?',
  'Obrigado pelo contato. Estou verificando as informações e retorno em breve.',
  'Entendi sua solicitação. Vou encaminhar para a equipe responsável.',
];

function buildSystemPrompt(email: Email, tone: ToneMode): string {
  const toneInstructions = TONE_CONFIG[tone].prompt;
  return `Você é um assistente especializado em comunicação profissional para um escritório de propriedade intelectual e registro de marcas chamado WebMarcas.

CONTEXTO DO EMAIL:
- Remetente: ${email.from_name || email.from_email}
- Email: ${email.from_email}
- Assunto: ${email.subject}
- Conteúdo: ${email.body_text || email.subject}

INSTRUÇÕES DE TOM: ${toneInstructions}

REGRAS OBRIGATÓRIAS:
1. Sempre use saudação profissional com o nome do remetente se disponível
2. Assine como "Equipe WebMarcas | Propriedade Intelectual"
3. Não invente dados de processos, prazos ou valores
4. Use variáveis entre colchetes quando precisar de dados específicos: [NÚMERO_PROCESSO], [PRAZO], [VALOR]
5. Responda SOMENTE em português brasileiro
6. Resposta deve ser imediatamente utilizável pelo admin
7. Máximo 300 palavras para respostas normais, 3 linhas para tom curto`;
}

function buildActionPrompt(action: AIAction, emailContent: string, tone: ToneMode): string {
  switch (action) {
    case 'reply': return `Gere uma resposta profissional para este email com o tom especificado.`;
    case 'improve': return `Melhore a qualidade, clareza e profissionalismo deste texto: "${emailContent}"`;
    case 'summarize': return `Faça um resumo executivo claro e objetivo deste email em 3-5 bullet points.`;
    case 'formal': return `Reescreva este texto com linguagem extremamente formal e profissional: "${emailContent}"`;
    case 'simple': return `Simplifique este texto tornando-o mais fácil de entender: "${emailContent}"`;
    case 'persuasive': return `Reescreva este texto tornando-o mais persuasivo e impactante: "${emailContent}"`;
    case 'correct': return `Corrija a ortografia, gramática e pontuação deste texto mantendo o conteúdo original: "${emailContent}"`;
    default: return 'Gere uma resposta profissional.';
  }
}

export function AIEmailAssistant({ email, onUseDraft, onClose }: AIEmailAssistantProps) {
  const [selectedTone, setSelectedTone] = useState<ToneMode>('livre');
  const [selectedAction, setSelectedAction] = useState<AIAction>('reply');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReplies, setGeneratedReplies] = useState<GeneratedReply[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [detectedIntent, setDetectedIntent] = useState<string>('');
  const [expandedReply, setExpandedReply] = useState<string | null>(null);

  const detectIntent = useCallback((content: string): string => {
    const lower = content.toLowerCase();
    if (lower.includes('andamento') || lower.includes('status') || lower.includes('processo')) return '📋 Status do Processo INPI';
    if (lower.includes('pagar') || lower.includes('boleto') || lower.includes('cobranç') || lower.includes('valor')) return '💰 Questão Financeira / Cobrança';
    if (lower.includes('cancelar') || lower.includes('desistir') || lower.includes('encerrar')) return '⚠️ Pedido de Cancelamento';
    if (lower.includes('exigência') || lower.includes('prazo') || lower.includes('inpi')) return '⚖️ Questão Jurídica / INPI';
    if (lower.includes('dúvida') || lower.includes('como') || lower.includes('o que é')) return '❓ Dúvida / Suporte';
    if (lower.includes('reclamaç') || lower.includes('insatisf') || lower.includes('problema')) return '🚨 Reclamação';
    return '📧 Comunicação Geral';
  }, []);

  const generateWithAI = useCallback(async (action: AIAction, tone: ToneMode) => {
    setIsGenerating(true);
    const intent = detectIntent(email.body_text || email.subject || '');
    setDetectedIntent(intent);

    try {
      const { data, error } = await supabase.functions.invoke('email-ai-assistant', {
        body: {
          action,
          systemPrompt: buildSystemPrompt(email, tone),
          messages: [
            { role: 'user', content: buildActionPrompt(action, customInput || email.body_text || email.subject || '', tone) },
          ],
        },
      });

      if (error) throw new Error(error.message || 'Erro na função IA');

      const aiText = data?.content || '';

      if (!aiText) throw new Error('Resposta vazia da IA');

      if (action === 'summarize') {
        setSummary(aiText);
        setShowSummary(true);
      } else {
        const newReply: GeneratedReply = {
          id: `${Date.now()}`,
          tone,
          content: aiText,
          label: TONE_CONFIG[tone].label,
          icon: TONE_CONFIG[tone].icon,
          color: TONE_CONFIG[tone].color,
        };
        setGeneratedReplies(prev => [newReply, ...prev.slice(0, 3)]);
        setExpandedReply(newReply.id);
      }
    } catch (err) {
      console.error('AI error:', err);
      const errMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      // Show error but also provide intelligent fallback so UX never breaks
      toast.warning(`IA indisponível: ${errMsg}. Usando template inteligente.`);
      const fallback = generateFallback(action, tone, email);
      if (action === 'summarize') {
        setSummary(fallback);
        setShowSummary(true);
      } else {
        const newReply: GeneratedReply = {
          id: `${Date.now()}`,
          tone,
          content: fallback,
          label: `${TONE_CONFIG[tone].label} (template)`,
          icon: TONE_CONFIG[tone].icon,
          color: TONE_CONFIG[tone].color,
        };
        setGeneratedReplies(prev => [newReply, ...prev.slice(0, 3)]);
        setExpandedReply(newReply.id);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [email, customInput, detectIntent]);

  const generateFallback = (action: AIAction, tone: ToneMode, email: Email): string => {
    const senderName = email.from_name?.split(' ')[0] || 'Cliente';
    if (action === 'summarize') {
      return `📋 **Resumo do Email**\n\n• **Remetente:** ${email.from_name || email.from_email}\n• **Assunto:** ${email.subject}\n• **Intenção detectada:** ${detectIntent(email.body_text || '')}\n• **Conteúdo:** ${(email.body_text || '').substring(0, 200)}...`;
    }
    const tones: Record<ToneMode, string> = {
      juridico: `Prezado(a) ${senderName},\n\nAgradeço o contato com nossa assessoria jurídica especializada.\n\nEm resposta à sua solicitação referente ao assunto "${email.subject}", informamos que o processo se encontra em análise pela nossa equipe técnica e retornaremos em prazo hábil com as informações pertinentes.\n\nAtenciosamente,\nEquipe WebMarcas | Propriedade Intelectual`,
      comercial: `Olá ${senderName}! 👋\n\nQue bom receber seu contato! Ficamos felizes em poder ajudá-lo(a).\n\nSobre "${email.subject}" — nossa equipe está analisando e já garanto que teremos a melhor solução para você. Somos especialistas em registro de marcas e nosso time está pronto para apoiá-lo nessa jornada!\n\nPodemos agendar uma conversa rápida?\n\nEquipe WebMarcas 🚀`,
      suporte: `Olá ${senderName},\n\nEntendo sua preocupação e estou aqui para ajudar! 😊\n\nRecebi sua mensagem sobre "${email.subject}" e vou verificar todos os detalhes para você. Sei que aguardar pode ser difícil, mas pode contar comigo para manter você informado(a) em cada etapa.\n\nVolto com as informações em breve!\n\nEquipe WebMarcas`,
      curto: `Olá ${senderName}, recebemos sua mensagem sobre "${email.subject}". Estamos verificando e retornamos em breve. Obrigado! — WebMarcas`,
      livre: `Olá ${senderName},\n\nObrigado pelo contato!\n\nEm relação à sua mensagem sobre "${email.subject}", nossa equipe está analisando e retornará com as informações necessárias em breve.\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\nEquipe WebMarcas | Propriedade Intelectual`,
      formal: `Ilmo(a). Sr(a). ${senderName},\n\nVimos por meio desta, acusar o recebimento de sua correspondência eletrônica datada de hoje, referente ao assunto "${email.subject}".\n\nInformamos que o presente comunicado está sendo devidamente analisado por nossa equipe especializada, que providenciará o retorno cabível no prazo adequado.\n\nRespeitosamente,\nEquipe WebMarcas | Assessoria em Propriedade Intelectual`,
      amigavel: `Oi ${senderName}! 😊\n\nQue ótimo ter sua mensagem! Sobre "${email.subject}" — já estou de olho e te conto tudo em breve.\n\nQualquer coisa, pode chamar!\n\nUm abraço,\nEquipe WebMarcas`,
    };
    return tones[tone];
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col bg-card border-l border-border/50 relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold">Assistente IA</p>
            <p className="text-[10px] text-muted-foreground">Gmail + GPT-4o Style</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse" />
          <span className="text-[10px] text-muted-foreground font-medium mr-2">Online</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Intent Detection */}
          {detectedIntent && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-xl"
            >
              <Lightbulb className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Intenção detectada</p>
                <p className="text-xs font-medium">{detectedIntent}</p>
              </div>
            </motion.div>
          )}

          {/* Smart Quick Replies */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Zap className="h-3 w-3" />Respostas Rápidas
            </p>
            <div className="space-y-1.5">
              {SMART_REPLIES.map((reply, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { onUseDraft(reply); toast.success('✅ Resposta rápida inserida!'); }}
                  className="w-full text-left text-xs p-2.5 rounded-lg border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-primary text-[10px] font-bold mt-0.5 opacity-60 group-hover:opacity-100">✦</span>
                    <span className="text-muted-foreground group-hover:text-foreground">{reply}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tone Selector */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tom da Resposta</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(TONE_CONFIG) as [ToneMode, typeof TONE_CONFIG[ToneMode]][]).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = selectedTone === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTone(key)}
                    className={cn(
                      "flex items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all",
                      isSelected
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "border-border/50 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : config.color)} />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Selector */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ação IA</p>
            <Select value={selectedAction} onValueChange={(v) => setSelectedAction(v as AIAction)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <SelectItem key={action.key} value={action.key} className="text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{action.label}</span>
                        <span className="text-muted-foreground text-[10px]">— {action.description}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Input for improve/formal/simple/persuasive */}
          {selectedAction !== 'reply' && selectedAction !== 'summarize' && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Texto para processar (opcional)</p>
              <Textarea
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                placeholder="Cole o texto que deseja melhorar, ou deixe vazio para usar o email atual..."
                className="text-xs min-h-[80px] resize-none"
              />
            </div>
          )}

          {/* Generate Button */}
          <Button
            className="w-full gap-2 shadow-lg shadow-primary/20 relative overflow-hidden"
            onClick={() => generateWithAI(selectedAction, selectedTone)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando com IA...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                ✨ Gerar com IA
              </>
            )}
            {isGenerating && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
            )}
          </Button>

          {/* Summary Block */}
          <AnimatePresence>
            {showSummary && summary && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-muted/40 border border-border/50 rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold">Resumo Executivo</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(summary); toast.success('Copiado!'); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSummary(false)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{summary}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generated Replies */}
          <AnimatePresence>
            {generatedReplies.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Brain className="h-3 w-3" />Respostas Geradas ({generatedReplies.length})
                </p>
                {generatedReplies.map((reply, i) => {
                  const Icon = reply.icon;
                  const isExpanded = expandedReply === reply.id;
                  return (
                    <motion.div
                      key={reply.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "border rounded-xl overflow-hidden transition-all",
                        i === 0 ? "border-primary/30 shadow-sm shadow-primary/10" : "border-border/50"
                      )}
                    >
                      {/* Reply Header */}
                      <button
                        onClick={() => setExpandedReply(isExpanded ? null : reply.id)}
                        className="w-full flex items-center gap-2 p-2.5 hover:bg-muted/30 transition-colors"
                      >
                        <div className={cn("h-6 w-6 rounded-lg bg-muted flex items-center justify-center flex-shrink-0")}>
                          <Icon className={`h-3.5 w-3.5 ${reply.color}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-xs font-semibold">{reply.label}</span>
                          {i === 0 && <Badge variant="default" className="ml-1.5 text-[8px] h-4 px-1">✨ Novo</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-6 w-6"
                            onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(reply.content); toast.success('✅ Copiado!'); }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/30"
                          >
                            <div className="p-3 bg-muted/20">
                              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                            </div>
                            <div className="flex gap-1.5 p-2.5 border-t border-border/20 bg-background/50">
                              <Button
                                size="sm" className="flex-1 h-7 text-xs gap-1 shadow-sm shadow-primary/20"
                                onClick={() => { onUseDraft(reply.content); toast.success('✅ Rascunho inserido no editor!'); }}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Usar Esta
                              </Button>
                              <Button
                                variant="outline" size="sm" className="h-7 text-xs gap-1"
                                onClick={() => { generateWithAI(selectedAction, reply.tone); toast.info('🔄 Regenerando...'); }}
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          {/* AI Security Notice */}
          <div className="flex items-start gap-2 p-2.5 bg-muted/30 rounded-xl border border-border/30">
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Revisão humana obrigatória.</strong> A IA nunca envia automaticamente. Revise antes de usar.
            </p>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
