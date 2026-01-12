import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  cpf_cnpj: string | null;
  status: string;
  origin: string | null;
  estimated_value: number | null;
  notes: string | null;
  created_at: string;
}

interface LeadImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  onImportComplete: () => void;
}

export function LeadImportExportDialog({ 
  open, 
  onOpenChange, 
  leads,
  onImportComplete 
}: LeadImportExportDialogProps) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setImportData(results.data);
          toast.success(`${results.data.length} registros encontrados`);
        },
        error: () => toast.error('Erro ao ler arquivo CSV'),
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        setImportData(jsonData);
        toast.success(`${jsonData.length} registros encontrados`);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Formato não suportado. Use CSV ou Excel.');
    }
  }, []);

  const handleImport = async () => {
    if (importData.length === 0) {
      toast.error('Nenhum dado para importar');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const row of importData) {
        const leadData = {
          full_name: row.full_name || row.nome || row.Nome || row['Nome Completo'] || 'Lead Importado',
          email: row.email || row.Email || row['E-mail'] || null,
          phone: row.phone || row.telefone || row.Telefone || row.celular || null,
          company_name: row.company_name || row.empresa || row.Empresa || null,
          cpf_cnpj: row.cpf_cnpj || row.cpf || row.cnpj || row.CPF || row.CNPJ || null,
          status: 'novo',
          origin: 'import',
          estimated_value: row.estimated_value || row.valor || null,
          notes: row.notes || row.observacoes || row.Observações || null,
        };

        const { error } = await supabase.from('leads').insert(leadData);
        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      }

      toast.success(`Importação concluída: ${successCount} leads importados, ${errorCount} erros`);
      onImportComplete();
      setImportData([]);
      setFileName('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro durante a importação');
    } finally {
      setImporting(false);
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      const exportData = leads.map(lead => ({
        Nome: lead.full_name,
        Email: lead.email || '',
        Telefone: lead.phone || '',
        Empresa: lead.company_name || '',
        'CPF/CNPJ': lead.cpf_cnpj || '',
        Status: lead.status,
        Origem: lead.origin || '',
        'Valor Estimado': lead.estimated_value || '',
        Observações: lead.notes || '',
        'Criado em': new Date(lead.created_at).toLocaleDateString('pt-BR'),
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Leads exportados com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const exportData = leads.map(lead => ({
        Nome: lead.full_name,
        Email: lead.email || '',
        Telefone: lead.phone || '',
        Empresa: lead.company_name || '',
        'CPF/CNPJ': lead.cpf_cnpj || '',
        Status: lead.status,
        Origem: lead.origin || '',
        'Valor Estimado': lead.estimated_value || '',
        Observações: lead.notes || '',
        'Criado em': new Date(lead.created_at).toLocaleDateString('pt-BR'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
      XLSX.writeFile(workbook, `leads_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Leads exportados com sucesso');
    } catch (error) {
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar / Exportar Leads</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar ou arraste um arquivo
                </p>
                <p className="text-xs text-muted-foreground">
                  Suporta CSV, XLSX e XLS
                </p>
              </label>
            </div>

            {fileName && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {importData.length} registros prontos para importar
                </p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Colunas esperadas:</p>
              <p className="text-muted-foreground">
                nome, email, telefone, empresa, cpf_cnpj, valor, observacoes
              </p>
            </div>

            <Button 
              onClick={handleImport} 
              disabled={importData.length === 0 || importing}
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar {importData.length} Leads
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">{leads.length} leads disponíveis para exportar</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={exportToCSV} 
                variant="outline" 
                disabled={exporting || leads.length === 0}
                className="h-24 flex-col gap-2"
              >
                <FileText className="h-8 w-8" />
                <span>Exportar CSV</span>
              </Button>
              <Button 
                onClick={exportToExcel} 
                variant="outline" 
                disabled={exporting || leads.length === 0}
                className="h-24 flex-col gap-2"
              >
                <FileSpreadsheet className="h-8 w-8" />
                <span>Exportar Excel</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
