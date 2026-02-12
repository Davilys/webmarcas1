import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileText, Image, Video, Music, File as FileIcon, Download, Bot, CheckCheck, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
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
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setLoadError(false);

    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setPlaying(false);
    const onError = () => {
      const err = audio.error;
      console.warn('Audio load error:', err?.code, err?.message || 'unknown');
      setLoadError(true);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplaythrough', onLoaded);

    // Set crossOrigin before setting src to avoid CORS issues
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.src = src;
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplaythrough', onLoaded);
      audio.pause();
      audio.removeAttribute('src');
    };
  }, [src]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    
    // If there was a load error, try reloading without crossOrigin
    if (loadError) {
      setLoadError(false);
      a.crossOrigin = null as any;
      a.src = src;
      a.load();
      try {
        await a.play();
        setPlaying(true);
      } catch (err) {
        console.error('Audio play retry error:', err);
        setPlaying(false);
        setLoadError(true);
      }
      return;
    }
    
    try {
      if (playing) {
        a.pause();
        setPlaying(false);
      } else {
        a.volume = 1;
        a.muted = false;
        await a.play();
        setPlaying(true);
      }
    } catch (err) {
      console.error('Audio play error:', err);
      setPlaying(false);
    }
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
      <audio ref={audioRef} />
      <button
        onClick={toggle}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
          isOwn ? "bg-white/20 text-white hover:bg-white/30" : "bg-[#00a884]/15 text-[#00a884] hover:bg-[#00a884]/25",
          loadError && "opacity-70"
        )}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-[11px] font-mono shrink-0", isOwn ? "text-white/70" : "text-muted-foreground")}>
            {fmt(currentTime || duration)}
          </span>
          <input
            type="range" min={0} max={duration || 0} step={0.1} value={currentTime} onChange={seek}
            className={cn(
              "flex-1 h-1 rounded-full appearance-none cursor-pointer",
              isOwn
                ? "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-track]:bg-white/30"
                : "[&::-webkit-slider-thumb]:bg-[#00a884] [&::-webkit-slider-track]:bg-[#00a884]/30"
            )}
            style={{
              background: `linear-gradient(to right, ${isOwn ? 'rgba(255,255,255,0.8)' : '#00a884'} ${duration ? (currentTime / duration) * 100 : 0}%, ${isOwn ? 'rgba(255,255,255,0.25)' : 'rgba(0,168,132,0.2)'} 0%)`,
            }}
          />
        </div>
      </div>
      <button
        onClick={cycleSpeed}
        className={cn(
          "text-[11px] font-bold shrink-0 px-1 rounded",
          isOwn ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"
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
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-muted-foreground bg-white/80 dark:bg-card/80 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-sm">
          {message.content}
        </span>
      </div>
    );
  }

  const timeStr = format(new Date(message.created_at), "HH:mm");

  return (
    <div className={cn('flex gap-2 max-w-[75%] group mb-1', isOwnMessage ? 'ml-auto flex-row-reverse' : '')}>
      {showAvatar && !isOwnMessage && (
        <Avatar className="w-7 h-7 flex-shrink-0 mt-auto opacity-0 group-first:opacity-100">
          <AvatarFallback className={cn(
            "text-[10px] font-semibold",
            message.sender_id ? "bg-[#00a884]/15 text-[#008069]" : "bg-emerald-100 text-emerald-700"
          )}>
            {message.sender_id ? initials : <Bot className="h-3.5 w-3.5" />}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className={cn(
          'rounded-lg px-3 py-2 shadow-sm relative',
          isOwnMessage
            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-foreground rounded-tr-none'
            : 'bg-white dark:bg-[#1f2c33] border-0 rounded-tl-none shadow-sm'
        )}>
          {/* WhatsApp-style tail */}
          <div className={cn(
            "absolute top-0 w-3 h-3 overflow-hidden",
            isOwnMessage ? "-right-2" : "-left-2"
          )}>
            <div className={cn(
              "w-4 h-4 rotate-45 origin-bottom-left",
              isOwnMessage
                ? "bg-[#d9fdd3] dark:bg-[#005c4b]"
                : "bg-white dark:bg-[#1f2c33]"
            )} />
          </div>

          {/* Audio attachment */}
          {isAudio && message.file_url && (
            <AudioPlayer src={message.file_url} isOwn={isOwnMessage} />
          )}

          {/* Other file attachments */}
          {isFile && !isAudio && message.file_url && (
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-xl mb-1",
              isOwnMessage ? "bg-[#c1f0be] dark:bg-[#004d40]" : "bg-muted/60"
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

          {/* Text content */}
          {message.content && !isAudio && (
            <div className="text-[14px] leading-relaxed [&_p]:mb-1 [&_p:last-child]:mb-0 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline">
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Time & read status */}
          <div className={cn(
            "flex items-center gap-1 justify-end -mb-1 mt-0.5",
            isOwnMessage ? "text-[#667781] dark:text-white/50" : "text-[#667781] dark:text-white/40"
          )}>
            <span className="text-[11px]">{timeStr}</span>
            {isOwnMessage && (
              message.is_read
                ? <CheckCheck className="h-4 w-4 text-[#53bdeb]" />
                : <CheckCheck className="h-4 w-4 text-[#667781] dark:text-white/40" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
