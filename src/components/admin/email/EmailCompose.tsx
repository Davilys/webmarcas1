import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { X, Send, Paperclip, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Email } from '@/pages/admin/Emails';

interface EmailComposeProps {
  onClose: () => void;
  replyTo?: Email | null;
}

export function EmailCompose({ onClose, replyTo }: EmailComposeProps) {
  const queryClient = useQueryClient();
  const [to, setTo] = useState(replyTo?.from_email || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [body, setBody] = useState(
    replyTo
      ? `\n\n---\nEm resposta a:\n${replyTo.body_text?.slice(0, 500)}`
      : ''
  );

  const sendEmail = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get user profile for from_email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const fromEmail = profile?.email || user.email || 'admin@webmarcas.com.br';

      // Call edge function to send email
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

      // Log the sent email
      await supabase.from('email_logs').insert({
        from_email: fromEmail,
        to_email: to,
        cc_emails: cc ? cc.split(',').map(e => e.trim()) : null,
        subject,
        body,
        html_body: `<div style="font-family: sans-serif; white-space: pre-wrap;">${body}</div>`,
        status: 'sent',
        trigger_type: 'manual',
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
    sendEmail.mutate();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle>
            {replyTo ? 'Responder Email' : 'Novo Email'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-hidden p-4 space-y-4">
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
