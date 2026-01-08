import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  Users, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Loader2,
  BookOpen,
  Filter,
  Download,
  Eye,
  ArrowRight,
  Clock,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RpiUpload {
  id: string;
  file_name: string;
  file_path: string;
  rpi_date: string | null;
  rpi_number: string | null;
  total_processes_found: number;
  total_clients_matched: number;
  status: string;
  summary: string | null;
  processed_at: string | null;
  created_at: string;
}

interface RpiEntry {
  id: string;
  process_number: string;
  brand_name: string | null;
  ncl_classes: string[] | null;
  dispatch_type: string | null;
  dispatch_code: string | null;
  dispatch_text: string | null;
  publication_date: string | null;
  holder_name: string | null;
  matched_client_id: string | null;
  matched_process_id: string | null;
  update_status: string;
  client?: {
    full_name: string | null;
    email: string;
    company_name: string | null;
  };
  process?: {
    pipeline_stage: string | null;
    status: string | null;
  };
}

const PIPELINE_STAGES = [
  { value: 'protocolado', label: 'Protocolado' },
  { value: '003', label: '003 - Exigência' },
  { value: 'oposicao', label: 'Oposição' },
  { value: 'indeferimento', label: 'Indeferimento' },
  { value: 'notificacao_extrajudicial', label: 'Notificação Extrajudicial' },
  { value: 'deferimento', label: 'Deferimento' },
  { value: 'certificados', label: 'Certificados' },
  { value: 'renovacao', label: 'Renovação' },
  { value: 'distrato', label: 'Distrato' },
];

function getDispatchBadge(dispatchType: string | null) {
  const type = (dispatchType || '').toLowerCase();
  
  if (type.includes('deferido') || type.includes('deferimento')) {
    return <Badge className="bg-green-100 text-green-800">Deferimento</Badge>;
  }
  if (type.includes('indeferido') || type.includes('indeferimento')) {
    return <Badge className="bg-red-100 text-red-800">Indeferimento</Badge>;
  }
  if (type.includes('exigência') || type.includes('exigencia')) {
    return <Badge className="bg-yellow-100 text-yellow-800">Exigência</Badge>;
  }
  if (type.includes('oposição') || type.includes('oposicao')) {
    return <Badge className="bg-orange-100 text-orange-800">Oposição</Badge>;
  }
  if (type.includes('certificado')) {
    return <Badge className="bg-blue-100 text-blue-800">Certificado</Badge>;
  }
  
  return <Badge variant="outline">{dispatchType || 'Outro'}</Badge>;
}

function suggestStage(dispatchCode: string | null, dispatchText: string | null): string {
  const code = (dispatchCode || '').toUpperCase();
  const text = (dispatchText || '').toLowerCase();
  
  if (text.includes('deferido') || text.includes('deferimento')) return 'deferimento';
  if (text.includes('indeferido') || text.includes('indeferimento')) return 'indeferimento';
  if (text.includes('exigência') || text.includes('exigencia')) return '003';
  if (text.includes('oposição') || text.includes('oposicao')) return 'oposicao';
  if (text.includes('certificado') || text.includes('concessão')) return 'certificados';
  if (text.includes('renovação') || text.includes('prorrogação')) return 'renovacao';
  
  return 'protocolado';
}

