import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Image, Video, Music, File as FileIcon, Download, Bot, Check, CheckCheck, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
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

function AudioPlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setPlaying(false);

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); }
    setPlaying(!playing);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const t = parseFloat(e.target.value);
    a.currentTime = t;
    setCurrentTime(t);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const idx = speeds.indexOf(playbackRate);
    const next = speeds[(idx + 1) % speeds.length];
    setPlaybackRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2.5 min-w-[220px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isOwn ? "bg-white/20 text-primary-foreground hover:bg-white/30" : "bg-primary/10 text-primary hover:bg-primary/20"
        )}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-[11px] font-mono shrink-0", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {fmt(currentTime || duration)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={seek}
            className={cn(
              "flex-1 h-1 rounded-full appearance-none cursor-pointer",
              isOwn 
                ? "[&::-webkit-slider-thumb]:bg-primary-foreground [&::-webkit-slider-track]:bg-primary-foreground/30"
                : "[&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-track]:bg-primary/30"
            )}
            style={{
              background: `linear-gradient(to right, ${isOwn ? 'rgba(255,255,255,0.8)' : 'hsl(var(--primary))'} ${duration ? (currentTime / duration) * 100 : 0}%, ${isOwn ? 'rgba(255,255,255,0.25)' : 'hsl(var(--primary) / 0.2)'} 0%)`,
            }}
          />
        </div>
      </div>
      <button
        onClick={cycleSpeed}
        className={cn(
          "text-[11px] font-bold shrink-0 px-1 rounded",
          isOwn ? "text-primary-foreground/70 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {playbackRate}x
      </button>
    </div>
  );
}

export function ChatMessageBubble({ message, isOwnMessage, showAvatar = true }: ChatMessageBubbleProps) {
  const initials = message.sender_profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?';
  const isSystem = message.message_type === 'system' || message.message_type === 'call_started' || message.message_type === 'call_ended' || message.message_type === 'meeting_scheduled';
  const isFile = message.message_type === 'file' || message.message_type === 'image' || message.message_type === 'audio' || message.message_type === 'video';
  const isAudio = message.message_type === 'audio' || (isFile && message.file_mime_type?.startsWith('audio/'));

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const timeStr = format(new Date(message.created_at), "EEE, d MMM yyyy, HH:mm", { locale: ptBR });

  return (
    <div className={cn('flex gap-2 max-w-[80%] group mb-1', isOwnMessage ? 'ml-auto flex-row-reverse' : '')}>
      {showAvatar && !isOwnMessage && (
        <Avatar className="w-7 h-7 flex-shrink-0 mt-auto">
          <AvatarFallback className={cn(
            "text-[10px] font-semibold",
            message.sender_id ? "bg-primary/15 text-primary" : "bg-emerald-100 text-emerald-700"
          )}>
            {message.sender_id ? initials : <Bot className="h-3.5 w-3.5" />}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className={cn(
          'rounded-2xl px-3 py-2 shadow-sm relative',
          isOwnMessage
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card border rounded-bl-sm'
        )}>
          {/* Audio attachment - WhatsApp style */}
          {isAudio && message.file_url && (
            <AudioPlayer src={message.file_url} isOwn={isOwnMessage} />
          )}

          {/* Other file attachments */}
          {isFile && !isAudio && message.file_url && (
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-xl mb-1",
              isOwnMessage ? "bg-white/10" : "bg-muted/60"
            )}>
              {message.file_mime_type?.startsWith('image/') ? (
                <img src={message.file_url} alt={message.file_name || ''} className="max-w-[200px] max-h-[200px] rounded-lg object-cover" />
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

          {/* Text content (skip for audio-only messages) */}
          {message.content && !isAudio && (
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
            <span className="text-[10px]">{timeStr}</span>
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
