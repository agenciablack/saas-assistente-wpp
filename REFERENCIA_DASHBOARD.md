# Referência Completa — Dashboard de Leads

> Este arquivo contém o código completo de todos os componentes principais do Dashboard para consulta.

---

## 1. Sidebar — `src/components/Sidebar.tsx`

```tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Filter, Send, MessageSquare, MessagesSquare, Phone, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Leads', path: '/leads' },
    { icon: Filter, label: 'Funil', path: '/funil' },
    { icon: MessagesSquare, label: 'Conversas', path: '/conversas' },
    { icon: Send, label: 'Envios', path: '/envios' },
    { icon: MessageSquare, label: 'Mensagens', path: '/mensagens' },
    { icon: Phone, label: 'Números', path: '/numeros' },
    { icon: Settings, label: 'Configuracoes', path: '/configuracoes' },
  ];

  return (
    <aside className={cn(
      "bg-surface-50 border-r border-surface-300/20 h-screen flex flex-col hidden md:flex transition-all duration-300 shrink-0 relative",
      collapsed ? "w-[72px]" : "w-[260px]"
    )}>
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] to-transparent pointer-events-none" />

      <div className={cn("p-5 border-b border-surface-300/20 relative", collapsed && "px-3")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-txt tracking-tight font-display">Allan Cabral</h1>
              <p className="text-[11px] text-txt-muted font-mono tracking-wide uppercase">Leads</p>
            </div>
          )}
          <button
            onClick={onToggle}
            className={cn(
              "p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/50 rounded-lg transition-all duration-200",
              collapsed && "absolute -right-3 top-6 bg-surface-50 border border-surface-300/30 shadow-lg z-10"
            )}
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto relative">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
              collapsed && "justify-center px-2",
              isActive
                ? "bg-accent/10 text-accent border-glow"
                : "text-txt-secondary hover:bg-surface-200/40 hover:text-txt"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full" />
                )}
                <item.icon className={cn(
                  "w-[18px] h-[18px] transition-colors duration-200",
                  !collapsed && "mr-3",
                  isActive ? "text-accent" : "text-txt-muted group-hover:text-txt-secondary"
                )} />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-surface-300/20 relative">
        <button
          onClick={logout}
          className={cn(
            "flex items-center w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-txt-muted hover:bg-red-500/10 hover:text-red-400 transition-all duration-200",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className={cn("w-[18px] h-[18px]", !collapsed && "mr-3")} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};
```

---

## 2. Layout Principal — `src/App.tsx`

```tsx
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { Funil } from './pages/Funil';
import { Notificacoes } from './pages/Notificacoes';
import { Configuracoes } from './pages/Configuracoes';
import { Envios } from './pages/Envios';
import { HistoricoEnvios } from './pages/HistoricoEnvios';
import { Templates } from './pages/Templates';
import { Mensagens } from './pages/Mensagens';
import { Numeros } from './pages/Numeros';
import Conversas from './pages/Conversas';
import { Loader2 } from 'lucide-react';

const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen min-w-0">
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/funil" element={<Funil />} />
            <Route path="/conversas" element={<Conversas />} />
            <Route path="/envios" element={<Envios />} />
            <Route path="/envios/historico" element={<HistoricoEnvios />} />
            <Route path="/envios/templates" element={<Templates />} />
            <Route path="/mensagens" element={<Mensagens />} />
            <Route path="/numeros" element={<Numeros />} />
            <Route path="/notificacoes" element={<Notificacoes />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
```

---

## 3. Página Dashboard — `src/pages/Dashboard.tsx`

```tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Toast } from '../components/Toast';
import { MetricCard } from '../components/MetricCard';
import { LeadBadge } from '../components/LeadBadge';
import {
  Users, TrendingUp, Clock, ArrowRight, Bell, X, Activity,
  ChevronLeft, ChevronRight, Calendar, Loader2, CheckCheck,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useNotificacoes } from '../hooks/useNotificacoes';
import { useToast } from '../hooks/useToast';
import { useSupabaseDiagnostics } from '../hooks/useSupabaseDiagnostics';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, isSameDay, getDaysInMonth, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { formatTime, formatTelefone, formatRelativeTime } from '../utils/formatters';
import { NotificacoesList } from './Notificacoes';
import { cn } from '../utils/cn';
import type { StatusLead } from '../types/database';

type PresetKey = 'hoje' | '7dias' | '15dias' | '30dias' | 'custom';

interface DateRange {
  start: Date;
  end: Date;
}

const PRESETS: { key: PresetKey; label: string; days: number }[] = [
  { key: 'hoje', label: 'Hoje', days: 1 },
  { key: '7dias', label: '7 dias', days: 7 },
  { key: '15dias', label: '15 dias', days: 15 },
  { key: '30dias', label: '30 dias', days: 30 },
];

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function parseLocalDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T12:00:00');
  }
  return new Date(dateStr);
}

// ─── Compact Day Picker ───
const DayPicker: React.FC<{
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  label: string;
}> = ({ selectedDate, onSelect, onClose, label }) => {
  const [viewMonth, setViewMonth] = useState(getMonth(selectedDate));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const daysInMonth = getDaysInMonth(new Date(currentYear, viewMonth));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleSelect = (day: number) => {
    const d = new Date(currentYear, viewMonth, day);
    if (d > now) return;
    onSelect(d);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute top-full mt-2 z-50 animate-slide-up"
      style={{ animationDuration: '0.25s' }}
    >
      <div
        className="rounded-xl p-3 border border-white/[0.06] shadow-2xl w-[260px]"
        style={{
          background: 'linear-gradient(145deg, rgba(20, 20, 22, 0.97) 0%, rgba(26, 26, 30, 0.97) 100%)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="absolute top-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="text-[9px] uppercase tracking-[0.1em] text-txt-dim font-mono mb-2">{label}</div>

        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setViewMonth(m => Math.max(0, m - 1))}
            className="p-1 rounded-lg hover:bg-white/[0.04] text-txt-muted hover:text-txt transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-txt font-display">{MONTHS_SHORT[viewMonth]}</span>
          <button
            onClick={() => setViewMonth(m => Math.min(11, m + 1))}
            className="p-1 rounded-lg hover:bg-white/[0.04] text-txt-muted hover:text-txt transition-colors"
            disabled={viewMonth >= getMonth(now)}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-[8px] text-txt-dim font-mono text-center py-1">{d}</div>
          ))}
          {Array.from({ length: new Date(currentYear, viewMonth, 1).getDay() }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map(day => {
            const date = new Date(currentYear, viewMonth, day);
            const isFuture = date > now;
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, now);

            return (
              <button
                key={day}
                onClick={() => handleSelect(day)}
                disabled={isFuture}
                className={cn(
                  "w-full aspect-square rounded-lg text-[11px] font-mono transition-all duration-200 relative",
                  isFuture && "opacity-20 cursor-not-allowed",
                  isSelected
                    ? "bg-accent text-surface font-semibold shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : isToday
                    ? "text-accent ring-1 ring-accent/30 hover:bg-accent/10"
                    : "text-txt-secondary hover:bg-white/[0.04] hover:text-txt"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Period Selector Component ───
const PeriodSelector: React.FC<{
  activePreset: PresetKey;
  dateRange: DateRange;
  onPresetChange: (key: PresetKey) => void;
  onDateRangeChange: (range: DateRange) => void;
}> = ({ activePreset, dateRange, onPresetChange, onDateRangeChange }) => {
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
        {PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onPresetChange(key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-medium font-display transition-all duration-300 relative",
              activePreset === key
                ? "text-accent"
                : "text-txt-muted hover:text-txt-secondary"
            )}
          >
            {activePreset === key && (
              <div
                className="absolute inset-0 rounded-lg bg-accent/[0.08] border border-accent/20 pointer-events-none"
                style={{ boxShadow: '0 0 16px rgba(6, 182, 212, 0.06)' }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      <div className="hidden sm:block w-px h-5 bg-white/[0.06]" />

      <div className="flex items-center gap-2 text-[11px] font-mono">
        <Calendar className="w-3 h-3 text-txt-dim" />

        <div className="relative">
          <button
            onClick={() => { setStartPickerOpen(!startPickerOpen); setEndPickerOpen(false); }}
            className={cn(
              "px-2 py-1 rounded-lg transition-all duration-200 tabular-nums",
              startPickerOpen
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-txt-secondary hover:text-txt hover:bg-white/[0.03] border border-transparent"
            )}
          >
            {format(dateRange.start, 'dd/MM')}
          </button>
          {startPickerOpen && (
            <DayPicker
              selectedDate={dateRange.start}
              onSelect={(d) => {
                onDateRangeChange({ start: d, end: dateRange.end < d ? d : dateRange.end });
              }}
              onClose={() => setStartPickerOpen(false)}
              label="Data inicio"
            />
          )}
        </div>

        <span className="text-txt-dim">—</span>

        <div className="relative">
          <button
            onClick={() => { setEndPickerOpen(!endPickerOpen); setStartPickerOpen(false); }}
            className={cn(
              "px-2 py-1 rounded-lg transition-all duration-200 tabular-nums",
              endPickerOpen
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-txt-secondary hover:text-txt hover:bg-white/[0.03] border border-transparent"
            )}
          >
            {format(dateRange.end, 'dd/MM')}
          </button>
          {endPickerOpen && (
            <DayPicker
              selectedDate={dateRange.end}
              onSelect={(d) => {
                onDateRangeChange({ start: dateRange.start > d ? d : dateRange.start, end: d });
              }}
              onClose={() => setEndPickerOpen(false)}
              label="Data fim"
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── KPI Date Range Picker ───
const KpiDateRangePicker: React.FC<{
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}> = ({ dateRange, onDateRangeChange }) => {
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 text-[11px] font-mono">
      <Calendar className="w-3 h-3 text-txt-dim" />

      <div className="relative">
        <button
          onClick={() => { setStartPickerOpen(!startPickerOpen); setEndPickerOpen(false); }}
          className={cn(
            "px-2 py-1 rounded-lg transition-all duration-200 tabular-nums",
            startPickerOpen
              ? "bg-accent/10 text-accent border border-accent/20"
              : "text-txt-secondary hover:text-txt hover:bg-white/[0.03] border border-transparent"
          )}
        >
          {format(dateRange.start, 'dd/MM')}
        </button>
        {startPickerOpen && (
          <DayPicker
            selectedDate={dateRange.start}
            onSelect={(d) => {
              onDateRangeChange({ start: d, end: dateRange.end < d ? d : dateRange.end });
            }}
            onClose={() => setStartPickerOpen(false)}
            label="Data inicio"
          />
        )}
      </div>

      <span className="text-txt-dim">—</span>

      <div className="relative">
        <button
          onClick={() => { setEndPickerOpen(!endPickerOpen); setStartPickerOpen(false); }}
          className={cn(
            "px-2 py-1 rounded-lg transition-all duration-200 tabular-nums",
            endPickerOpen
              ? "bg-accent/10 text-accent border border-accent/20"
              : "text-txt-secondary hover:text-txt hover:bg-white/[0.03] border border-transparent"
          )}
        >
          {format(dateRange.end, 'dd/MM')}
        </button>
        {endPickerOpen && (
          <DayPicker
            selectedDate={dateRange.end}
            onSelect={(d) => {
              onDateRangeChange({ start: dateRange.start > d ? d : dateRange.start, end: d });
            }}
            onClose={() => setEndPickerOpen(false)}
            label="Data fim"
          />
        )}
      </div>
    </div>
  );
};

// ─── Chart Tooltip ───
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="relative rounded-xl p-3.5 shadow-2xl border border-white/[0.06] overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(26, 26, 30, 0.95) 0%, rgba(20, 20, 22, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/40 via-cyan-500/20 to-transparent" />
      <p className="text-[10px] text-txt-muted font-mono mb-2.5 uppercase tracking-wider">
        {label ? format(parseLocalDate(label), "EEE, dd 'de' MMM", { locale: ptBR }) : ''}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 6px ${entry.color}40` }} />
              <span className="text-txt-secondary text-[11px]">{entry.name}</span>
            </div>
            <span className="text-txt font-mono font-semibold text-[11px] tabular-nums">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Skeleton Loader ───
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-10 bg-white/[0.03] rounded-xl w-64" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="card-dark p-5 h-44">
          <div className="h-4 bg-white/[0.04] rounded w-20 mb-4" />
          <div className="h-8 bg-white/[0.04] rounded w-16 mb-2" />
          <div className="h-3 bg-white/[0.03] rounded w-32" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card-dark p-6 h-96" />
      <div className="card-dark p-5 h-96" />
    </div>
  </div>
);

