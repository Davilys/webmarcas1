import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientLayout } from '@/components/cliente/ClientLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FolderOpen, Search, Download, FileText, Eye, Upload, Image,
  FileSignature, Inbox, Shield, RefreshCw, X, ExternalLink,
  File as FileIcon, CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';
import { DocumentUploader } from '@/components/shared/DocumentUploader';
import { DocumentPreview } from '@/components/shared/DocumentPreview';

interface Document {
  id: string;
  name: string;
  document_type: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  signature_status?: string;
  blockchain_hash?: string;
  isContract?: boolean;
  contract_id?: string;
}

// Fixed particles
const PARTICLES = Array.from({ length: 15 }).map((_, i) => ({
  x: (i * 53.7 + 11) % 100, y: (i * 37.3 + 7) % 100,
  s: 1 + (i % 3) * 0.6, dur: 7 + (i % 5),
  delay: (i * 0.52) % 5, op: 0.03 + (i % 4) * 0.015,
}));

const TYPE_CFG: Record<string, { label: string; colorRgb: string; icon: React.ElementType }> = {
  contrato:    { label: 'Contrato',      colorRgb: '59,130,246',  icon: FileSignature },
  procuracao:  { label: 'Procuração',    colorRgb: '139,92,246',  icon: FileText },
  distrato:    { label: 'Distrato',      colorRgb: '239,68,68',   icon: FileText },
  certificado: { label: 'Certificado',   colorRgb: '16,185,129',  icon: Shield },
  comprovante: { label: 'Comprovante',   colorRgb: '6,182,212',   icon: CheckCircle },
  parecer:     { label: 'Parecer INPI',  colorRgb: '249,115,22',  icon: FileText },
  rpi:         { label: 'RPI',           colorRgb: '234,179,8',   icon: FileText },
  laudo:       { label: 'Laudo',         colorRgb: '244,63,94',   icon: FileText },
  notificacao: { label: 'Notificação',   colorRgb: '251,191,36',  icon: FileText },
  anexo:       { label: 'Anexo',         colorRgb: '99,102,241',  icon: FileText },
  imagem:      { label: 'Imagem',        colorRgb: '236,72,153',  icon: Image },
  outro:       { label: 'Outro',         colorRgb: '100,116,139', icon: FileIcon },
};

function getTypeCfg(type: string) {
  return TYPE_CFG[type] || TYPE_CFG['outro'];
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocCard({ doc, index }: { doc: Document; index: number }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const cfg = getTypeCfg(doc.document_type || 'outro');
  const Icon = cfg.icon;
  const timeAgo = doc.created_at
    ? formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: ptBR })
    : '';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, type: 'spring', stiffness: 280, damping: 24 }}
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        className="group relative rounded-2xl border overflow-hidden backdrop-blur-sm"
        style={{
          background: `linear-gradient(135deg, hsl(var(--card)/0.9) 0%, rgba(${cfg.colorRgb},0.04) 100%)`,
          borderColor: `rgba(${cfg.colorRgb},0.18)`,
        }}
      >
        {/* Left bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
          style={{ background: `linear-gradient(180deg, transparent, rgba(${cfg.colorRgb},0.8), transparent)` }} />

        <div className="flex items-start gap-3 p-4 pl-5">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
            style={{ background: `rgba(${cfg.colorRgb},0.12)`, borderColor: `rgba(${cfg.colorRgb},0.25)` }}>
            <Icon className="h-5 w-5" style={{ color: `rgb(${cfg.colorRgb})` }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-semibold text-sm text-foreground leading-tight truncate">{doc.name}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0"
                style={{
                  background: `rgba(${cfg.colorRgb},0.12)`,
                  borderColor: `rgba(${cfg.colorRgb},0.3)`,
                  color: `rgb(${cfg.colorRgb})`,
                }}>
                {cfg.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
              <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
              <span className="text-[11px] text-muted-foreground">{formatSize(doc.file_size)}</span>
              {doc.blockchain_hash && (
                <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" />
                  Blockchain
                </span>
              )}
              {doc.signature_status === 'signed' && (
                <span className="text-[11px] text-blue-500 flex items-center gap-1">
                  <CheckCircle className="h-2.5 w-2.5" />
                  Assinado
                </span>
              )}
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
              >
                <Eye className="h-3 w-3" />
                Ver
              </button>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-muted/60 border border-border/50 text-foreground hover:bg-muted transition-colors"
                download
              >
                <Download className="h-3 w-3" />
                Baixar
              </a>
            </div>
          </div>
        </div>
      </motion.div>

        {/* Preview dialog */}
      {previewOpen && (
        <DocumentPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          document={{ name: doc.name, file_url: doc.file_url, mime_type: doc.mime_type, document_type: doc.document_type }}
        />
      )}
    </>
  );
}

