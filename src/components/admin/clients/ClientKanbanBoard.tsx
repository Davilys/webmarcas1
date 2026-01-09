import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Eye, MessageCircle, Mail, Phone, Building2, DollarSign, 
  ChevronDown, ChevronRight, GripVertical, ExternalLink 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ClientWithProcess {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  priority: string | null;
  origin: string | null;
  contract_value: number | null;
  process_id: string | null;
  brand_name: string | null;
  pipeline_stage: string | null;
  process_status: string | null;
}

export interface KanbanFilters {
  priority: string[];
  origin: string[];
}

interface ClientKanbanBoardProps {
  clients: ClientWithProcess[];
  onClientClick: (client: ClientWithProcess) => void;
  onRefresh: () => void;
  filters?: KanbanFilters;
}

export const PIPELINE_STAGES = [
  { id: 'protocolado', label: 'PROTOCOLADO', color: 'border-l-blue-500', bgColor: 'bg-blue-50', description: 'Pedido de registro enviado ao INPI. Aguardando análise inicial.' },
  { id: '003', label: '003', color: 'border-l-yellow-500', bgColor: 'bg-yellow-50', description: 'Cumprimento de exigência formal. Documentos adicionais solicitados.' },
  { id: 'oposicao', label: 'Oposição', color: 'border-l-orange-500', bgColor: 'bg-orange-50', description: 'Terceiro contestou o registro. Manifestação necessária.' },
  { id: 'indeferimento', label: 'Indeferimento', color: 'border-l-red-500', bgColor: 'bg-red-50', description: 'Pedido indeferido. Recurso pode ser interposto.' },
  { id: 'notificacao', label: 'Notificação Extrajudicial', color: 'border-l-purple-500', bgColor: 'bg-purple-50', description: 'Notificação enviada a terceiros por uso indevido.' },
  { id: 'deferimento', label: 'Deferimento', color: 'border-l-green-500', bgColor: 'bg-green-50', description: 'Pedido aprovado! Aguardando pagamento da taxa de concessão.' },
  { id: 'certificados', label: 'Certificados', color: 'border-l-teal-500', bgColor: 'bg-teal-50', description: 'Marca registrada. Certificado emitido pelo INPI.' },
  { id: 'renovacao', label: 'Renovação', color: 'border-l-cyan-500', bgColor: 'bg-cyan-50', description: 'Próximo da renovação decenal. Ação necessária.' },
  { id: 'distrato', label: 'Distrato', color: 'border-l-gray-500', bgColor: 'bg-gray-50', description: 'Cliente encerrou contrato ou serviço cancelado.' },
];

