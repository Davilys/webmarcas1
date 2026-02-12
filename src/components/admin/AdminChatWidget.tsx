import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { VideoCallOverlay, IncomingCallNotification } from '@/components/chat/VideoCallOverlay';
import { MeetingScheduleDialog } from '@/components/chat/MeetingScheduleDialog';
import { useChat, type Conversation, type ChatMessage } from '@/hooks/useChat';
import { useWebRTC } from '@/hooks/useWebRTC';
import {
  MessageCircle, X, Search, Phone, Video, Calendar, ChevronLeft,
  Users, Minimize2, Maximize2, Send, Loader2, Monitor, Mail, Clock,
  CreditCard, Edit, MoreVertical, UserCheck, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientProfile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  cpf_cnpj: string | null;
  created_at: string | null;
  assigned_to: string | null;
}

export function AdminChatWidget() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [meetingOpen, setMeetingOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [contactProfile, setContactProfile] = useState<ClientProfile | null>(null);
  const [adminProfiles, setAdminProfiles] = useState<Map<string, string>>(new Map());

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
        const { data: allClients } = await supabase.from('profiles').select('id, full_name, email, phone, cpf_cnpj, created_at, assigned_to').order('full_name');
        if (allClients) setClients(allClients);

        // Fetch admin names for assignment display
        const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
        if (roles) {
          const { data: adminP } = await supabase.from('profiles').select('id, full_name, email').in('id', roles.map(r => r.user_id));
          if (adminP) {
            const map = new Map<string, string>();
            adminP.forEach(a => map.set(a.id, a.full_name || a.email));
            setAdminProfiles(map);
          }
        }
      }
    });
  }, []);

  // Listen for open-admin-chat events
  useEffect(() => {
    const handleOpenChat = async (e: Event) => {
      const clientId = (e as CustomEvent).detail?.clientId;
      if (clientId) {
        setOpen(true);
        setExpanded(true);
        await chat.openDirectConversation(clientId);
      }
    };
    window.addEventListener('open-admin-chat', handleOpenChat);
    return () => window.removeEventListener('open-admin-chat', handleOpenChat);
  }, [chat]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chat.messages]);

  // Load contact profile when conversation changes
  useEffect(() => {
    if (!chat.activeConversation || !remoteId) {
      setContactProfile(null);
      return;
    }
    const found = clients.find(c => c.id === remoteId);
    if (found) setContactProfile(found);
  }, [chat.activeConversation, remoteId, clients]);

  if (!isAdmin) return null;

  const filteredConversations = chat.conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherP = conv.participants?.find(p => p.user_id !== user?.id);
    const name = otherP?.profile?.full_name || otherP?.profile?.email || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredNewClients = searchQuery
    ? clients.filter(c =>
        c.id !== user?.id &&
        !chat.conversations.some(conv => conv.participants?.some(p => p.user_id === c.id)) &&
        ((c.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
         c.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const openChatWith = async (clientId: string) => {
    await chat.openDirectConversation(clientId);
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

  const otherParticipant = chat.activeConversation?.participants?.find(p => p.user_id !== user?.id);
  const activeName = otherParticipant?.profile?.full_name || otherParticipant?.profile?.email || 'Cliente';
  const activeInitials = activeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const unreadTotal = chat.conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Hoje';
    if (isYesterday(d)) return 'Ontem';
    return format(d, "EEE, d MMM yyyy", { locale: ptBR });
  };

  const getConvTimeLabel = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'ontem';
    return format(d, 'dd/MM', { locale: ptBR });
  };

  const renderMessagesWithDateSeparators = (msgs: ChatMessage[]) => {
    const elements: React.ReactNode[] = [];
    let lastDate = '';
    msgs.forEach((msg) => {
      const dateLabel = getDateLabel(msg.created_at);
      if (dateLabel !== lastDate) {
        lastDate = dateLabel;
        elements.push(
          <div key={`date-${msg.created_at}`} className="flex justify-center my-4">
            <span className="text-[11px] text-muted-foreground bg-card border px-4 py-1 rounded-lg shadow-sm font-medium">
              {dateLabel}
            </span>
          </div>
        );
      }
      elements.push(
        <ChatMessageBubble key={msg.id} message={msg} isOwnMessage={msg.sender_id === user?.id} />
      );
    });
    return elements;
  };

  const getLastMsgPreview = (conv: Conversation) => {
    const preview = conv.last_message_preview;
    if (!preview) return 'Sem mensagens';
    if (preview.startsWith('audio-')) return '🎤 Áudio';
    return preview;
  };

  // ==================== RENDER ====================

  const isFullView = expanded && open;

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => { setOpen(true); setExpanded(true); }}
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

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed z-[90] bg-card border shadow-2xl flex flex-col overflow-hidden",
              isFullView
                ? "top-4 bottom-4 right-4 w-[50vw] rounded-2xl"
                : "bottom-6 right-6 w-[400px] h-[560px] rounded-2xl"
            )}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-card">
              <h2 className="text-lg font-bold">Inbox</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content: 3-column layout when expanded, single view when compact */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* LEFT: Conversation List */}
              {(isFullView || !chat.activeConversation) && (
                <div className={cn(
                  "flex flex-col border-r bg-card overflow-hidden",
                  isFullView ? "w-[280px] shrink-0" : "flex-1"
                )}>
                  {/* Search & filters */}
                  <div className="p-2.5 space-y-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Busca"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 h-8 text-sm rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Conversations */}
                  <ScrollArea className="flex-1">
                    <div className="divide-y">
                      {filteredConversations.map(conv => {
                        const otherP = conv.participants?.find(p => p.user_id !== user?.id);
                        const name = otherP?.profile?.full_name || otherP?.profile?.email || 'Cliente';
                        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        const isActive = chat.activeConversation?.id === conv.id;
                        const preview = getLastMsgPreview(conv);

                        return (
                          <button
                            key={conv.id}
                            onClick={() => { chat.setActiveConversation(conv); chat.fetchMessages(conv.id); }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors text-left",
                              isActive && "bg-primary/5 border-l-2 border-l-primary"
                            )}
                          >
                            <Avatar className="w-10 h-10 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-sm font-semibold truncate">{name}</p>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {getConvTimeLabel(conv.last_message_at)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{preview}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Users className="h-3.5 w-3.5 text-muted-foreground/50" />
                            </div>
                          </button>
                        );
                      })}

                      {/* New client matches from search */}
                      {filteredNewClients.map(client => (
                        <button
                          key={client.id}
                          onClick={() => openChatWith(client.id)}
                          className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <Avatar className="w-10 h-10 shrink-0">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              {client.full_name?.substring(0, 2).toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{client.full_name || client.email}</p>
                            <p className="text-xs text-muted-foreground">Nova conversa</p>
                          </div>
                        </button>
                      ))}

                      {filteredConversations.length === 0 && filteredNewClients.length === 0 && (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          Nenhuma conversa encontrada
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* CENTER: Chat Area */}
              {(isFullView ? true : !!chat.activeConversation) && (
                <div className="flex-1 flex flex-col overflow-hidden bg-muted/20 min-w-0">
                  {chat.activeConversation ? (
                    <>
                      {/* Chat header */}
                      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card">
                        {!isFullView && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => chat.setActiveConversation(null)}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                        )}
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {activeInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{activeName}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => webrtc.startCall('video')} title="Vídeo">
                            <Video className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => webrtc.startCall('audio')} title="Áudio">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => webrtc.toggleScreenShare()} title="Compartilhar tela">
                            <Monitor className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMeetingOpen(true)} title="Agendar">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Messages */}
                      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
                        {renderMessagesWithDateSeparators(chat.messages)}
                      </div>

                      {/* Input */}
                      <ChatInput onSend={handleSend} onFileUpload={handleFileUpload} onAudioSend={handleAudioSend} disabled={chat.sendingMessage} />
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-2">
                        <MessageCircle className="h-12 w-12 mx-auto opacity-30" />
                        <p className="text-sm">Selecione uma conversa</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RIGHT: Contact Details (only when expanded + active conversation) */}
              {isFullView && chat.activeConversation && contactProfile && (
                <div className="w-[280px] shrink-0 border-l bg-card flex flex-col overflow-y-auto">
                  {/* Contact header */}
                  <div className="p-5 text-center border-b">
                    <div className="flex items-center justify-end gap-1 mb-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                    </div>
                    <Avatar className="w-20 h-20 mx-auto mb-3">
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                        {activeInitials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm truncate">{activeName}</p>
                    {contactProfile.phone && (
                      <p className="text-xs text-muted-foreground mt-0.5">{contactProfile.phone}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="px-5 py-3 border-b space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Atendimento está</span>
                      <Badge variant="outline" className="text-xs font-medium text-green-600 border-green-300">Aberto</Badge>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="px-5 py-3 space-y-3 border-b">
                    {contactProfile.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Telefone</p>
                          <p className="text-sm font-medium truncate">{contactProfile.phone}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">E-mail</p>
                        <p className="text-sm font-medium truncate">{contactProfile.email}</p>
                      </div>
                    </div>
                    {contactProfile.created_at && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Data de inscrição</p>
                          <p className="text-sm font-medium">{format(new Date(contactProfile.created_at), 'dd.MM.yyyy HH:mm')}</p>
                        </div>
                      </div>
                    )}
                    {contactProfile.cpf_cnpj && (
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                          <p className="text-sm font-medium">{contactProfile.cpf_cnpj}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assignment */}
                  <div className="px-5 py-3 space-y-3">
                    <Button className="w-full" size="sm" onClick={async () => {
                      if (!user || !contactProfile) return;
                      await supabase.from('profiles').update({ assigned_to: user.id }).eq('id', contactProfile.id);
                      setContactProfile(prev => prev ? { ...prev, assigned_to: user.id } : null);
                      toast.success('Atribuído a você!');
                    }}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Atribuir a mim
                    </Button>
                    {contactProfile.assigned_to && (
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          Atribuído a {adminProfiles.get(contactProfile.assigned_to) || 'Admin'}
                        </Badge>
                      </div>
                    )}
                    {contactProfile.assigned_to && (
                      <button
                        className="text-xs text-destructive hover:underline w-full text-center"
                        onClick={async () => {
                          if (!contactProfile) return;
                          await supabase.from('profiles').update({ assigned_to: null }).eq('id', contactProfile.id);
                          setContactProfile(prev => prev ? { ...prev, assigned_to: null } : null);
                          toast.success('Atribuição removida');
                        }}
                      >
                        Remover Atribuição
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
