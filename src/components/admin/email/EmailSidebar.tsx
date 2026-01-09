import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Inbox,
  Send,
  FileText,
  Layout,
  Settings,
  PenSquare,
} from 'lucide-react';
import type { EmailFolder } from '@/pages/admin/Emails';

interface EmailSidebarProps {
  currentFolder: EmailFolder;
  onFolderChange: (folder: EmailFolder) => void;
  onCompose: () => void;
}

const folders: { id: EmailFolder; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'inbox', label: 'Caixa de Entrada', icon: Inbox },
  { id: 'sent', label: 'Enviados', icon: Send },
  { id: 'drafts', label: 'Rascunhos', icon: FileText },
  { id: 'templates', label: 'Templates', icon: Layout },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function EmailSidebar({ currentFolder, onFolderChange, onCompose }: EmailSidebarProps) {
  return (
    <div className="w-56 flex-shrink-0 space-y-4">
      {/* Compose Button */}
      <Button onClick={onCompose} className="w-full gap-2" size="lg">
        <PenSquare className="h-5 w-5" />
        Novo Email
      </Button>

      {/* Folder List */}
      <nav className="space-y-1">
        {folders.map((folder) => {
          const Icon = folder.icon;
          return (
            <button
              key={folder.id}
              onClick={() => onFolderChange(folder.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                currentFolder === folder.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {folder.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
