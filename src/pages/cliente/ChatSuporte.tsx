import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { VideoCallOverlay, IncomingCallNotification } from '@/components/chat/VideoCallOverlay';
import { MeetingScheduleDialog } from '@/components/chat/MeetingScheduleDialog';
import { useChat, type ChatMessage } from '@/hooks/useChat';
import { useWebRTC } from '@/hooks/useWebRTC';
import { 
  Bot, Phone, Video, Monitor, Calendar, ArrowLeft, Sparkles, User, 
  MessageSquare, Send, Loader2, MoreVertical
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

  // Selection screen
  const SelectMode = () => (
    <div className="flex flex-col h-full">
      <div className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-6 pt-8">
        <h2 className="text-2xl font-bold mb-1">Olá {userName || 'visitante'} 👋</h2>
        <p className="text-primary-foreground/80">Como deseja ser atendido?</p>
      </div>
      <div className="flex-1 p-5 space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setChatMode('ai')}
          className="w-full flex items-center gap-4 p-5 bg-card hover:bg-accent rounded-2xl border shadow-sm transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-base">Suporte IA</p>
            <p className="text-sm text-muted-foreground">Respostas instantâneas 24/7</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={startHumanChat}
          className="w-full flex items-center gap-4 p-5 bg-card hover:bg-accent rounded-2xl border shadow-sm transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <User className="h-7 w-7 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-base">Atendente</p>
            <p className="text-sm text-muted-foreground">
              {assignedAdmin?.full_name || 'Chat com seu consultor'}
            </p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setMeetingOpen(true)}
          className="w-full flex items-center gap-4 p-5 bg-card hover:bg-accent rounded-2xl border shadow-sm transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Calendar className="h-7 w-7 text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-base">Agendar Reunião</p>
            <p className="text-sm text-muted-foreground">Vídeo ou áudio com consultor</p>
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
    <div className="flex items-center gap-3 p-3 border-b bg-card">
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Avatar className="w-9 h-9">
        <AvatarFallback className={isAI ? "bg-violet-100 text-violet-700" : "bg-primary/15 text-primary"}>
          {isAI ? <Bot className="h-4 w-4" /> : title[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> {subtitle}
        </p>
      </div>
      {!isAI && (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => webrtc.startCall('audio')}>
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => webrtc.startCall('video')}>
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setMeetingOpen(true)}>
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );

  const currentMessages = chatMode === 'ai' ? aiMessages : chat.messages;

  return (
    <ClientLayout>
      <div className="max-w-lg mx-auto h-[calc(100vh-8rem)]">
        <div className="bg-card rounded-2xl shadow-xl border h-full overflow-hidden flex flex-col">
          {chatMode === 'select' ? (
            <SelectMode />
          ) : (
            <>
              {renderChatHeader({
                title: chatMode === 'ai' ? 'Fernanda IA' : (assignedAdmin?.full_name || 'Consultor'),
                subtitle: chatMode === 'ai' ? 'IA • Sempre online' : 'Online',
                onBack: () => setChatMode('select'),
                isAI: chatMode === 'ai',
              })}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {currentMessages.length === 0 && (
                  <div className="text-center py-12">
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", chatMode === 'ai' ? "bg-violet-100" : "bg-primary/10")}>
                      {chatMode === 'ai' ? <Sparkles className="h-8 w-8 text-violet-600" /> : <MessageSquare className="h-8 w-8 text-primary" />}
                    </div>
                    <h4 className="font-medium mb-1">{chatMode === 'ai' ? 'Suporte IA' : 'Chat com Atendente'}</h4>
                    <p className="text-sm text-muted-foreground">Envie sua primeira mensagem</p>
                  </div>
                )}
                {currentMessages.map(msg => (
                  <ChatMessageBubble key={msg.id} message={msg} isOwnMessage={msg.sender_id === user?.id} />
                ))}
                {(aiLoading || chat.sendingMessage) && currentMessages[currentMessages.length - 1]?.sender_id === user?.id && (
                  <div className="flex gap-2">
                    <Avatar className="w-8 h-8"><AvatarFallback className="bg-violet-100 text-violet-700"><Bot className="h-4 w-4" /></AvatarFallback></Avatar>
                    <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
      <AnimatePresence>
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
        {webrtc.incomingCall && (
          <IncomingCallNotification
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
