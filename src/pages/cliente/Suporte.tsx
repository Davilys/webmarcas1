import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const FAQ_RESPONSES: Record<string, string> = {
  'status': 'Para verificar o status do seu processo, acesse "Meus Processos" no menu lateral. Lá você encontrará a situação atual de cada registro.',
  'processo': 'Para verificar o status do seu processo, acesse "Meus Processos" no menu lateral. Lá você encontrará a situação atual de cada registro.',
  'fatura': 'Suas faturas estão disponíveis em "Financeiro". Você pode ver faturas pendentes, pagas e gerar boletos ou copiar códigos PIX.',
  'pagar': 'Para pagar, acesse "Financeiro" no menu lateral e clique no botão "Pagar" na fatura desejada. Aceitamos PIX, boleto e cartão.',
  'pagamento': 'Para pagar, acesse "Financeiro" no menu lateral e clique no botão "Pagar" na fatura desejada. Aceitamos PIX, boleto e cartão.',
  'documento': 'Todos os seus documentos estão em "Documentos". Você pode visualizar, baixar e enviar novos arquivos.',
  'contrato': 'Seu contrato está disponível em "Documentos". Você também pode acessar diretamente em "Meus Processos" > selecionar o processo > Documentos.',
  'prazo': 'Os prazos do INPI variam. Em média: pesquisa 24h, publicação RPI 60-90 dias, exame 12-24 meses, concessão após exame positivo.',
  'despacho': 'Despacho é uma decisão oficial do INPI publicada na RPI. Pode ser uma exigência, deferimento ou indeferimento.',
  'rpi': 'RPI (Revista da Propriedade Industrial) é a publicação semanal do INPI onde são divulgados todos os despachos de marcas e patentes.',
  'exigência': 'Uma exigência é uma solicitação do INPI para complementar informações. Temos prazo de 60 dias para responder.',
  'renovação': 'A marca deve ser renovada a cada 10 anos. Enviaremos notificação antes do vencimento para você providenciar a renovação.',
};

export default function Suporte() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/cliente/login');
        } else {
          setUser(session.user);
          fetchMessages(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/cliente/login');
      } else {
        setUser(session.user);
        fetchMessages(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    setMessages((data as Message[]) || []);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const findAnswer = (question: string): string => {
    const normalized = question.toLowerCase();
    
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (normalized.includes(keyword)) {
        return response;
      }
    }
    
    return 'Não encontrei uma resposta específica para sua pergunta. Para um atendimento personalizado, entre em contato pelo WhatsApp: (XX) XXXXX-XXXX ou aguarde que um de nossos especialistas responderá em breve.';
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Save user message
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'user',
      content: input,
    });

    // Generate response
    const response = findAnswer(input);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response,
      created_at: new Date().toISOString(),
    };

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setMessages((prev) => [...prev, assistantMessage]);

    // Save assistant message
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      role: 'assistant',
      content: response,
    });

    setLoading(false);
  };

  const quickQuestions = [
    'Qual o status do meu processo?',
    'Como pagar minha fatura?',
    'O que é um despacho?',
    'Qual o prazo do registro?',
  ];

  return (
    <ClientLayout>
      <div className="space-y-6 h-[calc(100vh-12rem)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suporte IA</h1>
          <p className="text-muted-foreground">
            Tire suas dúvidas com nossa assistente virtual
          </p>
        </div>

        <Card className="h-[calc(100%-5rem)] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Assistente WebMarcas
            </CardTitle>
            <CardDescription>
              Pergunte sobre status, documentos, pagamentos e mais
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea ref={scrollRef} className="flex-1 px-6">
              <div className="space-y-4 py-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                      Olá! Como posso ajudar você hoje?
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {quickQuestions.map((q) => (
                        <Button
                          key={q}
                          variant="outline"
                          size="sm"
                          onClick={() => setInput(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-4 py-2',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua pergunta..."
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
