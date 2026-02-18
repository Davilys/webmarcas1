import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Loader2,
  Bot,
  Globe,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

const BOTCONVERSA_URL = 'https://app.botconversa.com.br/8572/live-chat/all';

type ChatMode = 'selector' | 'chatweb' | 'botconversa';

export default function ChatAoVivo() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mode, setMode] = useState<ChatMode>('selector');
  const [isLoading, setIsLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Timeout para detectar bloqueio de iframe
  useEffect(() => {
    if (mode !== 'botconversa') return;
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIframeError(true);
        setIsLoading(false);
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [isLoading, mode]);

  const handleSelectChatWeb = () => {
    setMode('chatweb');
    // Dispara o evento para o AdminChatWidget abrir no modo expandido (docked)
    window.dispatchEvent(new CustomEvent('open-admin-chat', { detail: { expand: true } }));
    toast.success('ChatWeb aberto!');
  };

  const handleSelectBotConversa = () => {
    setMode('botconversa');
    setIsLoading(true);
    setIframeError(false);
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

  const handleBack = () => {
    setMode('selector');
    setIsLoading(false);
    setIframeError(false);
    // Fecha o ChatWeb se estiver aberto
    window.dispatchEvent(new CustomEvent('close-admin-chat'));
  };

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Chat ao Vivo</h1>
          </div>
          {mode !== 'selector' && (
            <Button onClick={handleBack} variant="outline" size="sm">
              ← Voltar
            </Button>
          )}
          {mode === 'botconversa' && (
            <div className="flex gap-2">
              <Button onClick={reloadIframe} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
              <Button onClick={openNewTab} variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Nova Aba
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 rounded-xl border overflow-hidden bg-background relative">
          <AnimatePresence mode="wait">

            {/* ── Selector ─────────────────────────────── */}
            {mode === 'selector' && (
              <motion.div
                key="selector"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-full max-w-2xl px-6 space-y-6">
                  {/* Title */}
                  <div className="text-center space-y-2">
                    <motion.div
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg,rgba(5,150,105,0.25),rgba(16,185,129,0.12))'
                          : 'linear-gradient(135deg,rgba(5,150,105,0.12),rgba(16,185,129,0.06))',
                        border: '1px solid rgba(16,185,129,0.25)',
                        boxShadow: '0 0 30px rgba(16,185,129,0.12)',
                      }}
                    >
                      <MessageCircle className="h-8 w-8 text-emerald-500" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-foreground">Selecione o Canal de Atendimento</h2>
                    <p className="text-muted-foreground text-sm">
                      Escolha como deseja atender seus clientes agora
                    </p>
                  </div>

                  {/* Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* ChatWeb Card */}
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSelectChatWeb}
                      className="relative flex flex-col items-start gap-4 p-6 rounded-2xl text-left overflow-hidden transition-all duration-200 group"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg,rgba(4,13,8,0.9) 0%,rgba(6,21,12,0.9) 100%)'
                          : 'linear-gradient(135deg,rgba(240,253,244,0.95) 0%,rgba(220,252,231,0.95) 100%)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        boxShadow: isDark
                          ? '0 4px 24px -4px rgba(16,185,129,0.15), inset 0 1px 0 rgba(16,185,129,0.1)'
                          : '0 4px 24px -4px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                      }}
                    >
                      {/* Glow on hover */}
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 70%)',
                        }}
                      />
                      {/* Scan line animation */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none opacity-0 group-hover:opacity-100"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />

                      {/* Icon */}
                      <div className="flex items-center justify-between w-full">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                          style={{
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                          }}
                        >
                          <Globe className="h-6 w-6 text-white" />
                          <motion.div
                            className="absolute -inset-0.5 rounded-xl opacity-60"
                            style={{ background: 'conic-gradient(from 0deg, transparent, rgba(52,211,153,0.4), transparent)' }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                          />
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{
                            background: 'rgba(16,185,129,0.15)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            color: '#10b981',
                          }}
                        >
                          <Zap className="h-3 w-3" />
                          Nativo
                        </div>
                      </div>

                      {/* Text */}
                      <div>
                        <p className="text-lg font-bold text-foreground">ChatWeb</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          Chat interno do CRM com IA, vídeo, áudio e histórico completo
                        </p>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1.5">
                        {['IA Integrada', 'Vídeo/Áudio', 'Histórico', 'Tempo Real'].map(f => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.1)',
                              border: '1px solid rgba(16,185,129,0.2)',
                              color: isDark ? '#86efac' : '#047857',
                            }}
                          >{f}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 text-emerald-500 text-sm font-semibold">
                        Abrir ChatWeb <ChevronRight className="h-4 w-4" />
                      </div>
                    </motion.button>

                    {/* BotConversa Card */}
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSelectBotConversa}
                      className="relative flex flex-col items-start gap-4 p-6 rounded-2xl text-left overflow-hidden transition-all duration-200 group"
                      style={{
                        background: isDark
                          ? 'linear-gradient(135deg,rgba(6,6,30,0.9) 0%,rgba(10,10,40,0.9) 100%)'
                          : 'linear-gradient(135deg,rgba(239,246,255,0.95) 0%,rgba(219,234,254,0.95) 100%)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        boxShadow: isDark
                          ? '0 4px 24px -4px rgba(99,102,241,0.15), inset 0 1px 0 rgba(99,102,241,0.1)'
                          : '0 4px 24px -4px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
                        }}
                      />
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none opacity-0 group-hover:opacity-100"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />

                      {/* Icon */}
                      <div className="flex items-center justify-between w-full">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center relative"
                          style={{
                            background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                          }}
                        >
                          <Bot className="h-6 w-6 text-white" />
                          <motion.div
                            className="absolute -inset-0.5 rounded-xl opacity-60"
                            style={{ background: 'conic-gradient(from 0deg, transparent, rgba(165,180,252,0.4), transparent)' }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                          />
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{
                            background: 'rgba(99,102,241,0.15)',
                            border: '1px solid rgba(99,102,241,0.3)',
                            color: '#818cf8',
                          }}
                        >
                          <Bot className="h-3 w-3" />
                          Externo
                        </div>
                      </div>

                      {/* Text */}
                      <div>
                        <p className="text-lg font-bold text-foreground">BotConversa</p>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          Plataforma externa de automação e chatbots com WhatsApp
                        </p>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1.5">
                        {['Automação', 'WhatsApp', 'Chatbot', 'Funis'].map(f => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              color: isDark ? '#a5b4fc' : '#4338ca',
                            }}
                          >{f}</span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 text-indigo-500 text-sm font-semibold">
                        Abrir BotConversa <ChevronRight className="h-4 w-4" />
                      </div>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ChatWeb ──────────────────────────────── */}
            {mode === 'chatweb' && (
              <motion.div
                key="chatweb"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="text-center space-y-4 max-w-sm">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center"
                    style={{
                      background: isDark
                        ? 'linear-gradient(135deg,rgba(5,150,105,0.25),rgba(16,185,129,0.1))'
                        : 'linear-gradient(135deg,rgba(5,150,105,0.12),rgba(16,185,129,0.06))',
                      border: '1px solid rgba(16,185,129,0.25)',
                      boxShadow: '0 0 40px rgba(16,185,129,0.15)',
                    }}
                  >
                    <Globe className="h-9 w-9 text-emerald-500" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-lg text-foreground">ChatWeb aberto!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      O painel de chat foi aberto na lateral direita da tela.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/60">
                    Você pode redimensioná-lo arrastando a borda esquerda.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── BotConversa ──────────────────────────── */}
            {mode === 'botconversa' && (
              <motion.div
                key="botconversa"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                {/* Loading */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-muted-foreground">Carregando BotConversa...</p>
                    </div>
                  </div>
                )}

                {/* Fallback */}
                {iframeError ? (
                  <div className="flex flex-col items-center justify-center h-full bg-muted/30">
                    <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Acesso Restrito pelo BotConversa</h2>
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
                    onLoad={() => setIsLoading(false)}
                    allow="microphone; camera; clipboard-write"
                    title="BotConversa Live Chat"
                  />
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}
