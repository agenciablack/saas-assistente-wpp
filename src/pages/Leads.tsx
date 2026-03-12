import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { LeadBadge } from '../components/LeadBadge';
import { useLeads, type LeadFiltro } from '../hooks/useLeads';
import { formatTelefone, formatRelativeTime, formatDate, formatTempoNoGrupo, getStatusPremiumLabel } from '../utils/formatters';
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, MessageCircle, Bot, Crown, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import type { StatusLead as StatusLeadUI } from '../types';
import type { StatusPremium } from '../types/database';
import { supabase } from '../backend/client';
import type { LeadRow } from '../types/database';

/** Garante que o número tenha apenas dígitos e comece com 55 */
const toWhatsAppNumber = (telefone: string): string => {
  const digits = telefone.replace(/\D/g, '');
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
};

const FILTER_OPTIONS: { value: LeadFiltro; label: string }[] = [
  { value: 'aguardando_nome', label: 'Aguardando Nome' },
  { value: 'aguardando_cadastro', label: 'Aguardando Cadastro' },
  { value: 'link_enviado', label: 'Link Enviado' },
  { value: 'no_grupo', label: 'No Grupo' },
  { value: 'saiu_grupo', label: 'Saiu do Grupo' },
];

const PREMIUM_STATUS_OPTIONS: { value: StatusPremium; label: string }[] = [
  { value: 'primeiro_audio_enviado', label: 'Primeiro Áudio Enviado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'encerrado', label: 'Encerrado' },
];

const PREMIUM_STATUS_COLORS: Record<StatusPremium, string> = {
  primeiro_audio_enviado: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  em_andamento: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  encerrado: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

type TabKey = 'automatico' | 'premium';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

/** Hook dedicado para leads do assistente premium */
function useLeadsPremium({ busca = '', pagina = 1, limite = 10, filtroStatus, ordenarTempo = 'desc' }: {
  busca?: string;
  pagina?: number;
  limite?: number;
  filtroStatus?: StatusPremium | 'all' | 'sem_status';
  ordenarTempo?: 'asc' | 'desc';
}) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++abortRef.current;
    try {
      setLoading(true);
      const from = (pagina - 1) * limite;
      const to = from + limite - 1;

      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .not('entrou_no_grupo', 'is', null)
        .is('saiu_grupo', null);

      if (filtroStatus === 'sem_status') {
        query = query.is('status_premium', null);
      } else if (filtroStatus && filtroStatus !== 'all') {
        query = query.eq('status_premium', filtroStatus);
      }

      if (busca.trim()) {
        const term = `%${busca.trim()}%`;
        query = query.or(`nome.ilike.${term},telefone.ilike.${term}`);
      }

      // 'desc' = mais tempo (entrou ha mais tempo = ascending timestamp)
      // 'asc' = menos tempo (entrou recentemente = descending timestamp)
      const ascending = ordenarTempo === 'desc';
      query = query
        .order('entrou_no_grupo', { ascending })
        .range(from, to);

      const { data, error, count } = await query;
      if (requestId !== abortRef.current) return;
      if (error) throw new Error(error.message);

      setLeads((data as LeadRow[]) ?? []);
      setTotal(count ?? 0);
    } catch (err: unknown) {
      if (requestId !== abortRef.current) return;
      console.error('Erro ao carregar leads premium:', err);
    } finally {
      if (requestId === abortRef.current) setLoading(false);
    }
  }, [busca, pagina, limite, filtroStatus, ordenarTempo]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('leads-premium-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  return { leads, total, loading, refetch: load };
}

/** Componente de badge para status premium */
const PremiumBadge: React.FC<{ status: StatusPremium }> = ({ status }) => (
  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border whitespace-nowrap tracking-wide ${PREMIUM_STATUS_COLORS[status]}`}>
    {getStatusPremiumLabel(status)}
  </span>
);

/** Dropdown inline para trocar status premium */
const PremiumStatusSelect: React.FC<{ lead: LeadRow; onUpdate: () => void }> = ({ lead, onUpdate }) => {
  const [updating, setUpdating] = useState(false);

  const handleChange = async (newStatus: StatusPremium) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status_premium: newStatus })
        .eq('id', lead.id);
      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Erro ao atualizar status premium:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (lead.status_premium) {
    return (
      <div className="flex items-center gap-2">
        <PremiumBadge status={lead.status_premium as StatusPremium} />
        <select
          className="bg-transparent border border-surface-300/20 rounded-md text-[10px] text-txt-muted px-1 py-0.5 cursor-pointer hover:border-surface-300/40 transition-colors appearance-none"
          value={lead.status_premium}
          onChange={(e) => handleChange(e.target.value as StatusPremium)}
          disabled={updating}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 4px center',
            paddingRight: '16px',
          }}
        >
          {PREMIUM_STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <select
      className="bg-surface-200/30 border border-surface-300/20 rounded-lg text-[11px] text-txt-muted px-2 py-1 cursor-pointer hover:border-accent/30 hover:text-txt transition-all appearance-none"
      value=""
      onChange={(e) => handleChange(e.target.value as StatusPremium)}
      disabled={updating}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
        paddingRight: '24px',
      }}
    >
      <option value="" disabled>Definir status...</option>
      {PREMIUM_STATUS_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
};

export const Leads: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('automatico');

  // === Assistente Automático state ===
  const [searchTerm, setSearchTerm] = useState('');
  const [filtro, setFiltro] = useState<LeadFiltro>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const debouncedSearch = useDebounce(searchTerm, 300);

  const prevSearchRef = useRef(debouncedSearch);
  const prevFiltroRef = useRef(filtro);
  useEffect(() => {
    if (prevSearchRef.current !== debouncedSearch || prevFiltroRef.current !== filtro) {
      setCurrentPage(1);
      prevSearchRef.current = debouncedSearch;
      prevFiltroRef.current = filtro;
    }
  }, [debouncedSearch, filtro]);

  const { leads, total, loading, refetch } = useLeads({
    filtro,
    busca: debouncedSearch,
    pagina: currentPage,
    limite: itemsPerPage,
  });

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  // === Assistente Premium state ===
  const [premiumSearch, setPremiumSearch] = useState('');
  const [premiumFiltro, setPremiumFiltro] = useState<StatusPremium | 'all' | 'sem_status'>('all');
  const [premiumPage, setPremiumPage] = useState(1);
  const [tempoSort, setTempoSort] = useState<'desc' | 'asc'>('desc');
  const debouncedPremiumSearch = useDebounce(premiumSearch, 300);

  const prevPremiumSearchRef = useRef(debouncedPremiumSearch);
  const prevPremiumFiltroRef = useRef(premiumFiltro);
  useEffect(() => {
    if (prevPremiumSearchRef.current !== debouncedPremiumSearch || prevPremiumFiltroRef.current !== premiumFiltro) {
      setPremiumPage(1);
      prevPremiumSearchRef.current = debouncedPremiumSearch;
      prevPremiumFiltroRef.current = premiumFiltro;
    }
  }, [debouncedPremiumSearch, premiumFiltro]);

  const { leads: premiumLeads, total: premiumTotal, loading: premiumLoading, refetch: premiumRefetch } = useLeadsPremium({
    busca: debouncedPremiumSearch,
    pagina: premiumPage,
    limite: itemsPerPage,
    filtroStatus: premiumFiltro,
    ordenarTempo: tempoSort,
  });

  const premiumTotalPages = Math.max(1, Math.ceil(premiumTotal / itemsPerPage));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Todos os Leads"
        subtitle={activeTab === 'automatico' ? `${total} leads encontrados` : `${premiumTotal} leads no grupo`}
        onRefresh={activeTab === 'automatico' ? refetch : premiumRefetch}
        isRefreshing={activeTab === 'automatico' ? loading : premiumLoading}
      />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-50 rounded-xl border border-surface-300/20 w-fit">
        <button
          onClick={() => setActiveTab('automatico')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
            activeTab === 'automatico'
              ? 'bg-accent/10 text-accent shadow-sm border border-accent/20'
              : 'text-txt-muted hover:text-txt hover:bg-surface-200/40'
          }`}
        >
          <Bot className="w-4 h-4" />
          Assistente Automatico
        </button>
        <button
          onClick={() => setActiveTab('premium')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
            activeTab === 'premium'
              ? 'bg-amber-500/10 text-amber-400 shadow-sm border border-amber-500/20'
              : 'text-txt-muted hover:text-txt hover:bg-surface-200/40'
          }`}
        >
          <Crown className="w-4 h-4" />
          Assistente Premium
        </button>
      </div>

      {/* ============================================ */}
      {/* ASSISTENTE AUTOMATICO TAB                    */}
      {/* ============================================ */}
      {activeTab === 'automatico' && (
        <>
          {/* Filters */}
          <div className="card-dark p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-dim" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                className="input-dark pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-txt-dim" />
              <select
                className="input-dark !w-auto pr-8 text-sm appearance-none cursor-pointer"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value as LeadFiltro)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="all">Todos</option>
                {FILTER_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card-dark overflow-hidden relative">
            {loading && leads.length > 0 && (
              <div className="absolute inset-0 bg-surface/50 z-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-300/20">
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Data Entrada</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Lead</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Ultima Interacao</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">No Grupo?</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-center">Mensagem</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && leads.length === 0 && (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skel-${i}`} className="border-b border-surface-300/10 animate-pulse">
                        <td className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-20" /></td>
                        <td className="px-5 py-4">
                          <div className="h-4 bg-white/[0.04] rounded w-32 mb-1" />
                          <div className="h-3 bg-white/[0.03] rounded w-24" />
                        </td>
                        <td className="px-5 py-4"><div className="h-5 bg-white/[0.04] rounded-lg w-24" /></td>
                        <td className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-20" /></td>
                        <td className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-10" /></td>
                        <td className="px-5 py-4"><div className="h-6 bg-white/[0.04] rounded w-6 mx-auto" /></td>
                      </tr>
                    ))
                  )}

                  {!loading && leads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-txt-muted text-sm">
                        Nenhum lead encontrado com os filtros atuais.
                      </td>
                    </tr>
                  )}

                  {leads.map((lead) => {
                    let grupoContent: React.ReactNode;
                    if (lead.entrou_no_grupo && !lead.saiu_grupo) {
                      grupoContent = <span className="text-emerald-400 font-mono text-xs font-semibold">SIM</span>;
                    } else if (lead.saiu_grupo) {
                      grupoContent = <span className="text-rose-400 font-mono text-xs font-semibold">SAIU</span>;
                    } else {
                      grupoContent = <span className="text-txt-dim font-mono text-xs">---</span>;
                    }

                    return (
                      <tr key={lead.id} className="border-b border-surface-300/10 hover:bg-surface-200/20 transition-colors duration-150 group">
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-txt-secondary font-mono text-[12px]">
                          {lead.data_primeiro_contato ? formatDate(lead.data_primeiro_contato) : '-'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-txt group-hover:text-accent transition-colors">{lead.nome || '-'}</span>
                            <span className="text-[11px] text-txt-dim font-mono">{formatTelefone(lead.telefone)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <LeadBadge status={lead.status as StatusLeadUI} />
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-[12px] text-txt-secondary font-mono">
                          {lead.ultima_interacao ? formatRelativeTime(lead.ultima_interacao) : '-'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm">
                          {grupoContent}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <a
                            href={`https://wa.me/${toWhatsAppNumber(lead.telefone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all duration-200"
                            title="Enviar mensagem no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-surface-300/20 flex items-center justify-between">
              <span className="text-[11px] text-txt-muted font-mono">
                {total === 0
                  ? '0 de 0'
                  : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, total)} de ${total}`
                }
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-surface-300/30 rounded-lg hover:bg-surface-200/40 hover:border-surface-300/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-txt-muted hover:text-txt"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-surface-300/30 rounded-lg hover:bg-surface-200/40 hover:border-surface-300/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-txt-muted hover:text-txt"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* ASSISTENTE PREMIUM TAB                       */}
      {/* ============================================ */}
      {activeTab === 'premium' && (
        <>
          {/* Filters */}
          <div className="card-dark p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-dim" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                className="input-dark pl-10"
                value={premiumSearch}
                onChange={(e) => setPremiumSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-txt-dim" />
              <select
                className="input-dark !w-auto pr-8 text-sm appearance-none cursor-pointer"
                value={premiumFiltro}
                onChange={(e) => setPremiumFiltro(e.target.value as StatusPremium | 'all' | 'sem_status')}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                }}
              >
                <option value="all">Todos os Status</option>
                <option value="sem_status">Sem Status</option>
                {PREMIUM_STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card-dark overflow-hidden relative">
            {premiumLoading && premiumLeads.length > 0 && (
              <div className="absolute inset-0 bg-surface/50 z-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-300/20">
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Lead</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Status Funil</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Status Premium</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">
                      <button
                        onClick={() => { setTempoSort(prev => prev === 'desc' ? 'asc' : 'desc'); setPremiumPage(1); }}
                        className="flex items-center gap-1.5 hover:text-txt transition-colors"
                        title={tempoSort === 'desc' ? 'Ordenar: menos tempo no grupo' : 'Ordenar: mais tempo no grupo'}
                      >
                        <Clock className="w-3 h-3" />
                        Tempo no Grupo
                        {tempoSort === 'desc'
                          ? <ArrowDown className="w-3 h-3 text-amber-400" />
                          : <ArrowUp className="w-3 h-3 text-amber-400" />
                        }
                      </button>
                    </th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest">Ultima Interacao</th>
                    <th className="px-5 py-3.5 text-[10px] font-mono font-semibold text-txt-muted uppercase tracking-widest text-center">Mensagem</th>
                  </tr>
                </thead>
                <tbody>
                  {premiumLoading && premiumLeads.length === 0 && (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skel-p-${i}`} className="border-b border-surface-300/10 animate-pulse">
                        <td className="px-5 py-4">
                          <div className="h-4 bg-white/[0.04] rounded w-32 mb-1" />
                          <div className="h-3 bg-white/[0.03] rounded w-24" />
                        </td>
                        <td className="px-5 py-4"><div className="h-5 bg-white/[0.04] rounded-lg w-24" /></td>
                        <td className="px-5 py-4"><div className="h-5 bg-white/[0.04] rounded-lg w-28" /></td>
                        <td className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-16" /></td>
                        <td className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-20" /></td>
                        <td className="px-5 py-4"><div className="h-6 bg-white/[0.04] rounded w-6 mx-auto" /></td>
                      </tr>
                    ))
                  )}

                  {!premiumLoading && premiumLeads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-txt-muted text-sm">
                        Nenhum lead premium encontrado.
                      </td>
                    </tr>
                  )}

                  {premiumLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-surface-300/10 hover:bg-surface-200/20 transition-colors duration-150 group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-txt group-hover:text-amber-400 transition-colors">{lead.nome || '-'}</span>
                          <span className="text-[11px] text-txt-dim font-mono">{formatTelefone(lead.telefone)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <LeadBadge status={lead.status as StatusLeadUI} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <PremiumStatusSelect lead={lead} onUpdate={premiumRefetch} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {lead.entrou_no_grupo ? (
                          <span className="text-[12px] font-mono text-emerald-400 font-semibold">
                            {formatTempoNoGrupo(lead.entrou_no_grupo)}
                          </span>
                        ) : (
                          <span className="text-txt-dim font-mono text-xs">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-[12px] text-txt-secondary font-mono">
                        {lead.ultima_interacao ? formatRelativeTime(lead.ultima_interacao) : '-'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <a
                          href={`https://wa.me/${toWhatsAppNumber(lead.telefone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all duration-200"
                          title="Enviar mensagem no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-surface-300/20 flex items-center justify-between">
              <span className="text-[11px] text-txt-muted font-mono">
                {premiumTotal === 0
                  ? '0 de 0'
                  : `${(premiumPage - 1) * itemsPerPage + 1}-${Math.min(premiumPage * itemsPerPage, premiumTotal)} de ${premiumTotal}`
                }
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPremiumPage(p => Math.max(1, p - 1))}
                  disabled={premiumPage === 1}
                  className="p-2 border border-surface-300/30 rounded-lg hover:bg-surface-200/40 hover:border-surface-300/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-txt-muted hover:text-txt"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPremiumPage(p => Math.min(premiumTotalPages, p + 1))}
                  disabled={premiumPage === premiumTotalPages}
                  className="p-2 border border-surface-300/30 rounded-lg hover:bg-surface-200/40 hover:border-surface-300/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-txt-muted hover:text-txt"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
