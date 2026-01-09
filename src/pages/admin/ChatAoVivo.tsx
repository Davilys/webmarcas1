import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  ExternalLink, 
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const BOTCONVERSA_URL = 'https://app.botconversa.com.br/8572/live-chat/all';

export default function ChatAoVivo() {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Timeout para detectar bloqueio de iframe
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIframeError(true);
        setIsLoading(false);
      }
    }, 15000); // 15 segundos
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const reloadIframe = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      setIframeError(false);
      iframeRef.current.src = BOTCONVERSA_URL;
      toast.info('Recarregando BotConversa...');
    }
  };

  const openNewTab = () => {
    window.open(BOTCONVERSA_URL, '_blank');
    toast.success('BotConversa aberto em nova aba!');
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header compacto */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Chat ao Vivo</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={reloadIframe} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
            <Button onClick={openNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em Nova Aba
            </Button>
          </div>
        </div>
        
        {/* Iframe ocupando toda a área */}
        <div className="flex-1 rounded-lg border overflow-hidden bg-background relative">
          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando BotConversa...</p>
              </div>
            </div>
          )}
          
          {/* Fallback se iframe for bloqueado */}
          {iframeError ? (
            <div className="flex flex-col items-center justify-center h-full bg-muted/30">
              <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Acesso Restrito pelo BotConversa
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                O BotConversa não permite exibição integrada por motivos de segurança.
                Você pode acessar em uma nova aba.
              </p>
              <Button onClick={openNewTab} size="lg">
                <ExternalLink className="h-5 w-5 mr-2" />
                Abrir BotConversa
              </Button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={BOTCONVERSA_URL}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              allow="microphone; camera; clipboard-write"
              title="BotConversa Live Chat"
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
