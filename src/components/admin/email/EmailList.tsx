import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Search, Mail, Star, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Email, EmailFolder } from '@/pages/admin/Emails';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EmailListProps {
  folder: 'inbox' | 'sent' | 'drafts';
  onSelectEmail: (email: Email) => void;
  accountId?: string | null;
  accountEmail?: string;
}

export function EmailList({ folder, onSelectEmail, accountId, accountEmail }: EmailListProps) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-imap-inbox', {
        body: { limit: 10, account_id: accountId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      toast.success(`Sincronização concluída! ${data.synced_count} novos emails.`);
    },
    onError: (error: any) => {
      console.error('Sync error:', error);
      toast.error('Erro ao sincronizar: ' + error.message);
    }
  });

  const { data: emails, isLoading } = useQuery({
    queryKey: ['emails', folder, accountId, accountEmail],
    queryFn: async () => {
      if (!accountId) return [];

      if (folder === 'inbox') {
        const { data, error } = await supabase
          .from('email_inbox')
          .select('*')
          .eq('is_archived', false)
          .eq('account_id', accountId)
          .order('received_at', { ascending: false });
        
        if (error) throw error;
        return data?.map(e => ({
          id: e.id,
          from_email: e.from_email,
          from_name: e.from_name,
          to_email: e.to_email,
          subject: e.subject || '(Sem assunto)',
          body_text: e.body_text,
          body_html: e.body_html,
          is_read: e.is_read || false,
          is_starred: e.is_starred || false,
          received_at: e.received_at,
        })) as Email[];
      } else if (folder === 'sent') {
        if (!accountEmail) return [];
        const { data, error } = await supabase
          .from('email_logs')
          .select('*')
          .eq('status', 'sent')
          .eq('from_email', accountEmail)
          .order('sent_at', { ascending: false });
        
        if (error) throw error;
        return data?.map(e => ({
          id: e.id,
          from_email: e.from_email,
          to_email: e.to_email,
          subject: e.subject,
          body_text: e.body,
          body_html: e.html_body,
          is_read: true,
          is_starred: false,
          sent_at: e.sent_at,
        })) as Email[];
      }
      return [];
    },
    enabled: !!accountId,
  });

  const filteredEmails = emails?.filter(email =>
    email.subject.toLowerCase().includes(search.toLowerCase()) ||
    email.from_email.toLowerCase().includes(search.toLowerCase()) ||
    email.to_email.toLowerCase().includes(search.toLowerCase())
  );

  const title = folder === 'inbox' ? 'Caixa de Entrada' : folder === 'sent' ? 'Enviados' : 'Rascunhos';

  if (!accountId) {
    return (
      <Card className="h-full flex flex-col border-0 md:border shadow-none md:shadow-sm">
        <CardContent className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <Mail className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Selecione uma conta</p>
          <p className="text-sm">Escolha uma conta de email no painel lateral</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border-0 md:border shadow-none md:shadow-sm">
      <CardHeader className="pb-3 flex-shrink-0 px-3 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Mail className="h-4 w-4 md:h-5 md:w-5" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-1.5 md:gap-2">
            {folder === 'inbox' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="h-8 text-xs"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 md:mr-1", syncMutation.isPending && "animate-spin")} />
                <span className="hidden md:inline">Sincronizar</span>
              </Button>
            )}
            <Badge variant="secondary" className="text-[10px] md:text-xs">
              {emails?.length || 0}
            </Badge>
          </div>
        </div>
        <div className="relative mt-2 md:mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 md:h-10"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredEmails && filteredEmails.length > 0 ? (
            <div className="divide-y">
              {filteredEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => onSelectEmail(email)}
                  className={cn(
                    'w-full text-left p-4 hover:bg-muted transition-colors',
                    !email.is_read && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <Star className={cn(
                        'h-4 w-4',
                        email.is_starred ? 'fill-primary text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          'truncate',
                          !email.is_read && 'font-semibold'
                        )}>
                          {folder === 'sent' ? email.to_email : (email.from_name || email.from_email)}
                        </p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {format(
                            new Date(email.received_at || email.sent_at || new Date()),
                            'dd/MM',
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                      <p className={cn(
                        'text-sm truncate',
                        !email.is_read ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {email.body_text?.slice(0, 80)}...
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Mail className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum email encontrado</p>
              <p className="text-sm">
                {folder === 'inbox' 
                  ? 'Sua caixa de entrada está vazia' 
                  : folder === 'sent'
                  ? 'Você ainda não enviou nenhum email'
                  : 'Nenhum rascunho salvo'}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
