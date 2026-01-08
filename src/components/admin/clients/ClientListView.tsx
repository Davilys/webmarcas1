import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ClientWithProcess } from './ClientKanbanBoard';

const PIPELINE_STAGES: Record<string, string> = {
  protocolado: 'Protocolado',
  '003': '003',
  oposicao: 'Oposição',
  indeferimento: 'Indeferimento',
  notificacao: 'Notificação Extrajudicial',
  deferimento: 'Deferimento',
  certificados: 'Certificados',
  renovacao: 'Renovação',
  distrato: 'Distrato',
};

interface ClientListViewProps {
  clients: ClientWithProcess[];
  loading: boolean;
  onClientClick: (client: ClientWithProcess) => void;
}

export function ClientListView({ clients, loading, onClientClick }: ClientListViewProps) {
  const getStatusBadge = (stage: string | null) => {
    const stageId = stage || 'protocolado';
    const colors: Record<string, string> = {
      protocolado: 'bg-blue-100 text-blue-700',
      '003': 'bg-yellow-100 text-yellow-700',
      oposicao: 'bg-orange-100 text-orange-700',
      indeferimento: 'bg-red-100 text-red-700',
      notificacao: 'bg-purple-100 text-purple-700',
      deferimento: 'bg-green-100 text-green-700',
      certificados: 'bg-teal-100 text-teal-700',
      renovacao: 'bg-cyan-100 text-cyan-700',
      distrato: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[stageId] || colors.protocolado}`}>
        {PIPELINE_STAGES[stageId] || 'Protocolado'}
      </span>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-500 text-white">Alta</Badge>;
      case 'low': return <Badge className="bg-green-500 text-white">Baixa</Badge>;
      default: return <Badge className="bg-yellow-500 text-white">Média</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Faturas</TableHead>
            <TableHead>Atualização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  Carregando...
                </div>
              </TableCell>
            </TableRow>
          ) : clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Nenhum cliente encontrado
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id + (client.process_id || '')} className="hover:bg-muted/50">
                <TableCell>
                  <div>
                    <p className="font-medium">{client.full_name || 'Sem nome'}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {client.email}
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{client.brand_name || '-'}</p>
                  <p className="text-xs text-muted-foreground">{client.company_name || ''}</p>
                </TableCell>
                <TableCell>{getStatusBadge(client.pipeline_stage)}</TableCell>
                <TableCell>
                  <span className="font-medium text-green-600">
                    R$ {(client.contract_value || 0).toLocaleString('pt-BR')}
                  </span>
                </TableCell>
                <TableCell>{getPriorityBadge(client.priority)}</TableCell>
                <TableCell>
                  <Badge variant="outline">-</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  -
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onClientClick(client)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
