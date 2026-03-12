# Referencia Completa — Secao Leads

> Este arquivo contem o codigo completo de todos os componentes, hooks, tipos e utilitarios usados na pagina de Leads.

---

## 1. Pagina Leads — `src/pages/Leads.tsx`

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { LeadBadge } from '../components/LeadBadge';
import { useLeads, type LeadFiltro } from '../hooks/useLeads';
import { formatTelefone, formatRelativeTime, formatDate, formatTempoNoGrupo, getStatusPremiumLabel } from '../utils/formatters';
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, MessageCircle, Bot, Crown, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import type { StatusLead as StatusLeadUI } from '../types';
import type { StatusPremium } from '../types/database';
import { supabase } from '../lib/supabase';
import type { LeadRow } from '../types/database';

/** Garante que o numero tenha apenas digitos e comece com 55 */
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
  { value: 'primeiro_audio_enviado', label: 'Primeiro Audio Enviado' },
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
    } catch (err: any) {
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

  // === Assistente Automatico state ===
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
```

---

## 2. Hook useLeads — `src/hooks/useLeads.ts`

```tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useVisibilityRefresh } from './useVisibilityRefresh';
import type { LeadRow } from '../types/database';

export type LeadFiltro =
  | 'all'
  | 'aguardando_nome'
  | 'aguardando_cadastro'
  | 'link_enviado'
  | 'no_grupo'
  | 'saiu_grupo';

interface UseLeadsParams {
  filtro?: LeadFiltro;
  busca?: string;
  pagina?: number;
  limite?: number;
}

interface UseLeadsReturn {
  leads: LeadRow[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLeads({
  filtro = 'all',
  busca = '',
  pagina = 1,
  limite = 10,
}: UseLeadsParams = {}): UseLeadsReturn {
  const { sessionReady } = useAuth();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++abortRef.current;

    try {
      setLoading(true);
      setError(null);

      const from = (pagina - 1) * limite;
      const to = from + limite - 1;

      // Build query
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' });

      // Apenas leads com data_primeiro_contato preenchida
      query = query.not('data_primeiro_contato', 'is', null);

      // Apply filter
      switch (filtro) {
        case 'aguardando_nome':
          query = query.eq('status', 'primeiro_audio_enviado');
          break;
        case 'aguardando_cadastro':
          query = query.eq('status', 'aguardando_cadastro');
          break;
        case 'link_enviado':
          query = query.eq('status', 'link_enviado');
          break;
        case 'no_grupo':
          query = query.not('entrou_no_grupo', 'is', null).is('saiu_grupo', null);
          break;
        case 'saiu_grupo':
          query = query.not('saiu_grupo', 'is', null);
          break;
        // 'all': no filter
      }

      // Search by nome or telefone
      if (busca.trim()) {
        const term = `%${busca.trim()}%`;
        query = query.or(`nome.ilike.${term},telefone.ilike.${term}`);
      }

      // Order and paginate
      query = query
        .order('data_primeiro_contato', { ascending: false })
        .range(from, to);

      const { data, error: queryError, count } = await query;

      // Ignore stale responses
      if (requestId !== abortRef.current) return;

      if (queryError) throw new Error(queryError.message);

      setLeads((data as LeadRow[]) ?? []);
      setTotal(count ?? 0);
    } catch (err: any) {
      if (requestId !== abortRef.current) return;
      console.error('Erro ao carregar leads:', err);
      setError(err.message || 'Erro ao carregar leads');
    } finally {
      if (requestId === abortRef.current) {
        setLoading(false);
      }
    }
  }, [filtro, busca, pagina, limite]);

  useEffect(() => {
    load();
  }, [load, sessionReady]);

