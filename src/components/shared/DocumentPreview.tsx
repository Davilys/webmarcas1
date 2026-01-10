import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Image, Video, Music, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    name: string;
    file_url: string;
    document_type?: string | null;
    mime_type?: string | null;
  } | null;
}

export function DocumentPreview({ open, onOpenChange, document }: DocumentPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [effectiveUrl, setEffectiveUrl] = useState<string>('');

  // Reset states when document changes
  useEffect(() => {
    if (document) {
      setImageError(false);
      setSignedUrl(null);
      setLoading(false);
      setEffectiveUrl(document.file_url);
    }
  }, [document]);

  // Try to get signed URL as fallback when public URL fails
  const trySignedUrl = async () => {
    if (!document?.file_url || signedUrl) return;
    
    setLoading(true);
    try {
      // Extract path from URL - handle different URL formats
      const url = new URL(document.file_url);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);
      
      if (pathMatch && pathMatch[1]) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 3600); // 1 hour validity
        
        if (data?.signedUrl && !error) {
          setSignedUrl(data.signedUrl);
          setEffectiveUrl(data.signedUrl);
        }
      }
    } catch (err) {
      console.error('Error getting signed URL:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!document) return null;

  const url = effectiveUrl || document.file_url;

  // Detect file type from mime_type or URL extension
  const isImage = document.mime_type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico)$/i.test(url);
  const isPDF = document.mime_type === 'application/pdf' || 
    /\.pdf$/i.test(url);
  const isVideo = document.mime_type?.startsWith('video/') ||
    /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i.test(url);
  const isAudio = document.mime_type?.startsWith('audio/') ||
    /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i.test(url);

  const handleDownload = async () => {
    try {
      const downloadUrl = signedUrl || document.file_url;
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = window.document.createElement('a');
      link.href = blobUrl;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback to direct link
      const link = window.document.createElement('a');
      link.href = signedUrl || document.file_url;
      link.download = document.name;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const openInNewTab = () => {
    window.open(signedUrl || document.file_url, '_blank');
  };

  const handleMediaError = () => {
    if (!signedUrl) {
      setImageError(true);
      trySignedUrl();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-12 w-12 mb-4 animate-spin opacity-50" />
          <p className="text-lg font-medium">Carregando...</p>
        </div>
      );
    }

    if (isImage && !imageError) {
      return (
        <img
          src={url}
          alt={document.name}
          className="max-w-full h-auto mx-auto rounded-lg"
          onError={handleMediaError}
        />
      );
    }

    if (isPDF) {
      return (
        <iframe
          src={url}
          className="w-full h-[60vh] rounded-lg"
          title={document.name}
          onError={handleMediaError}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={url}
          controls
          className="max-w-full h-auto mx-auto rounded-lg"
          onError={handleMediaError}
        >
          Seu navegador não suporta vídeo HTML5.
        </video>
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Music className="h-16 w-16 mb-4 text-primary opacity-70" />
          <p className="text-lg font-medium mb-4">{document.name}</p>
          <audio
            src={url}
            controls
            className="w-full max-w-md"
            onError={handleMediaError}
          >
            Seu navegador não suporta áudio HTML5.
          </audio>
        </div>
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Pré-visualização não disponível</p>
        <p className="text-sm mt-2">Clique em "Baixar" para ver o arquivo</p>
        <Button onClick={handleDownload} className="mt-4">
          <Download className="h-4 w-4 mr-2" />
          Baixar Arquivo
        </Button>
      </div>
    );
  };

  const getIcon = () => {
    if (isImage) return <Image className="h-5 w-5" />;
    if (isVideo) return <Video className="h-5 w-5" />;
    if (isAudio) return <Music className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getIcon()}
              <span className="truncate max-w-[300px]">{document.name}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 overflow-auto max-h-[70vh] rounded-lg border bg-muted/30 p-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
