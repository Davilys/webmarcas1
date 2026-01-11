import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Paperclip, Mic, Square, Loader2, X, FileText, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
  fileImages?: string[];
  createdAt: Date;
}

interface INPILegalChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Convert PDF pages to images for OCR
async function convertPdfToImages(base64Data: string, maxPages: number = 3): Promise<string[]> {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;

    const images: string[] = [];
    const pagesToProcess = Math.min(pdf.numPages, maxPages);

    console.log(`Converting ${pagesToProcess} pages of PDF to images`);

    for (let i = 1; i <= pagesToProcess; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 }); // Good quality for OCR

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) continue;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert to JPEG data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      images.push(imageDataUrl);
      
      console.log(`Page ${i} converted, size: ${Math.round(imageDataUrl.length / 1024)}KB`);
    }

    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    return [];
  }
}

export function INPILegalChatDialog({ open, onOpenChange }: INPILegalChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou sua consultora jurídica especialista em recursos INPI. Posso analisar documentos do INPI (indeferimentos, exigências, oposições) e orientar você sobre as melhores estratégias jurídicas.\n\nVocê pode:\n• Enviar um PDF do INPI para análise\n• Fazer perguntas sobre registro de marcas\n• Solicitar que eu elabore um recurso\n• Usar o microfone para falar sua pergunta\n\nComo posso ajudar?',
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachedFile, setAttachedFile] = useState<{ name: string; images: string[] } | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }

    setIsProcessingPdf(true);
    toast.info('Processando PDF para análise...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        
        // Convert PDF to images for OCR
        const images = await convertPdfToImages(base64);
        
        if (images.length === 0) {
          toast.error('Não foi possível processar o PDF. Tente novamente.');
          setIsProcessingPdf(false);
          return;
        }

        setAttachedFile({
          name: file.name,
          images,
        });
        
        toast.success(`PDF processado: ${images.length} página(s) prontas para análise`);
        setIsProcessingPdf(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.error('Erro ao processar o PDF');
      setIsProcessingPdf(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine best supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        setRecordingTime(0);

        // Process audio
        if (audioChunksRef.current.length > 0) {
          await transcribeAndSend(mimeType);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.info('Gravando... Clique no botão vermelho para parar e enviar');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAndSend = async (mimeType: string) => {
    setIsTranscribing(true);
    toast.info('Transcrevendo áudio...');

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      console.log(`Sending audio for transcription: ${Math.round(audioBlob.size / 1024)}KB, type: ${mimeType}`);

      // Call transcription API
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ audioBase64, mimeType }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro na transcrição');
      }

      const { text } = await response.json();

      if (text && text.trim()) {
        toast.success('Áudio transcrito!');
        // Auto-send the transcribed message
        setInput(text);
        setTimeout(() => {
          sendMessageWithText(text);
        }, 100);
      } else {
        toast.error('Não foi possível entender o áudio. Tente novamente.');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Erro ao transcrever o áudio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() && !attachedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim() || (attachedFile ? `Analise este documento: ${attachedFile.name}` : ''),
      fileName: attachedFile?.name,
      fileImages: attachedFile?.images,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachedFile(null);
    setIsLoading(true);

    try {
      // Prepare messages for API
      const apiMessages = messages
        .filter((m) => m.role !== 'assistant' || m.id !== '1')
        .concat(userMessage)
        .map((m) => ({
          role: m.role,
          content: m.content,
          fileImages: m.fileImages,
          fileName: m.fileName,
        }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-inpi-legal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: apiMessages }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao conectar com a IA');
      }

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  if (updated[lastIndex]?.role === 'assistant') {
                    updated[lastIndex] = { ...updated[lastIndex], content: fullContent };
                  }
                  return updated;
                });
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    await sendMessageWithText(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Consultora Jurídica INPI
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback
                    className={cn(
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {message.role === 'user' ? 'Eu' : '⚖️'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'flex flex-col gap-1 max-w-[80%]',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  {message.fileName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      <FileText className="h-3 w-3" />
                      {message.fileName}
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm whitespace-pre-wrap',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.content || (isLoading && message.role === 'assistant' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t px-6 py-4 space-y-3">
          {attachedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm flex-1 truncate">
                {attachedFile.name} ({attachedFile.images.length} página{attachedFile.images.length > 1 ? 's' : ''})
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeAttachment}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isProcessingPdf && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processando PDF...</span>
            </div>
          )}

          {isTranscribing && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Transcrevendo áudio...</span>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isProcessingPdf || isRecording}
              title="Anexar PDF"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading || isTranscribing || isProcessingPdf}
              className={cn(
                isRecording && 'bg-red-500 border-red-500 text-white hover:bg-red-600 hover:text-white'
              )}
              title={isRecording ? 'Parar e enviar' : 'Gravar áudio'}
            >
              {isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            {isRecording && (
              <div className="flex items-center gap-2 px-3 bg-red-50 rounded-lg text-red-600 text-sm font-medium animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                {formatTime(recordingTime)}
              </div>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem ou envie um PDF para análise..."
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
              disabled={isLoading || isRecording}
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || isRecording || isTranscribing || (!input.trim() && !attachedFile)}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
