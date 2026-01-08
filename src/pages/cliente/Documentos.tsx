import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Search, 
  Download, 
  FileText, 
  File, 
  Eye,
  Upload
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { User } from '@supabase/supabase-js';

interface Document {
  id: string;
  name: string;
  document_type: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  contrato: { label: 'Contrato', color: 'bg-blue-500' },
  laudo: { label: 'Laudo', color: 'bg-green-500' },
  notificacao: { label: 'Notificação', color: 'bg-yellow-500' },
  certificado: { label: 'Certificado', color: 'bg-purple-500' },
  rpi: { label: 'RPI', color: 'bg-orange-500' },
  comprovante: { label: 'Comprovante', color: 'bg-cyan-500' },
  outro: { label: 'Outro', color: 'bg-gray-500' },
};

export default function Documentos() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
        fetchDocuments(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchDocuments = async (userId: string) => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setDocuments((data as Document[]) || []);
    setLoading(false);
  };

  const filteredDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
            <p className="text-muted-foreground">
              Acesse todos os documentos do seu processo
            </p>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Enviar Documento
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum documento encontrado</p>
                <p className="text-sm">Os documentos do seu processo aparecerão aqui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocs.map((doc) => {
                  const typeConfig = typeLabels[doc.document_type] || typeLabels.outro;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {typeConfig.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(doc.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