  // Realtime: refresh when leads change
  useEffect(() => {
    const channel = supabase
      .channel('leads-table-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => { load(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load, sessionReady]);

  // Refetch quando a aba volta ao foco ou rede reconecta
  useVisibilityRefresh(load);

  return { leads, total, loading, error, refetch: load };
}
```

---

## 3. Componentes Compartilhados Usados pela Leads

### 3.1 LeadBadge — `src/components/LeadBadge.tsx`

```tsx
import React from 'react';
import { StatusLead } from '../types';
import { getStatusLabel } from '../utils/formatters';
import { cn } from '../utils/cn';

interface LeadBadgeProps {
  status: StatusLead;
  className?: string;
}

const statusColors: Record<StatusLead, string> = {
  primeiro_audio_enviado: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  convite_enviado: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  interessado: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  aguardando_cadastro: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  link_enviado: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  aguardando_confirmacao_entrada: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  no_grupo: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  entrou_grupo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  nao_interessado: "bg-surface-300/30 text-txt-muted border-surface-300/30",
  sem_resposta: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  atendimento_manual: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export const LeadBadge: React.FC<LeadBadgeProps> = ({ status, className }) => {
  return (
    <span className={cn(
      "px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border whitespace-nowrap tracking-wide",
      statusColors[status],
      className
    )}>
      {getStatusLabel(status)}
    </span>
  );
};
```

### 3.2 PageHeader — `src/components/PageHeader.tsx`

```tsx
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  rightContent?: React.ReactNode;
  titleRight?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  rightContent,
  titleRight
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt font-display tracking-tight">{title}</h1>
          {titleRight}
        </div>
        {subtitle && <p className="text-sm text-txt-muted mt-1 font-light">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {rightContent}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 text-txt-muted hover:text-accent hover:bg-accent/5 rounded-xl transition-all duration-200 disabled:opacity-50 border border-transparent hover:border-accent/10"
            title="Atualizar dados"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## 4. Tipos — `src/types/index.ts`

```tsx
export type StatusLead =
  | "primeiro_audio_enviado"
  | "convite_enviado"
  | "interessado"
  | "aguardando_cadastro"
  | "link_enviado"
  | "aguardando_confirmacao_entrada"
  | "no_grupo"
  | "entrou_grupo"
  | "nao_interessado"
  | "sem_resposta"
  | "atendimento_manual";

export type StatusPremium =
  | "primeiro_audio_enviado"
  | "em_andamento"
  | "encerrado";

export interface Lead {
  id: string;
  telefone: string;
  nome: string | null;
  origem: string;
  data_primeiro_contato: string;
  status: StatusLead;
  ultima_interacao: string;
  saudacao_enviada: "bom_dia" | "boa_tarde" | "boa_noite";
  followup_enviado: string | null;
  resposta_comunidade: "sim" | "nao" | null;
  link_enviado_em: string | null;
  entrou_no_grupo: string | null;
  observacoes: string | null;
}

export interface Notificacao {
  id: string;
  tipo: "novo_lead" | "interesse" | "conversao" | "alerta";
  mensagem: string;
  data: string;
  lida: boolean;
}

export interface MetricaDiaria {
  data: string;
  leads_total: number;
  responderam: number;
  interessados: number;
  no_grupo: number;
}

export interface User {
  email: string;
  nome: string;
}
```

---

## 5. Tipos Database — `src/types/database.ts`

```tsx
// ============================================================
// Tipos gerados a partir do schema do Supabase
// ============================================================

// --- Status do funil ---
export type StatusLead =
  | 'primeiro_audio_enviado'
  | 'convite_enviado'
  | 'interessado'
  | 'aguardando_cadastro'
  | 'link_enviado'
  | 'aguardando_confirmacao_entrada'
  | 'no_grupo'
  | 'entrou_grupo'
  | 'nao_interessado'
  | 'sem_resposta'
  | 'atendimento_manual';

// --- Status do assistente premium (manual) ---
export type StatusPremium =
  | 'primeiro_audio_enviado'
  | 'em_andamento'
  | 'encerrado';

export type TipoNotificacao = 'novo_lead' | 'interesse' | 'conversao' | 'saiu_grupo';

export type TipoTemplate = 'texto' | 'audio';

export type StatusEnvioMassa = 'em_andamento' | 'concluido' | 'cancelado' | 'erro';

export type StatusEnvioLead = 'enviado' | 'erro';

// --- Row types (o que vem do banco) ---

export interface LeadRow {
  id: string;
  telefone: string;
  nome: string | null;
  origem: string;
  data_primeiro_contato: string | null;
  ultima_interacao: string | null;
  status: StatusLead;
  saudacao_enviada: string | null;
  resposta_comunidade: string | null;
  link_enviado_em: string | null;
  entrou_no_grupo: string | null;
  saiu_grupo: string | null;
  observacoes: string | null;
  id_grupo: string | null;
  nome_grupo: string | null;
  followup_enviado: string | null;
  followup_convite_enviado: string | null;
  followup_aguardando_cadastro: string | null;
  followup_saiu_grupo: string | null;
  pergunta_entrada_enviada: string | null;
  status_premium: StatusPremium | null;
  created_at: string;
  updated_at: string;
}

export interface LeadInsert {
  id?: string;
  telefone: string;
  nome?: string | null;
  origem?: string;
  data_primeiro_contato?: string | null;
  ultima_interacao?: string | null;
  status?: StatusLead;
  saudacao_enviada?: string | null;
  resposta_comunidade?: string | null;
  link_enviado_em?: string | null;
  entrou_no_grupo?: string | null;
  saiu_grupo?: string | null;
  observacoes?: string | null;
  id_grupo?: string | null;
  nome_grupo?: string | null;
  followup_enviado?: string | null;
  followup_convite_enviado?: string | null;
  followup_aguardando_cadastro?: string | null;
  followup_saiu_grupo?: string | null;
  pergunta_entrada_enviada?: string | null;
  status_premium?: StatusPremium | null;
}

export interface LeadUpdate extends Partial<LeadInsert> {}

export interface NotificacaoRow {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  lead_id: string | null;
  lida: boolean;
  created_at: string;
}

export interface TemplateMensagemRow {
  id: string;
  nome: string;
  tipo: TipoTemplate;
  mensagem_com_nome: string;
  mensagem_sem_nome: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnvioMassaRow {
  id: string;
  data_envio: string;
  tipo: TipoTemplate;
  mensagem_com_nome: string;
  mensagem_sem_nome: string;
  status_selecionados: string[];
  periodo_inicio: string | null;
  periodo_fim: string | null;
  total_leads: number;
  leads_com_nome: number;
  leads_sem_nome: number;
  leads_enviados: number;
  leads_erro: number;
  intervalo_segundos: number;
  template_id: string | null;
  status: StatusEnvioMassa;
  created_at: string;
}

export interface EnvioMassaLeadRow {
  id: string;
  envio_id: string;
  lead_id: string;
  telefone: string;
  nome: string | null;
  status_envio: StatusEnvioLead;
  erro_mensagem: string | null;
  enviado_em: string | null;
}

export interface DashboardUserRow {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  notificar_novos_leads: boolean;
  notificar_conversoes: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetricaDiariaRow {
  id: string;
  data: string;
  leads_total: number;
  responderam: number;
  interessados: number;
  no_grupo: number;
  leads_com_nome: number;
  link_enviado: number;
  nao_interessados: number;
  sem_resposta: number;
  saiu_grupo: number;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracaoRow {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
  updated_at: string;
}

export interface MembrosGrupoRow {
  id: string;
  telefone: string;
  lead_id: string | null;
  grupo_id: string;
  grupo_nome: string | null;
  entrou_em: string | null;
  saiu_em: string | null;
  ativo: boolean;
  created_at: string;
}

export interface MensagemFunilRow {
  id: string;
  secao: string;
  cenario: string;
  titulo: string;
  descricao: string;
  tipo_envio: string;
  mensagens: string[];
  tempo_espera_horas: number | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// --- Views ---

export interface FunilStatusRow {
  status: StatusLead;
  total: number;
  percentual: number;
}

export interface MetricasHojeRow {
  leads_total: number;
  responderam: number;
  interessados: number;
  no_grupo: number;
  aguardando_resposta: number;
}

// --- Database type para o cliente tipado ---

export type Database = {
  public: {
    Tables: {
      leads: {
        Row: LeadRow;
        Insert: LeadInsert;
        Update: LeadUpdate;
        Relationships: [];
      };
      notificacoes: {
        Row: NotificacaoRow;
        Insert: Omit<NotificacaoRow, 'id' | 'created_at'>;
        Update: Partial<Omit<NotificacaoRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      templates_mensagem: {
        Row: TemplateMensagemRow;
        Insert: Omit<TemplateMensagemRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TemplateMensagemRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      envios_massa: {
        Row: EnvioMassaRow;
        Insert: Omit<EnvioMassaRow, 'id' | 'created_at'>;
        Update: Partial<Omit<EnvioMassaRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      envios_massa_leads: {
        Row: EnvioMassaLeadRow;
        Insert: Omit<EnvioMassaLeadRow, 'id'>;
        Update: Partial<Omit<EnvioMassaLeadRow, 'id'>>;
        Relationships: [];
      };
      dashboard_users: {
        Row: DashboardUserRow;
        Insert: Omit<DashboardUserRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DashboardUserRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      metricas_diarias: {
        Row: MetricaDiariaRow;
        Insert: Omit<MetricaDiariaRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MetricaDiariaRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      configuracoes: {
        Row: ConfiguracaoRow;
        Insert: Omit<ConfiguracaoRow, 'id' | 'updated_at'>;
        Update: Partial<Omit<ConfiguracaoRow, 'id' | 'updated_at'>>;
        Relationships: [];
      };
      membros_grupo: {
        Row: MembrosGrupoRow;
        Insert: Omit<MembrosGrupoRow, 'id' | 'created_at'>;
        Update: Partial<Omit<MembrosGrupoRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      mensagens_funil_v2: {
        Row: MensagemFunilRow;
        Insert: Omit<MensagemFunilRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MensagemFunilRow, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
    };
    Views: {
      leads_aguardando: { Row: LeadRow; Relationships: [] };
      leads_hoje: { Row: LeadRow; Relationships: [] };
      funil_status: { Row: FunilStatusRow; Relationships: [] };
      metricas_hoje: { Row: MetricasHojeRow; Relationships: [] };
      notificacoes_nao_lidas: { Row: Omit<NotificacaoRow, 'titulo'>; Relationships: [] };
    };
    Functions: {
      get_metricas_periodo: {
        Args: Record<string, unknown>;
        Returns: unknown[];
      };
      get_metricas_dashboard: {
        Args: Record<string, unknown>;
        Returns: unknown[];
      };
      marcar_notificacoes_lidas: {
        Args: Record<string, unknown>;
        Returns: void;
      };
      buscar_leads_envio_massa: {
        Args: Record<string, unknown>;
        Returns: LeadRow[];
      };
      get_funil_status: {
        Args: Record<string, unknown>;
        Returns: FunilStatusRow[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
```

---

## 6. Utilitarios — `src/utils/formatters.ts`

```tsx
import { format, formatDistanceToNow, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatTelefone = (telefone: string): string => {
  const cleaned = ('' + telefone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{2})(\d{5})(\d{4})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
  }
  // Fallback para formato brasileiro sem DDI se for curto
  const matchBR = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  if (matchBR) {
    return `(${matchBR[1]}) ${matchBR[2]}-${matchBR[3]}`;
  }
  return telefone;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
};

export const formatTime = (dateString: string): string => {
  if (!dateString) return '-';
  return format(parseISO(dateString), 'HH:mm', { locale: ptBR });
};

export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '-';
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: ptBR });
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    primeiro_audio_enviado: "Aguardando Nome",
    convite_enviado: "Convite Enviado",
    interessado: "Interessado",
    aguardando_cadastro: "Aguardando Cadastro",
    link_enviado: "Link Enviado",
    aguardando_confirmacao_entrada: "Aguardando Confirmacao",
    no_grupo: "No Grupo",
    entrou_grupo: "Entrou no Grupo",
    nao_interessado: "Nao Interessado",
    sem_resposta: "Sem Resposta",
    atendimento_manual: "Atendimento Manual",
  };
  return labels[status] || status;
};

export const getStatusPremiumLabel = (status: string): string => {
  const labels: Record<string, string> = {
    primeiro_audio_enviado: "Primeiro Audio Enviado",
    em_andamento: "Em Andamento",
    encerrado: "Encerrado",
  };
  return labels[status] || status;
};

export const formatTempoNoGrupo = (entrouNoGrupo: string): string => {
  const entrou = parseISO(entrouNoGrupo);
  const agora = new Date();

  const mins = differenceInMinutes(agora, entrou);
  if (mins < 60) return `${mins} min`;

  const horas = differenceInHours(agora, entrou);
  if (horas < 24) return `${horas}h`;

  const dias = differenceInDays(agora, entrou);
  if (dias < 30) return `${dias}d`;

  const meses = Math.floor(dias / 30);
  return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    primeiro_audio_enviado: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    convite_enviado: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    interessado: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    aguardando_cadastro: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    link_enviado: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    aguardando_confirmacao_entrada: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    no_grupo: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    entrou_grupo: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    nao_interessado: "bg-surface-300/30 text-txt-muted border-surface-300/30",
    sem_resposta: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    atendimento_manual: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    // Premium status colors
    em_andamento: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    encerrado: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };
  return colors[status] || "bg-surface-300/20 text-txt-muted border-surface-300/20";
};
```

---

## 7. Utilitario cn — `src/utils/cn.ts`

```tsx
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 8. Mock Data (leads) — `src/data/mockData.ts`

```tsx
import { Lead, MetricaDiaria, Notificacao } from "../types";
import { subDays, subHours, subMinutes, formatISO } from "date-fns";

const now = new Date();

const getRelativeDate = (days: number, hours: number = 0, minutes: number = 0) => {
  const date = subMinutes(subHours(subDays(now, days), hours), minutes);
  return formatISO(date);
};

export const mockLeads: Lead[] = [
  { id: "1", telefone: "5511999991001", nome: "Ana Souza", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 0, 15), status: "primeiro_audio_enviado", ultima_interacao: getRelativeDate(0, 0, 15), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "2", telefone: "5511999991002", nome: null, origem: "instagram", data_primeiro_contato: getRelativeDate(0, 1, 30), status: "primeiro_audio_enviado", ultima_interacao: getRelativeDate(0, 1, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "3", telefone: "5521988882001", nome: "Carlos Lima", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 2, 0), status: "convite_enviado", ultima_interacao: getRelativeDate(0, 1, 50), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "4", telefone: "5531977773001", nome: "Beatriz M.", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 3, 0), status: "interessado", ultima_interacao: getRelativeDate(0, 2, 45), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: null, entrou_no_grupo: null, observacoes: "Perguntou sobre horario das lives" },
  { id: "5", telefone: "5541966664001", nome: "Joao Pedro", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 4, 0), status: "no_grupo", ultima_interacao: getRelativeDate(0, 3, 30), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(0, 3, 40), entrou_no_grupo: getRelativeDate(0, 3, 30), observacoes: null },
  { id: "6", telefone: "5551955555001", nome: "Fernanda K.", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 5, 0), status: "link_enviado", ultima_interacao: getRelativeDate(0, 4, 50), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(0, 4, 50), entrou_no_grupo: null, observacoes: null },
  { id: "7", telefone: "5511944446001", nome: null, origem: "instagram", data_primeiro_contato: getRelativeDate(0, 6, 0), status: "primeiro_audio_enviado", ultima_interacao: getRelativeDate(0, 6, 0), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "8", telefone: "5511933337001", nome: "Marcos", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 7, 0), status: "convite_enviado", ultima_interacao: getRelativeDate(0, 6, 50), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "9", telefone: "5511922228001", nome: "Lucas", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 1), status: "no_grupo", ultima_interacao: getRelativeDate(0, 0, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(0, 0, 40), entrou_no_grupo: getRelativeDate(0, 0, 30), observacoes: null },
  { id: "10", telefone: "5511911119001", nome: "Julia", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 2), status: "nao_interessado", ultima_interacao: getRelativeDate(0, 1, 50), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "nao", link_enviado_em: null, entrou_no_grupo: null, observacoes: "Disse que nao tem tempo" },
  { id: "11", telefone: "5511900001001", nome: "Roberto", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 3), status: "link_enviado", ultima_interacao: getRelativeDate(0, 2, 50), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(0, 2, 50), entrou_no_grupo: null, observacoes: null },
  { id: "12", telefone: "5511999992002", nome: null, origem: "instagram", data_primeiro_contato: getRelativeDate(0, 4), status: "primeiro_audio_enviado", ultima_interacao: getRelativeDate(0, 4), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "13", telefone: "5511988883003", nome: "Carla", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 5), status: "no_grupo", ultima_interacao: getRelativeDate(0, 4, 30), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(0, 4, 40), entrou_no_grupo: getRelativeDate(0, 4, 30), observacoes: null },
  { id: "14", telefone: "5511977774004", nome: "Pedro", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 6), status: "sem_resposta", ultima_interacao: getRelativeDate(0, 6), saudacao_enviada: "bom_dia", followup_enviado: getRelativeDate(0, 2), resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: "Follow-up enviado" },
  { id: "15", telefone: "5511966665005", nome: "Mariana", origem: "instagram", data_primeiro_contato: getRelativeDate(0, 7), status: "interessado", ultima_interacao: getRelativeDate(0, 6, 30), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "16", telefone: "5511955556006", nome: "Ricardo", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 10), status: "no_grupo", ultima_interacao: getRelativeDate(1, 9), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(1, 9, 10), entrou_no_grupo: getRelativeDate(1, 9), observacoes: null },
  { id: "17", telefone: "5511944447007", nome: "Sofia", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 11), status: "sem_resposta", ultima_interacao: getRelativeDate(1, 11), saudacao_enviada: "bom_dia", followup_enviado: getRelativeDate(0, 10), resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "18", telefone: "5511933338008", nome: "Bruno", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 12), status: "nao_interessado", ultima_interacao: getRelativeDate(1, 11, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "nao", link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "19", telefone: "5511922229009", nome: "Aline", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 13), status: "no_grupo", ultima_interacao: getRelativeDate(1, 12), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(1, 12, 10), entrou_no_grupo: getRelativeDate(1, 12), observacoes: null },
  { id: "20", telefone: "5511911110010", nome: null, origem: "instagram", data_primeiro_contato: getRelativeDate(1, 14), status: "primeiro_audio_enviado", ultima_interacao: getRelativeDate(1, 14), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "21", telefone: "5511900001011", nome: "Gustavo", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 15), status: "convite_enviado", ultima_interacao: getRelativeDate(1, 14, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "22", telefone: "5511999992012", nome: "Camila", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 16), status: "link_enviado", ultima_interacao: getRelativeDate(1, 15, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(1, 15, 30), entrou_no_grupo: null, observacoes: null },
  { id: "23", telefone: "5511988883013", nome: "Felipe", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 17), status: "interessado", ultima_interacao: getRelativeDate(1, 16, 30), saudacao_enviada: "boa_noite", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "24", telefone: "5511977774014", nome: "Larissa", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 18), status: "no_grupo", ultima_interacao: getRelativeDate(1, 17), saudacao_enviada: "boa_noite", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(1, 17, 10), entrou_no_grupo: getRelativeDate(1, 17), observacoes: null },
  { id: "25", telefone: "5511966665015", nome: "Diego", origem: "instagram", data_primeiro_contato: getRelativeDate(1, 19), status: "sem_resposta", ultima_interacao: getRelativeDate(1, 19), saudacao_enviada: "boa_noite", followup_enviado: getRelativeDate(0, 9), resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "26", telefone: "5511955556016", nome: "Patricia", origem: "instagram", data_primeiro_contato: getRelativeDate(2, 10), status: "no_grupo", ultima_interacao: getRelativeDate(2, 9), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(2, 9, 10), entrou_no_grupo: getRelativeDate(2, 9), observacoes: null },
  { id: "27", telefone: "5511944447017", nome: "Rodrigo", origem: "instagram", data_primeiro_contato: getRelativeDate(2, 11), status: "nao_interessado", ultima_interacao: getRelativeDate(2, 10, 30), saudacao_enviada: "bom_dia", followup_enviado: null, resposta_comunidade: "nao", link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "28", telefone: "5511933338018", nome: "Vanessa", origem: "instagram", data_primeiro_contato: getRelativeDate(2, 12), status: "sem_resposta", ultima_interacao: getRelativeDate(2, 12), saudacao_enviada: "bom_dia", followup_enviado: getRelativeDate(1, 10), resposta_comunidade: null, link_enviado_em: null, entrou_no_grupo: null, observacoes: null },
  { id: "29", telefone: "5511922229019", nome: "Thiago", origem: "instagram", data_primeiro_contato: getRelativeDate(2, 13), status: "no_grupo", ultima_interacao: getRelativeDate(2, 12), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(2, 12, 10), entrou_no_grupo: getRelativeDate(2, 12), observacoes: null },
  { id: "30", telefone: "5511911110020", nome: "Leticia", origem: "instagram", data_primeiro_contato: getRelativeDate(2, 14), status: "link_enviado", ultima_interacao: getRelativeDate(2, 13, 30), saudacao_enviada: "boa_tarde", followup_enviado: null, resposta_comunidade: "sim", link_enviado_em: getRelativeDate(2, 13, 30), entrou_no_grupo: null, observacoes: null },
];

