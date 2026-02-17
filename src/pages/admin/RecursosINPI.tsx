import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, Upload, Loader2, Edit3, Check, Download, Printer, FileCheck, 
  History, Plus, Eye, Search, X, Calendar, Scale, Shield, Gavel, 
  AlertTriangle, FileWarning, Sparkles, ArrowRight, Brain, Zap,
  BarChart3, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { INPIResourcePDFPreview } from '@/components/admin/INPIResourcePDFPreview';
import { INPILegalChatDialog } from '@/components/admin/inpi/INPILegalChatDialog';
import { motion, AnimatePresence } from 'framer-motion';

interface ExtractedData {
  process_number: string;
  brand_name: string;
  ncl_class: string;
  holder: string;
  examiner_or_opponent: string;
  legal_basis: string;
}

interface INPIResource {
  id: string;
  resource_type: string;
  process_number: string | null;
  brand_name: string | null;
  ncl_class: string | null;
  holder: string | null;
  status: string;
  draft_content: string | null;
  final_content: string | null;
  created_at: string;
  approved_at: string | null;
}

type Step = 'list' | 'select-type' | 'upload' | 'processing' | 'review' | 'approved';

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  indeferimento: 'Recurso contra Indeferimento',
  exigencia_merito: 'Exigência de Mérito',
  oposicao: 'Manifestação à Oposição'
};

const RESOURCE_TYPE_CONFIG: Record<string, { icon: typeof Gavel; color: string; gradient: string; description: string }> = {
  indeferimento: {
    icon: XCircle,
    color: 'text-red-500',
    gradient: 'from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40',
    description: 'Para marcas que tiveram o pedido indeferido pelo INPI. A IA analisará o fundamento e elaborará defesa robusta.'
  },
  exigencia_merito: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    gradient: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40',
    description: 'Para atender exigências técnicas formuladas pelo INPI com argumentação jurídica precisa e fundamentada.'
  },
  oposicao: {
    icon: Shield,
    color: 'text-blue-500',
    gradient: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40',
    description: 'Para responder a oposições de terceiros contra a marca com análise comparativa detalhada.'
  }
};

const STEPS_FLOW = [
  { key: 'select-type', label: 'Tipo', icon: Gavel },
  { key: 'upload', label: 'Documento', icon: Upload },
  { key: 'processing', label: 'IA Analisando', icon: Brain },
  { key: 'review', label: 'Revisão', icon: Edit3 },
  { key: 'approved', label: 'Aprovado', icon: CheckCircle2 },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: 'easeOut' as const }
};

