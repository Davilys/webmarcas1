import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { VideoCallOverlay, IncomingCallNotification } from '@/components/chat/VideoCallOverlay';
import { MeetingScheduleDialog } from '@/components/chat/MeetingScheduleDialog';
import { useChat, type Conversation } from '@/hooks/useChat';
import { useWebRTC } from '@/hooks/useWebRTC';
import {
  MessageCircle, X, Search, Phone, Video, Calendar, ChevronLeft,
  Users, Minimize2, Maximize2, Send, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminChatWidget() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clients, setClients] = useState<{ id: string; full_name: string | null; email: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = useChat(user);
  const remoteId = chat.activeConversation?.participants?.find(p => p.user_id !== user?.id)?.user_id || null;

  const webrtc = useWebRTC({
    conversationId: chat.activeConversation?.id || null,
    userId: user?.id || null,
    remoteUserId: remoteId,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUser(session.user);
      const { data: hasAdmin } = await supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' });
      setIsAdmin(!!hasAdmin);
      if (hasAdmin) {
        const { data: allClients } = await supabase.from('profiles').select('id, full_name, email').order('full_name');
        if (allClients) setClients(allClients);
      }
    });
  }, []);

  // Listen for open-admin-chat events from other components
  useEffect(() => {
    const handleOpenChat = async (e: Event) => {
      const clientId = (e as CustomEvent).detail?.clientId;
      if (clientId) {
        setOpen(true);
        await chat.openDirectConversation(clientId);
        setView('chat');
      }
    };
    window.addEventListener('open-admin-chat', handleOpenChat);
    return () => window.removeEventListener('open-admin-chat', handleOpenChat);
  }, [chat]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat.messages]);

  if (!isAdmin) return null;

  const filteredClients = clients.filter(c =>
    c.id !== user?.id &&
    ((c.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
     c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openChatWith = async (clientId: string) => {
    await chat.openDirectConversation(clientId);
    setView('chat');
  };

  const handleSend = async (content: string) => {
    await chat.sendMessage(content);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const fd = await chat.uploadFile(file);
      if (fd) {
        const mt = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'file';
        await chat.sendMessage(file.name, mt, fd);
      }
    } catch { toast.error('Erro ao enviar'); }
  };

  const handleAudioSend = async (file: File) => {
    await handleFileUpload(file);
  };

  const activeName = chat.activeConversation?.participants?.find(p => p.user_id !== user?.id)?.profile?.full_name || 'Cliente';
  const unreadTotal = chat.conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {unreadTotal}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed z-[90] bg-card border shadow-2xl flex flex-col overflow-hidden",
              expanded
                ? "inset-4 rounded-2xl"
                : "bottom-6 right-6 w-[380px] h-[520px] rounded-2xl"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2 p-3 border-b bg-primary text-primary-foreground">
              {view === 'chat' && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10" onClick={() => { setView('list'); chat.setActiveConversation(null); }}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <span className="font-semibold text-sm flex-1 truncate">
                {view === 'chat' ? activeName : 'Chat'}
              </span>
              {view === 'chat' && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/80 hover:bg-white/10" onClick={() => webrtc.startCall('audio')}><Phone className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/80 hover:bg-white/10" onClick={() => webrtc.startCall('video')}><Video className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/80 hover:bg-white/10" onClick={() => setMeetingOpen(true)}><Calendar className="h-3.5 w-3.5" /></Button>
                </div>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/80 hover:bg-white/10" onClick={() => setExpanded(!expanded)}>
                {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/80 hover:bg-white/10" onClick={() => setOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {view === 'list' ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar cliente..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 rounded-xl" />
                  </div>
                </div>

                {/* Conversations list */}
                <ScrollArea className="flex-1">
                  <div className="p-1">
                    {/* Existing conversations */}
                    {chat.conversations.map(conv => {
                      const otherP = conv.participants?.find(p => p.user_id !== user?.id);
                      return (
                        <button key={conv.id} onClick={() => { chat.setActiveConversation(conv); chat.fetchMessages(conv.id); setView('chat'); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/60 rounded-xl transition-colors text-left">
                          <Avatar className="w-10 h-10"><AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {otherP?.profile?.full_name?.substring(0, 2).toUpperCase() || '??'}
                          </AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{otherP?.profile?.full_name || otherP?.profile?.email || 'Cliente'}</p>
                            <p className="text-xs text-muted-foreground truncate">{conv.last_message_preview || 'Sem mensagens'}</p>
                          </div>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(conv.last_message_at), { locale: ptBR })}</span>
                          )}
                        </button>
                      );
                    })}

                    {/* New chat with clients */}
                    {searchQuery && filteredClients.filter(c => !chat.conversations.some(conv => conv.participants?.some(p => p.user_id === c.id))).map(client => (
                      <button key={client.id} onClick={() => openChatWith(client.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/60 rounded-xl transition-colors text-left">
                        <Avatar className="w-10 h-10"><AvatarFallback className="bg-muted text-muted-foreground text-xs">
                          {client.full_name?.substring(0, 2).toUpperCase() || '??'}
                        </AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{client.full_name || client.email}</p>
                          <p className="text-xs text-muted-foreground">Nova conversa</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/20">
                  {chat.messages.map(msg => (
                    <ChatMessageBubble key={msg.id} message={msg} isOwnMessage={msg.sender_id === user?.id} />
                  ))}
                </div>
                <ChatInput onSend={handleSend} onFileUpload={handleFileUpload} onAudioSend={handleAudioSend} disabled={chat.sendingMessage} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video call overlay */}
      <AnimatePresence>
        <VideoCallOverlay
          callActive={webrtc.callActive} callType={webrtc.callType}
          isMuted={webrtc.isMuted} isCameraOff={webrtc.isCameraOff} isScreenSharing={webrtc.isScreenSharing}
          localVideoRef={webrtc.localVideoRef} remoteVideoRef={webrtc.remoteVideoRef}
          callerName={activeName}
          onEndCall={webrtc.endCall} onToggleMute={webrtc.toggleMute}
          onToggleCamera={webrtc.toggleCamera} onToggleScreenShare={webrtc.toggleScreenShare}
        />
        {webrtc.incomingCall && (
          <IncomingCallNotification callerName={webrtc.incomingCall.callerName || ''} callType={webrtc.incomingCall.callType} onAccept={webrtc.acceptCall} onReject={webrtc.rejectCall} />
        )}
      </AnimatePresence>

      <MeetingScheduleDialog open={meetingOpen} onOpenChange={setMeetingOpen} conversationId={chat.activeConversation?.id} currentUserId={user?.id} participants={chat.activeConversation?.participants} isAdmin={true} />
    </>
  );
}