export const mockNotificacoes: Notificacao[] = [
  { id: "1", tipo: "novo_lead", mensagem: "Novo lead: 11 99999-1001 entrou pelo Instagram", data: getRelativeDate(0, 0, 15), lida: false },
  { id: "2", tipo: "interesse", mensagem: "Beatriz M. demonstrou interesse na comunidade", data: getRelativeDate(0, 2, 45), lida: false },
  { id: "3", tipo: "conversao", mensagem: "Joao Pedro entrou no grupo!", data: getRelativeDate(0, 3, 30), lida: false },
  { id: "4", tipo: "alerta", mensagem: "2 leads sem resposta ha mais de 2 horas", data: getRelativeDate(0, 4, 0), lida: true },
  { id: "5", tipo: "conversao", mensagem: "Lucas entrou no grupo!", data: getRelativeDate(0, 0, 30), lida: true },
  { id: "6", tipo: "novo_lead", mensagem: "Novo lead: 11 99999-2002 entrou pelo Instagram", data: getRelativeDate(0, 4, 0), lida: true },
  { id: "7", tipo: "interesse", mensagem: "Mariana demonstrou interesse na comunidade", data: getRelativeDate(0, 6, 30), lida: true },
  { id: "8", tipo: "conversao", mensagem: "Carla entrou no grupo!", data: getRelativeDate(0, 4, 30), lida: true },
  { id: "9", tipo: "novo_lead", mensagem: "Novo lead: 11 99999-3003 entrou pelo Instagram", data: getRelativeDate(0, 5, 0), lida: true },
  { id: "10", tipo: "alerta", mensagem: "Falta enviar follow-up para 3 leads", data: getRelativeDate(0, 8, 0), lida: true },
];

