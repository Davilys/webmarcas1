import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { VideoCallOverlay, IncomingCallNotification } from '@/components/chat/VideoCallOverlay';
import { MeetingScheduleDialog } from '@/components/chat/MeetingScheduleDialog';
import { useChat, type Conversation, type ChatMessage } from '@/hooks/useChat';
import { useWebRTC } from '@/hooks/useWebRTC';
import {
  MessageCircle, X, Search, Phone, Video, Calendar, ChevronLeft,
  Users, Minimize2, Maximize2, Send, Loader2, Monitor, Mail, Clock,
  CreditCard, Edit, MoreVertical, UserCheck, Trash2, Filter, CircleDot
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
  const [convFilter, setConvFilter] = useState<'all' | 'unread'>('all');
  const [activeTab, setActiveTab] = useState<'clients' | 'internal'>('clients');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

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

  // Track online users via Supabase Presence
  useEffect(() => {
    if (!user || !isAdmin) return;

    const presenceChannel = supabase.channel('online-users-listen', {
      config: { presence: { key: user.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const ids = new Set<string>(Object.keys(state));
        setOnlineUsers(ids);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user, isAdmin]);

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

  // Get admin user IDs set for filtering
  const adminUserIds = new Set(adminProfiles.keys());

  // Build a unified contact list: merge CRM data with conversation data, no duplicates
  const buildUnifiedList = () => {
    const convByUserId = new Map<string, Conversation>();
    chat.conversations.forEach(conv => {
      const otherP = conv.participants?.find(p => p.user_id !== user?.id);
      if (otherP) convByUserId.set(otherP.user_id, conv);
    });

    if (activeTab === 'clients') {
      // Show ALL CRM clients (non-admin, non-self)
      const allClients = clients
        .filter(c => c.id !== user?.id && !adminUserIds.has(c.id))
        .map(c => ({
          client: c,
          conversation: convByUserId.get(c.id) || null,
        }));

      // Sort: conversations with recent messages first, then alphabetical
      allClients.sort((a, b) => {
        const aTime = a.conversation?.last_message_at;
        const bTime = b.conversation?.last_message_at;
        if (aTime && !bTime) return -1;
        if (!aTime && bTime) return 1;
        if (aTime && bTime) return new Date(bTime).getTime() - new Date(aTime).getTime();
        return (a.client.full_name || a.client.email).localeCompare(b.client.full_name || b.client.email);
      });

      return allClients;
    } else {
      // Internal: show all other admins
      const adminEntries = Array.from(adminProfiles.entries())
        .filter(([id]) => id !== user?.id)
        .map(([id, name]) => ({
          client: { id, full_name: name, email: '', phone: null, cpf_cnpj: null, created_at: null, assigned_to: null } as ClientProfile,
          conversation: convByUserId.get(id) || null,
        }));

      adminEntries.sort((a, b) => {
        const aTime = a.conversation?.last_message_at;
        const bTime = b.conversation?.last_message_at;
        if (aTime && !bTime) return -1;
        if (!aTime && bTime) return 1;
        if (aTime && bTime) return new Date(bTime).getTime() - new Date(aTime).getTime();
        return (a.client.full_name || '').localeCompare(b.client.full_name || '');
      });

      return adminEntries;
    }
  };

  const unifiedList = buildUnifiedList().filter(item => {
    if (convFilter === 'unread') {
      if (!item.conversation || !(item.conversation.unread_count && item.conversation.unread_count > 0)) return false;
    }
    if (!searchQuery) return true;
    const name = item.client.full_name || item.client.email || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
            <span className="text-[11px] bg-white/80 dark:bg-card/80 text-muted-foreground px-4 py-1.5 rounded-lg shadow-sm font-medium backdrop-blur-sm">
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
      {/* FAB - WhatsApp style green */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setOpen(true); setExpanded(true); }}
            className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white shadow-2xl flex items-center justify-center transition-colors"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold">
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
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-[90] bg-card border shadow-2xl flex flex-col overflow-hidden",
              isFullView
                ? "inset-3 rounded-xl"
                : "bottom-6 right-6 w-[420px] h-[580px] rounded-xl"
            )}
          >
            {/* Top Header Bar - WhatsApp teal */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#008069] dark:bg-[#1f2c33] text-white">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold tracking-tight">Inbox</h2>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10" onClick={() => setOpen(false)}>
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
                  isFullView ? "w-[320px] shrink-0" : "flex-1"
                )}>
                  {/* Tabs: Clientes / Interno */}
                  <div className="px-3 pt-2 pb-1 flex items-center gap-1 border-b border-border/30">
                    <button
                      onClick={() => setActiveTab('clients')}
                      className={cn(
                        "text-xs font-semibold px-3 py-1.5 rounded-t transition-colors border-b-2",
                        activeTab === 'clients'
                          ? "border-[#00a884] text-[#008069] dark:text-[#00a884]"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Users className="h-3.5 w-3.5 inline mr-1" />
                      Clientes
                    </button>
                    <button
                      onClick={() => setActiveTab('internal')}
                      className={cn(
                        "text-xs font-semibold px-3 py-1.5 rounded-t transition-colors border-b-2",
                        activeTab === 'internal'
                          ? "border-[#00a884] text-[#008069] dark:text-[#00a884]"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <MessageCircle className="h-3.5 w-3.5 inline mr-1" />
                      Interno
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => setConvFilter(f => f === 'all' ? 'unread' : 'all')}
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors",
                        convFilter === 'unread'
                          ? "bg-[#008069]/10 text-[#008069] dark:bg-[#00a884]/20 dark:text-[#00a884]"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {convFilter === 'unread' ? 'Não lidos' : 'Todos'}
                    </button>
                  </div>

                  {/* Search */}
                  <div className="px-3 py-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar ou iniciar conversa"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 h-9 text-sm rounded-lg bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-[#00a884]/40"
                      />
                    </div>
                  </div>

                  {/* Conversations */}
                  <ScrollArea className="flex-1">
                    <div>
                      {unifiedList.map(({ client, conversation: conv }) => {
                        const name = client.full_name || client.email || 'Cliente';
                        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                        const isActive = conv && chat.activeConversation?.id === conv.id;
                        const preview = conv ? getLastMsgPreview(conv) : 'Sem mensagens';
                        const hasUnread = conv?.unread_count && conv.unread_count > 0;

                        return (
                          <button
                            key={client.id}
                            onClick={() => {
                              if (conv) {
                                chat.setActiveConversation(conv);
                                chat.fetchMessages(conv.id);
                              } else {
                                openChatWith(client.id);
                              }
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/30",
                              isActive && "bg-[#008069]/5 dark:bg-[#00a884]/10"
                            )}
                          >
                            <div className="relative">
                              <Avatar className="w-12 h-12 shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-[#00a884]/20 to-[#008069]/20 text-[#008069] dark:text-[#00a884] text-sm font-bold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              {onlineUsers.has(client.id) && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className={cn("text-sm truncate", hasUnread ? "font-bold" : "font-medium")}>{name}</p>
                                <span className={cn(
                                  "text-[11px] shrink-0",
                                  hasUnread ? "text-[#00a884] font-semibold" : "text-muted-foreground"
                                )}>
                                  {conv ? getConvTimeLabel(conv.last_message_at) : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <p className={cn(
                                  "text-xs truncate flex-1",
                                  hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
                                )}>{preview}</p>
                                {hasUnread && (
                                  <span className="min-w-5 h-5 px-1.5 bg-[#00a884] text-white text-[10px] rounded-full flex items-center justify-center font-bold shrink-0">
                                    {conv?.unread_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {unifiedList.length === 0 && (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                          <p>Nenhum contato encontrado</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* CENTER: Chat Area */}
              {(isFullView ? true : !!chat.activeConversation) && (
                <div className="flex-1 flex flex-col overflow-hidden min-w-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundColor: 'hsl(var(--muted) / 0.3)',
                  }}
                >
                  {chat.activeConversation ? (
                    <>
                      {/* Chat header - WhatsApp style */}
                      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-[#f0f2f5] dark:bg-[#1f2c33]">
                        {!isFullView && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => chat.setActiveConversation(null)}>
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                        )}
                        <div className="relative">
                          <Avatar className="w-10 h-10 shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-[#00a884]/20 to-[#008069]/20 text-[#008069] dark:text-[#00a884] text-sm font-bold">
                              {activeInitials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#f0f2f5] dark:border-[#1f2c33]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{activeName}</p>
                          <p className="text-[11px] text-muted-foreground">online</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => webrtc.startCall('video')} title="Chamada de vídeo">
                            <Video className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => webrtc.startCall('audio')} title="Chamada de áudio">
                            <Phone className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => webrtc.toggleScreenShare()} title="Compartilhar tela">
                            <Monitor className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => setMeetingOpen(true)} title="Agendar">
                            <Calendar className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Mais opções">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      {/* Messages */}
                      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                        {renderMessagesWithDateSeparators(chat.messages)}
                      </div>

                      {/* Input */}
                      <ChatInput onSend={handleSend} onFileUpload={handleFileUpload} onAudioSend={handleAudioSend} disabled={chat.sendingMessage} />
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]/50 dark:bg-[#0b141a]/50">
                      <div className="text-center space-y-3 max-w-sm">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#00a884]/10 to-[#008069]/10 flex items-center justify-center">
                          <MessageCircle className="h-10 w-10 text-[#00a884]/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-muted-foreground">WebMarcas Chat</h3>
                        <p className="text-sm text-muted-foreground/70">Selecione uma conversa para começar</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RIGHT: Contact Details (only when expanded + active conversation) */}
              {isFullView && chat.activeConversation && contactProfile && (
                <div className="w-[300px] shrink-0 border-l bg-card flex flex-col overflow-y-auto">
                  {/* Contact header */}
                  <div className="bg-[#f0f2f5] dark:bg-[#1f2c33] px-4 py-3 border-b flex items-center justify-between">
                    <span className="text-sm font-semibold">Dados do contato</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  
                  {/* Avatar & Name */}
                  <div className="p-6 text-center border-b">
                    <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-[#00a884]/20">
                      <AvatarFallback className="bg-gradient-to-br from-[#00a884]/20 to-[#008069]/30 text-[#008069] dark:text-[#00a884] text-2xl font-bold">
                        {activeInitials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-base">{activeName}</p>
                    {contactProfile.phone && (
                      <p className="text-sm text-muted-foreground mt-1">{contactProfile.phone}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="px-5 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Atendimento está</span>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                          <CircleDot className="h-3 w-3 mr-1" />
                          Aberto
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="px-5 py-4 space-y-4 border-b">
                    {contactProfile.phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Telefone</p>
                          <p className="text-sm font-medium truncate">{contactProfile.phone}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">E-mail</p>
                        <p className="text-sm font-medium truncate">{contactProfile.email}</p>
                      </div>
                    </div>
                    {contactProfile.created_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Data de inscrição</p>
                          <p className="text-sm font-medium">{format(new Date(contactProfile.created_at), 'dd.MM.yyyy HH:mm')}</p>
                        </div>
                      </div>
                    )}
                    {contactProfile.cpf_cnpj && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">CPF/CNPJ</p>
                          <p className="text-sm font-medium">{contactProfile.cpf_cnpj}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Assignment */}
                  <div className="px-5 py-4 space-y-3">
                    {contactProfile.assigned_to && (
                      <div className="p-3 rounded-xl bg-[#00a884]/5 dark:bg-[#00a884]/10 border border-[#00a884]/20">
                        <p className="text-xs text-muted-foreground mb-1">Atribuído a</p>
                        <p className="text-sm font-semibold text-[#008069] dark:text-[#00a884]">
                          {adminProfiles.get(contactProfile.assigned_to) || 'Admin'}
                        </p>
                      </div>
                    )}
                    <Button className="w-full bg-[#00a884] hover:bg-[#008069] text-white" size="sm" onClick={async () => {
                      if (!user || !contactProfile) return;
                      await supabase.from('profiles').update({ assigned_to: user.id }).eq('id', contactProfile.id);
                      setContactProfile(prev => prev ? { ...prev, assigned_to: user.id } : null);
                      toast.success('Atribuído a você!');
                    }}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Atribuir a mim
                    </Button>
                    {contactProfile.assigned_to && (
                      <button
                        className="text-xs text-destructive hover:underline w-full text-center py-1"
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