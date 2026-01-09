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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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
  Cloud,
  CloudDownload,
  Globe,
  Sparkles,
  Zap,
  UserPlus,
  AlertTriangle,
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
  deadline_date?: string | null;
  priority?: 'urgent' | 'medium' | null;
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

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  company_name: string | null;
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
  
  // Remote fetch state
  const [fetchingRemote, setFetchingRemote] = useState(false);
  const [recentRpis, setRecentRpis] = useState<number[]>([]);
  const [latestRpi, setLatestRpi] = useState<number | null>(null);
  const [selectedRpiNumber, setSelectedRpiNumber] = useState<string>('');
  
  // Update dialog
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<RpiEntry | null>(null);
  const [newStage, setNewStage] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // Client assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignEntry, setAssignEntry] = useState<RpiEntry | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [availableClients, setAvailableClients] = useState<Profile[]>([]);
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [assignPriority, setAssignPriority] = useState<'urgent' | 'medium'>('medium');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchUploads();
    fetchAvailableRpis();
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedUpload) {
      fetchEntries(selectedUpload.id);
    }
  }, [selectedUpload]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_name')
      .order('full_name');
    setAvailableClients(data || []);
  };

  const fetchAvailableRpis = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-inpi-magazine`,
        {
          method: 'POST',
          body: JSON.stringify({ mode: 'list' }),
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setRecentRpis(data.recentRpis || []);
        setLatestRpi(data.latestRpi);
        setSelectedRpiNumber(data.latestRpi?.toString() || '');
      }
    } catch (error) {
      console.error('Error fetching RPI list:', error);
    }
  };

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

  const handleRemoteFetch = async (rpiNumber?: number) => {
    setFetchingRemote(true);
    
    try {
      const targetRpi = rpiNumber || parseInt(selectedRpiNumber) || latestRpi;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-inpi-magazine`,
        {
          method: 'POST',
          body: JSON.stringify({ rpiNumber: targetRpi }),
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.error === 'XML_NOT_AVAILABLE') {
          toast.info(result.message, { duration: 6000 });
        } else {
          toast.error(result.message || 'Erro ao buscar RPI');
        }
        return;
      }
      
      if (result.totalProcesses === 0) {
        toast.info(result.message, { duration: 6000 });
      } else {
        toast.success(`RPI ${result.rpiNumber} processada! ${result.totalProcesses} processos encontrados, ${result.matchedClients} clientes identificados.`);
      }
      
      // Refresh uploads and select the new one
      await fetchUploads();
      
      if (result.uploadId) {
        const { data: newUpload } = await supabase
          .from('rpi_uploads')
          .select('*')
          .eq('id', result.uploadId)
          .single();
        
        if (newUpload) {
          setSelectedUpload(newUpload);
          await fetchEntries(newUpload.id);
        }
      }
      
    } catch (error) {
      console.error('Remote fetch error:', error);
      toast.error('Erro ao buscar RPI do portal INPI');
    } finally {
      setFetchingRemote(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'xml', 'xlsx', 'xls'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !allowedExtensions.includes(ext)) {
      toast.error('Envie um arquivo .pdf, .xml, .xlsx ou .xls');
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

      toast.success('Arquivo enviado! Iniciando análise...');
      setSelectedUpload(rpiUpload);
      setUploads(prev => [rpiUpload, ...prev]);

      // Process the file using signed URL
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

      if (response.status === 429) {
        toast.error('Limite de requisições excedido. Aguarde alguns minutos e tente novamente.');
        await fetchUploads();
        return;
      }

      if (response.status === 402) {
        toast.error('Créditos de IA esgotados. Adicione créditos para continuar.');
        await fetchUploads();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Erro ao processar arquivo');
      }

      const result = await response.json();
      
      if (result.total_processes === 0) {
        toast.info(result.summary || 'Nenhum processo do procurador foi encontrado nesta edição.', {
          duration: 6000,
        });
      } else {
        toast.success(`Análise concluída! ${result.total_processes} processos encontrados, ${result.matched_clients} clientes identificados.`);
      }
      
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
      toast.error(error instanceof Error ? error.message : 'Erro ao processar revista. Verifique se o arquivo está correto.');
      
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

  const handleOpenAssignDialog = (entry: RpiEntry) => {
    setAssignEntry(entry);
    setClientSearch('');
    setSelectedClient(null);
    setAssignPriority('medium');
    setAssignDialogOpen(true);
  };

  const filteredClients = availableClients.filter(client => {
    if (!clientSearch) return true;
    const search = clientSearch.toLowerCase();
    return (
      client.full_name?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.company_name?.toLowerCase().includes(search)
    );
  });

  const handleAssignClient = async () => {
    if (!assignEntry || !selectedClient) return;

    setAssigning(true);

    try {
      // Calculate deadline (60 days from now)
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 60);

      // Update the RPI entry with client assignment
      const { error: entryError } = await supabase
        .from('rpi_entries')
        .update({
          matched_client_id: selectedClient.id,
          update_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignEntry.id);

      if (entryError) throw entryError;

      // Create notification for the client
      await supabase.from('notifications').insert({
        user_id: selectedClient.id,
        title: assignPriority === 'urgent' ? '🚨 URGENTE: Nova Publicação INPI' : 'Nova Publicação INPI',
        message: `Uma publicação referente ao processo ${assignEntry.process_number} (${assignEntry.brand_name || 'Marca'}) foi vinculada ao seu perfil. Prazo: 60 dias para cumprimento.`,
        type: assignPriority === 'urgent' ? 'warning' : 'info',
        link: '/cliente/processos',
      });

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('client_activities').insert({
        user_id: selectedClient.id,
        admin_id: user?.id,
        activity_type: 'rpi_publication',
        description: `Publicação RPI vinculada: ${assignEntry.brand_name} - ${assignEntry.dispatch_type}. Prioridade: ${assignPriority === 'urgent' ? 'Urgente' : 'Média'}. Prazo: 60 dias.`,
        metadata: {
          process_number: assignEntry.process_number,
          dispatch_code: assignEntry.dispatch_code,
          dispatch_text: assignEntry.dispatch_text,
          deadline_date: deadlineDate.toISOString(),
          priority: assignPriority,
        },
      });

      toast.success(`Publicação vinculada ao cliente ${selectedClient.full_name || selectedClient.email}!`);
      setAssignDialogOpen(false);

      // Refresh entries
      if (selectedUpload) {
        await fetchEntries(selectedUpload.id);
      }

    } catch (error) {
      console.error('Assign error:', error);
      toast.error('Erro ao vincular cliente');
    } finally {
      setAssigning(false);
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
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {uploading || processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? 'Enviando...' : processing ? 'Analisando...' : 'Upload Manual'}
            </Label>
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf,.xml,.xlsx,.xls"
              onChange={handleFileUpload}
              disabled={uploading || processing}
              className="hidden"
            />
          </div>
        </div>

        {/* Remote Fetch Card - Main Feature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Busca Remota - Portal INPI
                <Badge variant="secondary" className="ml-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Automático
                </Badge>
              </CardTitle>
              <CardDescription>
                Baixe e processe a Revista INPI diretamente do portal oficial com um clique
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="rpi-select">Selecionar edição da RPI</Label>
                  <div className="flex gap-2">
                    <Select value={selectedRpiNumber} onValueChange={setSelectedRpiNumber}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Selecione a RPI" />
                      </SelectTrigger>
                      <SelectContent>
                        {recentRpis.map(rpi => (
                          <SelectItem key={rpi} value={rpi.toString()}>
                            RPI {rpi} {rpi === latestRpi && '(Última)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      onClick={() => handleRemoteFetch()}
                      disabled={fetchingRemote || !selectedRpiNumber}
                      className="gap-2"
                    >
                      {fetchingRemote ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CloudDownload className="h-4 w-4" />
                      )}
                      Buscar RPI
                    </Button>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <Button
                    onClick={() => handleRemoteFetch(latestRpi || undefined)}
                    disabled={fetchingRemote || !latestRpi}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                  >
                    {fetchingRemote ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Zap className="h-5 w-5" />
                    )}
                    Buscar Última RPI {latestRpi && `(${latestRpi})`}
                  </Button>
                </div>
              </div>
              
              {latestRpi && (
                <p className="text-xs text-muted-foreground mt-3">
                  A RPI é publicada toda terça-feira. Última edição estimada: RPI {latestRpi}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Processing Indicator */}
        <AnimatePresence>
          {(processing || fetchingRemote) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      {fetchingRemote ? (
                        <Cloud className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {fetchingRemote ? 'Baixando RPI do portal INPI...' : 'Analisando revista do INPI...'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Extraindo processos do procurador Davilys Danques Oliveira Cunha
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        {fetchingRemote ? (
                          <>
                            <p>✓ Conectando ao portal INPI...</p>
                            <p>✓ Baixando arquivo XML da revista...</p>
                            <p>✓ Processando dados estruturados...</p>
                          </>
                        ) : (
                          <>
                            <p>✓ Identificando formato do arquivo (PDF/XML/Excel)</p>
                            <p>✓ Aplicando OCR se necessário para PDFs digitalizados</p>
                            <p>✓ Buscando variações do nome do procurador</p>
                            <p>✓ Extraindo dados completos de cada processo de MARCA</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        {selectedUpload && selectedUpload.status === 'completed' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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
            </motion.div>
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
                    {upload.file_path?.startsWith('remote/') ? (
                      <Cloud className="h-3 w-3" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
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
              <ScrollArea className="h-[600px] w-full">
                <div className="min-w-[1100px]">
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
                    {filteredEntries.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-muted/50"
                      >
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
                            <div className="text-sm">
                              <span className="font-medium text-foreground">Despacho: </span>
                              <span className="text-muted-foreground">
                                {entry.dispatch_text || entry.dispatch_type || 'Sem descrição'}
                              </span>
                            </div>
                            {entry.dispatch_code && (
                              <span className="text-xs text-muted-foreground/70 font-mono">
                                ({entry.dispatch_code})
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAssignDialog(entry)}
                              className="gap-1.5 text-xs"
                            >
                              <Users className="h-3 w-3" />
                              Vincular Cliente
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.update_status === 'updated' ? (
                            <div className="space-y-1">
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Atualizado
                              </Badge>
                            </div>
                          ) : entry.matched_client_id ? (
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950">
                                <Clock className="h-3 w-3 mr-1" />
                                60 dias
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Aguardando
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
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
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                    {filteredEntries.length === 0 && !processing && !fetchingRemote && (
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
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && uploads.length === 0 && !processing && !fetchingRemote && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma revista processada</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Use a busca remota para baixar a RPI diretamente do portal INPI ou faça upload manual do arquivo.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => handleRemoteFetch(latestRpi || undefined)}
                  disabled={!latestRpi}
                  className="gap-2"
                >
                  <CloudDownload className="h-5 w-5" />
                  Buscar Última RPI
                </Button>
                <Label
                  htmlFor="pdf-upload-empty"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/80 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  Upload Manual
                </Label>
                <Input
                  id="pdf-upload-empty"
                  type="file"
                  accept=".pdf,.xml,.xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
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
                    Etapa sugerida automaticamente com base no despacho
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProcess} disabled={updating || !newStage}>
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Atualização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Client Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Vincular Cliente à Publicação
            </DialogTitle>
            <DialogDescription>
              Selecione o cliente para vincular a esta publicação RPI. O cliente será notificado com prazo de 60 dias.
            </DialogDescription>
          </DialogHeader>

          {assignEntry && (
            <div className="space-y-4">
              {/* Publication Info */}
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Marca</span>
                  <span className="font-semibold">{assignEntry.brand_name || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Processo</span>
                  <span className="font-mono">{assignEntry.process_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Titular</span>
                  <span className="text-sm">{assignEntry.holder_name || '-'}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-sm text-muted-foreground">Despacho</span>
                  <div className="text-right">
                    {getDispatchBadge(assignEntry.dispatch_type)}
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                      {assignEntry.dispatch_text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Search */}
              <div className="space-y-2">
                <Label>Buscar Cliente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite nome, email ou empresa..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Client List */}
              <div className="space-y-2">
                <Label>Selecionar Cliente</Label>
                <ScrollArea className="h-[200px] border rounded-lg p-2">
                  {filteredClients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {clientSearch ? 'Nenhum cliente encontrado' : 'Digite para buscar clientes'}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredClients.slice(0, 20).map(client => (
                        <div
                          key={client.id}
                          onClick={() => setSelectedClient(client)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedClient?.id === client.id
                              ? 'bg-primary/10 border border-primary'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div className="font-medium text-sm">
                            {client.full_name || client.company_name || 'Sem nome'}
                          </div>
                          <div className="text-xs text-muted-foreground">{client.email}</div>
                          {client.company_name && client.full_name && (
                            <div className="text-xs text-muted-foreground">{client.company_name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={assignPriority === 'medium' ? 'default' : 'outline'}
                    onClick={() => setAssignPriority('medium')}
                    className="flex-1 gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Média
                  </Button>
                  <Button
                    type="button"
                    variant={assignPriority === 'urgent' ? 'destructive' : 'outline'}
                    onClick={() => setAssignPriority('urgent')}
                    className="flex-1 gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Urgente
                  </Button>
                </div>
              </div>

              {/* Deadline Info */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="font-medium text-sm text-amber-800 dark:text-amber-200">
                    Prazo: 60 dias para cumprimento
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    O cliente será notificado automaticamente
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignClient} 
              disabled={assigning || !selectedClient}
              className="gap-2"
            >
              {assigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Vincular Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