const generateMetrics = (): MetricaDiaria[] => {
  const metrics: MetricaDiaria[] = [];
  for (let i = 29; i >= 0; i--) {
    const dayOfWeek = subDays(now, i).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseLeads = isWeekend ? 6 : 14;

    const variance = Math.sin(i * 2.7 + 1.3) * 5;
    const trend = Math.max(0, (30 - i) * 0.15);

    const leads_total = Math.max(3, Math.round(baseLeads + variance + trend));
    const responderam = Math.max(1, Math.round(leads_total * (0.65 + Math.sin(i * 1.5) * 0.15)));
    const interessados = Math.max(1, Math.round(responderam * (0.7 + Math.sin(i * 3.1) * 0.1)));
    const no_grupo = Math.max(0, Math.round(interessados * (0.55 + Math.sin(i * 4.2) * 0.15)));

    metrics.push({
      data: getRelativeDate(i),
      leads_total,
      responderam,
      interessados,
      no_grupo,
    });
  }
  return metrics;
};

export const mockMetricasDiarias: MetricaDiaria[] = generateMetrics();
```

---

## Resumo dos Arquivos

| # | Arquivo | Funcao |
|---|---------|--------|
| 1 | `src/pages/Leads.tsx` | Pagina com 2 tabs (Automatico + Premium), tabelas, filtros, paginacao, busca |
| 2 | `src/hooks/useLeads.ts` | Hook para buscar leads com filtro, busca e paginacao (Supabase) |
| 3 | `src/components/LeadBadge.tsx` | Badge colorido por status do lead |
| 4 | `src/components/PageHeader.tsx` | Header reutilizavel com titulo e botao refresh |
| 5 | `src/types/index.ts` | Tipos basicos (StatusLead, Lead, Notificacao, etc) |
| 6 | `src/types/database.ts` | Tipos completos do schema do Supabase (LeadRow, etc) |
| 7 | `src/utils/formatters.ts` | Funcoes de formatacao (telefone, data, tempo relativo, labels de status) |
| 8 | `src/utils/cn.ts` | Utilitario classname (clsx + tailwind-merge) |
| 9 | `src/data/mockData.ts` | 30 leads mock + 10 notificacoes + 30 dias de metricas |

### Nota sobre chamadas Supabase na secao Leads

Os seguintes pontos fazem chamadas ao Supabase que devem ser substituidas por dados mock:

- **`useLeads.ts`**: `supabase.from('leads').select(...)` — substituir por filtragem local dos `mockLeads`
- **`useLeadsPremium`** (dentro de `Leads.tsx`): `supabase.from('leads').select(...)` — substituir por filtragem dos leads com `entrou_no_grupo` preenchido
- **`PremiumStatusSelect`** (dentro de `Leads.tsx`): `supabase.from('leads').update(...)` — substituir por setState local
- **Realtime channels**: `supabase.channel(...)` — remover, nao necessario com mock
- **`useVisibilityRefresh`**: pode manter, nao depende de Supabase
