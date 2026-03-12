import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, BarChart3, Users, Plus, Clock, Zap, Loader2, X, Pencil, Trash2, Pause, Play, XCircle, MoreHorizontal, RefreshCw, Crown, Search, ChevronDown, ChevronUp, AlertTriangle, Send } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';

// ── Types ──────────────────────────────────────────────────────────

interface Torneio {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  status: 'ativo' | 'encerrado' | 'pausado';
  created_at: string;
}

interface ResumoAtivo {
  torneio: Torneio | null;
  totalParticipantes: number;
  totalGreens: number;
  somaPagamentos: number;
}

interface RankingEntry {
  torneio_id: string;
  torneio_nome: string;
  participante_id: string;
  telefone_whatsapp: string;
  id_conta: string | null;
  participante_nome: string | null;
  total_greens: number;
  soma_pagamentos: number;
  soma_lucro_liquido: number;
  primeiro_green: string | null;
  ultimo_green: string | null;
}

interface TorneioOption {
  id: string;
  nome: string;
  status: string;
}

interface GreenEntry {
  id: string;
  torneio_id: string;
  participante_id: string;
  id_aposta: string;
  jogo: string;
  data_hora_aposta: string;
  valor_apostado: number;
  valor_green: number;
  imagem_referencia: string | null;
  created_at: string;
}

interface InstanciaWpp {
  id: string;
  nome: string;
  numero: string;
  instancia: string;
  token: string;
  ativo: boolean;
}

// ── Tabs ───────────────────────────────────────────────────────────

const tabs = [
  { key: 'torneios', label: 'Torneios', icon: Trophy },
  { key: 'ranking', label: 'Ranking', icon: BarChart3 },
  { key: 'participantes', label: 'Participantes', icon: Users },
] as const;

type TabKey = typeof tabs[number]['key'];

// ── Helpers ────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function fmtBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcCountdown(dataFim: string) {
  const diff = new Date(dataFim).getTime() - Date.now();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

function fmtPhone(phone: string) {
  const nums = phone.replace(/\D/g, '');
  if (nums.length >= 12) {
    const ddd = nums.slice(2, 4);
    const p1 = nums.slice(4, 9);
    const p2 = nums.slice(9);
    return `(${ddd}) ${p1}-${p2}`;
  }
  return phone;
}

