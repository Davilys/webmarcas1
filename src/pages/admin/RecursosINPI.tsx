import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Loader2, Edit3, Check, Download, Printer, FileCheck, History, Plus, Eye, Search, X, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { INPIResourcePDFPreview } from '@/components/admin/INPIResourcePDFPreview';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResources();
  }, []);

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
      setStep('review');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Rascunho</Badge>;
      case 'pending_review': return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Em Revisão</Badge>;
      case 'approved': return <Badge className="bg-green-600">Aprovado</Badge>;
      case 'finalized': return <Badge className="bg-blue-600">Finalizado</Badge>;
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Recursos INPI</h1>
            <p className="text-muted-foreground">Geração de recursos administrativos de marcas perante o INPI</p>
          </div>
          {step === 'list' && (
            <Button onClick={() => setStep('select-type')}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Recurso Administrativo
            </Button>
          )}
          {step !== 'list' && (
            <Button variant="outline" onClick={resetFlow}>Voltar à Lista</Button>
          )}
        </div>

        {step === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Recursos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome da marca ou número do processo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="pl-9 w-full sm:w-44" />
                  {searchDate && (
                    <button onClick={() => setSearchDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{resources.length === 0 ? 'Nenhum recurso criado ainda.' : 'Nenhum resultado encontrado.'}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marca</TableHead>
                      <TableHead>Processo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.brand_name || '-'}</TableCell>
                        <TableCell>{resource.process_number || '-'}</TableCell>
                        <TableCell>{RESOURCE_TYPE_LABELS[resource.resource_type] || resource.resource_type}</TableCell>
                        <TableCell>{getStatusBadge(resource.status)}</TableCell>
                        <TableCell>{format(new Date(resource.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedResource(resource); setShowPDFPreview(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'select-type' && (
          <Card>
            <CardHeader><CardTitle>Selecione o Tipo de Recurso</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={resourceType} onValueChange={setResourceType} className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="indeferimento" id="indeferimento" />
                  <Label htmlFor="indeferimento" className="flex-1 cursor-pointer">
                    <div className="font-medium">Recurso contra Indeferimento</div>
                    <div className="text-sm text-muted-foreground">Para marcas que tiveram o pedido indeferido pelo INPI</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="exigencia_merito" id="exigencia_merito" />
                  <Label htmlFor="exigencia_merito" className="flex-1 cursor-pointer">
                    <div className="font-medium">Cumprimento de Exigência de Mérito</div>
                    <div className="text-sm text-muted-foreground">Para atender exigências técnicas formuladas pelo INPI</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="oposicao" id="oposicao" />
                  <Label htmlFor="oposicao" className="flex-1 cursor-pointer">
                    <div className="font-medium">Manifestação à Oposição</div>
                    <div className="text-sm text-muted-foreground">Para responder a oposições de terceiros contra a marca</div>
                  </Label>
                </div>
              </RadioGroup>
              <Button onClick={() => fileInputRef.current?.click()} disabled={!resourceType} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Continuar e Anexar PDF do INPI
              </Button>
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
            </CardContent>
          </Card>
        )}

        {step === 'upload' && file && (
          <Card>
            <CardHeader><CardTitle>Documento Selecionado</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <FileText className="h-10 w-10 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB • {RESOURCE_TYPE_LABELS[resourceType]}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('select-type')}>Voltar</Button>
                <Button onClick={processDocument} className="flex-1">
                  <FileCheck className="mr-2 h-4 w-4" />
                  Processar Documento
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'processing' && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Processando Documento</h3>
                  <p className="text-muted-foreground">A IA está analisando o documento e elaborando o recurso...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            {extractedData && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Dados Extraídos do Documento</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Processo:</span><p className="font-medium">{extractedData.process_number || '-'}</p></div>
                    <div><span className="text-muted-foreground">Marca:</span><p className="font-medium">{extractedData.brand_name || '-'}</p></div>
                    <div><span className="text-muted-foreground">Classe NCL:</span><p className="font-medium">{extractedData.ncl_class || '-'}</p></div>
                    <div><span className="text-muted-foreground">Titular:</span><p className="font-medium">{extractedData.holder || '-'}</p></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Fundamento Legal:</span><p className="font-medium">{extractedData.legal_basis || '-'}</p></div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Rascunho do Recurso (Revisão Obrigatória)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white dark:bg-gray-900 border rounded-lg p-6 max-h-[500px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">{draftContent}</pre>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adjustments">📝 Orientações para Ajuste do Recurso</Label>
                  <Textarea
                    id="adjustments"
                    placeholder="Escreva exatamente o que deseja ajustar ou corrigir. A IA deve modificar SOMENTE os pontos indicados."
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Descreva as alterações necessárias. A IA ajustará apenas os trechos indicados.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleAdjustResource} disabled={isAdjusting || !adjustmentNotes.trim()}>
                    {isAdjusting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4" />}
                    Ajustar Recurso
                  </Button>
                  <Button onClick={handleApproveResource} className="flex-1">
                    <Check className="mr-2 h-4 w-4" />
                    Aprovar Recurso Final
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'approved' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Recurso Aprovado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">O recurso foi aprovado e está pronto para geração do PDF final com papel timbrado.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
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
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Gerar PDF com Papel Timbrado
                </Button>
              </div>
              <Button variant="ghost" onClick={resetFlow} className="w-full">Criar Novo Recurso</Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={showPDFPreview} onOpenChange={setShowPDFPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Recurso Administrativo - PDF</DialogTitle>
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
    </AdminLayout>
  );
}