export default function Documentos() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate('/cliente/login');
      else { setUser(session.user); fetchDocs(session.user.id); }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/cliente/login');
      else { setUser(session.user); fetchDocs(session.user.id); }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchDocs = async (uid: string) => {
    setLoading(true);
    const [{ data: docs }, { data: contracts }] = await Promise.all([
      supabase.from('documents').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('contracts').select('id, subject, signature_status, blockchain_hash, created_at, visible_to_client')
        .eq('user_id', uid).eq('visible_to_client', true).order('created_at', { ascending: false }),
    ]);

    const contractDocs: Document[] = (contracts || []).map(c => ({
      id: `contract-${c.id}`,
      name: c.subject || 'Contrato sem título',
      document_type: 'contrato',
      file_url: `/verificar-contrato?id=${c.id}`,
      file_size: null,
      mime_type: 'application/pdf',
      created_at: c.created_at || '',
      signature_status: c.signature_status || undefined,
      blockchain_hash: c.blockchain_hash || undefined,
      isContract: true,
      contract_id: c.id,
    }));

    setDocuments([...contractDocs, ...(docs || [])]);
    setLoading(false);
  };

  const availableTypes = useMemo(() => {
    const types = new Set(documents.map(d => d.document_type));
    return ['all', ...Array.from(types)];
  }, [documents]);

  const filtered = useMemo(() => documents.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.name.toLowerCase().includes(q);
    const matchType = typeFilter === 'all' || d.document_type === typeFilter;
    return matchSearch && matchType;
  }), [documents, search, typeFilter]);

  const handleUploadComplete = () => {
    if (user) fetchDocs(user.id);
    toast.success('Documento enviado com sucesso!');
  };

  return (
    <ClientLayout>
      <div className="relative space-y-5">
        {/* Background particles */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          {PARTICLES.map((p, i) => (
            <motion.div key={i} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, background: 'hsl(var(--primary))', opacity: p.op }}
              animate={{ y: [-6, 6, -6], opacity: [p.op, p.op * 2, p.op] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="relative z-10 space-y-5">
          {/* ── Header ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-xl p-5"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg"
                  animate={{ boxShadow: ['0 0 16px rgba(245,158,11,0.3)', '0 0 32px rgba(245,158,11,0.5)', '0 0 16px rgba(245,158,11,0.3)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <FolderOpen className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-black tracking-tight">Documentos</h1>
                  <p className="text-xs text-muted-foreground">{documents.length} arquivos</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => user && fetchDocs(user.id)} className="gap-2">
                  <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                  Atualizar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setUploading(true)}
                  className="gap-2 bg-gradient-to-r from-primary to-violet-500 text-white shadow-md"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Enviar
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ── Upload modal */}
          <AnimatePresence>
            {uploading && user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Enviar Documento</h3>
                    <button onClick={() => setUploading(false)} className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <DocumentUploader
                    userId={user.id}
                    onUploadComplete={() => { handleUploadComplete(); setUploading(false); }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Filters ──────────────────────────── */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 rounded-xl border-border/60 bg-card/60 backdrop-blur-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {availableTypes.map(type => {
                const cfg = type !== 'all' ? getTypeCfg(type) : null;
                const count = type === 'all' ? documents.length : documents.filter(d => d.document_type === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                      typeFilter === type
                        ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                        : 'bg-card/60 text-muted-foreground border-border/50 hover:border-primary/30'
                    )}
                  >
                    {type === 'all' ? `Todos (${count})` : `${cfg?.label || type} (${count})`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Documents Grid ───────────────────── */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-3 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Inbox className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="font-semibold text-muted-foreground">
                {search ? 'Nenhum documento encontrado' : 'Nenhum documento disponível'}
              </p>
              {!search && (
                <Button size="sm" onClick={() => setUploading(true)} className="gap-2 mt-1">
                  <Upload className="h-3.5 w-3.5" />
                  Enviar primeiro documento
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((doc, i) => (
                  <DocCard key={doc.id} doc={doc} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
