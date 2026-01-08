import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Upload, FileText, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  file_url: string;
  document_type: string | null;
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
  { value: 'contrato', label: 'Contrato' },
  { value: 'procuracao', label: 'Procuração' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'comprovante', label: 'Comprovante' },
  { value: 'parecer', label: 'Parecer INPI' },
  { value: 'outros', label: 'Outros' },
];

export default function AdminDocumentos() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    document_type: 'outros',
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !formData.user_id) {
      toast.error('Selecione um arquivo e um cliente');
      return;
    }

    setUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${formData.user_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('documents').insert({
        name: formData.name || selectedFile.name,
        file_url: urlData.publicUrl,
        document_type: formData.document_type,
        file_size: selectedFile.size,
        user_id: formData.user_id,
        process_id: formData.process_id || null,
        uploaded_by: 'admin',
      });

      if (insertError) throw insertError;

      toast.success('Documento enviado com sucesso');
      fetchDocuments();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar documento');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', document_type: 'outros', user_id: '', process_id: '' });
    setSelectedFile(null);
  };

  const filteredDocuments = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.profiles as any)?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    (d.brand_processes as any)?.brand_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const clientProcesses = processes.filter(p => p.user_id === formData.user_id);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Documentos</h1>
            <p className="text-muted-foreground">Gerencie documentos dos clientes</p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Enviar Documento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Label>Cliente *</Label>
                    <Select value={formData.user_id} onValueChange={(v) => setFormData({ ...formData, user_id: v, process_id: '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
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
                      <Select value={formData.document_type} onValueChange={(v) => setFormData({ ...formData, document_type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Arquivo *</Label>
                    <div className="mt-1">
                      <label className="flex items-center justify-center w-full h-32 px-4 transition bg-muted border-2 border-dashed rounded-lg cursor-pointer hover:border-primary">
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <span className="mt-2 text-sm text-muted-foreground">
                            {selectedFile ? selectedFile.name : 'Clique para selecionar'}
                          </span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? 'Enviando...' : 'Enviar Documento'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
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
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted">
                          {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                        </span>
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
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