export default function RecursosINPI() {
  const [step, setStep] = useState<Step>('list');
  const [resourceType, setResourceType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [draftContent, setDraftContent] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [currentResourceId, setCurrentResourceId] = useState<string | null>(null);
  const [resources, setResources] = useState<INPIResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedResource, setSelectedResource] = useState<INPIResource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [showLegalChat, setShowLegalChat] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchResources(); }, []);

  // Processing animation
  useEffect(() => {
    if (step === 'processing') {
      setProcessingProgress(0);
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 8;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [step]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('inpi_resources')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Erro ao carregar recursos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Por favor, selecione um arquivo PDF');
        return;
      }
      setFile(selectedFile);
      setStep('upload');
    }
  };

  const processDocument = async () => {
    if (!file || !resourceType) return;
    setIsProcessing(true);
    setStep('processing');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const fileBase64 = await base64Promise;

      const { data, error } = await supabase.functions.invoke('process-inpi-resource', {
        body: { fileBase64, fileType: file.type, resourceType }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro ao processar documento');

      setExtractedData(data.extracted_data);
      setDraftContent(data.resource_content);

      const { data: { user } } = await supabase.auth.getUser();

      const { data: insertedResource, error: insertError } = await supabase
        .from('inpi_resources')
        .insert({
          user_id: user?.id,
          resource_type: resourceType,
          process_number: data.extracted_data?.process_number,
          brand_name: data.extracted_data?.brand_name,
          ncl_class: data.extracted_data?.ncl_class,
          holder: data.extracted_data?.holder,
          examiner_or_opponent: data.extracted_data?.examiner_or_opponent,
          legal_basis: data.extracted_data?.legal_basis,
          draft_content: data.resource_content,
          status: 'pending_review'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setCurrentResourceId(insertedResource.id);
      setProcessingProgress(100);
      setTimeout(() => setStep('review'), 500);
      toast.success('Documento processado com sucesso!');
    } catch (error) {
      console.error('Error processing document:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar documento');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustResource = async () => {
    if (!adjustmentNotes.trim()) {
      toast.error('Por favor, descreva os ajustes desejados');
      return;
    }
    setIsAdjusting(true);

    try {
      const { data, error } = await supabase.functions.invoke('adjust-inpi-resource', {
        body: { currentContent: draftContent, adjustmentInstructions: adjustmentNotes }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro ao ajustar recurso');

      setDraftContent(data.adjusted_content);

      if (currentResourceId) {
        await supabase
          .from('inpi_resources')
          .update({ draft_content: data.adjusted_content })
          .eq('id', currentResourceId);
      }

      setAdjustmentNotes('');
      toast.success('Recurso ajustado com sucesso!');
    } catch (error) {
      console.error('Error adjusting resource:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao ajustar recurso');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleApproveResource = async () => {
    if (!currentResourceId) return;
    try {
      await supabase
        .from('inpi_resources')
        .update({ final_content: draftContent, status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', currentResourceId);
      setStep('approved');
      toast.success('Recurso aprovado! Você pode gerar o PDF agora.');
      fetchResources();
    } catch (error) {
      console.error('Error approving resource:', error);
      toast.error('Erro ao aprovar recurso');
    }
  };

  const resetFlow = () => {
    setStep('list');
    setResourceType('');
    setFile(null);
    setExtractedData(null);
    setDraftContent('');
    setAdjustmentNotes('');
    setCurrentResourceId(null);
    setSelectedResource(null);
    setProcessingProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Rascunho</Badge>;
      case 'pending_review': return <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-600 bg-amber-500/10"><Edit3 className="h-3 w-3" /> Em Revisão</Badge>;
      case 'approved': return <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="h-3 w-3" /> Aprovado</Badge>;
      case 'finalized': return <Badge className="gap-1 bg-blue-600 hover:bg-blue-700"><FileCheck className="h-3 w-3" /> Finalizado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredResources = resources.filter((resource) => {
    const matchesQuery = !searchQuery || 
      resource.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.process_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !searchDate || format(new Date(resource.created_at), 'yyyy-MM-dd') === searchDate;
    return matchesQuery && matchesDate;
  });

  const stats = {
    total: resources.length,
    approved: resources.filter(r => r.status === 'approved').length,
    pending: resources.filter(r => r.status === 'pending_review').length,
    draft: resources.filter(r => r.status === 'draft').length,
  };

  const currentStepIndex = STEPS_FLOW.findIndex(s => s.key === step);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Premium Header */}
        <motion.div {...fadeIn} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/10 p-6 md:p-8">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                <Scale className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recursos INPI</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Geração inteligente de recursos administrativos com IA Jurídica Especializada
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {step === 'list' ? (
                <Button onClick={() => setStep('select-type')} size="lg" className="gap-2 shadow-lg shadow-primary/20 rounded-xl">
                  <Sparkles className="h-4 w-4" />
                  Criar Recurso com IA
                </Button>
              ) : (
                <Button variant="outline" onClick={resetFlow} className="gap-2 rounded-xl">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  Voltar à Lista
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        {step === 'list' && (
          <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total de Recursos', value: stats.total, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Aprovados', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Em Revisão', value: stats.pending, icon: Edit3, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Rascunhos', value: stats.draft, icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
            ].map((stat, i) => (
              <Card key={i} className="border-border/50 hover:border-border transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Step Indicator */}
        {step !== 'list' && (
          <motion.div {...fadeIn} className="flex items-center justify-center gap-1 md:gap-2 py-2">
            {STEPS_FLOW.map((s, i) => {
              const isActive = s.key === step;
              const isPast = i < currentStepIndex;
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-1 md:gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' :
                    isPast ? 'bg-primary/15 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{s.label}</span>
                  </div>
                  {i < STEPS_FLOW.length - 1 && (
                    <div className={`w-4 md:w-8 h-0.5 rounded-full transition-colors ${
                      isPast ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* LIST */}
        <AnimatePresence mode="wait">
          {step === 'list' && (
            <motion.div key="list" {...fadeIn}>
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-primary" />
                    Histórico de Recursos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar por marca ou processo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 rounded-xl"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="pl-9 w-full sm:w-44 rounded-xl" />
                      {searchDate && (
                        <button onClick={() => setSearchDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Carregando recursos...</p>
                    </div>
                  ) : filteredResources.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        {resources.length === 0 ? 'Nenhum recurso criado ainda.' : 'Nenhum resultado encontrado.'}
                      </p>
                      {resources.length === 0 && (
                        <Button variant="outline" onClick={() => setStep('select-type')} className="gap-2 rounded-xl">
                          <Plus className="h-4 w-4" />
                          Criar primeiro recurso
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Marca</TableHead>
                            <TableHead className="font-semibold">Processo</TableHead>
                            <TableHead className="font-semibold">Tipo</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Data</TableHead>
                            <TableHead className="font-semibold text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredResources.map((resource) => (
                            <TableRow key={resource.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium">{resource.brand_name || '-'}</TableCell>
                              <TableCell className="font-mono text-sm">{resource.process_number || '-'}</TableCell>
                              <TableCell>
                                <span className="text-sm">{RESOURCE_TYPE_LABELS[resource.resource_type] || resource.resource_type}</span>
                              </TableCell>
                              <TableCell>{getStatusBadge(resource.status)}</TableCell>
                              <TableCell className="text-sm">{format(new Date(resource.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="gap-1.5 rounded-lg" onClick={() => { setSelectedResource(resource); setShowPDFPreview(true); }}>
                                  <Eye className="h-4 w-4" />
                                  Visualizar
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* SELECT TYPE */}
          {step === 'select-type' && (
            <motion.div key="select-type" {...fadeIn} className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Qual tipo de recurso deseja gerar?</h2>
                <p className="text-muted-foreground text-sm mt-1">Selecione o tipo e a IA elaborará o recurso administrativo completo</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(RESOURCE_TYPE_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = resourceType === key;
                  return (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setResourceType(key)}
                      className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all bg-gradient-to-br ${config.gradient} ${
                        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-primary/50' : ''
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                      <div className={`h-12 w-12 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center mb-4 ${config.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-base mb-2">{RESOURCE_TYPE_LABELS[key]}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{config.description}</p>
                    </motion.div>
                  );
                })}
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={!resourceType} 
                  size="lg"
                  className="w-full gap-3 rounded-xl shadow-lg shadow-primary/15 h-14 text-base"
                >
                  <Upload className="h-5 w-5" />
                  Continuar e Anexar PDF do INPI
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
            </motion.div>
          )}

          {/* UPLOAD */}
          {step === 'upload' && file && (
            <motion.div key="upload" {...fadeIn}>
              <Card className="border-primary/20 shadow-lg shadow-primary/5">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center gap-5 p-5 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-base">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB • {RESOURCE_TYPE_LABELS[resourceType]}</p>
                    </div>
                    <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                      <FileCheck className="h-3 w-3" /> PDF Válido
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-xl border">
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">O que a IA irá fazer:</p>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Extrair dados do documento (nº processo, marca, classe NCL)</li>
                          <li>• Analisar o fundamento legal aplicado pelo INPI</li>
                          <li>• Elaborar recurso administrativo completo em 7 seções</li>
                          <li>• Incluir jurisprudência real e fundamentação da LPI</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep('select-type')} className="rounded-xl">Voltar</Button>
                    <Button onClick={processDocument} className="flex-1 gap-2 rounded-xl h-12 text-base shadow-lg shadow-primary/15">
                      <Zap className="h-5 w-5" />
                      Processar com IA Jurídica
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* PROCESSING */}
          {step === 'processing' && (
            <motion.div key="processing" {...fadeIn}>
              <Card className="border-primary/20 overflow-hidden">
                <div className="h-1 bg-muted">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-primary/70"
                    initial={{ width: '0%' }}
                    animate={{ width: `${processingProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                      <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Brain className="h-10 w-10 text-primary-foreground animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">IA Jurídica Processando</h3>
                      <p className="text-muted-foreground">Analisando documento, extraindo dados e elaborando recurso administrativo com fundamentação jurídica...</p>
                    </div>
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium text-primary">{Math.round(processingProgress)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                          style={{ width: `${processingProgress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      {['Lendo PDF', 'Extraindo dados', 'Analisando fundamentos', 'Elaborando recurso'].map((label, i) => (
                        <Badge key={i} variant="outline" className={`text-xs ${processingProgress > (i + 1) * 20 ? 'border-primary/50 text-primary' : 'text-muted-foreground'}`}>
                          {processingProgress > (i + 1) * 20 ? <Check className="h-3 w-3 mr-1" /> : <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* REVIEW */}
          {step === 'review' && (
            <motion.div key="review" {...fadeIn} className="space-y-4">
              {extractedData && (
                <Card className="border-primary/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-primary" />
                      Dados Extraídos do Documento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Processo', value: extractedData.process_number, icon: '📋' },
                        { label: 'Marca', value: extractedData.brand_name, icon: '®️' },
                        { label: 'Classe NCL', value: extractedData.ncl_class, icon: '📑' },
                        { label: 'Titular', value: extractedData.holder, icon: '👤' },
                        { label: 'Examinador/Opoente', value: extractedData.examiner_or_opponent, icon: '⚖️' },
                        { label: 'Fundamento Legal', value: extractedData.legal_basis, icon: '📖' },
                      ].map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border/50">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">{item.icon} {item.label}</span>
                          <p className="font-medium text-sm mt-1 truncate">{item.value || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Edit3 className="h-5 w-5 text-primary" />
                    Rascunho do Recurso
                    <Badge variant="outline" className="ml-auto text-xs border-amber-500/30 text-amber-600 bg-amber-500/10">Revisão obrigatória</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white dark:bg-gray-950 border rounded-xl p-6 max-h-[500px] overflow-y-auto shadow-inner">
                    <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground">{draftContent}</pre>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
                    <Label htmlFor="adjustments" className="flex items-center gap-2 font-semibold">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Ajustes com IA
                    </Label>
                    <Textarea
                      id="adjustments"
                      placeholder="Descreva os ajustes desejados. Ex: Reforce a argumentação no item III, adicione referência ao art. 124 da LPI..."
                      value={adjustmentNotes}
                      onChange={(e) => setAdjustmentNotes(e.target.value)}
                      rows={4}
                      className="rounded-xl resize-none"
                    />
                    <p className="text-xs text-muted-foreground">A IA ajustará apenas os trechos indicados, mantendo o restante intacto.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleAdjustResource} disabled={isAdjusting || !adjustmentNotes.trim()} className="gap-2 rounded-xl">
                      {isAdjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                      Ajustar com IA
                    </Button>
                    <Button onClick={handleApproveResource} className="flex-1 gap-2 rounded-xl h-11 shadow-lg shadow-primary/15">
                      <CheckCircle2 className="h-4 w-4" />
                      Aprovar Recurso Final
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* APPROVED */}
          {step === 'approved' && (
            <motion.div key="approved" {...fadeIn}>
              <Card className="border-emerald-500/20 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
                <CardContent className="p-8">
                  <div className="text-center space-y-4 mb-8">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto"
                    >
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </motion.div>
                    <h3 className="text-xl font-bold">Recurso Aprovado com Sucesso!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">O recurso foi aprovado e está pronto para geração do PDF final com papel timbrado oficial da WebMarcas.</p>
                  </div>
                  
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Button variant="outline" onClick={() => window.print()} className="gap-2 rounded-xl h-12">
                      <Printer className="h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button
                      onClick={() => {
                        if (currentResourceId) {
                          const resource: INPIResource = {
                            id: currentResourceId,
                            resource_type: resourceType,
                            process_number: extractedData?.process_number || null,
                            brand_name: extractedData?.brand_name || null,
                            ncl_class: extractedData?.ncl_class || null,
                            holder: extractedData?.holder || null,
                            status: 'approved',
                            draft_content: null,
                            final_content: draftContent,
                            created_at: new Date().toISOString(),
                            approved_at: new Date().toISOString()
                          };
                          setSelectedResource(resource);
                          setShowPDFPreview(true);
                        }
                      }}
                      className="gap-2 rounded-xl h-12 shadow-lg shadow-primary/15"
                    >
                      <Download className="h-4 w-4" />
                      Gerar PDF Timbrado
                    </Button>
                    <Button variant="ghost" onClick={resetFlow} className="gap-2 rounded-xl h-12">
                      <Plus className="h-4 w-4" />
                      Novo Recurso
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF Preview Dialog */}
        <Dialog open={showPDFPreview} onOpenChange={setShowPDFPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recurso Administrativo — Papel Timbrado
              </DialogTitle>
            </DialogHeader>
            {selectedResource && (
              <INPIResourcePDFPreview
                resource={selectedResource}
                content={selectedResource.final_content || selectedResource.draft_content || draftContent}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Floating Legal AI Chat Button */}
      <button
        onClick={() => setShowLegalChat(true)}
        className="fixed bottom-24 right-6 z-[9999] h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center group"
        title="Consultora Jurídica IA"
      >
        <Scale className="h-6 w-6 group-hover:scale-110 transition-transform" />
      </button>

      <INPILegalChatDialog open={showLegalChat} onOpenChange={setShowLegalChat} />
    </AdminLayout>
  );
}
