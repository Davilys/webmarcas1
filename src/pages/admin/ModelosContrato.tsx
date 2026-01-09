import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { FileStack, Plus, RefreshCw, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  contract_type_id: string | null;
  is_active: boolean;
  variables: unknown[];
  created_at: string;
  contract_type?: { name: string } | null;
}

interface ContractType {
  id: string;
  name: string;
}

const AVAILABLE_VARIABLES = [
  { key: '{{nome_cliente}}', label: 'Nome do Cliente' },
  { key: '{{cpf_cnpj}}', label: 'CPF/CNPJ' },
  { key: '{{endereco}}', label: 'Endereço' },
  { key: '{{cidade}}', label: 'Cidade' },
  { key: '{{estado}}', label: 'Estado' },
  { key: '{{cep}}', label: 'CEP' },
  { key: '{{email}}', label: 'E-mail' },
  { key: '{{telefone}}', label: 'Telefone' },
  { key: '{{marca}}', label: 'Nome da Marca' },
  { key: '{{valor}}', label: 'Valor do Contrato' },
  { key: '{{data}}', label: 'Data Atual' },
  { key: '{{data_inicio}}', label: 'Data de Início' },
  { key: '{{data_fim}}', label: 'Data Final' },
  { key: '{{numero_contrato}}', label: 'Número do Contrato' },
];

export default function ModelosContrato() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    contract_type_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, typesRes] = await Promise.all([
        supabase
          .from('contract_templates')
          .select('*, contract_type:contract_types(name)')
          .order('created_at', { ascending: false }),
        supabase.from('contract_types').select('*'),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      
      setTemplates(templatesRes.data?.map(t => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables : []
      })) || []);
      setContractTypes(typesRes.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Erro ao carregar modelos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Extract variables used in content
      const usedVariables = AVAILABLE_VARIABLES
        .filter(v => formData.content.includes(v.key))
        .map(v => v.key);

      const templateData = {
        name: formData.name,
        content: formData.content,
        contract_type_id: formData.contract_type_id || null,
        is_active: formData.is_active,
        variables: usedVariables,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('contract_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        if (error) throw error;
        toast.success('Modelo atualizado');
      } else {
        const { error } = await supabase
          .from('contract_templates')
          .insert(templateData);
        if (error) throw error;
        toast.success('Modelo criado');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar modelo');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      contract_type_id: '',
      is_active: true,
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: ContractTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      contract_type_id: template.contract_type_id || '',
      is_active: template.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return;

    try {
      const { error } = await supabase.from('contract_templates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Modelo excluído');
      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erro ao excluir modelo');
    }
  };

  const handleDuplicate = async (template: ContractTemplate) => {
    try {
      const duplicateData = {
        name: `${template.name} (Cópia)`,
        content: template.content,
        contract_type_id: template.contract_type_id,
        is_active: false,
        variables: template.variables as string[],
      };
      const { error } = await supabase.from('contract_templates').insert(duplicateData);
      if (error) throw error;
      toast.success('Modelo duplicado');
      fetchData();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Erro ao duplicar modelo');
    }
  };

  const handlePreview = (content: string) => {
    // Replace variables with sample data
    let preview = content
      .replace(/{{nome_cliente}}/g, 'João da Silva')
      .replace(/{{cpf_cnpj}}/g, '123.456.789-00')
      .replace(/{{endereco}}/g, 'Rua Exemplo, 123')
      .replace(/{{cidade}}/g, 'São Paulo')
      .replace(/{{estado}}/g, 'SP')
      .replace(/{{cep}}/g, '01234-567')
      .replace(/{{email}}/g, 'joao@email.com')
      .replace(/{{telefone}}/g, '(11) 99999-9999')
      .replace(/{{marca}}/g, 'MARCA EXEMPLO')
      .replace(/{{valor}}/g, 'R$ 699,00')
      .replace(/{{data}}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{{data_inicio}}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{{data_fim}}/g, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'))
      .replace(/{{numero_contrato}}/g, '2026001');
    
    setPreviewContent(preview);
    setPreviewOpen(true);
  };

  const insertVariable = (variable: string) => {
    setFormData({
      ...formData,
      content: formData.content + variable,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileStack className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Modelos de Contrato</h1>
              <p className="text-sm text-muted-foreground">
                Crie e gerencie modelos reutilizáveis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Modelo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Editar Modelo' : 'Novo Modelo de Contrato'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Modelo *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Contrato Registro de Marca Padrão"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Contrato</Label>
                      <Select
                        value={formData.contract_type_id}
                        onValueChange={(value) => setFormData({ ...formData, contract_type_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {contractTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Variáveis Disponíveis</Label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_VARIABLES.map(v => (
                        <Button
                          key={v.key}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(v.key)}
                        >
                          {v.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Conteúdo do Contrato *</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={15}
                      placeholder="Digite o texto do contrato usando as variáveis acima..."
                      className="font-mono text-sm"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Modelo ativo</Label>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handlePreview(formData.content)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Pré-visualizar
                    </Button>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingTemplate ? 'Salvar' : 'Criar Modelo'}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileStack className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum modelo de contrato cadastrado</p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Modelo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>
                        {template.contract_type?.name || 'Sem tipo definido'}
                      </CardDescription>
                    </div>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {template.content.substring(0, 150)}...
                  </p>
                  
                  {Array.isArray(template.variables) && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(template.variables as string[]).slice(0, 3).map((v, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {String(v)}
                        </Badge>
                      ))}
                      {Array.isArray(template.variables) && template.variables.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePreview(template.content)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pré-visualização do Contrato</DialogTitle>
            </DialogHeader>
            <div className="border rounded-lg p-6 bg-white whitespace-pre-wrap font-serif">
              {previewContent}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
