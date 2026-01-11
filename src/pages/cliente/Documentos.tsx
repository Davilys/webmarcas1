import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  FolderOpen, 
  Search, 
  Download, 
  FileText, 
  Eye,
  Upload,
  Image,
  File as FileIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { DocumentUploader } from '@/components/shared/DocumentUploader';
import { DocumentPreview } from '@/components/shared/DocumentPreview';

interface Document {
  id: string;
  name: string;
  document_type: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  contrato: { label: 'Contrato', color: 'bg-blue-100 text-blue-700' },
  procuracao: { label: 'Procuração', color: 'bg-purple-100 text-purple-700' },
  certificado: { label: 'Certificado', color: 'bg-green-100 text-green-700' },
  comprovante: { label: 'Comprovante', color: 'bg-cyan-100 text-cyan-700' },
  parecer: { label: 'Parecer INPI', color: 'bg-orange-100 text-orange-700' },
  rpi: { label: 'RPI', color: 'bg-yellow-100 text-yellow-700' },
  laudo: { label: 'Laudo', color: 'bg-rose-100 text-rose-700' },
  notificacao: { label: 'Notificação', color: 'bg-amber-100 text-amber-700' },
  anexo: { label: 'Anexo', color: 'bg-indigo-100 text-indigo-700' },
  outro: { label: 'Outro', color: 'bg-gray-100 text-gray-700' },
};

export default function Documentos() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    document_type: 'outro'
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate('/cliente/login');
        } else {
          setUser(session.user);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/cliente/login');
      } else {
        setUser(session.user);
        fetchDocuments(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchDocuments = async (userId: string) => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setDocuments((data as Document[]) || []);
    setLoading(false);
  };

  const handleUploadComplete = async (fileUrl: string, fileName: string, fileSize: number) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('documents').insert({
        name: uploadForm.name || fileName,
        file_url: fileUrl,
        document_type: uploadForm.document_type,
        file_size: fileSize,
        user_id: user.id,
        uploaded_by: 'client',
      });

      if (error) throw error;

      fetchDocuments(user.id);
      setUploadDialogOpen(false);
      setUploadForm({ name: '', document_type: 'outro' });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar documento');
    }
  };

  const handleDownload = (doc: Document) => {
    const link = window.document.createElement('a');
    link.href = doc.file_url;
    link.download = doc.name;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const filteredDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (doc: Document) => {
    const url = doc.file_url.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico)$/i.test(url)) return <Image className="h-6 w-6 text-blue-500" />;
    if (/\.pdf$/i.test(url)) return <FileText className="h-6 w-6 text-red-500" />;
    if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url)) return <FileIcon className="h-6 w-6 text-purple-500" />;
    if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(url)) return <FileIcon className="h-6 w-6 text-green-500" />;
    return <FileIcon className="h-6 w-6 text-gray-500" />;
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
            <p className="text-muted-foreground">
              Acesse todos os documentos do seu processo
            </p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Enviar Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do documento</Label>
                    <Input
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                      placeholder="Ex: Comprovante de endereço"
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select 
                      value={uploadForm.document_type} 
                      onValueChange={(v) => setUploadForm({ ...uploadForm, document_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeLabels).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {user && (
                  <DocumentUploader 
                    userId={user.id}
                    onUploadComplete={handleUploadComplete}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum documento encontrado</p>
                <p className="text-sm">Os documentos do seu processo aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocs.map((doc) => {
                  const typeConfig = typeLabels[doc.document_type] || typeLabels.outro;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          {getFileIcon(doc)}
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className={`text-xs ${typeConfig.color}`}>
                              {typeConfig.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(doc.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => { setPreviewDoc(doc); setPreviewOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <DocumentPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          document={previewDoc}
        />
      </div>
    </ClientLayout>
  );
}