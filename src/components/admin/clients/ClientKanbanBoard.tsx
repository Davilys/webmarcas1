import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2, MessageCircle, Mail, Phone, Building2, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface ClientKanbanBoardProps {
  clients: ClientWithProcess[];
  onClientClick: (client: ClientWithProcess) => void;
  onRefresh: () => void;
}

const PIPELINE_STAGES = [
  { id: 'protocolado', label: 'PROTOCOLADO', color: 'border-l-blue-500' },
  { id: '003', label: '003', color: 'border-l-yellow-500' },
  { id: 'oposicao', label: 'Oposição', color: 'border-l-orange-500' },
  { id: 'indeferimento', label: 'Indeferimento', color: 'border-l-red-500' },
  { id: 'notificacao', label: 'Notificação Extrajudicial', color: 'border-l-purple-500' },
  { id: 'deferimento', label: 'Deferimento', color: 'border-l-green-500' },
  { id: 'certificados', label: 'Certificados', color: 'border-l-teal-500' },
  { id: 'renovacao', label: 'Renovação', color: 'border-l-cyan-500' },
  { id: 'distrato', label: 'Distrato', color: 'border-l-gray-500' },
];

export function ClientKanbanBoard({ clients, onClientClick, onRefresh }: ClientKanbanBoardProps) {
  const [draggedClient, setDraggedClient] = useState<ClientWithProcess | null>(null);

  const handleDragStart = (e: React.DragEvent, client: ClientWithProcess) => {
    setDraggedClient(client);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (!draggedClient || !draggedClient.process_id) return;

    try {
      const { error } = await supabase
        .from('brand_processes')
        .update({ pipeline_stage: stageId })
        .eq('id', draggedClient.process_id);

      if (error) throw error;
      toast.success(`Cliente movido para ${PIPELINE_STAGES.find(s => s.id === stageId)?.label}`);
      onRefresh();
    } catch (error) {
      console.error('Error moving client:', error);
      toast.error('Erro ao mover cliente');
    }
    setDraggedClient(null);
  };

  const getClientsForStage = (stageId: string) => {
    return clients.filter(c => (c.pipeline_stage || 'protocolado') === stageId);
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

  const totalValue = clients.reduce((sum, c) => sum + (c.contract_value || 0), 0);
  const activeClients = clients.filter(c => c.pipeline_stage !== 'distrato').length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 justify-end">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Clientes:</span>
          <span className="font-bold">{clients.length}</span>
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
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className={`bg-muted/50 rounded-lg p-3 min-h-[500px] border-l-4 ${stage.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                  <Badge variant="secondary">{stageClients.length}</Badge>
                </div>

                <div className="space-y-3">
                  {stageClients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
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
                        className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex gap-1 flex-wrap">
                              <Badge className="bg-green-100 text-green-700 text-xs">ATIVO</Badge>
                              {getPriorityBadge(client.priority)}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onClientClick(client)}>
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <p className="font-semibold text-sm">{client.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {client.brand_name || client.company_name || 'Empresa não informada'}
                            </p>
                          </div>

                          {client.contract_value && client.contract_value > 0 && (
                            <p className="text-sm font-medium text-green-600">
                              <DollarSign className="h-3 w-3 inline" />
                              R$ {client.contract_value.toLocaleString('pt-BR')} /mês
                            </p>
                          )}

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

                          <div className="pt-1">
                            {getOriginBadge(client.origin)}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
