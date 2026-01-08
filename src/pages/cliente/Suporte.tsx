import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  Loader2, 
  Home, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Import avatars for team display
import avatar1 from '@/assets/avatars/avatar-1.jpg';
import avatar2 from '@/assets/avatars/avatar-2.jpg';
import avatar3 from '@/assets/avatars/avatar-3.jpg';
import webmarcasIcon from '@/assets/webmarcas-icon.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

type ViewType = 'home' | 'chat';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-support`;

export default function Suporte() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          navigate('/cliente/login');
        } else {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
          await fetchMessages(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/cliente/login');
      } else {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
        await fetchMessages(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    if (data?.full_name) {
      setUserName(data.full_name.split(' ')[0]);
    }
  };

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const msgs = (data as Message[]) || [];
    setMessages(msgs);
    
    // Count unread (assistant messages from last 24h)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const unread = msgs.filter(m => m.role === 'assistant' && m.created_at > dayAgo).length;
    setUnreadCount(Math.min(unread, 9));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = useCallback(async (
    allMessages: { role: string; content: string }[],
    onDelta: (text: string) => void,
    onDone: () => void
  ) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages: allMessages,
        userName 
      }),
    });

    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(error.error || "Erro ao conectar com a IA");
    }

    if (!resp.body) throw new Error("Sem resposta do servidor");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    onDone();
  }, [userName]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || !user || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setCurrentView('chat');

    // Save user message
    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content: text,
      });
    } catch (err) {
      console.error('Error saving user message:', err);
    }

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    // Add placeholder for assistant message
    setMessages((prev) => [...prev, {
      id: assistantId,
      role: 'assistant' as const,
      content: '',
      created_at: new Date().toISOString(),
    }]);

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => 
        prev.map((m) => 
          m.id === assistantId ? { ...m, content: assistantContent } : m
        )
      );
    };

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      chatHistory.push({ role: 'user', content: text });

      await streamChat(
        chatHistory,
        updateAssistant,
        async () => {
          setLoading(false);
          // Save assistant message
          if (assistantContent) {
            try {
              await supabase.from('chat_messages').insert({
                user_id: user.id,
                role: 'assistant',
                content: assistantContent,
              });
            } catch (err) {
              console.error('Error saving assistant message:', err);
            }
          }
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      setLoading(false);
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter(m => m.id !== assistantId));
    }
  };

  const quickQuestions = [
    'Qual o status do meu processo?',
    'Como pagar minha fatura?',
    'Quanto tempo leva o registro?',
    'O que é NCL?',
  ];

  const externalLinks = [
    { label: 'Base de Marcas INPI', url: 'https://busca.inpi.gov.br/pePI/' },
    { label: 'Tabela de Taxas INPI', url: 'https://www.gov.br/inpi/pt-br/servicos/marcas/guia-basico/taxas' },
    { label: 'Falar no WhatsApp', url: 'https://wa.me/5511911120225' },
  ];

  const HomeView = () => (
    <div className="flex flex-col h-full">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-6 rounded-t-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Bot className="h-5 w-5" />
            </div>
          </div>
          <div className="flex -space-x-2">
            <Avatar className="w-8 h-8 border-2 border-primary">
              <AvatarImage src={avatar1} />
              <AvatarFallback>W</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 border-2 border-primary">
              <AvatarImage src={avatar2} />
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 border-2 border-primary">
              <AvatarImage src={avatar3} />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-1">
          Olá {userName || 'visitante'} 👋
        </h2>
        <p className="text-primary-foreground/80 text-lg">
          Como podemos ajudar?
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3 overflow-auto bg-background">
        {/* Send message button */}
        <button
          onClick={() => setCurrentView('chat')}
          className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent rounded-xl border transition-colors group"
        >
          <div className="text-left">
            <p className="font-medium text-foreground">Envie uma mensagem</p>
            <p className="text-sm text-muted-foreground">
              Nossa IA responde na hora
            </p>
          </div>
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Send className="h-5 w-5 text-primary" />
          </div>
        </button>

        {/* Quick questions */}
        <div className="grid grid-cols-2 gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="p-3 text-left text-sm bg-card hover:bg-accent rounded-xl border transition-colors"
            >
              <Sparkles className="h-4 w-4 text-primary mb-1" />
              {q}
            </button>
          ))}
        </div>

        {/* External links */}
        <div className="pt-2 space-y-2">
          {externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-card hover:bg-accent rounded-xl border transition-colors"
            >
              <span className="text-sm font-medium">{link.label}</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="border-t bg-card p-2 flex rounded-b-xl">
        <button
          onClick={() => setCurrentView('home')}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors",
            currentView === 'home' ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-medium">Início</span>
        </button>
        <button
          onClick={() => setCurrentView('chat')}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors relative",
            currentView === 'chat' ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Mensagens</span>
        </button>
      </div>
    </div>
  );

  const ChatView = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card rounded-t-xl">
        <Avatar className="w-10 h-10">
          <AvatarImage src={webmarcasIcon} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">Fernanda – Suporte WebMarcas</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Online agora
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-medium mb-2">Olá! Sou a Fernanda da WebMarcas 👋</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Especialista em registro de marcas no INPI. Como posso ajudar você hoje?
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {quickQuestions.slice(0, 2).map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSend(q)}
                    className="text-xs"
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
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={webmarcasIcon} />
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted rounded-bl-md'
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={webmarcasIcon} />
                <AvatarFallback className="bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card rounded-b-xl">
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
            placeholder="Digite sua mensagem..."
            disabled={loading}
            className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-1"
          />
          <Button 
            type="submit" 
            disabled={loading || !input.trim()}
            size="icon"
            className="rounded-full"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Bottom navigation */}
      <div className="border-t bg-card p-2 flex">
        <button
          onClick={() => setCurrentView('home')}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors",
            currentView === 'home' ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-medium">Início</span>
        </button>
        <button
          onClick={() => setCurrentView('chat')}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors relative",
            currentView === 'chat' ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs font-medium">Mensagens</span>
        </button>
      </div>
    </div>
  );

  return (
    <ClientLayout>
      <div className="max-w-lg mx-auto h-[calc(100vh-8rem)]">
        <div className="bg-card rounded-xl shadow-lg border h-full overflow-hidden flex flex-col">
          {currentView === 'home' ? <HomeView /> : <ChatView />}
        </div>
      </div>
    </ClientLayout>
  );
}
