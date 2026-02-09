import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, FileText, Download, Eye, Trash2, MoreVertical, Filter, X, Image, File as FileIcon, User } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentUploader } from '@/components/shared/DocumentUploader';
import { DocumentPreview } from '@/components/shared/DocumentPreview';

interface Document {
  id: string;
  name: string;
  file_url: string;
  document_type: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string | null;
  user_id: string | null;
  process_id: string | null;
  profiles?: { full_name: string | null; email: string } | null;
  brand_processes?: { brand_name: string } | null;
}

interface Client {
  id: string;
  full_name: string | null;
  email: string;
}

interface Process {
  id: string;
  brand_name: string;
  user_id: string | null;
}

const documentTypes = [
  { value: 'contrato', label: 'Contrato', color: 'bg-blue-100 text-blue-700' },
  { value: 'contract', label: 'Contrato', color: 'bg-blue-100 text-blue-700' },
  { value: 'procuracao', label: 'Procuração', color: 'bg-purple-100 text-purple-700' },
  { value: 'certificado', label: 'Certificado', color: 'bg-green-100 text-green-700' },
  { value: 'comprovante', label: 'Comprovante', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'parecer', label: 'Parecer INPI', color: 'bg-orange-100 text-orange-700' },
  { value: 'rpi', label: 'RPI', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'laudo', label: 'Laudo', color: 'bg-rose-100 text-rose-700' },
  { value: 'notificacao', label: 'Notificação', color: 'bg-amber-100 text-amber-700' },
  { value: 'protocolo', label: 'Protocolo de Registro', color: 'bg-teal-100 text-teal-700' },
  { value: 'outro', label: 'Outro', color: 'bg-gray-100 text-gray-700' },
];

const tabDefinitions = [
  { value: 'todos', label: 'Todos', types: [] as string[] },
  { value: 'contrato', label: 'Contrato', types: ['contrato', 'contract'] },
  { value: 'procuracao', label: 'Procuração', types: ['procuracao'] },
  { value: 'anexo', label: 'Anexo', types: ['anexo'] },
  { value: 'certificado', label: 'Certificado', types: ['certificado'] },
  { value: 'comprovante', label: 'Comprovante', types: ['comprovante'] },
  { value: 'parecer', label: 'Parecer INPI', types: ['parecer'] },
  { value: 'protocolo', label: 'Protocolo', types: ['protocolo'] },
  { value: 'outros', label: 'Outros', types: ['laudo', 'notificacao', 'rpi', 'outro'] },
];

