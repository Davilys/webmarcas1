import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  ExternalLink, 
  Maximize2, 
  Monitor,
  Smartphone,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

const BOTCONVERSA_URL = 'https://app.botconversa.com.br/8572/live-chat/all';

type WindowSize = 'small' | 'medium' | 'large';

const windowSizes: Record<WindowSize, { width: number; height: number; label: string }> = {
  small: { width: 800, height: 600, label: 'Pequena (800x600)' },
  medium: { width: 1200, height: 800, label: 'Média (1200x800)' },
  large: { width: 1400, height: 900, label: 'Grande (1400x900)' },
};

export default function ChatAoVivo() {
  const [selectedSize, setSelectedSize] = useState<WindowSize>('medium');
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  const openPopup = () => {
    const size = windowSizes[selectedSize];
    const left = (window.screen.width - size.width) / 2;
    const top = (window.screen.height - size.height) / 2;

    const popup = window.open(
      BOTCONVERSA_URL,
      'BotConversa',
      `width=${size.width},height=${size.height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no`
    );

    if (popup) {
      setPopupWindow(popup);
      toast.success('BotConversa aberto com sucesso!');
      
      // Check if popup was closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          setPopupWindow(null);
          clearInterval(checkClosed);
        }
      }, 1000);
    } else {
      toast.error('Popup bloqueado! Verifique as configurações do navegador.');
      // Fallback to new tab
      window.open(BOTCONVERSA_URL, '_blank');
    }
  };

  const openNewTab = () => {
    window.open(BOTCONVERSA_URL, '_blank');
    toast.success('BotConversa aberto em nova aba!');
  };

  const focusPopup = () => {
    if (popupWindow && !popupWindow.closed) {
      popupWindow.focus();
      toast.info('Janela do BotConversa em foco');
    }
  };

  const closePopup = () => {
    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
      setPopupWindow(null);
      toast.info('Janela do BotConversa fechada');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Chat ao Vivo</h1>
            <p className="text-muted-foreground">
              Gerencie suas conversas do BotConversa diretamente do painel
            </p>
          </div>
          <Badge variant={popupWindow && !popupWindow.closed ? "default" : "secondary"} className="gap-2">
            {popupWindow && !popupWindow.closed ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Conectado
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                Desconectado
              </>
            )}
          </Badge>
        </div>

        {/* Main Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              BotConversa Live Chat
            </CardTitle>
            <CardDescription>
              Acesse o painel de conversas do BotConversa em uma janela flutuante ou nova aba
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Window Size Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Tamanho da Janela</label>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(windowSizes) as WindowSize[]).map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                    className="gap-2"
                  >
                    {size === 'small' && <Smartphone className="h-4 w-4" />}
                    {size === 'medium' && <Monitor className="h-4 w-4" />}
                    {size === 'large' && <Maximize2 className="h-4 w-4" />}
                    {windowSizes[size].label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button onClick={openPopup} size="lg" className="gap-2">
                <MessageCircle className="h-5 w-5" />
                Abrir BotConversa
              </Button>
              
              <Button onClick={openNewTab} variant="outline" size="lg" className="gap-2">
                <ExternalLink className="h-5 w-5" />
                Abrir em Nova Aba
              </Button>
            </div>

            {/* Popup Controls */}
            {popupWindow && !popupWindow.closed && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">Janela do BotConversa aberta</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Focar" para trazer a janela para frente
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={focusPopup} variant="secondary" size="sm">
                    Focar
                  </Button>
                  <Button onClick={closePopup} variant="destructive" size="sm">
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Janela Flutuante</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Abre o BotConversa em uma janela popup que pode ser redimensionada e movida
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Nova Aba</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Alternativa caso o popup seja bloqueado pelo navegador
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Dica</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Para melhor experiência, permita popups deste site nas configurações do navegador
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
