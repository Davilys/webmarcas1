import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Image, Video, Music, File as FileIcon, Download, Bot, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ChatMessage } from '@/hooks/useChat';
import ReactMarkdown from 'react-markdown';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

const getFileIcon = (mime: string | null) => {
  if (!mime) return <FileIcon className="h-5 w-5" />;
  if (mime.startsWith('image/')) return <Image className="h-5 w-5 text-blue-400" />;
  if (mime.startsWith('video/')) return <Video className="h-5 w-5 text-purple-400" />;
  if (mime.startsWith('audio/')) return <Music className="h-5 w-5 text-green-400" />;
  if (mime.includes('pdf')) return <FileText className="h-5 w-5 text-red-400" />;
  return <FileIcon className="h-5 w-5 text-muted-foreground" />;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export function ChatMessageBubble({ message, isOwnMessage, showAvatar = true }: ChatMessageBubbleProps) {
  const initials = message.sender_profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?';
  const isSystem = message.message_type === 'system' || message.message_type === 'call_started' || message.message_type === 'call_ended' || message.message_type === 'meeting_scheduled';
  const isFile = message.message_type === 'file' || message.message_type === 'image' || message.message_type === 'audio' || message.message_type === 'video';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 max-w-[85%] group', isOwnMessage ? 'ml-auto flex-row-reverse' : '')}>
      {showAvatar && !isOwnMessage && (
        <Avatar className="w-8 h-8 flex-shrink-0 mt-auto">
          <AvatarFallback className={cn(
            "text-xs font-semibold",
            message.sender_id ? "bg-primary/15 text-primary" : "bg-emerald-100 text-emerald-700"
          )}>
            {message.sender_id ? initials : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col gap-0.5">
        {!isOwnMessage && showAvatar && (
          <span className="text-[10px] font-medium text-muted-foreground ml-1">
            {message.sender_profile?.full_name || 'IA Fernanda'}
          </span>
        )}

        <div className={cn(
          'rounded-2xl px-3.5 py-2 shadow-sm relative',
          isOwnMessage
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-card border rounded-bl-md'
        )}>
          {/* File attachment */}
          {isFile && message.file_url && (
            <div className={cn(
              "flex items-center gap-3 p-2.5 rounded-xl mb-1.5",
              isOwnMessage ? "bg-white/10" : "bg-muted/60"
            )}>
          {message.file_mime_type?.startsWith('image/') ? (
                <img src={message.file_url} alt={message.file_name || ''} className="max-w-[200px] max-h-[200px] rounded-lg object-cover" />
              ) : message.file_mime_type?.startsWith('audio/') ? (
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Music className="h-5 w-5 flex-shrink-0 text-green-400" />
                  <audio controls preload="metadata" className="h-8 max-w-[220px] flex-1" style={{ colorScheme: 'dark' }}>
                    <source src={message.file_url} type={message.file_mime_type} />
                  </audio>
                </div>
              ) : (
                <>
                  {getFileIcon(message.file_mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{message.file_name}</p>
                    <p className="text-[10px] opacity-70">{formatSize(message.file_size)}</p>
                  </div>
                  <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100">
                    <Download className="h-4 w-4" />
                  </a>
                </>
              )}
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <div className={cn("text-sm leading-relaxed", isOwnMessage ? "prose-invert" : "prose prose-sm")}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(
                      "underline",
                      isOwnMessage ? "text-primary-foreground/90" : "text-primary"
                    )}>{children}</a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Time & read status */}
          <div className={cn(
            "flex items-center gap-1 justify-end mt-1",
            isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground"
          )}>
            <span className="text-[10px]">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: false, locale: ptBR })}
            </span>
            {isOwnMessage && (
              message.is_read
                ? <CheckCheck className="h-3 w-3 text-blue-300" />
                : <Check className="h-3 w-3" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
