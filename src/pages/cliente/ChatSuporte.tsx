import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { VideoCallOverlay, IncomingCallNotification } from '@/components/chat/VideoCallOverlay';
import { MeetingScheduleDialog } from '@/components/chat/MeetingScheduleDialog';
import { useChat, type ChatMessage } from '@/hooks/useChat';
import { useWebRTC } from '@/hooks/useWebRTC';
import { whatsappBgStyle, whatsappBgDarkStyle } from '@/components/chat/WhatsAppBackground';
import { 
  Bot, Phone, Video, Monitor, Calendar, ArrowLeft, Sparkles, User, 
  MessageSquare, Search, MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type ChatMode = 'select' | 'ai' | 'human';

export default function ChatSuporte() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userName, setUserName] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode>('select');
  const [assignedAdmin, setAssignedAdmin] = useState<{ id: string; full_name: string | null } | null>(null);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // AI chat state
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');

  const chat = useChat(user);
  const webrtc = useWebRTC({
    conversationId: chat.activeConversation?.id || null,
    userId: user?.id || null,
    remoteUserId: assignedAdmin?.id || null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate('/cliente/login'); return; }
      setUser(session.user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, assigned_to, created_by')
        .eq('id', session.user.id)
        .single();

      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);

      // Get assigned admin
      const adminId = profile?.assigned_to || profile?.created_by;
      if (adminId) {
        const { data: admin } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', adminId)
          .single();
        if (admin) setAssignedAdmin(admin);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat.messages, aiMessages]);

  // AI streaming
  const handleAISend = useCallback(async (text: string) => {
    if (!user || aiLoading) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(), conversation_id: '', sender_id: user.id, content: text,
      message_type: 'text', file_url: null, file_name: null, file_size: null, file_mime_type: null,
      reply_to_id: null, is_read: true, created_at: new Date().toISOString(), edited_at: null, deleted_at: null,
      sender_profile: { full_name: userName, email: '' },
    };
    setAiMessages(prev => [...prev, userMsg]);
    setAiLoading(true);

    let content = '';
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId, conversation_id: '', sender_id: null, content: '',
      message_type: 'text', file_url: null, file_name: null, file_size: null, file_mime_type: null,
      reply_to_id: null, is_read: true, created_at: new Date().toISOString(), edited_at: null, deleted_at: null,
    };
    setAiMessages(prev => [...prev, assistantMsg]);

    try {
      const history = [...aiMessages, userMsg].map(m => ({ role: m.sender_id ? 'user' : 'assistant', content: m.content || '' }));
      await chat.streamAIChat(history, (delta) => {
        content += delta;
        setAiMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content } : m));
      }, () => setAiLoading(false));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
      setAiLoading(false);
      setAiMessages(prev => prev.filter(m => m.id !== assistantId));
    }
  }, [user, aiLoading, aiMessages, chat, userName]);

  // Human chat
  const handleHumanSend = async (text: string) => {
    if (!assignedAdmin) {
      toast.error('Nenhum consultor atribuído');
      return;
    }
    let conv = chat.activeConversation;
    if (!conv) {
      conv = await chat.openDirectConversation(assignedAdmin.id);
      if (!conv) {
        toast.error('Erro ao iniciar conversa');
        return;
      }
    }
    await chat.sendMessage(text);
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Ensure conversation exists for human mode
      if (chatMode === 'human' && !chat.activeConversation && assignedAdmin) {
        const conv = await chat.openDirectConversation(assignedAdmin.id);
        if (!conv) {
          toast.error('Erro ao iniciar conversa');
          return;
        }
      }
      const fileData = await chat.uploadFile(file);
      if (fileData) {
        const mimeType = file.type;
        const msgType = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : mimeType.startsWith('audio/') ? 'audio' : 'file';
        await chat.sendMessage(file.name, msgType, fileData);
        toast.success('Arquivo enviado!');
      }
    } catch { toast.error('Erro ao enviar arquivo'); }
  };

  const startHumanChat = async () => {
    setChatMode('human');
    if (assignedAdmin) {
      await chat.openDirectConversation(assignedAdmin.id);
    }
  };

  // Selection screen - WhatsApp style
  const SelectMode = () => (
    <div className="flex flex-col h-full">
      {/* WhatsApp-style green header */}
      <div className="bg-[#008069] dark:bg-[#1f2c33] text-white px-5 py-6">
        <h2 className="text-xl font-semibold mb-0.5">Olá {userName || 'visitante'} 👋</h2>
        <p className="text-white/70 text-sm">Como deseja ser atendido?</p>
      </div>
      <div className="flex-1 p-4 space-y-2.5 bg-[#f0f2f5] dark:bg-[#111b21]">
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={() => setChatMode('ai')}
          className="w-full flex items-center gap-4 p-4 bg-white dark:bg-[#1f2c33] hover:bg-gray-50 dark:hover:bg-[#2a3942] rounded-xl shadow-sm transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-sm text-foreground">Fernanda IA</p>
            <p className="text-xs text-muted-foreground">Respostas instantâneas 24/7</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={startHumanChat}
          className="w-full flex items-center gap-4 p-4 bg-white dark:bg-[#1f2c33] hover:bg-gray-50 dark:hover:bg-[#2a3942] rounded-xl shadow-sm transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-sm text-foreground">{assignedAdmin?.full_name || 'Atendente'}</p>
            <p className="text-xs text-muted-foreground">Chat com seu consultor</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={() => setMeetingOpen(true)}
          className="w-full flex items-center gap-4 p-4 bg-white dark:bg-[#1f2c33] hover:bg-gray-50 dark:hover:bg-[#2a3942] rounded-xl shadow-sm transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-[#54656f] flex items-center justify-center">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-sm text-foreground">Agendar Reunião</p>
            <p className="text-xs text-muted-foreground">Vídeo ou áudio com consultor</p>
          </div>
        </motion.button>
      </div>
    </div>
  );

  // Handle audio send
  const handleAudioSend = async (file: File) => {
    await handleFileUpload(file);
  };

  // Chat header - extracted as a plain function to avoid ref warnings
  const renderChatHeader = ({ title, subtitle, onBack, isAI }: { title: string; subtitle: string; onBack: () => void; isAI?: boolean }) => (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#008069] dark:bg-[#1f2c33] text-white">
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/80 hover:text-white hover:bg-white/10" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarFallback className={isAI ? "bg-violet-500/30 text-white" : "bg-white/20 text-white"}>
            {isAI ? <Bot className="h-5 w-5" /> : title[0]}
          </AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#008069] dark:border-[#1f2c33]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{title}</p>
        <p className="text-xs text-white/70">{subtitle}</p>
      </div>
      {!isAI && (
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10" onClick={() => webrtc.startCall('video')}>
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10" onClick={() => webrtc.startCall('audio')}>
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );

  const currentMessages = chatMode === 'ai' ? aiMessages : chat.messages;
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <ClientLayout>
      <div className="max-w-lg mx-auto h-[calc(100vh-8rem)]">
        <div className="bg-white dark:bg-[#111b21] rounded-xl shadow-2xl border-0 h-full overflow-hidden flex flex-col">
          {chatMode === 'select' ? (
            <SelectMode />
          ) : (
            <>
              {renderChatHeader({
                title: chatMode === 'ai' ? 'Fernanda IA' : (assignedAdmin?.full_name || 'Consultor'),
                subtitle: chatMode === 'ai' ? 'IA • Sempre online' : 'online',
                onBack: () => setChatMode('select'),
                isAI: chatMode === 'ai',
              })}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
                style={isDark ? whatsappBgDarkStyle : whatsappBgStyle}
              >
                {currentMessages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-white/60 dark:bg-white/5 shadow-sm">
                      {chatMode === 'ai' ? <Sparkles className="h-10 w-10 text-violet-400" /> : <MessageSquare className="h-10 w-10 text-[#00a884]/40" />}
                    </div>
                    <p className="text-sm text-[#667781] dark:text-[#8696a0]">Envie sua primeira mensagem</p>
                  </div>
                )}
                {currentMessages.map(msg => (
                  <ChatMessageBubble key={msg.id} message={msg} isOwnMessage={msg.sender_id === user?.id} />
                ))}
                {(aiLoading || chat.sendingMessage) && currentMessages[currentMessages.length - 1]?.sender_id === user?.id && (
                  <div className="flex gap-2">
                    <Avatar className="w-8 h-8"><AvatarFallback className="bg-white dark:bg-[#1f2c33] text-violet-600"><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                    <div className="bg-white dark:bg-[#1f2c33] rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#667781]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#667781]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#667781]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <ChatInput
                onSend={chatMode === 'ai' ? handleAISend : handleHumanSend}
                onFileUpload={handleFileUpload}
                onAudioSend={handleAudioSend}
                disabled={chatMode === 'ai' ? aiLoading : chat.sendingMessage}
                placeholder={chatMode === 'ai' ? 'Pergunte à IA...' : 'Digite uma mensagem...'}
              />
            </>
          )}
        </div>
      </div>

      {/* Video call overlay */}
      {webrtc.callActive && (
        <VideoCallOverlay
          callActive={webrtc.callActive}
          callType={webrtc.callType}
          isMuted={webrtc.isMuted}
          isCameraOff={webrtc.isCameraOff}
          isScreenSharing={webrtc.isScreenSharing}
          localVideoRef={webrtc.localVideoRef}
          remoteVideoRef={webrtc.remoteVideoRef}
          callerName={assignedAdmin?.full_name || ''}
          onEndCall={webrtc.endCall}
          onToggleMute={webrtc.toggleMute}
          onToggleCamera={webrtc.toggleCamera}
          onToggleScreenShare={webrtc.toggleScreenShare}
        />
      )}
      <AnimatePresence>
        {webrtc.incomingCall && (
          <IncomingCallNotification
            key="incoming-call"
            callerName={webrtc.incomingCall.callerName || ''}
            callType={webrtc.incomingCall.callType}
            onAccept={webrtc.acceptCall}
            onReject={webrtc.rejectCall}
          />
        )}
      </AnimatePresence>

      <MeetingScheduleDialog
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
        conversationId={chat.activeConversation?.id}
        currentUserId={user?.id}
        participants={chat.activeConversation?.participants}
        isAdmin={false}
        assignedAdmin={assignedAdmin}
      />
    </ClientLayout>
  );
}
