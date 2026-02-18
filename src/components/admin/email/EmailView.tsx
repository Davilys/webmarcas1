import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Reply, Forward, Trash2, Star, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Email } from '@/pages/admin/Emails';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EmailViewProps {
  email: Email;
  onBack: () => void;
  onReply: () => void;
}

export function EmailView({ email, onBack, onReply }: EmailViewProps) {
  // Mark email as read
  useEffect(() => {
    if (!email.is_read) {
      supabase
        .from('email_inbox')
        .update({ is_read: true })
        .eq('id', email.id)
        .then(() => {});
    }
  }, [email.id, email.is_read]);

  const emailDate = email.received_at || email.sent_at;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{email.subject}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Star className={cn(
                'h-5 w-5',
                email.is_starred ? 'fill-primary text-primary' : ''
              )} />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Email Header Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {(email.from_name || email.from_email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{email.from_name || email.from_email}</p>
                      <p className="text-sm text-muted-foreground">{email.from_email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {emailDate && format(new Date(emailDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">Para:</Badge>
                <span className="text-muted-foreground">{email.to_email}</span>
              </div>
            </div>

            <Separator />

            {/* Email Body */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {email.body_html ? (
                <div dangerouslySetInnerHTML={{ __html: email.body_html }} />
              ) : (
                <p className="whitespace-pre-wrap">{email.body_text}</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Action Bar */}
      <div className="p-4 flex items-center gap-2 flex-shrink-0">
        <Button onClick={onReply} className="gap-2">
          <Reply className="h-4 w-4" />
          Responder
        </Button>
        <Button variant="outline" className="gap-2">
          <Forward className="h-4 w-4" />
          Encaminhar
        </Button>
      </div>
    </Card>
  );
}
