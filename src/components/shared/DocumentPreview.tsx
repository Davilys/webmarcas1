import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileText, Image, X } from 'lucide-react';

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

  if (!document) return null;

  const isImage = document.mime_type?.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(document.file_url);
  const isPDF = document.mime_type === 'application/pdf' || 
    /\.pdf$/i.test(document.file_url);

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.file_url;
    link.download = document.name;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const openInNewTab = () => {
    window.open(document.file_url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {isImage ? <Image className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              {document.name}
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

        <div className="mt-4 overflow-auto max-h-[70vh] rounded-lg border bg-muted/30">
          {isImage && !imageError ? (
            <img
              src={document.file_url}
              alt={document.name}
              className="max-w-full h-auto mx-auto"
              onError={() => setImageError(true)}
            />
          ) : isPDF ? (
            <iframe
              src={document.file_url}
              className="w-full h-[60vh]"
              title={document.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Pré-visualização não disponível</p>
              <p className="text-sm mt-2">Clique em "Baixar" para ver o arquivo</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}