// ─── Dashboard ───
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>('7dias');
  const [dias, setDias] = useState(7);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfDay(subDays(new Date(), 6)),
    end: endOfDay(new Date()),
  });

  const [kpiRange, setKpiRange] = useState<DateRange>({
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  });

  const kpiInicio = format(kpiRange.start, 'yyyy-MM-dd');
  const kpiFim = format(kpiRange.end, 'yyyy-MM-dd');
  const kpiIsSingleDay = isSameDay(kpiRange.start, kpiRange.end);
  const kpiIsToday = kpiIsSingleDay && isSameDay(kpiRange.start, new Date());

  const { metricas, chartData, leadsPeriodo, loading, error: dashboardError, refresh } = useDashboard(dias, kpiInicio, kpiFim);
  const {
    notificacoes,
    contadorNaoLidas,
    loading: loadingNotif,
    marcarComoLida,
    marcarTodasComoLidas,
  } = useNotificacoes();
  const { toast, showToast, hideToast } = useToast();
  const diagnostics = useSupabaseDiagnostics(true);

  useEffect(() => {
    if (dashboardError) showToast('error', dashboardError);
  }, [dashboardError, showToast]);

  const handlePresetChange = (key: PresetKey) => {
    setActivePreset(key);
    const now = new Date();
    const preset = PRESETS.find(p => p.key === key);
    if (preset) {
      setDias(preset.days);
      setDateRange({
        start: startOfDay(subDays(now, preset.days - 1)),
        end: endOfDay(now),
      });
    }
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange({ start: startOfDay(range.start), end: endOfDay(range.end) });
    setActivePreset('custom');
    const diffTime = Math.abs(range.end.getTime() - range.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    setDias(diffDays);
  };

  const filteredChartData = useMemo(() => {
    if (activePreset !== 'custom') return chartData;
    return chartData.filter(metric => {
      const metricDate = parseLocalDate(metric.data);
      return isWithinInterval(metricDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [chartData, dateRange, activePreset]);

  const totalLeads = leadsPeriodo.length;
  const leadsNoGrupo = leadsPeriodo.filter(l => !!l.entrou_no_grupo).length;
  const conversionRate = totalLeads > 0 ? Math.round((leadsNoGrupo / totalLeads) * 100) : 0;
  const leadsWaiting = leadsPeriodo.filter(l => l.status === 'sem_resposta').length;

  const chartTitle = useMemo(() => {
    const preset = PRESETS.find(p => p.key === activePreset);
    if (preset) {
      if (activePreset === 'hoje') return 'Metricas de Conversao - Hoje';
      return `Metricas de Conversao - ${preset.days} Dias`;
    }
    return 'Metricas de Conversao';
  }, [activePreset]);

  const periodSummary = useMemo(() => {
    if (filteredChartData.length === 0) return { total: 0, avg: 0, best: 0 };
    const total = filteredChartData.reduce((sum, d) => sum + d.leads_total, 0);
    const avg = Math.round(total / filteredChartData.length);
    const best = Math.max(...filteredChartData.map(d => d.leads_total));
    return { total, avg, best };
  }, [filteredChartData]);

  const diagnosticsPanel = (
    <div className="card-dark p-5 border border-rose-500/20">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <div className="text-sm font-semibold text-rose-400">Diagnostico Supabase</div>
          <div className="text-[12px] text-txt-dim">
            {diagnostics.lastRun
              ? `Ultima verificacao: ${diagnostics.lastRun.toLocaleTimeString()}`
              : 'Ainda nao executado'}
          </div>
        </div>
        <button
          onClick={diagnostics.run}
          disabled={diagnostics.running}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-surface-200/40 text-txt-muted hover:text-txt hover:bg-surface-200/60 transition-colors disabled:opacity-50"
        >
          {diagnostics.running ? 'Verificando...' : 'Reexecutar diagnostico'}
        </button>
      </div>
      {diagnostics.items.length === 0 ? (
        <div className="text-[13px] text-txt-dim">Aguardando diagnostico...</div>
      ) : (
        <div className="space-y-2">
          {diagnostics.items.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-[13px]">
              <span className="text-txt-secondary">{item.label}</span>
              <span className={cn(item.ok ? 'text-emerald-400' : 'text-rose-400')}>
                {item.ok ? 'OK' : item.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading && !metricas) {
    return (
      <div className="space-y-6 mesh-bg">
        <div className="noise-overlay" />
        {diagnosticsPanel}
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 mesh-bg">
      <div className="noise-overlay" />
      {toast && <Toast toast={toast} onClose={hideToast} />}
      {diagnosticsPanel}

      <PageHeader
        title="Dashboard"
        subtitle={format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        onRefresh={refresh}
        isRefreshing={loading}
        titleRight={
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2.5 text-txt-muted hover:text-txt hover:bg-white/[0.04] rounded-xl transition-all duration-300 group"
            aria-label="Abrir notificacoes"
          >
            <Bell className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            {contadorNaoLidas > 0 && (
              <span className={cn(
                "absolute -top-0.5 -right-0.5 h-4 bg-accent text-surface text-[9px] font-mono font-bold flex items-center justify-center rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]",
                contadorNaoLidas > 99 ? "min-w-5 px-1" : "w-4"
              )}>
                {contadorNaoLidas > 99 ? '99+' : contadorNaoLidas}
              </span>
            )}
          </button>
        }
      />

      {/* KPI Date Filter */}
      <div className="flex items-center gap-3 relative z-20">
        <KpiDateRangePicker
          dateRange={kpiRange}
          onDateRangeChange={(range) => setKpiRange({ start: startOfDay(range.start), end: endOfDay(range.end) })}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch relative z-10">
        <div className="animate-slide-up stagger-1 opacity-0 h-full">
          <MetricCard
            title={kpiIsToday ? 'Leads Hoje' : kpiIsSingleDay ? `Leads - ${format(kpiRange.start, 'dd/MM')}` : 'Leads no Periodo'}
            value={totalLeads}
            subtitle={kpiIsToday ? undefined : `${format(kpiRange.start, 'dd/MM')} a ${format(kpiRange.end, 'dd/MM')}`}
            icon={Users}
            color="cyan"
          />
        </div>
        <div className="animate-slide-up stagger-2 opacity-0 h-full">
          <MetricCard
            title="Taxa de Conversao"
            value={`${conversionRate}%`}
            subtitle={`${leadsNoGrupo} de ${totalLeads} entraram no grupo`}
            icon={TrendingUp}
            color="cyan"
          />
        </div>
        <div className="animate-slide-up stagger-3 opacity-0 h-full">
          <MetricCard
            title="Aguardando Resposta"
            value={leadsWaiting}
            subtitle="Leads sem resposta no periodo"
            icon={Clock}
            color="amber"
            trend={leadsWaiting > 5 ? 'Atencao necessaria' : 'Dentro do normal'}
            trendType={leadsWaiting > 5 ? 'negative' : 'positive'}
          />
        </div>
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
        {/* Chart */}
        <div className="lg:col-span-2 card-dark p-6 animate-slide-up stagger-4 opacity-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-accent/10 ring-1 ring-accent/20">
                <Activity className="w-3.5 h-3.5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-txt font-display">{chartTitle}</h3>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {[
                { label: 'Total', value: periodSummary.total },
                { label: 'Media/dia', value: periodSummary.avg },
                { label: 'Melhor dia', value: periodSummary.best },
              ].map(({ label, value }) => (
                <div key={label} className="text-right">
                  <div className="text-[9px] text-txt-dim font-mono uppercase tracking-wider">{label}</div>
                  <div className="text-sm font-bold text-txt font-display tabular-nums leading-tight">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/[0.03]">
            <PeriodSelector
              activePreset={activePreset}
              dateRange={dateRange}
              onPresetChange={handlePresetChange}
              onDateRangeChange={handleDateRangeChange}
            />

            <div className="flex items-center gap-5">
              {[
                { label: 'Total', color: '#FBBF24' },
                { label: 'Interessados', color: '#34D399' },
                { label: 'No Grupo', color: '#06B6D4' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5 group/legend cursor-default">
                  <div
                    className="w-2 h-2 rounded-full transition-transform duration-200 group-hover/legend:scale-125"
                    style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}30` }}
                  />
                  <span className="text-[10px] text-txt-dim font-mono group-hover/legend:text-txt-muted transition-colors">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-72">
            {filteredChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredChartData} barGap={2}>
                  <defs>
                    <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientInteressados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientGrupo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="data"
                    tickFormatter={(val) => format(parseLocalDate(val), activePreset === 'hoje' ? 'HH:mm' : 'dd/MM')}
                    stroke="transparent" fontSize={10} fontFamily="JetBrains Mono"
                    tickLine={false} axisLine={false} tick={{ fill: '#52525B' }}
                  />
                  <YAxis
                    stroke="transparent" fontSize={10} fontFamily="JetBrains Mono"
                    tickLine={false} axisLine={false} tick={{ fill: '#52525B' }} width={30}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6, 182, 212, 0.03)' }} />
                  <Area type="monotone" dataKey="leads_total" name="Total Leads"
                    fill="url(#gradientTotal)" stroke="#FBBF24" strokeWidth={1.5} strokeOpacity={0.6}
                    dot={false} activeDot={{ r: 4, fill: '#FBBF24', stroke: '#0A0A0B', strokeWidth: 2 }}
                    animationDuration={600} animationEasing="ease-out"
                  />
                  <Area type="monotone" dataKey="interessados" name="Interessados"
                    fill="url(#gradientInteressados)" stroke="#34D399" strokeWidth={1.5} strokeOpacity={0.5}
                    dot={false} activeDot={{ r: 3, fill: '#34D399', stroke: '#0A0A0B', strokeWidth: 2 }}
                    animationDuration={700} animationEasing="ease-out"
                  />
                  <Area type="monotone" dataKey="no_grupo" name="No Grupo"
                    fill="url(#gradientGrupo)" stroke="#06B6D4" strokeWidth={1.5} strokeOpacity={0.5}
                    dot={false} activeDot={{ r: 3, fill: '#06B6D4', stroke: '#0A0A0B', strokeWidth: 2 }}
                    animationDuration={800} animationEasing="ease-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-8 h-8 text-txt-dim mx-auto mb-2" />
                  <p className="text-sm text-txt-muted">Sem dados para o periodo selecionado</p>
                  <p className="text-[11px] text-txt-dim mt-1">Selecione um periodo com dados disponiveis</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent leads */}
        <div className="card-dark p-5 flex flex-col animate-slide-up stagger-5 opacity-0">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-semibold text-txt font-display">
              {kpiIsToday ? 'Leads de Hoje' : kpiIsSingleDay ? `Leads - ${format(kpiRange.start, 'dd/MM')}` : 'Leads do Periodo'}
            </h3>
            <span className="text-[10px] text-accent font-mono font-semibold bg-accent/8 px-2.5 py-1 rounded-lg ring-1 ring-accent/15">
              {leadsPeriodo.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 max-h-[340px]">
            {leadsPeriodo.slice(0, 10).map((lead, i) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 hover:bg-white/[0.02] rounded-xl transition-all duration-300 group cursor-default"
                style={{ animationDelay: `${0.3 + i * 0.03}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-200/60 flex items-center justify-center text-[11px] font-semibold text-txt-muted font-mono shrink-0 ring-1 ring-white/[0.04]">
                    {(lead.nome || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-txt group-hover:text-accent transition-colors duration-300">{lead.nome || 'Sem nome'}</span>
                    <span className="text-[10px] text-txt-dim font-mono">{formatTelefone(lead.telefone)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <LeadBadge status={lead.status as StatusLead} />
                  <span className="text-[9px] text-txt-dim font-mono tabular-nums">
                    {lead.ultima_interacao ? formatRelativeTime(lead.ultima_interacao) : formatTime(lead.data_primeiro_contato ?? lead.created_at)}
                  </span>
                </div>
              </div>
            ))}
            {leadsPeriodo.length === 0 && (
              <div className="text-center text-txt-dim py-12 text-sm">Nenhum lead no periodo.</div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.04]">
            <button
              onClick={() => navigate('/leads')}
              className="flex items-center justify-center w-full text-xs text-accent font-medium hover:text-cyan-300 transition-colors duration-300 group py-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setIsNotificationsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="w-full max-w-2xl relative z-10" onClick={(e) => e.stopPropagation()}>
            <div className="card-dark-elevated overflow-hidden flex flex-col max-h-[70vh] animate-slide-up">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-accent/10 ring-1 ring-accent/20">
                    <Bell className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm font-semibold text-txt font-display">Notificacoes</span>
                  {contadorNaoLidas > 0 && (
                    <span className="text-[10px] text-accent font-mono font-semibold bg-accent/8 px-2 py-0.5 rounded-lg ring-1 ring-accent/15">
                      {contadorNaoLidas}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notificacoes.length > 0 && (
                    <button
                      onClick={marcarTodasComoLidas}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-accent hover:text-cyan-300 font-medium transition-colors rounded-lg hover:bg-accent/5"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Marcar todas como lidas
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/[0.04] text-txt-muted hover:text-txt transition-all duration-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NotificacoesList
                  notificacoes={notificacoes}
                  loading={loadingNotif}
                  onMarcarComoLida={marcarComoLida}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 4. MetricCard — `src/components/MetricCard.tsx`

```tsx
import React, { useMemo } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color?: 'emerald' | 'cyan' | 'amber' | 'rose';
  sparklineData?: number[];
}

const colorMap = {
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-400',
    iconRing: 'ring-emerald-500/20',
    glow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.08)]',
    gradient: 'from-emerald-500/8 via-transparent to-transparent',
    sparkline: '#10B981',
    sparklineFill: 'rgba(16, 185, 129, 0.08)',
    dot: 'bg-emerald-400',
    accentLine: 'bg-gradient-to-r from-emerald-500/40 to-transparent',
  },
  cyan: {
    icon: 'bg-cyan-500/10 text-cyan-400',
    iconRing: 'ring-cyan-500/20',
    glow: 'group-hover:shadow-[0_0_40px_rgba(6,182,212,0.08)]',
    gradient: 'from-cyan-500/8 via-transparent to-transparent',
    sparkline: '#06B6D4',
    sparklineFill: 'rgba(6, 182, 212, 0.08)',
    dot: 'bg-cyan-400',
    accentLine: 'bg-gradient-to-r from-cyan-500/40 to-transparent',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-400',
    iconRing: 'ring-amber-500/20',
    glow: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.08)]',
    gradient: 'from-amber-500/8 via-transparent to-transparent',
    sparkline: '#F59E0B',
    sparklineFill: 'rgba(245, 158, 11, 0.08)',
    dot: 'bg-amber-400',
    accentLine: 'bg-gradient-to-r from-amber-500/40 to-transparent',
  },
  rose: {
    icon: 'bg-rose-500/10 text-rose-400',
    iconRing: 'ring-rose-500/20',
    glow: 'group-hover:shadow-[0_0_40px_rgba(244,63,94,0.08)]',
    gradient: 'from-rose-500/8 via-transparent to-transparent',
    sparkline: '#F43F5E',
    sparklineFill: 'rgba(244, 63, 94, 0.08)',
    dot: 'bg-rose-400',
    accentLine: 'bg-gradient-to-r from-rose-500/40 to-transparent',
  },
};

const Sparkline: React.FC<{ data: number[]; color: string; fill: string }> = ({ data, color, fill }) => {
  const width = 100;
  const height = 32;
  const padding = 2;

  const points = useMemo(() => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    return data.map((val, i) => ({
      x: padding + (i / (data.length - 1)) * (width - padding * 2),
      y: padding + (1 - (val - min) / range) * (height - padding * 2),
    }));
  }, [data]);

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="1" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-fill-${color})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2" fill={color} />
    </svg>
  );
};

const defaultSparklines: Record<string, number[]> = {
  emerald: [4, 6, 5, 8, 7, 9, 10, 8, 12, 11, 13],
  cyan: [8, 10, 9, 12, 11, 15, 14, 13, 16, 15, 18],
  amber: [3, 2, 4, 3, 5, 4, 3, 5, 4, 6, 3],
  rose: [5, 4, 6, 5, 3, 4, 5, 3, 4, 3, 2],
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendType = 'neutral',
  icon: Icon,
  color = 'emerald',
  sparklineData,
}) => {
  const colors = colorMap[color];
  const data = sparklineData || defaultSparklines[color];

  const trendConfig = {
    positive: { color: 'text-emerald-400', icon: TrendingUp, bg: 'bg-emerald-500/8' },
    negative: { color: 'text-rose-400', icon: TrendingDown, bg: 'bg-rose-500/8' },
    neutral: { color: 'text-txt-muted', icon: Minus, bg: 'bg-surface-300/10' },
  };

  const TrendIcon = trendConfig[trendType].icon;

  return (
    <div className={cn(
      "card-dark p-5 group transition-all duration-500 h-full flex flex-col relative",
      colors.glow
    )}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none", colors.gradient)} />
      <div className={cn("absolute top-0 left-0 right-0 h-[1px]", colors.accentLine)} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "p-2.5 rounded-xl ring-1 transition-all duration-300 group-hover:scale-105",
            colors.icon,
            colors.iconRing
          )}>
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </div>

          {trend && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-medium tracking-wide",
              trendConfig[trendType].bg,
              trendConfig[trendType].color
            )}>
              <TrendIcon className="w-3 h-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>

        <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-[0.08em] mb-1">{title}</p>

        <div className="text-[2rem] font-bold text-txt font-display tracking-tight leading-none mb-1 animate-count-up">
          {value}
        </div>

        {subtitle && (
          <p className="text-[11px] text-txt-dim leading-relaxed mb-3">{subtitle}</p>
        )}

        <div className="mt-auto pt-3">
          <div className="sparkline-container">
            <Sparkline data={data} color={colors.sparkline} fill={colors.sparklineFill} />
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 5. LeadBadge — `src/components/LeadBadge.tsx`

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

---

## 6. PageHeader — `src/components/PageHeader.tsx`

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

## 7. Toast — `src/components/Toast.tsx`

```tsx
import React from 'react';
import { Check, X } from 'lucide-react';
import type { ToastData } from '../hooks/useToast';
import { cn } from '../utils/cn';

interface ToastProps {
  toast: ToastData;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border animate-slide-up',
      toast.type === 'success'
        ? 'bg-accent/10 border-accent/20 text-accent'
        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
    )} style={{
      background: toast.type === 'success'
        ? 'linear-gradient(145deg, rgba(6, 182, 212, 0.12) 0%, rgba(6, 182, 212, 0.06) 100%)'
        : 'linear-gradient(145deg, rgba(244, 63, 94, 0.12) 0%, rgba(244, 63, 94, 0.06) 100%)',
      backdropFilter: 'blur(20px)',
    }}>
      {toast.type === 'success'
        ? <Check className="w-4 h-4 shrink-0" />
        : <X className="w-4 h-4 shrink-0" />
      }
      <span className="text-[13px] font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/[0.06] rounded-lg transition-colors ml-2"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
```

---

## 8. Hook useDashboard — `src/hooks/useDashboard.ts`

```tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useVisibilityRefresh } from './useVisibilityRefresh';
import type { LeadRow } from '../types/database';

export interface DashboardMetricas {
  leads_hoje: number;
  leads_ontem: number;
  taxa_conversao: number;
  aguardando_resposta: number;
  total_leads: number;
  total_no_grupo: number;
}

export interface MetricaPeriodo {
  data: string;
  data_formatada: string;
  leads_total: number;
  interessados: number;
  no_grupo: number;
}

interface UseDashboardReturn {
  metricas: DashboardMetricas | null;
  chartData: MetricaPeriodo[];
  leadsPeriodo: LeadRow[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

type MetricasDashboardRow = {
  leads_hoje: number;
  leads_ontem: number;
  taxa_conversao: number;
  aguardando_resposta: number;
  total_leads: number;
  total_no_grupo: number;
};

async function fetchMetricasDashboard(): Promise<DashboardMetricas> {
  const { data, error } = await supabase.rpc('get_metricas_dashboard') as unknown as {
    data: MetricasDashboardRow | MetricasDashboardRow[] | null;
    error: unknown;
  };

  if (error) {
    const message = typeof error === 'object' && error && 'message' in error
      ? String((error as { message: unknown }).message)
      : 'Erro ao carregar metricas';
    throw new Error(message);
  }

  const row = (Array.isArray(data) ? data[0] : data) ?? ({} as Partial<MetricasDashboardRow>);
  return {
    leads_hoje: row?.leads_hoje ?? 0,
    leads_ontem: row?.leads_ontem ?? 0,
    taxa_conversao: row?.taxa_conversao ?? 0,
    aguardando_resposta: row?.aguardando_resposta ?? 0,
    total_leads: row?.total_leads ?? 0,
    total_no_grupo: row?.total_no_grupo ?? 0,
  };
}

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseTimestamp(ts: string): Date {
  return new Date(ts.replace(' ', 'T'));
}

function localStartOfDayUTC(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

function localEndOfDayUTC(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59.999`).toISOString();
}

async function fetchMetricasPeriodo(dias: number): Promise<MetricaPeriodo[]> {
  const hoje = new Date();
  const inicio = new Date();
  inicio.setDate(hoje.getDate() - (dias - 1));

  const inicioStr = formatLocalDate(inicio);
  const hojeStr = formatLocalDate(hoje);

  const { data, error } = await supabase
    .from('leads')
    .select('data_primeiro_contato, resposta_comunidade, entrou_no_grupo')
    .not('data_primeiro_contato', 'is', null)
    .gte('data_primeiro_contato', localStartOfDayUTC(inicioStr))
    .lte('data_primeiro_contato', localEndOfDayUTC(hojeStr));

  if (error) throw new Error(error.message);
  if (!data) return [];

  const grouped: Record<string, { total: number; interessados: number; no_grupo: number }> = {};
  for (let i = 0; i < dias; i++) {
    const d = new Date();
    d.setDate(hoje.getDate() - (dias - 1 - i));
    grouped[formatLocalDate(d)] = { total: 0, interessados: 0, no_grupo: 0 };
  }

  for (const lead of data as any[]) {
    if (!lead.data_primeiro_contato) continue;
    const dateKey = formatLocalDate(parseTimestamp(lead.data_primeiro_contato));
    if (!grouped[dateKey]) continue;

    grouped[dateKey].total += 1;
    if (lead.resposta_comunidade === 'sim') {
      grouped[dateKey].interessados += 1;
    }
    if (lead.entrou_no_grupo) {
      grouped[dateKey].no_grupo += 1;
    }
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, counts]) => ({
      data: dateStr,
      data_formatada: '',
      leads_total: counts.total,
      interessados: counts.interessados,
      no_grupo: counts.no_grupo,
    }));
}

async function fetchLeadsPeriodo(inicio: string, fim: string): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .not('data_primeiro_contato', 'is', null)
    .gte('data_primeiro_contato', localStartOfDayUTC(inicio))
    .lte('data_primeiro_contato', localEndOfDayUTC(fim))
    .order('data_primeiro_contato', { ascending: false });

  if (error) throw new Error(error.message);
  return (data as unknown as LeadRow[]) ?? [];
}

const AUTO_REFRESH_MS = 30_000;

export function useDashboard(
  dias: number = 7,
  kpiInicio: string = formatLocalDate(new Date()),
  kpiFim: string = formatLocalDate(new Date()),
): UseDashboardReturn {
  const { sessionReady } = useAuth();
  const [metricas, setMetricas] = useState<DashboardMetricas | null>(null);
  const [chartData, setChartData] = useState<MetricaPeriodo[]>([]);
  const [leadsPeriodo, setLeadsPeriodo] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const deriveMetricas = useCallback((rows: LeadRow[]): DashboardMetricas => {
    const totalLeads = rows.length;
    const leadsNoGrupo = rows.filter(l => !!l.entrou_no_grupo).length;
    const leadsWaiting = rows.filter(l => l.status === 'sem_resposta').length;
    const taxa = totalLeads > 0 ? Math.round((leadsNoGrupo / totalLeads) * 100) : 0;
    return {
      leads_hoje: totalLeads,
      leads_ontem: 0,
      taxa_conversao: taxa,
      aguardando_resposta: leadsWaiting,
      total_leads: totalLeads,
      total_no_grupo: leadsNoGrupo,
    };
  }, []);

  const errorToMessage = useCallback((err: unknown) => {
    if (typeof err === 'object' && err && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'Erro ao carregar dados';
  }, []);

  const load = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const [metRes, chartRes, leadsRes] = await Promise.allSettled([
        fetchMetricasDashboard(),
        fetchMetricasPeriodo(dias),
        fetchLeadsPeriodo(kpiInicio, kpiFim),
      ]);

      if (metRes.status === 'fulfilled') setMetricas(metRes.value);
      if (chartRes.status === 'fulfilled') setChartData(chartRes.value);
      if (leadsRes.status === 'fulfilled') {
        setLeadsPeriodo(leadsRes.value);
        if (metRes.status === 'rejected') {
          setMetricas(deriveMetricas(leadsRes.value));
        }
      }

      const firstError = [metRes, chartRes, leadsRes].find(r => r.status === 'rejected') as
        | PromiseRejectedResult
        | undefined;
      if (firstError) {
        const message = errorToMessage(firstError.reason);
        setError(message);
        console.error('Erro ao carregar dashboard:', message);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [deriveMetricas, dias, errorToMessage, kpiInicio, kpiFim]);

  useEffect(() => {
    load();
  }, [load, sessionReady]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      load(false);
    }, AUTO_REFRESH_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-leads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => { load(false); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load, sessionReady]);

  useVisibilityRefresh(() => load(false));

  const refresh = useCallback(() => {
    load(true);
  }, [load]);

  return { metricas, chartData, leadsPeriodo, loading, error, refresh };
}
```

---

## 9. Mock Data — `src/data/mockData.ts`

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

## 10. Mock Templates — `src/data/mockTemplates.ts`

```tsx
import { Template } from "../types/envios";

export const mockTemplates: Template[] = [
  {
    id: "1",
    nome: "Lembrete de Live",
    tipo: "texto",
    mensagem_com_nome: "Ola, {{nome}}! Hoje tem live as 20h na comunidade. Nao perde! Te espero la.",
    mensagem_sem_nome: "Ola! Hoje tem live as 20h na comunidade. Nao perde! Te espero la.",
    created_at: "2025-02-10T10:00:00Z",
    updated_at: "2025-02-10T10:00:00Z"
  },
  {
    id: "2",
    nome: "Reengajamento",
    tipo: "texto",
    mensagem_com_nome: "E ai, {{nome}}! Sumiu, hein? To fazendo lives todos os dias com conteudo novo. Bora participar?",
    mensagem_sem_nome: "E ai! Sumiu, hein? To fazendo lives todos os dias com conteudo novo. Bora participar?",
    created_at: "2025-02-08T14:30:00Z",
    updated_at: "2025-02-08T14:30:00Z"
  },
  {
    id: "3",
    nome: "Boas vindas atrasadas",
    tipo: "audio",
    mensagem_com_nome: "Fala, {{nome}}! Vi que voce chegou pelo Instagram mas a gente ainda nao conversou direito. To fazendo lives gratuitas todo dia, quer participar?",
    mensagem_sem_nome: "Fala! Vi que voce chegou pelo Instagram mas a gente ainda nao conversou direito. To fazendo lives gratuitas todo dia, quer participar?",
    created_at: "2025-02-05T09:00:00Z",
    updated_at: "2025-02-05T09:00:00Z"
  },
  {
    id: "4",
    nome: "Convite Comunidade",
    tipo: "texto",
    mensagem_com_nome: "{{nome}}, tudo bem? O Allan ta liberando conteudo exclusivo na comunidade gratuita. Quer o link pra entrar?",
    mensagem_sem_nome: "Tudo bem? O Allan ta liberando conteudo exclusivo na comunidade gratuita. Quer o link pra entrar?",
    created_at: "2025-02-03T16:00:00Z",
    updated_at: "2025-02-03T16:00:00Z"
  }
];
```

---

## 11. Mock Historico Envios — `src/data/mockHistoricoEnvios.ts`

```tsx
import { HistoricoEnvio } from "../types/envios";

export const mockHistoricoEnvios: HistoricoEnvio[] = [
  {
    id: "1",
    data_envio: "2025-02-15T14:32:00Z",
    tipo: "texto",
    mensagem_com_nome: "Ola, {{nome}}! Hoje tem live as 20h na comunidade. Nao perde! Te espero la.",
    mensagem_sem_nome: "Ola! Hoje tem live as 20h na comunidade. Nao perde! Te espero la.",
    status_selecionados: ["interessado", "link_enviado"],
    periodo_inicio: null,
    periodo_fim: null,
    total_leads: 47,
    leads_com_nome: 32,
    leads_sem_nome: 15,
    template_id: "1"
  },
  {
    id: "2",
    data_envio: "2025-02-14T10:15:00Z",
    tipo: "audio",
    mensagem_com_nome: "Fala, {{nome}}! Passou na live ontem? Teve conteudo muito bom!",
    mensagem_sem_nome: "Fala! Passou na live ontem? Teve conteudo muito bom!",
    status_selecionados: ["primeiro_audio_enviado"],
    periodo_inicio: "2025-02-07",
    periodo_fim: "2025-02-14",
    total_leads: 23,
    leads_com_nome: 18,
    leads_sem_nome: 5,
    template_id: null
  },
  {
    id: "3",
    data_envio: "2025-02-13T09:00:00Z",
    tipo: "texto",
    mensagem_com_nome: "Bom dia, {{nome}}! So passando pra lembrar da live de hoje as 20h. Vai ter sorteio!",
    mensagem_sem_nome: "Bom dia! So passando pra lembrar da live de hoje as 20h. Vai ter sorteio!",
    status_selecionados: ["no_grupo"],
    periodo_inicio: null,
    periodo_fim: null,
    total_leads: 89,
    leads_com_nome: 67,
    leads_sem_nome: 22,
    template_id: null
  },
  {
    id: "4",
    data_envio: "2025-02-12T18:45:00Z",
    tipo: "texto",
    mensagem_com_nome: "E ai, {{nome}}! Sumiu, hein? To fazendo lives todos os dias com conteudo novo. Bora participar?",
    mensagem_sem_nome: "E ai! Sumiu, hein? To fazendo lives todos os dias com conteudo novo. Bora participar?",
    status_selecionados: ["sem_resposta", "nao_interessado"],
    periodo_inicio: "2025-01-01",
    periodo_fim: "2025-02-10",
    total_leads: 34,
    leads_com_nome: 21,
    leads_sem_nome: 13,
    template_id: "2"
  },
  {
    id: "5",
    data_envio: "2025-02-10T11:30:00Z",
    tipo: "audio",
    mensagem_com_nome: "{{nome}}, tudo bem? O Allan ta liberando conteudo exclusivo na comunidade gratuita. Quer o link pra entrar?",
    mensagem_sem_nome: "Tudo bem? O Allan ta liberando conteudo exclusivo na comunidade gratuita. Quer o link pra entrar?",
    status_selecionados: ["convite_enviado", "interessado"],
    periodo_inicio: null,
    periodo_fim: null,
    total_leads: 56,
    leads_com_nome: 41,
    leads_sem_nome: 15,
    template_id: "4"
  }
];
```

---

## Resumo dos Arquivos

| # | Arquivo | Funcao |
|---|---------|--------|
| 1 | `src/components/Sidebar.tsx` | Navegacao lateral colapsavel |
| 2 | `src/App.tsx` | Layout principal (ProtectedLayout + rotas) |
| 3 | `src/pages/Dashboard.tsx` | Pagina com KPIs, grafico Recharts, leads recentes, notificacoes |
| 4 | `src/components/MetricCard.tsx` | Card de KPI com sparkline SVG |
| 5 | `src/components/LeadBadge.tsx` | Badge colorido por status do lead |
| 6 | `src/components/PageHeader.tsx` | Header reutilizavel com titulo e botao refresh |
| 7 | `src/components/Toast.tsx` | Notificacao toast de sucesso/erro |
| 8 | `src/hooks/useDashboard.ts` | Hook que busca dados do Supabase |
| 9 | `src/data/mockData.ts` | 30 leads mock + 10 notificacoes + 30 dias de metricas |
| 10 | `src/data/mockTemplates.ts` | 4 templates de mensagem |
| 11 | `src/data/mockHistoricoEnvios.ts` | 5 registros de envios em massa |