export function ClientKanbanBoard({ clients, onClientClick, onRefresh, filters }: ClientKanbanBoardProps) {
  const [draggedClient, setDraggedClient] = useState<ClientWithProcess | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());

  // Apply filters
  const filteredClients = useMemo(() => {
    if (!filters) return clients;
    
    return clients.filter(client => {
      const priorityMatch = filters.priority.length === 0 || 
        filters.priority.includes(client.priority || 'medium');
      const originMatch = filters.origin.length === 0 || 
        filters.origin.includes(client.origin || 'site');
      return priorityMatch && originMatch;
    });
  }, [clients, filters]);

  const handleDragStart = (e: React.DragEvent, client: ClientWithProcess) => {
    setDraggedClient(client);
    e.dataTransfer.effectAllowed = 'move';
    // Add drag image styling
    const target = e.target as HTMLElement;
    target.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.classList.remove('opacity-50');
    setDraggedClient(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (!draggedClient || !draggedClient.process_id) {
      toast.error('Cliente sem processo não pode ser movido');
      setDraggedClient(null);
      return;
    }

    if (draggedClient.pipeline_stage === stageId) {
      setDraggedClient(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('brand_processes')
        .update({ pipeline_stage: stageId })
        .eq('id', draggedClient.process_id);

      if (error) throw error;
      
      const stageName = PIPELINE_STAGES.find(s => s.id === stageId)?.label;
      toast.success(`Cliente movido para ${stageName}`);
      onRefresh();
    } catch (error) {
      console.error('Error moving client:', error);
      toast.error('Erro ao mover cliente');
    }
    setDraggedClient(null);
  };

  const getClientsForStage = (stageId: string) => {
    return filteredClients.filter(c => (c.pipeline_stage || 'protocolado') === stageId);
  };

  const getStageValue = (stageId: string) => {
    return getClientsForStage(stageId).reduce((sum, c) => sum + (c.contract_value || 0), 0);
  };

  const toggleStageCollapse = (stageId: string) => {
    setCollapsedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-500 text-white text-xs">ALTA</Badge>;
      case 'medium': return <Badge className="bg-yellow-500 text-white text-xs">MÉDIA</Badge>;
      case 'low': return <Badge className="bg-green-500 text-white text-xs">BAIXA</Badge>;
      default: return <Badge variant="secondary" className="text-xs">MÉDIA</Badge>;
    }
  };

  const getOriginBadge = (origin: string | null) => {
    switch (origin) {
      case 'whatsapp': return <Badge variant="outline" className="text-xs border-green-500 text-green-600">WhatsApp</Badge>;
      case 'site': return <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">Site</Badge>;
      default: return <Badge variant="outline" className="text-xs">Site</Badge>;
    }
  };

  const openWhatsApp = (phone: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phone) {
      toast.error('Cliente sem telefone cadastrado');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const totalValue = filteredClients.reduce((sum, c) => sum + (c.contract_value || 0), 0);
  const activeClients = filteredClients.filter(c => c.pipeline_stage !== 'distrato').length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 justify-end">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Clientes:</span>
          <span className="font-bold">{filteredClients.length}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
          <DollarSign className="h-4 w-4" />
          <span className="text-sm">Valor Total:</span>
          <span className="font-bold">R$ {totalValue.toLocaleString('pt-BR')}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
          <span className="text-sm">Ativos:</span>
          <span className="font-bold">{activeClients}</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageClients = getClientsForStage(stage.id);
          const stageValue = getStageValue(stage.id);
          const isCollapsed = collapsedStages.has(stage.id);
          const isDragOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              className={cn(
                "flex-shrink-0 transition-all duration-200",
                isCollapsed ? "w-14" : "w-72"
              )}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div 
                className={cn(
                  "rounded-lg p-3 min-h-[500px] border-l-4 transition-all duration-200",
                  stage.color,
                  isDragOver ? `${stage.bgColor} ring-2 ring-primary ring-offset-2` : "bg-muted/50",
                  isCollapsed && "px-2"
                )}
              >
                {/* Column Header */}
                <div 
                  className={cn(
                    "flex items-center gap-2 mb-3 cursor-pointer",
                    isCollapsed && "flex-col"
                  )}
                  onClick={() => toggleStageCollapse(stage.id)}
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  
                  {isCollapsed ? (
                    <div className="flex flex-col items-center gap-2">
                      <span 
                        className="font-semibold text-xs writing-mode-vertical whitespace-nowrap"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                      >
                        {stage.label}
                      </span>
                      <Badge variant="secondary" className="text-xs">{stageClients.length}</Badge>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-sm flex-1 truncate">{stage.label}</h3>
                      <Badge variant="secondary">{stageClients.length}</Badge>
                    </>
                  )}
                </div>

                {/* Stage Description - Only show when expanded */}
                {!isCollapsed && (
                  <p className="mb-2 px-2 py-1.5 text-xs text-muted-foreground bg-white/70 rounded border-l-2 border-primary/30">
                    {stage.description}
                  </p>
                )}

                {/* Stage Value - Only show when expanded */}
                {!isCollapsed && stageValue > 0 && (
                  <div className="mb-3 px-2 py-1 bg-white/50 rounded text-xs text-center">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-semibold text-green-600">
                      R$ {stageValue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}

                {/* Cards */}
                {!isCollapsed && (
                  <div className="space-y-3">
                    {stageClients.length === 0 ? (
                      <div 
                        className={cn(
                          "text-center py-8 text-muted-foreground text-sm rounded-lg border-2 border-dashed transition-colors",
                          isDragOver ? "border-primary bg-primary/5" : "border-transparent"
                        )}
                      >
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 opacity-50" />
                        </div>
                        <p>Nenhum cliente</p>
                        <p className="text-xs">Arraste clientes aqui</p>
                      </div>
                    ) : (
                      stageClients.map((client) => (
                        <Card
                          key={client.id + (client.process_id || '')}
                          draggable
                          onDragStart={(e) => handleDragStart(e, client)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            "p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all bg-white group",
                            draggedClient?.id === client.id && draggedClient?.process_id === client.process_id && "ring-2 ring-primary"
                          )}
                        >
                          <div className="space-y-2">
                            {/* Drag Handle + Badges */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex gap-1 flex-wrap">
                                  <Badge className="bg-green-100 text-green-700 text-xs">ATIVO</Badge>
                                  {getPriorityBadge(client.priority)}
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  onClick={(e) => openWhatsApp(client.phone, e)}
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  onClick={(e) => { e.stopPropagation(); onClientClick(client); }}
                                  title="Ver detalhes"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Client Info */}
                            <div 
                              className="cursor-pointer"
                              onClick={() => onClientClick(client)}
                            >
                              <p className="font-semibold text-sm">{client.full_name || 'Sem nome'}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {client.brand_name || client.company_name || 'Empresa não informada'}
                              </p>
                            </div>

                            {/* Contract Value */}
                            {client.contract_value && client.contract_value > 0 && (
                              <p className="text-sm font-medium text-green-600">
                                <DollarSign className="h-3 w-3 inline" />
                                R$ {client.contract_value.toLocaleString('pt-BR')} /mês
                              </p>
                            )}

                            {/* Contact Info */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{client.email}</span>
                            </div>

                            {client.phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{client.phone}</span>
                              </div>
                            )}

                            {/* Origin Badge */}
                            <div className="pt-1">
                              {getOriginBadge(client.origin)}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}