import { useState, useRef, useCallback, useEffect, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Mic, MicOff, X, Loader2, Image, FileText, Film, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (content: string) => void;
  onFileUpload: (file: File) => void;
  onAudioSend?: (file: File) => void;
  disabled?: boolean;
  uploading?: boolean;
  placeholder?: string;
}

export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(
  ({ onSend, onFileUpload, onAudioSend, disabled, uploading, placeholder = 'Digite uma mensagem...' }, ref) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `audio-${Date.now()}.${ext}`, { type: mimeType });

        if (onAudioSend) {
          onAudioSend(file);
        } else {
          onFileUpload(file);
        }

        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch {
      // Mic permission denied
    }
  }, [onAudioSend, onFileUpload]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecordingTime(0);
  }, []);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) { onFileUpload(selectedFile); setSelectedFile(null); return; }
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // Recording UI
  if (isRecording) {
    return (
      <div ref={ref} className="border-t bg-card/80 backdrop-blur-sm p-3">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full text-destructive" onClick={cancelRecording}>
            <X className="h-5 w-5" />
          </Button>

          <div className="flex-1 flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono text-destructive font-medium">{formatTime(recordingTime)}</span>
            <div className="flex-1 h-1 bg-destructive/20 rounded-full overflow-hidden">
              <div className="h-full bg-destructive/60 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>

          <Button type="button" size="icon" className="h-10 w-10 rounded-full bg-primary shadow-md" onClick={stopRecording}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="border-t bg-card/80 backdrop-blur-sm p-3">
      {selectedFile && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg">
          {selectedFile.type.startsWith('image/') ? <Image className="h-4 w-4 text-blue-500" /> :
           selectedFile.type.startsWith('video/') ? <Film className="h-4 w-4 text-purple-500" /> :
           <FileText className="h-4 w-4 text-red-500" />}
          <span className="text-xs flex-1 truncate">{selectedFile.name}</span>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedFile(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="*" />

        <Button type="button" variant="ghost" size="icon"
          className="h-9 w-9 rounded-full flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()} disabled={disabled || uploading}>
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative">
          <textarea ref={textareaRef} value={input} onChange={handleTextareaChange} onKeyDown={handleKeyDown}
            placeholder={placeholder} rows={1}
            className={cn(
              "w-full resize-none rounded-2xl bg-muted/60 border-0 px-4 py-2.5 text-sm",
              "focus:outline-none focus:ring-1 focus:ring-primary/30",
              "placeholder:text-muted-foreground/60", "max-h-[120px] scrollbar-thin"
            )}
            disabled={disabled || uploading} />
        </div>

        {input.trim() || selectedFile ? (
          <Button type="submit" size="icon"
            className="h-9 w-9 rounded-full flex-shrink-0 bg-primary shadow-md"
            disabled={disabled || uploading || (!input.trim() && !selectedFile)}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        ) : (
          <Button type="button" size="icon"
            className="h-9 w-9 rounded-full flex-shrink-0 bg-primary shadow-md"
            onClick={startRecording} disabled={disabled || uploading}>
            <Mic className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
