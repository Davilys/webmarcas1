import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Reply, Forward, Trash2, Star, Clock, Sparkles,
  MoreHorizontal, Archive, Eye, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Email } from '@/pages/admin/Emails';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { AIEmailAssistant } from './AIEmailAssistant';
import { toast } from 'sonner';

interface EmailViewProps {
  email: Email;
  onBack: () => void;
  onReply: () => void;
  onUseDraftFromAI?: (text: string) => void;
}

const TRACKING_MOCK = {
  opens: 3,
  lastOpen: '14:22',
  device: 'Desktop · Chrome',
  location: 'São Paulo, SP',
  clicks: 1,
};

export function EmailView({ email, onBack, onReply, onUseDraftFromAI }: EmailViewProps) {
  const [showAI, setShowAI] = useState(false);
  const [isStarred, setIsStarred] = useState(email.is_starred);
  const [draftText, setDraftText] = useState('');

  useEffect(() => {
    if (!email.is_read) {
      supabase.from('email_inbox').update({ is_read: true }).eq('id', email.id).then(() => {});
    }
  }, [email.id, email.is_read]);

  const emailDate = email.received_at || email.sent_at;

  const handleUseDraft = (text: string) => {
    setDraftText(text);
    setShowAI(false); // Close the AI modal
    if (onUseDraftFromAI) {
      onUseDraftFromAI(text);
    } else {
      onReply();
      toast.success('✅ Rascunho pronto! Clique em Responder para editar.');
    }
  };


  const handleToggleStar = async () => {
    setIsStarred(prev => !prev);
    await supabase.from('email_inbox').update({ is_starred: !isStarred }).eq('id', email.id);
    toast.success(isStarred ? 'Removido dos favoritos' : '⭐ Adicionado aos favoritos');
  };

  return (
    <>
      {/* AI Assistant as Dialog/Modal */}
      <Dialog open={showAI} onOpenChange={setShowAI}>
        <DialogContent className="max-w-2xl w-full p-0 gap-0 overflow-hidden max-h-[90vh]">
          <AIEmailAssistant
            email={email}
            onUseDraft={handleUseDraft}
            onClose={() => setShowAI(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Main Email View — always full width */}
      <div className="h-full flex flex-col w-full">
        <Card className="h-full flex flex-col rounded-none border-0 shadow-none">
          {/* Top Toolbar */}
          <CardHeader className="pb-0 pt-3 px-4 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 hover:bg-muted">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1" />
              <div className="flex items-center gap-1">
                <Button
                  variant={showAI ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "gap-1.5 text-xs h-8 transition-all",
                    showAI ? "shadow-lg" : ""
                  )}
                  onClick={() => setShowAI(prev => !prev)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  ✨ IA Assistente
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleToggleStar}>
                  <Star className={cn('h-4 w-4 transition-colors', isStarred ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Archive className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Subject */}
            <h2 className="text-lg font-bold leading-tight mb-3">{email.subject}</h2>

            {/* Tracking Bar */}
            <div className="flex items-center gap-3 py-2 px-3 bg-muted/30 rounded-xl border border-border/30 text-[10px] text-muted-foreground mb-3">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-primary" />
                <span className="font-semibold text-foreground">{TRACKING_MOCK.opens}x</span> aberto
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última: {TRACKING_MOCK.lastOpen}
              </div>
              <div className="w-px h-3 bg-border" />
              <span>{TRACKING_MOCK.device}</span>
              <div className="w-px h-3 bg-border" />
              <span>{TRACKING_MOCK.location}</span>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Sender Block */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-sm">
                        {(email.from_name || email.from_email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{email.from_name || email.from_email}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-muted-foreground">{email.from_email}</p>
                        <span className="text-muted-foreground text-xs">→</span>
                        <p className="text-xs text-muted-foreground">{email.to_email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    {emailDate && format(new Date(emailDate), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Email Body */}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {email.body_html ? (
                    <div dangerouslySetInnerHTML={{ __html: email.body_html }} className="leading-relaxed" />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-sm text-foreground/90">{email.body_text || '(Sem conteúdo)'}</p>
                  )}
                </div>

                {/* AI Draft Preview */}
                <AnimatePresence>
                  {draftText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <p className="text-xs font-semibold text-primary">Rascunho gerado pela IA</p>
                        <Badge variant="outline" className="text-[9px]">Aguardando revisão</Badge>
                      </div>
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">{draftText}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={onReply}>
                          <Reply className="h-3 w-3" />
                          Editar e Enviar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDraftText('')}>
                          Descartar
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>

          <Separator />

          {/* Action Bar */}
          <div className="p-3 flex items-center gap-2 flex-shrink-0 bg-background/50">
            <Button onClick={onReply} className="gap-2 h-9 shadow-sm shadow-primary/20">
              <Reply className="h-4 w-4" />
              Responder
            </Button>
            <Button variant="outline" className="gap-2 h-9">
              <Forward className="h-4 w-4" />
              Encaminhar
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 text-xs"
              onClick={() => setShowAI(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              ✨ IA
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
