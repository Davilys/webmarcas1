import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Mail, Star, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Email, EmailFolder } from '@/pages/admin/Emails';
import { cn } from '@/lib/utils';

interface EmailListProps {
  folder: EmailFolder;
  onSelectEmail: (email: Email) => void;
}

export function EmailList({ folder, onSelectEmail }: EmailListProps) {
  const [search, setSearch] = useState('');

  const { data: emails, isLoading } = useQuery({
    queryKey: ['emails', folder],
    queryFn: async () => {
      if (folder === 'inbox') {
        const { data, error } = await supabase
          .from('email_inbox')
          .select('*')
          .eq('is_archived', false)
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
        const { data, error } = await supabase
          .from('email_logs')
          .select('*')
          .eq('status', 'sent')
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
  });

  const filteredEmails = emails?.filter(email =>
    email.subject.toLowerCase().includes(search.toLowerCase()) ||
    email.from_email.toLowerCase().includes(search.toLowerCase()) ||
    email.to_email.toLowerCase().includes(search.toLowerCase())
  );

  const title = folder === 'inbox' ? 'Caixa de Entrada' : folder === 'sent' ? 'Enviados' : 'Rascunhos';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {title}
          </CardTitle>
          <Badge variant="secondary">
            {emails?.length || 0} {emails?.length === 1 ? 'email' : 'emails'}
          </Badge>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
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
                        email.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
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
