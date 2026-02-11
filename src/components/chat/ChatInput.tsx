import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile, Mic, X, Loader2, Image, FileText, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ChatInputProps {
  onSend: (content: string) => void;
  onFileUpload: (file: File) => void;
  disabled?: boolean;
  uploading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onFileUpload, disabled, uploading, placeholder = 'Digite uma mensagem...' }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onFileUpload(selectedFile);
      setSelectedFile(null);
      return;
    }
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="border-t bg-card/80 backdrop-blur-sm p-3">
      {/* Selected file preview */}
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

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl bg-muted/60 border-0 px-4 py-2.5 text-sm",
              "focus:outline-none focus:ring-1 focus:ring-primary/30",
              "placeholder:text-muted-foreground/60",
              "max-h-[120px] scrollbar-thin"
            )}
            disabled={disabled || uploading}
          />
        </div>

        <Button
          type="submit"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-full flex-shrink-0 transition-all",
            (input.trim() || selectedFile) ? "bg-primary shadow-md" : "bg-muted text-muted-foreground"
          )}
          disabled={disabled || uploading || (!input.trim() && !selectedFile)}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