export default function AdminDocumentos() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('todos');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    document_type: 'outro',
    user_id: '',
    process_id: '',
  });

  useEffect(() => {
    fetchDocuments();
    fetchClients();
    fetchProcesses();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*, profiles(full_name, email), brand_processes(brand_name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar documentos');
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email');
    setClients(data || []);
  };

  const fetchProcesses = async () => {
    const { data } = await supabase.from('brand_processes').select('id, brand_name, user_id');
    setProcesses(data || []);
  };

  const generateProtocol = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `DOC-${date}-${rand}`;
  };

  const handleUploadComplete = async (fileUrl: string, fileName: string, fileSize: number) => {
    if (!formData.user_id) {
      toast.error('Selecione um cliente primeiro');
      return;
    }

    try {
      const protocol = generateProtocol();
      const { error: insertError } = await supabase.from('documents').insert({
        name: formData.name || fileName,
        file_url: fileUrl,
        document_type: formData.document_type,
        file_size: fileSize,
        user_id: formData.user_id,
        process_id: formData.process_id || null,
        uploaded_by: 'admin',
        protocol,
      } as any);

      if (insertError) throw insertError;

      toast.success(`Documento enviado! Protocolo: ${protocol}`);
      fetchDocuments();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar documento');
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Excluir "${doc.name}"?`)) return;

    try {
      const urlParts = doc.file_url.split('/documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('documents').remove([filePath]);
      }

      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;

      toast.success('Documento excluído');
      fetchDocuments();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir documento');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', document_type: 'outro', user_id: '', process_id: '' });
  };

  const filteredDocuments = documents.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.profiles as any)?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      (d.brand_processes as any)?.brand_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.document_type === typeFilter;
    const matchClient = clientFilter === 'all' || d.user_id === clientFilter;

    const currentTab = tabDefinitions.find(t => t.value === activeTab);
    const matchTab = !currentTab || currentTab.types.length === 0 || currentTab.types.includes(d.document_type || '');

    return matchSearch && matchType && matchClient && matchTab;
  });

  const getTabCount = (tab: typeof tabDefinitions[0]) => {
    if (tab.types.length === 0) return documents.length;
    return documents.filter(d => tab.types.includes(d.document_type || '')).length;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico)$/i.test(lowerUrl)) return <Image className="h-4 w-4 text-blue-500" />;
    if (/\.pdf$/i.test(lowerUrl)) return <FileText className="h-4 w-4 text-red-500" />;
    if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(lowerUrl)) return <FileIcon className="h-4 w-4 text-purple-500" />;
    if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(lowerUrl)) return <FileIcon className="h-4 w-4 text-green-500" />;
    return <FileIcon className="h-4 w-4 text-gray-500" />;
  };

  const clientProcesses = processes.filter(p => p.user_id === formData.user_id);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">Documentos</h1>
              <p className="text-muted-foreground">Gerencie documentos dos clientes</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Enviar Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Enviar Documento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Cliente *</Label>
                    <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v, process_id: '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.full_name || c.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.user_id && clientProcesses.length > 0 && (
                    <div>
                      <Label>Processo (opcional)</Label>
                      <Select value={formData.process_id} onValueChange={(v) => setFormData({ ...formData, process_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vincular a um processo" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientProcesses.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.brand_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do documento</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Contrato de Serviço"
                      />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select value={formData.document_type} onValueChange={(v) => {
                        const typeLabel = documentTypes.find(t => t.value === v)?.label || '';
                        setFormData({ ...formData, document_type: v, name: typeLabel });
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.filter(t => t.value !== 'contract').map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.user_id ? (
                    <DocumentUploader 
                      userId={formData.user_id}
                      onUploadComplete={handleUploadComplete}
                    />
                  ) : (
                    <div className="p-8 border-2 border-dashed rounded-xl text-center text-muted-foreground">
                      <p>Selecione um cliente para habilitar o upload</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-48">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar cliente" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name || c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {documentTypes.filter(t => t.value !== 'contract').map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(typeFilter !== 'all' || clientFilter !== 'all') && (
              <Button variant="ghost" size="icon" onClick={() => { setTypeFilter('all'); setClientFilter('all'); }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            {tabDefinitions.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
                {tab.label}
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                  {getTabCount(tab)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Processo</TableHead>
                  <TableHead className="hidden lg:table-cell">Tamanho</TableHead>
                  <TableHead className="hidden lg:table-cell">Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        Carregando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum documento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => {
                    const typeConfig = documentTypes.find(t => t.value === doc.document_type);
                    return (
                      <TableRow key={doc.id} className="group">
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-3">
                              {getFileIcon(doc.file_url)}
                              <span className="font-medium">{doc.name}</span>
                            </div>
                            {(doc as any).protocol && (
                              <span className="text-xs text-muted-foreground ml-7">{(doc as any).protocol}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={typeConfig?.color || ''}>
                            {typeConfig?.label || doc.document_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {(doc.profiles as any)?.full_name || (doc.profiles as any)?.email || '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {(doc.brand_processes as any)?.brand_name || '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{formatFileSize(doc.file_size)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setPreviewDoc(doc); setPreviewOpen(true); }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={doc.file_url} download={doc.name} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteDocument(doc)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <DocumentPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          document={previewDoc}
        />
      </div>
    </AdminLayout>
  );
}