export default function RevistaINPI() {
  const [uploads, setUploads] = useState<RpiUpload[]>([]);
  const [entries, setEntries] = useState<RpiEntry[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<RpiUpload | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMatched, setFilterMatched] = useState<'all' | 'matched' | 'unmatched'>('all');
  
  // Update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<RpiEntry | null>(null);
  const [newStage, setNewStage] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, []);

  useEffect(() => {
    if (selectedUpload) {
      fetchEntries(selectedUpload.id);
    }
  }, [selectedUpload]);

  const fetchUploads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rpi_uploads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar uploads');
      console.error(error);
    } else {
      setUploads(data || []);
      if (data && data.length > 0 && !selectedUpload) {
        setSelectedUpload(data[0]);
      }
    }
    setLoading(false);
  };

  const fetchEntries = async (uploadId: string) => {
    const { data, error } = await supabase
      .from('rpi_entries')
      .select('*')
      .eq('rpi_upload_id', uploadId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar entradas');
      console.error(error);
      return;
    }

    // Fetch related client and process data
    const entriesWithDetails = await Promise.all(
      (data || []).map(async (entry) => {
        let client = null;
        let process = null;

        if (entry.matched_client_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email, company_name')
            .eq('id', entry.matched_client_id)
            .single();
          client = profileData;
        }

        if (entry.matched_process_id) {
          const { data: processData } = await supabase
            .from('brand_processes')
            .select('pipeline_stage, status')
            .eq('id', entry.matched_process_id)
            .single();
          process = processData;
        }

        return { ...entry, client, process };
      })
    );

    setEntries(entriesWithDetails);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileName = `rpi_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`rpi/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Get signed URL for the uploaded file (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(uploadData.path, 3600);

      if (signedUrlError) throw signedUrlError;

      // Create RPI upload record
      const { data: rpiUpload, error: insertError } = await supabase
        .from('rpi_uploads')
        .insert({
          file_name: file.name,
          file_path: uploadData.path,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('PDF enviado! Iniciando análise...');
      setSelectedUpload(rpiUpload);
      setUploads(prev => [rpiUpload, ...prev]);

      // Process the PDF using signed URL (not file upload)
      await processRpi(rpiUpload.id, signedUrlData.signedUrl);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const processRpi = async (rpiUploadId: string, fileUrl: string) => {
    setProcessing(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-rpi`,
        {
          method: 'POST',
          body: JSON.stringify({ rpiUploadId, fileUrl }),
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar PDF');
      }

      const result = await response.json();
      toast.success(`Análise concluída! ${result.total_processes} processos encontrados, ${result.matched_clients} clientes identificados.`);
      
      // Refresh uploads list
      const { data: updatedUploads } = await supabase
        .from('rpi_uploads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (updatedUploads) {
        setUploads(updatedUploads);
        // Find the newly processed upload and select it
        const processedUpload = updatedUploads.find(u => u.id === rpiUploadId);
        if (processedUpload) {
          setSelectedUpload(processedUpload);
          // Immediately fetch and display entries
          await fetchEntries(rpiUploadId);
        }
      }
      
    } catch (error) {
      console.error('Process error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar revista');
      
      // Update status to error
      await supabase
        .from('rpi_uploads')
        .update({ status: 'error' })
        .eq('id', rpiUploadId);
      
      await fetchUploads();
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenUpdateDialog = (entry: RpiEntry) => {
    setSelectedEntry(entry);
    setNewStage(suggestStage(entry.dispatch_code, entry.dispatch_text));
    setUpdateDialogOpen(true);
  };

  const handleUpdateProcess = async () => {
    if (!selectedEntry || !newStage) return;

    setUpdating(true);

    try {
      // Update the brand process
      if (selectedEntry.matched_process_id) {
        const { error: processError } = await supabase
          .from('brand_processes')
          .update({
            pipeline_stage: newStage,
            status: 'em_andamento',
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedEntry.matched_process_id);

        if (processError) throw processError;
      }

      // Mark entry as updated
      const { error: entryError } = await supabase
        .from('rpi_entries')
        .update({
          update_status: 'updated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedEntry.id);

      if (entryError) throw entryError;

      // Create notification for client
      if (selectedEntry.matched_client_id) {
        await supabase.from('notifications').insert({
          user_id: selectedEntry.matched_client_id,
          title: 'Atualização do Processo',
          message: `Seu processo da marca "${selectedEntry.brand_name}" foi atualizado com base na RPI.`,
          type: 'info',
          link: '/cliente/processos',
        });

        // Log activity
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('client_activities').insert({
          user_id: selectedEntry.matched_client_id,
          admin_id: user?.id,
          activity_type: 'process_update',
          description: `Processo atualizado via RPI para etapa: ${PIPELINE_STAGES.find(s => s.value === newStage)?.label}`,
        });
      }

      toast.success('Processo atualizado com sucesso!');
      setUpdateDialogOpen(false);
      
      // Refresh entries
      if (selectedUpload) {
        await fetchEntries(selectedUpload.id);
      }
      
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Erro ao atualizar processo');
    } finally {
      setUpdating(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.process_number?.includes(searchTerm) ||
      entry.holder_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterMatched === 'all' ||
      (filterMatched === 'matched' && entry.matched_client_id) ||
      (filterMatched === 'unmatched' && !entry.matched_client_id);

    return matchesSearch && matchesFilter;
  });

  const matchedEntries = entries.filter(e => e.matched_client_id);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              Revista INPI
            </h1>
            <p className="text-muted-foreground">
              Análise automática da Revista da Propriedade Industrial
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Label
              htmlFor="pdf-upload"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                uploading || processing
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {uploading || processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? 'Enviando...' : processing ? 'Analisando...' : 'Enviar PDF da Revista'}
            </Label>
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading || processing}
              className="hidden"
            />
          </div>
        </div>

        {/* Processing Indicator */}
        {processing && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <BookOpen className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <h3 className="font-semibold">Analisando revista do INPI...</h3>
                  <p className="text-sm text-muted-foreground">
                    Extraindo processos do procurador Davilys Danques Oliveira Cunha
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {selectedUpload && selectedUpload.status === 'completed' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data da RPI</p>
                    <p className="text-lg font-semibold">
                      {selectedUpload.rpi_date 
                        ? format(new Date(selectedUpload.rpi_date), "dd/MM/yyyy", { locale: ptBR })
                        : 'Não identificada'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nº da RPI</p>
                    <p className="text-lg font-semibold">
                      {selectedUpload.rpi_number || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Processos Encontrados</p>
                    <p className="text-lg font-semibold">
                      {selectedUpload.total_processes_found}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clientes WebMarcas</p>
                    <p className="text-lg font-semibold">
                      {selectedUpload.total_clients_matched}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Summary Text */}
        {selectedUpload?.summary && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumo da Análise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{selectedUpload.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* History Selector */}
        {uploads.length > 1 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Histórico de Revistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {uploads.map(upload => (
                  <Button
                    key={upload.id}
                    variant={selectedUpload?.id === upload.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedUpload(upload)}
                    className="gap-2"
                  >
                    <FileText className="h-3 w-3" />
                    {upload.rpi_number || format(new Date(upload.created_at), "dd/MM/yy")}
                    {upload.status === 'completed' && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {upload.total_processes_found}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entries Table - Show after processing or when upload is completed */}
        {selectedUpload && (selectedUpload.status === 'completed' || entries.length > 0) && (
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Processos Identificados na RPI
                  </CardTitle>
                  <CardDescription>
                    {matchedEntries.length > 0 
                      ? `${matchedEntries.length} de ${entries.length} processos correspondem a clientes WebMarcas`
                      : `${entries.length} processos encontrados`}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar marca, processo..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>

                  <Select value={filterMatched} onValueChange={(v: any) => setFilterMatched(v)}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="matched">Clientes WebMarcas</SelectItem>
                      <SelectItem value="unmatched">Não identificados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Marca</TableHead>
                      <TableHead className="w-[130px]">Nº Processo</TableHead>
                      <TableHead className="w-[80px]">Classe</TableHead>
                      <TableHead className="w-[250px]">O que saiu (Despacho)</TableHead>
                      <TableHead className="w-[180px]">Cliente</TableHead>
                      <TableHead className="w-[100px]">Situação</TableHead>
                      <TableHead className="text-right w-[100px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map(entry => (
                      <TableRow key={entry.id} className="group hover:bg-muted/50">
                        <TableCell>
                          <div className="font-semibold text-foreground">{entry.brand_name || '-'}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">{entry.holder_name}</div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {entry.process_number}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {entry.ncl_classes?.join(', ') || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            {getDispatchBadge(entry.dispatch_type)}
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {entry.dispatch_text || 'Sem descrição do despacho'}
                            </p>
                            {entry.dispatch_code && (
                              <span className="text-xs text-muted-foreground font-mono">
                                Código: {entry.dispatch_code}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.matched_client_id ? (
                            <div className="flex items-start gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-sm text-foreground">
                                  {entry.client?.full_name || entry.client?.company_name || 'Cliente'}
                                </div>
                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {entry.client?.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <div className="h-2 w-2 rounded-full bg-gray-300" />
                              <span className="text-sm italic">Não identificado</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.update_status === 'updated' ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Atualizado
                            </Badge>
                          ) : entry.matched_client_id ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendente
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              N/A
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.matched_client_id && entry.update_status !== 'updated' && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenUpdateDialog(entry)}
                              className="gap-1.5"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Atualizar
                            </Button>
                          )}
                          {entry.update_status === 'updated' && (
                            <Button size="sm" variant="ghost" disabled className="text-green-600">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEntries.length === 0 && !processing && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-muted-foreground">Nenhum processo encontrado</p>
                          {searchTerm && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Tente buscar com termos diferentes
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && uploads.length === 0 && !processing && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma revista processada</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Faça upload do PDF da Revista da Propriedade Industrial (RPI) para analisar automaticamente
                os processos do procurador Davilys Danques Oliveira Cunha.
              </p>
              <Label
                htmlFor="pdf-upload-empty"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-5 w-5" />
                Enviar PDF da Revista INPI
              </Label>
              <Input
                id="pdf-upload-empty"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}
      </div>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Atualizar Processo
            </DialogTitle>
            <DialogDescription>
              Confirme a atualização do processo com base na publicação da RPI.
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-4">
              {/* Process Info */}
              <div className="rounded-lg bg-muted p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Marca</span>
                  <span className="font-semibold">{selectedEntry.brand_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Processo</span>
                  <span className="font-mono">{selectedEntry.process_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Despacho</span>
                  {getDispatchBadge(selectedEntry.dispatch_type)}
                </div>
                {selectedEntry.client && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cliente</span>
                    <span className="font-medium">{selectedEntry.client.full_name || selectedEntry.client.company_name}</span>
                  </div>
                )}
              </div>

              {/* Stage Selection */}
              <div className="space-y-2">
                <Label>Etapa do Funil</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    {selectedEntry.process?.pipeline_stage && (
                      <Badge variant="outline" className="mb-2">
                        Atual: {PIPELINE_STAGES.find(s => s.value === selectedEntry.process?.pipeline_stage)?.label || selectedEntry.process.pipeline_stage}
                      </Badge>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <Select value={newStage} onValueChange={setNewStage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Nova etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map(stage => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {suggestStage(selectedEntry.dispatch_code, selectedEntry.dispatch_text) === newStage && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Sugestão automática baseada no despacho
                  </p>
                )}
              </div>

              {/* Actions Info */}
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <p className="font-medium text-foreground">Ações ao confirmar:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Atualizar fase do cliente no Kanban
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Atualizar status do processo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Notificar cliente sobre atualização
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Registrar histórico (data + admin)
                  </li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProcess} disabled={updating || !newStage}>
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Atualização
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