function displayName(entry: RankingEntry) {
  return entry.participante_nome || fmtPhone(entry.telefone_whatsapp);
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `ha ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `ha ${hrs}h`;
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} as ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function buildRankingMsg(ranking: RankingEntry[], torneioNome: string, dataInicio: string, dataFim: string, top10: boolean) {
  const list = top10 ? ranking.slice(0, 10) : ranking;
  const numEmojis: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '4️⃣', 5: '5️⃣', 6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣', 10: '🔟' };

  const fmtD = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  let msg = `🏆 *RANKING — ${torneioNome}* 🏆\n📅 ${fmtD(dataInicio)} a ${fmtD(dataFim)}\n`;

  list.forEach((e, i) => {
    const pos = i + 1;
    const emoji = numEmojis[pos] || `${pos}º`;
    const nome = e.participante_nome || fmtPhone(e.telefone_whatsapp);
    const idConta = e.id_conta && e.id_conta.trim() ? e.id_conta : 'Pendente';
    msg += `\n${emoji} *${pos}º ${nome}*\n💰 ${fmtBRL(e.soma_pagamentos)} | 🎯 ${e.total_greens} greens\n🆔 ${idConta}\n`;
  });

  const totalGreens = ranking.reduce((s, e) => s + e.total_greens, 0);
  const totalPag = ranking.reduce((s, e) => s + e.soma_pagamentos, 0);
  msg += `\n📊 Total: ${ranking.length} participantes | ${totalGreens} greens\n💰 Total em pagamentos: ${fmtBRL(totalPag)}`;

  return msg;
}

// ── Status Badge ───────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, string> = {
    ativo: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    pausado: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    encerrado: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  };
  return (
    <span className={cn('px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border', cfg[status] || cfg.encerrado)}>
      {status}
    </span>
  );
};

// ── Modal ──────────────────────────────────────────────────────────

interface ModalProps {
  torneio?: Torneio | null;
  onClose: () => void;
  onSave: (data: { nome: string; data_inicio: string; data_fim: string; status: 'ativo' | 'pausado' }) => Promise<void>;
  saving: boolean;
}

const TorneioModal: React.FC<ModalProps> = ({ torneio, onClose, onSave, saving }) => {
  const [nome, setNome] = useState(torneio?.nome || '');
  const [dataInicio, setDataInicio] = useState(torneio?.data_inicio ? torneio.data_inicio.slice(0, 16) : '');
  const [dataFim, setDataFim] = useState(torneio?.data_fim ? torneio.data_fim.slice(0, 16) : '');
  const [status, setStatus] = useState<'ativo' | 'pausado'>(torneio?.status === 'pausado' ? 'pausado' : 'ativo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !dataInicio || !dataFim) return;
    onSave({ nome: nome.trim(), data_inicio: new Date(dataInicio).toISOString(), data_fim: new Date(dataFim).toISOString(), status });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card-dark-elevated w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-surface-300/20">
          <h2 className="text-[15px] font-semibold text-txt font-display">
            {torneio ? 'Editar Torneio' : 'Novo Torneio'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Nome do Torneio *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Torneio Semanal #1" className="input-dark w-full" required />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Data e Hora Inicio *</label>
            <input type="datetime-local" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="input-dark w-full" required />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Data e Hora Fim *</label>
            <input type="datetime-local" value={dataFim} onChange={e => setDataFim(e.target.value)} className="input-dark w-full" required />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'ativo' | 'pausado')} className="input-dark w-full">
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-xl transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !nome.trim() || !dataInicio || !dataFim}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-accent hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {torneio ? 'Salvar' : 'Criar Torneio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Confirm Modal ──────────────────────────────────────────────────

const ConfirmModal: React.FC<{
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}> = ({ title, message, confirmLabel, confirmColor = 'bg-rose-500 hover:bg-rose-600', onConfirm, onClose, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <div className="relative card-dark-elevated w-full max-w-sm animate-slide-up p-5">
      <h3 className="text-[15px] font-semibold text-txt font-display mb-2">{title}</h3>
      <p className="text-[13px] text-txt-secondary mb-5">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-xl transition-colors">
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-50', confirmColor)}
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ── Enviar Ranking Modal ───────────────────────────────────────────

interface EnviarRankingModalProps {
  ranking: RankingEntry[];
  torneio: TorneioOption | undefined;
  dataInicio: string;
  dataFim: string;
  onClose: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

const EnviarRankingModal: React.FC<EnviarRankingModalProps> = ({ ranking, torneio, dataInicio, dataFim, onClose, showToast }) => {
  const [instancias, setInstancias] = useState<InstanciaWpp[]>([]);
  const [instSelecionada, setInstSelecionada] = useState('');
  const [numDestino, setNumDestino] = useState('');
  const [formato, setFormato] = useState<'top10' | 'completo'>('top10');
  const [enviando, setEnviando] = useState(false);
  const [loadingInst, setLoadingInst] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ranking_envio_prefs');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.numDestino) setNumDestino(prefs.numDestino);
        if (prefs.instancia) setInstSelecionada(prefs.instancia);
      } catch { /* ignore */ }
    }
  }, []);

  // Fetch instancias
  useEffect(() => {
    (async () => {
      setLoadingInst(true);
      const { data } = await supabase
        .from('whatsapp_rotacao')
        .select('id, nome, numero, instancia, token, ativo')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      const list = (data as InstanciaWpp[]) || [];
      setInstancias(list);
      if (list.length > 0) {
        const savedInst = localStorage.getItem('ranking_envio_prefs');
        let preselect = '';
        if (savedInst) {
          try { preselect = JSON.parse(savedInst).instancia || ''; } catch { /* ignore */ }
        }
        if (preselect && list.find(i => i.id === preselect)) {
          setInstSelecionada(preselect);
        } else {
          setInstSelecionada(list[0].id);
        }
      }
      setLoadingInst(false);
    })();
  }, []);

  const instObj = instancias.find(i => i.id === instSelecionada);
  const mensagemPreview = torneio ? buildRankingMsg(ranking, torneio.nome, dataInicio, dataFim, formato === 'top10') : '';

  const handleEnviar = async () => {
    if (!instObj || !numDestino.trim() || !torneio) return;
    setEnviando(true);

    // Save prefs
    localStorage.setItem('ranking_envio_prefs', JSON.stringify({ numDestino: numDestino.trim(), instancia: instSelecionada }));

    try {
      const res = await fetch('http://187.77.61.4:5678/webhook/ranking-torneio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instancia: instObj.instancia,
          token: instObj.token.trim(),
          numero_instancia: instObj.numero,
          numero_destino: numDestino.replace(/\D/g, ''),
          mensagem: mensagemPreview,
          torneio_nome: torneio.nome,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast('success', 'Ranking enviado com sucesso!');
      onClose();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao enviar ranking');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card-dark-elevated w-full max-w-lg animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-surface-300/20 shrink-0">
          <h2 className="text-[15px] font-semibold text-txt font-display flex items-center gap-2">
            <Send className="w-4 h-4 text-accent" />
            Enviar Ranking via WhatsApp
          </h2>
          <button onClick={onClose} className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Instancia *</label>
            {loadingInst ? (
              <div className="h-10 bg-surface-200/40 rounded-xl animate-pulse" />
            ) : (
              <select value={instSelecionada} onChange={e => setInstSelecionada(e.target.value)} className="input-dark w-full">
                {instancias.map(i => (
                  <option key={i.id} value={i.id}>{i.nome} ({i.instancia})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Numero Destino *</label>
            <input
              type="text"
              value={numDestino}
              onChange={e => setNumDestino(e.target.value.replace(/\D/g, ''))}
              placeholder="Ex: 5511999999999"
              className="input-dark w-full"
              maxLength={15}
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Formato</label>
            <select value={formato} onChange={e => setFormato(e.target.value as 'top10' | 'completo')} className="input-dark w-full">
              <option value="top10">Top 10</option>
              <option value="completo">Ranking completo</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">Preview da Mensagem</label>
            <textarea
              readOnly
              value={mensagemPreview}
              className="w-full rounded-xl border border-surface-300/20 bg-[#0a0a0a] text-[12px] text-txt-secondary font-mono p-3 resize-none"
              style={{ minHeight: 180, maxHeight: 300 }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-surface-300/20 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleEnviar}
            disabled={enviando || !instObj || !numDestino.trim() || numDestino.length < 10}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-accent hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────

export const Torneios: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('torneios');
  const { toast, showToast, hideToast } = useToast();

  // Data
  const [torneios, setTorneios] = useState<Torneio[]>([]);
  const [resumo, setResumo] = useState<ResumoAtivo>({ torneio: null, totalParticipantes: 0, totalGreens: 0, somaPagamentos: 0 });
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Torneio | null>(null);
  const [saving, setSaving] = useState(false);

  // Confirm state
  const [confirmAction, setConfirmAction] = useState<{ type: 'encerrar' | 'pausar' | 'retomar' | 'excluir'; torneio: Torneio } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Countdown
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  // Ranking state
  const [rankTorneioId, setRankTorneioId] = useState<string>('');
  const [rankTorneios, setRankTorneios] = useState<TorneioOption[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [rankLoading, setRankLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Participantes state
  const [partTorneioId, setPartTorneioId] = useState<string>('');
  const [partTorneios, setPartTorneios] = useState<TorneioOption[]>([]);
  const [participantes, setParticipantes] = useState<RankingEntry[]>([]);
  const [partLoading, setPartLoading] = useState(false);
  const [partBusca, setPartBusca] = useState('');
  const [partSort, setPartSort] = useState<{ col: string; asc: boolean }>({ col: 'soma_pagamentos', asc: false });
  const [expandedPart, setExpandedPart] = useState<string | null>(null);
  const [expandedGreens, setExpandedGreens] = useState<GreenEntry[]>([]);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [editIdContaModal, setEditIdContaModal] = useState<RankingEntry | null>(null);
  const [editIdContaVal, setEditIdContaVal] = useState('');
  const [editIdContaSaving, setEditIdContaSaving] = useState(false);
  const [partDropdown, setPartDropdown] = useState<string | null>(null);
  const partDropdownRef = useRef<HTMLDivElement>(null);
  const [removePartConfirm, setRemovePartConfirm] = useState<RankingEntry | null>(null);
  const [removePartLoading, setRemovePartLoading] = useState(false);

  // Enviar Ranking modal
  const [enviarRankingOpen, setEnviarRankingOpen] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Todos os torneios
      const { data: allTorneios } = await supabase
        .from('torneios')
        .select('*')
        .order('created_at', { ascending: false });

      setTorneios((allTorneios as Torneio[]) || []);

      // Torneio ativo
      const ativo = (allTorneios as Torneio[])?.find(t => t.status === 'ativo') || null;

      if (ativo) {
        // Greens do torneio ativo
        const { data: greensData } = await supabase
          .from('greens')
          .select('participante_id, valor_green')
          .eq('torneio_id', ativo.id);

        const greens = greensData || [];
        const participantesUnicos = new Set(greens.map(g => (g as any).participante_id)).size;
        const soma = greens.reduce((acc, g) => acc + (Number((g as any).valor_green) || 0), 0);

        setResumo({ torneio: ativo, totalParticipantes: participantesUnicos, totalGreens: greens.length, somaPagamentos: soma });
      } else {
        setResumo({ torneio: null, totalParticipantes: 0, totalGreens: 0, somaPagamentos: 0 });
      }
    } catch {
      showToast('error', 'Erro ao carregar torneios');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    if (!resumo.torneio) { setCountdown(null); return; }
    const tick = () => setCountdown(calcCountdown(resumo.torneio!.data_fim));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resumo.torneio]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Ranking fetch ─────────────────────────────────────────────

  const fetchRankTorneios = useCallback(async () => {
    const { data } = await supabase
      .from('torneios')
      .select('id, nome, status')
      .order('created_at', { ascending: false });
    const list = (data as TorneioOption[]) || [];
    setRankTorneios(list);
    // Pre-select active tournament
    if (!rankTorneioId || !list.find(t => t.id === rankTorneioId)) {
      const ativo = list.find(t => t.status === 'ativo');
      if (ativo) setRankTorneioId(ativo.id);
      else if (list.length > 0) setRankTorneioId(list[0].id);
    }
  }, [rankTorneioId]);

  const fetchRanking = useCallback(async (torneioId?: string) => {
    const tid = torneioId || rankTorneioId;
    if (!tid) return;
    setRankLoading(true);
    try {
      const { data } = await supabase
        .from('ranking_torneio')
        .select('*')
        .eq('torneio_id', tid)
        .order('soma_pagamentos', { ascending: false });
      setRanking((data as RankingEntry[]) || []);
    } catch {
      showToast('error', 'Erro ao carregar ranking');
    } finally {
      setRankLoading(false);
    }
  }, [rankTorneioId, showToast]);

  // Load ranking torneios when tab changes
  useEffect(() => {
    if (activeTab === 'ranking') fetchRankTorneios();
  }, [activeTab, fetchRankTorneios]);

  // Fetch ranking when torneio selected
  useEffect(() => {
    if (activeTab === 'ranking' && rankTorneioId) fetchRanking(rankTorneioId);
  }, [activeTab, rankTorneioId, fetchRanking]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    if (autoRefresh && activeTab === 'ranking' && rankTorneioId) {
      autoRefreshRef.current = setInterval(() => fetchRanking(rankTorneioId), 30000);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [autoRefresh, activeTab, rankTorneioId, fetchRanking]);

  // ── Participantes fetch ──────────────────────────────────────

  const fetchPartTorneios = useCallback(async () => {
    const { data } = await supabase
      .from('torneios')
      .select('id, nome, status')
      .order('created_at', { ascending: false });
    const list = (data as TorneioOption[]) || [];
    setPartTorneios(list);
    if (!partTorneioId || !list.find(t => t.id === partTorneioId)) {
      const ativo = list.find(t => t.status === 'ativo');
      if (ativo) setPartTorneioId(ativo.id);
      else if (list.length > 0) setPartTorneioId(list[0].id);
    }
  }, [partTorneioId]);

  const fetchParticipantes = useCallback(async (torneioId?: string) => {
    const tid = torneioId || partTorneioId;
    if (!tid) return;
    setPartLoading(true);
    try {
      const { data } = await supabase
        .from('ranking_torneio')
        .select('*')
        .eq('torneio_id', tid)
        .order('soma_pagamentos', { ascending: false });
      setParticipantes((data as RankingEntry[]) || []);
    } catch {
      showToast('error', 'Erro ao carregar participantes');
    } finally {
      setPartLoading(false);
    }
  }, [partTorneioId, showToast]);

  const fetchGreensParticipante = useCallback(async (participanteId: string) => {
    if (!partTorneioId) return;
    setExpandedLoading(true);
    try {
      const { data } = await supabase
        .from('greens')
        .select('*')
        .eq('torneio_id', partTorneioId)
        .eq('participante_id', participanteId)
        .order('data_hora_aposta', { ascending: false });
      setExpandedGreens((data as GreenEntry[]) || []);
    } catch {
      showToast('error', 'Erro ao carregar greens');
    } finally {
      setExpandedLoading(false);
    }
  }, [partTorneioId, showToast]);

  useEffect(() => {
    if (activeTab === 'participantes') fetchPartTorneios();
  }, [activeTab, fetchPartTorneios]);

  useEffect(() => {
    if (activeTab === 'participantes' && partTorneioId) {
      fetchParticipantes(partTorneioId);
      setExpandedPart(null);
    }
  }, [activeTab, partTorneioId, fetchParticipantes]);

  // Close part dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (partDropdownRef.current && !partDropdownRef.current.contains(e.target as Node)) {
        setPartDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExpandParticipante = (id: string) => {
    if (expandedPart === id) {
      setExpandedPart(null);
      setExpandedGreens([]);
    } else {
      setExpandedPart(id);
      fetchGreensParticipante(id);
    }
  };

  const handleEditIdConta = async () => {
    if (!editIdContaModal) return;
    setEditIdContaSaving(true);
    try {
      const { error } = await supabase
        .from('participantes')
        .update({ id_conta: editIdContaVal.trim() || null })
        .eq('id', editIdContaModal.participante_id);
      if (error) throw error;
      showToast('success', 'ID Conta atualizado');
      setEditIdContaModal(null);
      fetchParticipantes();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao atualizar');
    } finally {
      setEditIdContaSaving(false);
    }
  };

  const handleRemoveParticipante = async () => {
    if (!removePartConfirm || !partTorneioId) return;
    setRemovePartLoading(true);
    try {
      const { error } = await supabase
        .from('greens')
        .delete()
        .eq('torneio_id', partTorneioId)
        .eq('participante_id', removePartConfirm.participante_id);
      if (error) throw error;
      showToast('success', 'Participante removido do torneio');
      setRemovePartConfirm(null);
      setExpandedPart(null);
      fetchParticipantes();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao remover');
    } finally {
      setRemovePartLoading(false);
    }
  };

  // Filtered & sorted participantes
  const filteredParticipantes = (() => {
    let list = participantes;
    if (partBusca.trim()) {
      const q = partBusca.toLowerCase();
      list = list.filter(p =>
        (p.participante_nome || '').toLowerCase().includes(q) ||
        p.telefone_whatsapp.includes(q) ||
        (p.id_conta || '').toLowerCase().includes(q)
      );
    }
    const sorted = [...list].sort((a, b) => {
      const col = partSort.col as keyof RankingEntry;
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return partSort.asc ? av - bv : bv - av;
      return partSort.asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return sorted;
  })();

  const partResumo = {
    total: participantes.length,
    comId: participantes.filter(p => p.id_conta && p.id_conta.trim()).length,
    semId: participantes.filter(p => !p.id_conta || !p.id_conta.trim()).length,
  };

  const handlePartSort = (col: string) => {
    setPartSort(prev => prev.col === col ? { col, asc: !prev.asc } : { col, asc: false });
  };

  const SortIcon: React.FC<{ col: string }> = ({ col }) => {
    if (partSort.col !== col) return null;
    return partSort.asc ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  // ── Actions ────────────────────────────────────────────────────

  const handleSave = async (data: { nome: string; data_inicio: string; data_fim: string; status: 'ativo' | 'pausado' }) => {
    setSaving(true);
    try {
      // Se vai ativar, checar se já existe outro ativo
      if (data.status === 'ativo') {
        const outroAtivo = torneios.find(t => t.status === 'ativo' && t.id !== editando?.id);
        if (outroAtivo) {
          // Encerrar o anterior
          await supabase.from('torneios').update({ status: 'encerrado' }).eq('id', outroAtivo.id);
        }
      }

      if (editando) {
        const { error } = await supabase.from('torneios').update(data).eq('id', editando.id);
        if (error) throw error;
        showToast('success', 'Torneio atualizado');
      } else {
        const { error } = await supabase.from('torneios').insert(data);
        if (error) throw error;
        showToast('success', 'Torneio criado');
      }

      setModalOpen(false);
      setEditando(null);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao salvar torneio');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    const { type, torneio } = confirmAction;

    try {
      if (type === 'encerrar') {
        await supabase.from('torneios').update({ status: 'encerrado' }).eq('id', torneio.id);
        showToast('success', 'Torneio encerrado');
      } else if (type === 'pausar') {
        await supabase.from('torneios').update({ status: 'pausado' }).eq('id', torneio.id);
        showToast('success', 'Torneio pausado');
      } else if (type === 'retomar') {
        // Checar se já existe outro ativo
        const outroAtivo = torneios.find(t => t.status === 'ativo' && t.id !== torneio.id);
        if (outroAtivo) {
          await supabase.from('torneios').update({ status: 'encerrado' }).eq('id', outroAtivo.id);
        }
        await supabase.from('torneios').update({ status: 'ativo' }).eq('id', torneio.id);
        showToast('success', 'Torneio retomado');
      } else if (type === 'excluir') {
        const { count } = await supabase.from('greens').select('*', { count: 'exact', head: true }).eq('torneio_id', torneio.id);
        if (count && count > 0) {
          showToast('error', `Nao e possivel excluir: ${count} greens vinculados`);
          setConfirmAction(null);
          setConfirmLoading(false);
          return;
        }
        await supabase.from('torneios').delete().eq('id', torneio.id);
        showToast('success', 'Torneio excluido');
      }

      setConfirmAction(null);
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Erro na operacao');
    } finally {
      setConfirmLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────

  const confirmMessages: Record<string, { title: string; message: string; label: string; color?: string }> = {
    encerrar: { title: 'Encerrar Torneio', message: `Deseja encerrar "${confirmAction?.torneio.nome}"? Esta acao nao pode ser desfeita.`, label: 'Encerrar', color: 'bg-rose-500 hover:bg-rose-600' },
    pausar: { title: 'Pausar Torneio', message: `Deseja pausar "${confirmAction?.torneio.nome}"?`, label: 'Pausar', color: 'bg-amber-500 hover:bg-amber-600' },
    retomar: { title: 'Retomar Torneio', message: `Deseja reativar "${confirmAction?.torneio.nome}"? Se houver outro torneio ativo, ele sera encerrado.`, label: 'Retomar', color: 'bg-emerald-500 hover:bg-emerald-600' },
    excluir: { title: 'Excluir Torneio', message: `Deseja excluir "${confirmAction?.torneio.nome}" permanentemente? So e possivel se nao houver greens vinculados.`, label: 'Excluir', color: 'bg-rose-500 hover:bg-rose-600' },
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Torneios" subtitle="Gerencie torneios, rankings e participantes" />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-50/80 rounded-xl border border-surface-300/10 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
              activeTab === tab.key
                ? 'bg-surface-200/60 text-txt shadow-sm border-glow'
                : 'text-txt-muted hover:text-txt-secondary hover:bg-surface-200/20'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Aba Torneios ───────────────────────────────────── */}
      {activeTab === 'torneios' && (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 — Torneio Ativo */}
            <div className="card-dark p-5 group transition-all duration-500 relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-emerald-500/40 to-transparent" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl ring-1 bg-emerald-500/10 text-emerald-400 ring-emerald-500/20">
                  <Trophy className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </div>
                {resumo.torneio && <StatusBadge status={resumo.torneio.status} />}
              </div>
              <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-[0.08em] mb-1">Torneio Ativo</p>
              <div className="text-lg font-bold text-txt font-display tracking-tight leading-tight">
                {loading ? (
                  <div className="h-5 w-32 bg-surface-200/40 rounded animate-pulse" />
                ) : resumo.torneio ? resumo.torneio.nome : (
                  <span className="text-txt-dim text-sm font-normal">Nenhum torneio ativo</span>
                )}
              </div>
              {resumo.torneio && (
                <p className="text-[11px] text-txt-dim mt-1">
                  {fmtDate(resumo.torneio.data_inicio)} — {fmtDate(resumo.torneio.data_fim)}
                </p>
              )}
            </div>

            {/* Card 2 — Tempo Restante */}
            <div className="card-dark p-5 group transition-all duration-500 relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/40 to-transparent" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl ring-1 bg-cyan-500/10 text-cyan-400 ring-cyan-500/20">
                  <Clock className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-[0.08em] mb-1">Tempo Restante</p>
              {loading ? (
                <div className="h-8 w-40 bg-surface-200/40 rounded animate-pulse" />
              ) : !resumo.torneio ? (
                <span className="text-txt-dim text-sm">—</span>
              ) : countdown ? (
                <div className="flex gap-3 mt-1">
                  {[
                    { val: countdown.d, label: 'd' },
                    { val: countdown.h, label: 'h' },
                    { val: countdown.m, label: 'm' },
                    { val: countdown.s, label: 's' },
                  ].map(u => (
                    <div key={u.label} className="text-center">
                      <div className="text-xl font-bold text-txt font-display tabular-nums">{String(u.val).padStart(2, '0')}</div>
                      <div className="text-[10px] text-txt-muted uppercase">{u.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-rose-400 text-sm font-semibold">Encerrado</span>
              )}
            </div>

            {/* Card 3 — Participantes */}
            <div className="card-dark p-5 group transition-all duration-500 relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-amber-500/40 to-transparent" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl ring-1 bg-amber-500/10 text-amber-400 ring-amber-500/20">
                  <Users className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-[0.08em] mb-1">Participantes</p>
              <div className="text-[2rem] font-bold text-txt font-display tracking-tight leading-none">
                {loading ? <div className="h-8 w-12 bg-surface-200/40 rounded animate-pulse" /> : resumo.totalParticipantes}
              </div>
              <p className="text-[11px] text-txt-dim mt-1">com greens registrados</p>
            </div>

            {/* Card 4 — Greens Registrados */}
            <div className="card-dark p-5 group transition-all duration-500 relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-rose-500/40 to-transparent" />
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl ring-1 bg-rose-500/10 text-rose-400 ring-rose-500/20">
                  <Zap className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-[0.08em] mb-1">Greens Registrados</p>
              <div className="text-[2rem] font-bold text-txt font-display tracking-tight leading-none">
                {loading ? <div className="h-8 w-12 bg-surface-200/40 rounded animate-pulse" /> : resumo.totalGreens}
              </div>
              <p className="text-[11px] text-txt-dim mt-1">
                {loading ? '' : fmtBRL(resumo.somaPagamentos) + ' em pagamentos'}
              </p>
            </div>
          </div>

          {/* Botão Novo Torneio + Tabela */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-txt font-display">Todos os Torneios</h3>
            <button
              onClick={() => { setEditando(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-accent hover:bg-accent/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Torneio
            </button>
          </div>

          {/* Tabela */}
          <div className="card-dark overflow-hidden relative" ref={dropdownRef}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-300/20">
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Nome</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Inicio</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Fim</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-surface-300/10">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-5 py-4"><div className="h-4 w-24 bg-surface-200/40 rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : torneios.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-txt-muted">
                        Nenhum torneio cadastrado
                      </td>
                    </tr>
                  ) : (
                    torneios.map(t => (
                      <tr key={t.id} className="border-b border-surface-300/10 hover:bg-surface-200/20 transition-colors duration-150 group">
                        <td className="px-5 py-4 text-sm font-medium text-txt group-hover:text-accent transition-colors">{t.nome}</td>
                        <td className="px-5 py-4 text-[12px] text-txt-secondary font-mono">{fmtDate(t.data_inicio)}</td>
                        <td className="px-5 py-4 text-[12px] text-txt-secondary font-mono">{fmtDate(t.data_fim)}</td>
                        <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                        <td className="px-5 py-4 text-right relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === t.id ? null : t.id)}
                            className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-lg transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {openDropdown === t.id && (
                            <div className="absolute right-5 top-12 z-40 w-44 py-1.5 rounded-xl border border-surface-300/20 bg-surface-50 shadow-xl animate-slide-up">
                              <button
                                onClick={() => { setOpenDropdown(null); setEditando(t); setModalOpen(true); }}
                                className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-txt-secondary hover:bg-surface-200/40 hover:text-txt transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Editar
                              </button>

                              {t.status === 'ativo' && (
                                <>
                                  <button
                                    onClick={() => { setOpenDropdown(null); setConfirmAction({ type: 'pausar', torneio: t }); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-amber-400 hover:bg-surface-200/40 transition-colors"
                                  >
                                    <Pause className="w-3.5 h-3.5" /> Pausar
                                  </button>
                                  <button
                                    onClick={() => { setOpenDropdown(null); setConfirmAction({ type: 'encerrar', torneio: t }); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-rose-400 hover:bg-surface-200/40 transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Encerrar
                                  </button>
                                </>
                              )}

                              {t.status === 'pausado' && (
                                <>
                                  <button
                                    onClick={() => { setOpenDropdown(null); setConfirmAction({ type: 'retomar', torneio: t }); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-emerald-400 hover:bg-surface-200/40 transition-colors"
                                  >
                                    <Play className="w-3.5 h-3.5" /> Retomar
                                  </button>
                                  <button
                                    onClick={() => { setOpenDropdown(null); setConfirmAction({ type: 'encerrar', torneio: t }); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-rose-400 hover:bg-surface-200/40 transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Encerrar
                                  </button>
                                </>
                              )}

                              <div className="h-px bg-surface-300/15 my-1" />
                              <button
                                onClick={() => { setOpenDropdown(null); setConfirmAction({ type: 'excluir', torneio: t }); }}
                                className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-rose-400 hover:bg-surface-200/40 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── Aba Ranking ────────────────────────────────────── */}
      {activeTab === 'ranking' && (
        <>
          {/* Seletor + controles */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={rankTorneioId}
              onChange={e => setRankTorneioId(e.target.value)}
              className="input-dark min-w-[220px]"
            >
              {rankTorneios.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nome} {t.status === 'ativo' ? '(Ativo)' : t.status === 'pausado' ? '(Pausado)' : ''}
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchRanking()}
              disabled={rankLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-txt-secondary hover:text-txt hover:bg-surface-200/40 border border-surface-300/20 transition-colors"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', rankLoading && 'animate-spin')} />
              Atualizar
            </button>

            <button
              onClick={() => setEnviarRankingOpen(true)}
              disabled={ranking.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar Ranking
            </button>

            <label className="flex items-center gap-2 cursor-pointer ml-auto">
              <span className="text-[12px] text-txt-muted">Auto-refresh</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={autoRefresh}
                  onChange={e => setAutoRefresh(e.target.checked)}
                />
                <div className="w-9 h-5 bg-surface-300/40 rounded-full peer peer-checked:bg-accent/30 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-txt-dim after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:bg-accent"></div>
              </div>
              {autoRefresh && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </label>
          </div>

          {/* Content */}
          {rankLoading && ranking.length === 0 ? (
            <div className="space-y-4">
              {/* Podium skeleton */}
              <div className="flex justify-center items-end gap-4 py-8">
                {[140, 180, 140].map((h, i) => (
                  <div key={i} className="w-48 rounded-2xl bg-surface-200/20 animate-pulse" style={{ height: h }} />
                ))}
              </div>
              {/* Table skeleton */}
              <div className="card-dark overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 px-5 py-4 border-b border-surface-300/10">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="h-4 flex-1 bg-surface-200/40 rounded animate-pulse" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : ranking.length === 0 ? (
            <div className="card-dark p-12 flex flex-col items-center justify-center">
              <Trophy className="w-12 h-12 text-txt-muted/40 mb-4" />
              <p className="text-sm text-txt-muted">Nenhum participante registrou greens neste torneio ainda</p>
            </div>
          ) : (
            <>
              {/* Pódio */}
              {ranking.length >= 3 ? (
                <div className="flex justify-center items-end gap-4 py-6">
                  {/* 2nd place — left */}
                  <div className="w-52 animate-[fadeScale_0.5s_ease-out_0.1s_both]">
                    <div className="card-dark p-5 rounded-2xl border border-[#C0C0C0]/30 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#C0C0C0]/5 to-transparent pointer-events-none" />
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C0C0C0]/60 to-transparent" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">🥈</span>
                          <span className="text-[11px] font-mono text-[#C0C0C0] font-semibold uppercase tracking-wider">2o Lugar</span>
                        </div>
                        <p className="text-sm font-semibold text-txt truncate">{displayName(ranking[1])}</p>
                        <p className="text-[11px] text-txt-dim font-mono truncate">{ranking[1].id_conta || 'Pendente'}</p>
                        <div className="mt-3 pt-3 border-t border-surface-300/15">
                          <p className="text-lg font-bold text-[#C0C0C0] font-display">{fmtBRL(ranking[1].soma_pagamentos)}</p>
                          <p className="text-[11px] text-txt-dim">{ranking[1].total_greens} greens</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1st place — center (taller) */}
                  <div className="w-56 -mt-6 animate-[fadeScale_0.5s_ease-out_both]">
                    <div className="card-dark p-6 rounded-2xl border border-[#FFD700]/30 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/8 via-[#FFD700]/3 to-transparent pointer-events-none" />
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FFD700]/70 via-[#FFD700]/40 to-transparent" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <Crown className="w-6 h-6 text-[#FFD700]" />
                          <span className="text-[11px] font-mono text-[#FFD700] font-semibold uppercase tracking-wider">1o Lugar</span>
                        </div>
                        <p className="text-base font-semibold text-txt truncate">{displayName(ranking[0])}</p>
                        <p className="text-[11px] text-txt-dim font-mono truncate">{ranking[0].id_conta || 'Pendente'}</p>
                        <div className="mt-4 pt-4 border-t border-[#FFD700]/15">
                          <p className="text-2xl font-bold text-[#FFD700] font-display">{fmtBRL(ranking[0].soma_pagamentos)}</p>
                          <p className="text-[11px] text-txt-dim">{ranking[0].total_greens} greens</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3rd place — right */}
                  <div className="w-48 animate-[fadeScale_0.5s_ease-out_0.2s_both]">
                    <div className="card-dark p-5 rounded-2xl border border-[#CD7F32]/30 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#CD7F32]/5 to-transparent pointer-events-none" />
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#CD7F32]/60 to-transparent" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">🥉</span>
                          <span className="text-[11px] font-mono text-[#CD7F32] font-semibold uppercase tracking-wider">3o Lugar</span>
                        </div>
                        <p className="text-sm font-semibold text-txt truncate">{displayName(ranking[2])}</p>
                        <p className="text-[11px] text-txt-dim font-mono truncate">{ranking[2].id_conta || 'Pendente'}</p>
                        <div className="mt-3 pt-3 border-t border-surface-300/15">
                          <p className="text-lg font-bold text-[#CD7F32] font-display">{fmtBRL(ranking[2].soma_pagamentos)}</p>
                          <p className="text-[11px] text-txt-dim">{ranking[2].total_greens} greens</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Less than 3: show available cards in a row */
                <div className="flex justify-center gap-4 py-6">
                  {ranking.slice(0, 3).map((entry, i) => {
                    const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                    const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
                    return (
                      <div key={entry.participante_id} className="w-52 animate-[fadeScale_0.5s_ease-out_both]">
                        <div className="card-dark p-5 rounded-2xl relative overflow-hidden" style={{ borderColor: `${colors[i]}30`, borderWidth: 1 }}>
                          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(to right, ${colors[i]}99, transparent)` }} />
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-2xl">{medals[i]}</span>
                              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: colors[i] }}>{i + 1}o Lugar</span>
                            </div>
                            <p className="text-sm font-semibold text-txt truncate">{displayName(entry)}</p>
                            <p className="text-[11px] text-txt-dim font-mono truncate">{entry.id_conta || 'Pendente'}</p>
                            <div className="mt-3 pt-3 border-t border-surface-300/15">
                              <p className="text-lg font-bold font-display" style={{ color: colors[i] }}>{fmtBRL(entry.soma_pagamentos)}</p>
                              <p className="text-[11px] text-txt-dim">{entry.total_greens} greens</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tabela completa */}
              <div className="card-dark overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-surface-300/20">
                        <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest w-16">#</th>
                        <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Nome</th>
                        <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">ID Conta</th>
                        <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-center">Greens</th>
                        <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-right">Total Pagamentos</th>
                        <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-right">Lucro Liquido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((entry, i) => {
                        const pos = i + 1;
                        const posColors: Record<number, string> = { 1: 'text-[#FFD700]', 2: 'text-[#C0C0C0]', 3: 'text-[#CD7F32]' };
                        const medals: Record<number, string> = { 1: '\uD83E\uDD47', 2: '\uD83E\uDD48', 3: '\uD83E\uDD49' };
                        const lucro = entry.soma_lucro_liquido;
                        return (
                          <tr key={entry.participante_id} className="border-b border-surface-300/10 hover:bg-surface-200/20 transition-colors duration-150 group">
                            <td className={cn('px-5 py-4 text-sm font-bold font-display', posColors[pos] || 'text-txt-muted')}>
                              {medals[pos] ? <span className="text-base">{medals[pos]}</span> : pos}
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm font-medium text-txt group-hover:text-accent transition-colors">{displayName(entry)}</span>
                            </td>
                            <td className="px-5 py-4">
                              {entry.id_conta ? (
                                <span className="text-[12px] text-txt-secondary font-mono">{entry.id_conta}</span>
                              ) : (
                                <span className="text-[12px] text-amber-400 font-mono">Pendente</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="text-sm font-semibold text-txt tabular-nums">{entry.total_greens}</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="text-sm font-semibold text-txt font-mono tabular-nums">{fmtBRL(entry.soma_pagamentos)}</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={cn('text-sm font-semibold font-mono tabular-nums', lucro >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                {fmtBRL(lucro)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ─── Aba Participantes ──────────────────────────────── */}
      {activeTab === 'participantes' && (
        <>
          {/* Seletor de torneio */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={partTorneioId}
              onChange={e => setPartTorneioId(e.target.value)}
              className="input-dark min-w-[220px]"
            >
              {partTorneios.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nome} {t.status === 'ativo' ? '(Ativo)' : t.status === 'pausado' ? '(Pausado)' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => fetchParticipantes()}
              disabled={partLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-txt-secondary hover:text-txt hover:bg-surface-200/40 border border-surface-300/20 transition-colors"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', partLoading && 'animate-spin')} />
              Atualizar
            </button>
          </div>

          {/* Cards resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-dark p-4 relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/40 to-transparent" />
              <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-[0.08em] mb-1">Total Participantes</p>
              <p className="text-2xl font-bold text-txt font-display">{partLoading ? <span className="inline-block h-7 w-8 bg-surface-200/40 rounded animate-pulse" /> : partResumo.total}</p>
            </div>
            <div className="card-dark p-4 relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-emerald-500/40 to-transparent" />
              <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-[0.08em] mb-1">Com ID Conta</p>
              <p className="text-2xl font-bold text-emerald-400 font-display">{partLoading ? <span className="inline-block h-7 w-8 bg-surface-200/40 rounded animate-pulse" /> : partResumo.comId}</p>
            </div>
            <div className="card-dark p-4 relative">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-amber-500/40 to-transparent" />
              <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-[0.08em] mb-1">ID Pendente</p>
              <p className={cn('text-2xl font-bold font-display', partResumo.semId > 0 ? 'text-amber-400' : 'text-txt')}>
                {partLoading ? <span className="inline-block h-7 w-8 bg-surface-200/40 rounded animate-pulse" /> : partResumo.semId}
              </p>
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
            <input
              type="text"
              value={partBusca}
              onChange={e => setPartBusca(e.target.value)}
              placeholder="Buscar por nome, telefone ou ID conta..."
              className="input-dark w-full pl-10"
            />
          </div>

          {/* Tabela */}
          {partLoading && participantes.length === 0 ? (
            <div className="card-dark overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-5 py-4 border-b border-surface-300/10">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="h-4 flex-1 bg-surface-200/40 rounded animate-pulse" />
                  ))}
                </div>
              ))}
            </div>
          ) : filteredParticipantes.length === 0 ? (
            <div className="card-dark p-12 flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-txt-muted/40 mb-4" />
              <p className="text-sm text-txt-muted">
                {participantes.length === 0 ? 'Nenhum participante neste torneio' : 'Nenhum resultado encontrado'}
              </p>
            </div>
          ) : (
            <div className="card-dark overflow-hidden" ref={partDropdownRef}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-surface-300/20">
                      <th onClick={() => handlePartSort('participante_nome')} className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest cursor-pointer hover:text-txt-secondary transition-colors">
                        Nome <SortIcon col="participante_nome" />
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Telefone</th>
                      <th onClick={() => handlePartSort('id_conta')} className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest cursor-pointer hover:text-txt-secondary transition-colors">
                        ID Conta <SortIcon col="id_conta" />
                      </th>
                      <th onClick={() => handlePartSort('total_greens')} className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-center cursor-pointer hover:text-txt-secondary transition-colors">
                        Greens <SortIcon col="total_greens" />
                      </th>
                      <th onClick={() => handlePartSort('soma_pagamentos')} className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-right cursor-pointer hover:text-txt-secondary transition-colors">
                        Total Pagamentos <SortIcon col="soma_pagamentos" />
                      </th>
                      <th onClick={() => handlePartSort('ultimo_green')} className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-right cursor-pointer hover:text-txt-secondary transition-colors">
                        Ultima Atividade <SortIcon col="ultimo_green" />
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipantes.map(p => {
                      const isExpanded = expandedPart === p.participante_id;
                      const pendingId = !p.id_conta || !p.id_conta.trim();
                      return (
                        <React.Fragment key={p.participante_id}>
                          <tr
                            onClick={() => handleExpandParticipante(p.participante_id)}
                            className={cn(
                              'border-b border-surface-300/10 hover:bg-surface-200/20 transition-colors duration-150 group cursor-pointer',
                              pendingId && 'border-l-2 border-l-amber-500/40',
                              isExpanded && 'bg-surface-200/10'
                            )}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-txt group-hover:text-accent transition-colors">{p.participante_nome || fmtPhone(p.telefone_whatsapp)}</span>
                                {pendingId && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[12px] text-txt-secondary font-mono">{fmtPhone(p.telefone_whatsapp)}</td>
                            <td className="px-5 py-4">
                              {pendingId ? (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">Pendente</span>
                              ) : (
                                <span className="text-[12px] text-txt-secondary font-mono">{p.id_conta}</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="text-sm font-semibold text-txt tabular-nums">{p.total_greens}</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="text-sm font-semibold text-txt font-mono tabular-nums">{fmtBRL(p.soma_pagamentos)}</span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="text-[12px] text-txt-secondary">{p.ultimo_green ? fmtRelative(p.ultimo_green) : '—'}</span>
                            </td>
                            <td className="px-5 py-4 text-right relative" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => setPartDropdown(partDropdown === p.participante_id ? null : p.participante_id)}
                                className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-lg transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {partDropdown === p.participante_id && (
                                <div className="absolute right-5 top-12 z-40 w-48 py-1.5 rounded-xl border border-surface-300/20 bg-surface-50 shadow-xl animate-slide-up">
                                  <button
                                    onClick={() => { setPartDropdown(null); handleExpandParticipante(p.participante_id); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-txt-secondary hover:bg-surface-200/40 hover:text-txt transition-colors"
                                  >
                                    <BarChart3 className="w-3.5 h-3.5" /> Ver greens
                                  </button>
                                  <button
                                    onClick={() => { setPartDropdown(null); setEditIdContaVal(p.id_conta || ''); setEditIdContaModal(p); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-txt-secondary hover:bg-surface-200/40 hover:text-txt transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" /> Editar ID Conta
                                  </button>
                                  <div className="h-px bg-surface-300/15 my-1" />
                                  <button
                                    onClick={() => { setPartDropdown(null); setRemovePartConfirm(p); }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 text-[13px] text-rose-400 hover:bg-surface-200/40 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Remover do torneio
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>

                          {/* Expanded greens */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="p-0">
                                <div className="bg-surface-50/50 border-b border-surface-300/10 px-8 py-4 animate-slide-up">
                                  {expandedLoading ? (
                                    <div className="flex items-center gap-2 py-4 justify-center">
                                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                      <span className="text-[13px] text-txt-muted">Carregando greens...</span>
                                    </div>
                                  ) : expandedGreens.length === 0 ? (
                                    <p className="text-[13px] text-txt-muted text-center py-4">Nenhum green encontrado</p>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left">
                                        <thead>
                                          <tr className="border-b border-surface-300/15">
                                            <th className="px-3 py-2 text-[9px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Jogo</th>
                                            <th className="px-3 py-2 text-[9px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Data/Hora</th>
                                            <th className="px-3 py-2 text-[9px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-right">Aposta</th>
                                            <th className="px-3 py-2 text-[9px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-right">Green</th>
                                            <th className="px-3 py-2 text-[9px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-right">Lucro</th>
                                            <th className="px-3 py-2 text-[9px] font-mono font-semibold text-txt-muted uppercase tracking-widest">ID Aposta</th>
                                            <th className="px-3 py-2 text-[9px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Imagem</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {expandedGreens.map(g => {
                                            const lucro = Number(g.valor_green) - Number(g.valor_apostado);
                                            return (
                                              <tr key={g.id} className="border-b border-surface-300/5 hover:bg-surface-200/10 transition-colors">
                                                <td className="px-3 py-2.5 text-[12px] text-txt">{g.jogo}</td>
                                                <td className="px-3 py-2.5 text-[11px] text-txt-secondary font-mono">{fmtDate(g.data_hora_aposta)}</td>
                                                <td className="px-3 py-2.5 text-[12px] text-txt-secondary font-mono text-right tabular-nums">{fmtBRL(Number(g.valor_apostado))}</td>
                                                <td className="px-3 py-2.5 text-[12px] text-emerald-400 font-mono font-semibold text-right tabular-nums">{fmtBRL(Number(g.valor_green))}</td>
                                                <td className={cn('px-3 py-2.5 text-[12px] font-mono font-semibold text-right tabular-nums', lucro >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                                  {fmtBRL(lucro)}
                                                </td>
                                                <td className="px-3 py-2.5 text-[11px] text-txt-dim font-mono truncate max-w-[120px]">{g.id_aposta}</td>
                                                <td className="px-3 py-2.5 text-[11px] text-txt-dim font-mono truncate max-w-[100px]">{g.imagem_referencia || '—'}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {modalOpen && (
        <TorneioModal
          torneio={editando}
          onClose={() => { setModalOpen(false); setEditando(null); }}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmMessages[confirmAction.type].title}
          message={confirmMessages[confirmAction.type].message}
          confirmLabel={confirmMessages[confirmAction.type].label}
          confirmColor={confirmMessages[confirmAction.type].color}
          onConfirm={handleConfirmAction}
          onClose={() => setConfirmAction(null)}
          loading={confirmLoading}
        />
      )}

      {/* Edit ID Conta Modal */}
      {editIdContaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditIdContaModal(null)} />
          <div className="relative card-dark-elevated w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-surface-300/20">
              <h2 className="text-[15px] font-semibold text-txt font-display">Editar ID Conta</h2>
              <button onClick={() => setEditIdContaModal(null)} className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[13px] text-txt-secondary">
                Participante: <span className="text-txt font-medium">{displayName(editIdContaModal)}</span>
              </p>
              <div>
                <label className="block text-[10px] font-mono font-semibold text-txt-muted mb-2 uppercase tracking-widest">ID da Conta</label>
                <input
                  type="text"
                  value={editIdContaVal}
                  onChange={e => setEditIdContaVal(e.target.value)}
                  placeholder="Ex: 123456789"
                  className="input-dark w-full"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditIdContaModal(null)} className="px-4 py-2 text-[13px] font-medium text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleEditIdConta}
                  disabled={editIdContaSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white bg-accent hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  {editIdContaSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove participante confirm */}
      {removePartConfirm && (
        <ConfirmModal
          title="Remover Participante"
          message={`Deseja remover ${displayName(removePartConfirm)} deste torneio? Todos os greens dele neste torneio serao excluidos.`}
          confirmLabel="Remover"
          confirmColor="bg-rose-500 hover:bg-rose-600"
          onConfirm={handleRemoveParticipante}
          onClose={() => setRemovePartConfirm(null)}
          loading={removePartLoading}
        />
      )}

      {/* Enviar Ranking Modal */}
      {enviarRankingOpen && (() => {
        const selTorneioFull = torneios.find(t => t.id === rankTorneioId);
        const selTorneioOpt: TorneioOption | undefined = selTorneioFull
          ? { id: selTorneioFull.id, nome: selTorneioFull.nome, status: selTorneioFull.status }
          : rankTorneios.find(t => t.id === rankTorneioId);
        return (
          <EnviarRankingModal
            ranking={ranking}
            torneio={selTorneioOpt}
            dataInicio={selTorneioFull?.data_inicio || ''}
            dataFim={selTorneioFull?.data_fim || ''}
            onClose={() => setEnviarRankingOpen(false)}
            showToast={showToast}
          />
        );
      })()}

      {toast && <Toast toast={toast} onClose={hideToast} />}
    </div>
  );
};
