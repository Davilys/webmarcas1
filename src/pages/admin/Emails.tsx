import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { EmailSidebar } from '@/components/admin/email/EmailSidebar';
import { EmailList } from '@/components/admin/email/EmailList';
import { EmailView } from '@/components/admin/email/EmailView';
import { EmailCompose } from '@/components/admin/email/EmailCompose';
import { EmailTemplates } from '@/components/admin/email/EmailTemplates';
import { EmailSettings } from '@/components/admin/email/EmailSettings';
import { EmailAutomations } from '@/components/admin/email/EmailAutomations';
import { EmailCampaigns } from '@/components/admin/email/EmailCampaigns';
import { EmailSequences } from '@/components/admin/email/EmailSequences';
import { EmailMetricsBar } from '@/components/admin/email/EmailMetricsBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Mail, Zap, BarChart3, TrendingUp, Send, Inbox, Menu, PenSquare
} from 'lucide-react';

export type EmailFolder =
  | 'inbox' | 'sent' | 'drafts' | 'templates' | 'settings'
  | 'scheduled' | 'automated' | 'starred' | 'archived' | 'trash'
  | 'campaigns' | 'sequences' | 'automations'
  | 'filter-clients' | 'filter-leads' | 'filter-legal' | 'filter-financial' | 'filter-support';

export interface Email {
  id: string;
  from_email: string;
  from_name?: string;
  to_email: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  is_read: boolean;
  is_starred: boolean;
  received_at?: string;
  sent_at?: string;
}

export default function Emails() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [replyTo, setReplyTo] = useState<Email | null>(null);
  const [initialTo, setInitialTo] = useState('');
  const [initialName, setInitialName] = useState('');
  const [aiDraftBody, setAiDraftBody] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();


  // Read URL params to auto-open compose with client data
  useEffect(() => {
    const compose = searchParams.get('compose');
    const to = searchParams.get('to');
    const name = searchParams.get('name');
    if (compose === 'true') {
      setIsComposing(true);
      setSelectedEmail(null);
      setReplyTo(null);
      if (to) setInitialTo(decodeURIComponent(to));
      if (name) setInitialName(decodeURIComponent(name));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Stats query for sidebar
  const { data: stats } = useQuery({
    queryKey: ['email-stats'],
    queryFn: async () => {
      const [inboxRes, sentRes, unreadRes] = await Promise.all([
        supabase.from('email_inbox').select('id', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('email_logs').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase.from('email_inbox').select('id', { count: 'exact', head: true }).eq('is_read', false).eq('is_archived', false),
      ]);
      return {
        inbox: inboxRes.count || 0,
        sent: sentRes.count || 0,
        unread: unreadRes.count || 0,
        drafts: 0,
        scheduled: 0,
        automated: 0,
      };
    },
    refetchInterval: 60000,
  });

  const handleFolderChange = (folder: EmailFolder) => {
    setSelectedEmail(null);
    setIsComposing(false);
    setReplyTo(null);
    setCurrentFolder(folder);
    setSidebarOpen(false);
  };

  const handleCompose = () => {
    setIsComposing(true);
    setSelectedEmail(null);
    setReplyTo(null);
    setSidebarOpen(false);
  };

  const handleReply = (email: Email) => {
    setReplyTo(email);
    setIsComposing(true);
  };

  const handleCloseCompose = () => {
    setIsComposing(false);
    setReplyTo(null);
    setAiDraftBody('');
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setIsComposing(false);
  };

  const handleBack = () => {
    setSelectedEmail(null);
  };

  // Called when AI assistant generates a draft → open compose with the text pre-filled
  const handleAiDraft = (text: string, email: Email) => {
    setAiDraftBody(text);
    setReplyTo(email);
    setInitialTo(email.from_email);
    setInitialName(email.from_name || '');
    setIsComposing(true);
    setSelectedEmail(null);
  };

  const renderContent = () => {
    if (currentFolder === 'templates') return <EmailTemplates />;
    if (currentFolder === 'settings') return <EmailSettings />;
    if (currentFolder === 'automations') return <EmailAutomations />;
    if (currentFolder === 'campaigns') return <EmailCampaigns onCompose={handleCompose} />;
    if (currentFolder === 'sequences') return <EmailSequences />;

    if (isComposing) {
      return (
        <EmailCompose
          onClose={handleCloseCompose}
          replyTo={replyTo}
          initialTo={initialTo}
          initialName={initialName}
          initialBody={aiDraftBody || undefined}
        />
      );
    }

    if (selectedEmail) {
      return (
        <EmailView
          email={selectedEmail}
          onBack={handleBack}
          onReply={() => handleReply(selectedEmail)}
          onUseDraftFromAI={(text) => handleAiDraft(text, selectedEmail)}
        />
      );
    }


    const listFolder = currentFolder.startsWith('filter-') ? 'inbox' : currentFolder;
    const validListFolders: EmailFolder[] = ['inbox', 'sent', 'drafts', 'starred', 'archived', 'trash', 'scheduled', 'automated'];
    const folderToShow = validListFolders.includes(listFolder as EmailFolder) ? listFolder as 'inbox' | 'sent' | 'drafts' : 'inbox';

    return (
      <EmailList
        folder={folderToShow}
        onSelectEmail={handleSelectEmail}
      />
    );
  };

  const getFolderLabel = () => {
    const map: Record<string, string> = {
      inbox: 'Caixa de Entrada', sent: 'Enviados', drafts: 'Rascunhos',
      templates: 'Templates', settings: 'Configurações', scheduled: 'Programados',
      automated: 'Automáticos', starred: 'Favoritos', archived: 'Arquivados',
      trash: 'Lixeira', campaigns: 'Campanhas', sequences: 'Sequências',
      automations: 'Automações', 'filter-clients': 'Clientes', 'filter-leads': 'Leads',
      'filter-legal': 'Jurídico', 'filter-financial': 'Financeiro', 'filter-support': 'Suporte',
    };
    return map[currentFolder] || 'Email';
  };

  const sidebarContent = (
    <EmailSidebar
      currentFolder={currentFolder}
      onFolderChange={handleFolderChange}
      onCompose={handleCompose}
      stats={stats}
    />
  );

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] gap-0 -mx-4 -mt-4">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50 px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 flex-shrink-0">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0 md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-4 pt-8">
                    {sidebarContent}
                  </SheetContent>
                </Sheet>
              )}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/30 flex-shrink-0"
              >
                <Mail className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </motion.div>
              <div className="min-w-0">
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text truncate"
                >
                  Central de Email
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.1 } }}
                  className="text-xs md:text-sm text-muted-foreground truncate"
                >
                  {getFolderLabel()}
                </motion.p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Mobile compose FAB */}
              {isMobile && (
                <Button
                  onClick={handleCompose}
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20 md:hidden"
                >
                  <PenSquare className="h-5 w-5" />
                </Button>
              )}
              {/* Live indicator */}
              <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Sistema Ativo</span>
              </div>
              {/* Mobile compact live dot */}
              {isMobile && (
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse md:hidden" />
              )}
            </div>
          </div>
          {/* Metrics Bar */}
          <EmailMetricsBar stats={stats} />
        </div>

        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="w-64 flex-shrink-0 border-r border-border/50 bg-background/50 overflow-y-auto p-3">
              {sidebarContent}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden bg-muted/20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFolder + (isComposing ? '-compose' : '') + (selectedEmail?.id || '')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="h-full p-2 md:p-4"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
