import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Newspaper,
  FolderOpen,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { User } from '@supabase/supabase-js';

interface BrandProcess {
  id: string;
  brand_name: string;
  process_number: string | null;
  status: string | null;
  pipeline_stage: string | null;
  business_area: string | null;
  inpi_protocol: string | null;
  deposit_date: string | null;
  grant_date: string | null;
  expiry_date: string | null;
  next_step: string | null;
  next_step_date: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  ncl_classes: number[] | null;
}

interface ProcessEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string | null;
  rpi_number: string | null;
  created_at: string | null;
}

interface Document {
  id: string;
  name: string;
  file_url: string;
  document_type: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string | null;
}

interface RpiEntry {
  id: string;
  process_number: string;
  brand_name: string | null;
  dispatch_code: string | null;
  dispatch_text: string | null;
  dispatch_type: string | null;
  publication_date: string | null;
  holder_name: string | null;
  ncl_classes: string[] | null;
  rpi_upload_id: string;
  rpi_uploads?: {
    rpi_number: string | null;
    rpi_date: string | null;
  };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  em_andamento: { label: 'Em Andamento', variant: 'default' },
  aguardando_documentos: { label: 'Aguardando Documentos', variant: 'secondary' },
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  deferido: { label: 'Deferido', variant: 'default' },
  indeferido: { label: 'Indeferido', variant: 'destructive' },
  arquivado: { label: 'Arquivado', variant: 'outline' },
  concedido: { label: 'Concedido', variant: 'default' },
};

const pipelineConfig: Record<string, { label: string; color: string }> = {
  protocolado: { label: 'Protocolado', color: 'bg-blue-500' },
  exame_formal: { label: 'Exame Formal', color: 'bg-yellow-500' },
  publicado: { label: 'Publicado', color: 'bg-purple-500' },
  exame_merito: { label: 'Exame de Mérito', color: 'bg-orange-500' },
  deferido: { label: 'Deferido', color: 'bg-green-500' },
  concedido: { label: 'Concedido', color: 'bg-emerald-600' },
};

export default function ProcessoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [process, setProcess] = useState<BrandProcess | null>(null);
  const [events, setEvents] = useState<ProcessEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [rpiEntries, setRpiEntries] = useState<RpiEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user && id) {
      fetchProcessData();
    }
  }, [user, id]);

  const fetchProcessData = async () => {
    if (!id || !user) return;

    setLoading(true);
    try {
      // Fetch process details
      const { data: processData, error: processError } = await supabase
        .from('brand_processes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (processError) {
        console.error('Error fetching process:', processError);
        navigate('/cliente/processos');
        return;
      }

      setProcess(processData);

      // Fetch events, documents, and RPI entries in parallel
      const [eventsResult, documentsResult, rpiResult] = await Promise.all([
        supabase
          .from('process_events')
          .select('*')
          .eq('process_id', id)
          .order('event_date', { ascending: false }),
        supabase
          .from('documents')
          .select('*')
          .or(`process_id.eq.${id},user_id.eq.${user.id}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('rpi_entries')
          .select('*, rpi_uploads(rpi_number, rpi_date)')
          .eq('matched_process_id', id)
          .order('publication_date', { ascending: false })
      ]);

      if (eventsResult.data) setEvents(eventsResult.data);
      if (documentsResult.data) setDocuments(documentsResult.data);
      if (rpiResult.data) setRpiEntries(rpiResult.data as RpiEntry[]);

    } catch (error) {
      console.error('Error fetching process data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(fileUrl.replace(/^.*\/documents\//, ''));

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ClientLayout>
    );
  }

  if (!process) {
    return (
      <ClientLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Processo não encontrado</h2>
          <p className="text-muted-foreground mb-4">O processo solicitado não existe ou você não tem acesso.</p>
          <Button onClick={() => navigate('/cliente/processos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos Processos
          </Button>
        </div>
      </ClientLayout>
    );
  }

  const status = statusConfig[process.status || 'em_andamento'] || statusConfig.em_andamento;
  const pipeline = pipelineConfig[process.pipeline_stage || 'protocolado'] || pipelineConfig.protocolado;

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cliente/processos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{process.brand_name}</h1>
            <p className="text-muted-foreground">
              {process.process_number ? `Processo: ${process.process_number}` : 'Processo em andamento'}
            </p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {/* Process Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Informações do Processo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Nome da Marca</p>
                <p className="font-medium">{process.brand_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Número do Processo</p>
                <p className="font-medium">{process.process_number || 'Aguardando'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protocolo INPI</p>
                <p className="font-medium">{process.inpi_protocol || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Área de Negócio</p>
                <p className="font-medium">{process.business_area || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classes NCL</p>
                <p className="font-medium">
                  {process.ncl_classes?.length ? process.ncl_classes.join(', ') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fase Atual</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${pipeline.color}`} />
                  <span className="font-medium">{pipeline.label}</span>
                </div>
              </div>
              {process.deposit_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Depósito</p>
                  <p className="font-medium">
                    {format(new Date(process.deposit_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              )}
              {process.grant_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Concessão</p>
                  <p className="font-medium">
                    {format(new Date(process.grant_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              )}
              {process.expiry_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Validade</p>
                  <p className="font-medium">
                    {format(new Date(process.expiry_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>

            {process.next_step && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Próximo Passo</span>
                </div>
                <p className="text-sm">{process.next_step}</p>
                {process.next_step_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Previsão: {format(new Date(process.next_step_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Events, Publications, Documents */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="publications" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">Publicações RPI</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Timeline do Processo</CardTitle>
                <CardDescription>Histórico de eventos e atualizações</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum evento registrado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-primary rounded-full" />
                          {index < events.length - 1 && (
                            <div className="w-0.5 h-full bg-border flex-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{event.title}</span>
                            {event.rpi_number && (
                              <Badge variant="outline" className="text-xs">
                                RPI {event.rpi_number}
                              </Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}
                          {event.event_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(event.event_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Publications Tab */}
          <TabsContent value="publications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Publicações na Revista INPI</CardTitle>
                <CardDescription>Despachos publicados nas edições da RPI</CardDescription>
              </CardHeader>
              <CardContent>
                {rpiEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma publicação encontrada para este processo</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>RPI</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Despacho</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descrição</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rpiEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">
                              {entry.rpi_uploads?.rpi_number || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {entry.publication_date 
                                ? format(new Date(entry.publication_date), 'dd/MM/yyyy', { locale: ptBR })
                                : entry.rpi_uploads?.rpi_date
                                  ? format(new Date(entry.rpi_uploads.rpi_date), 'dd/MM/yyyy', { locale: ptBR })
                                  : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{entry.dispatch_code || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>{entry.dispatch_type || 'N/A'}</TableCell>
                            <TableCell className="max-w-md truncate">
                              {entry.dispatch_text || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Documentos Disponíveis</CardTitle>
                <CardDescription>Arquivos relacionados ao seu processo</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum documento disponível</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {doc.document_type && (
                                <Badge variant="secondary" className="text-xs">
                                  {doc.document_type}
                                </Badge>
                              )}
                              <span>{formatFileSize(doc.file_size)}</span>
                              {doc.created_at && (
                                <span>
                                  {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDownload(doc.file_url, doc.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
