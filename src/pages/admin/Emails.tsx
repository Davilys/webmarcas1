import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { EmailSidebar } from '@/components/admin/email/EmailSidebar';
import { EmailList } from '@/components/admin/email/EmailList';
import { EmailView } from '@/components/admin/email/EmailView';
import { EmailCompose } from '@/components/admin/email/EmailCompose';
import { EmailTemplates } from '@/components/admin/email/EmailTemplates';
import { EmailSettings } from '@/components/admin/email/EmailSettings';

export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'templates' | 'settings';

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
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [replyTo, setReplyTo] = useState<Email | null>(null);

  const handleCompose = () => {
    setIsComposing(true);
    setSelectedEmail(null);
    setReplyTo(null);
  };

  const handleReply = (email: Email) => {
    setReplyTo(email);
    setIsComposing(true);
  };

  const handleCloseCompose = () => {
    setIsComposing(false);
    setReplyTo(null);
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    setIsComposing(false);
  };

  const handleBack = () => {
    setSelectedEmail(null);
  };

  const renderContent = () => {
    if (currentFolder === 'templates') {
      return <EmailTemplates />;
    }

    if (currentFolder === 'settings') {
      return <EmailSettings />;
    }

    if (isComposing) {
      return <EmailCompose onClose={handleCloseCompose} replyTo={replyTo} />;
    }

    if (selectedEmail) {
      return (
        <EmailView
          email={selectedEmail}
          onBack={handleBack}
          onReply={() => handleReply(selectedEmail)}
        />
      );
    }

    return (
      <EmailList
        folder={currentFolder}
        onSelectEmail={handleSelectEmail}
      />
    );
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Sidebar */}
        <EmailSidebar
          currentFolder={currentFolder}
          onFolderChange={setCurrentFolder}
          onCompose={handleCompose}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </AdminLayout>
  );
}
