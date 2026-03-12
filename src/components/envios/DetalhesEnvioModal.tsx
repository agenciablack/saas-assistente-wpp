import React from 'react';
import { X, MessageSquareText, Mic, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { HistoricoEnvio } from '../../types/envios';
import { LeadBadge } from '../LeadBadge';
import { StatusLead } from '../../types';
import { formatDate, formatTime } from '../../utils/formatters';

interface EnvioDetalhe extends HistoricoEnvio {
  leads_enviados?: number;
  leads_erro?: number;
  status?: string;
}

interface DetalhesEnvioModalProps {
  envio: EnvioDetalhe;
  onClose: () => void;
}

export const DetalhesEnvioModal: React.FC<DetalhesEnvioModalProps> = ({ envio, onClose }) => {
  const isAudio = envio.tipo === 'audio';
  const comNomePct = envio.total_leads > 0 ? Math.round((envio.leads_com_nome / envio.total_leads) * 100) : 0;
  const semNomePct = envio.total_leads > 0 ? Math.round((envio.leads_sem_nome / envio.total_leads) * 100) : 0;

  const statusLabel = envio.status === 'concluido' ? 'Concluido'
    : envio.status === 'em_andamento' ? 'Em andamento'
    : envio.status === 'cancelado' ? 'Cancelado'
    : envio.status === 'erro' ? 'Erro'
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card-dark-elevated w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-300/20 shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-txt font-display">Detalhes do Envio</h2>
            <p className="text-[12px] text-txt-muted mt-0.5">
              {formatDate(envio.data_envio)} às {formatTime(envio.data_envio)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
          {/* Config */}
          <div className="space-y-2.5">
            <h3 className="text-[12px] font-mono text-txt-muted uppercase tracking-wide">Configuração</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2 bg-surface-50/60 rounded-xl border border-surface-300/10">
                <span className="text-[11px] text-txt-dim block">Tipo</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isAudio
                    ? <Mic className="w-3 h-3 text-violet-400" />
                    : <MessageSquareText className="w-3 h-3 text-accent" />
                  }
                  <span className="text-[13px] text-txt font-medium">{isAudio ? 'Áudio' : 'Texto'}</span>
                </div>
              </div>
              <div className="px-3 py-2 bg-surface-50/60 rounded-xl border border-surface-300/10">
                <span className="text-[11px] text-txt-dim block">Período</span>
                <span className="text-[13px] text-txt font-medium mt-0.5 block">
                  {envio.periodo_inicio
                    ? `${formatDate(envio.periodo_inicio)} - ${formatDate(envio.periodo_fim || '')}`
                    : 'Todos os leads'
                  }
                </span>
              </div>
            </div>

            {/* Status badges */}
            <div className="px-3 py-2 bg-surface-50/60 rounded-xl border border-surface-300/10">
              <span className="text-[11px] text-txt-dim block mb-1.5">Status filtrados</span>
              <div className="flex flex-wrap gap-1.5">
                {envio.status_selecionados.map((s) => (
                  <LeadBadge key={s} status={s as StatusLead} className="!text-[9px] !px-1.5 !py-0.5" />
                ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-3">
            <h3 className="text-[12px] font-mono text-txt-muted uppercase tracking-wide">Mensagens</h3>
            <div className="space-y-2">
              <div className="px-3 py-3 bg-surface-50/60 rounded-xl border border-surface-300/10">
                <span className="text-[11px] text-accent font-mono uppercase tracking-wide block mb-1.5">Com nome</span>
                <p className="text-[12px] text-txt-secondary leading-relaxed">{envio.mensagem_com_nome}</p>
              </div>
              <div className="px-3 py-3 bg-surface-50/60 rounded-xl border border-surface-300/10">
                <span className="text-[11px] text-txt-muted font-mono uppercase tracking-wide block mb-1.5">Sem nome</span>
                <p className="text-[12px] text-txt-secondary leading-relaxed">{envio.mensagem_sem_nome}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2.5">
            <h3 className="text-[12px] font-mono text-txt-muted uppercase tracking-wide">Resumo</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="px-3 py-3 bg-surface-50/60 rounded-xl border border-surface-300/10 text-center">
                <span className="text-[20px] font-bold text-accent font-display block">{envio.total_leads}</span>
                <span className="text-[11px] text-txt-muted">Total enviado</span>
              </div>
              <div className="px-3 py-3 bg-surface-50/60 rounded-xl border border-surface-300/10 text-center">
                <span className="text-[20px] font-bold text-txt font-display block">{envio.leads_com_nome}</span>
                <span className="text-[11px] text-txt-muted">Com nome ({comNomePct}%)</span>
              </div>
              <div className="px-3 py-3 bg-surface-50/60 rounded-xl border border-surface-300/10 text-center">
                <span className="text-[20px] font-bold text-txt font-display block">{envio.leads_sem_nome}</span>
                <span className="text-[11px] text-txt-muted">Sem nome ({semNomePct}%)</span>
              </div>
            </div>

            {/* Envio status breakdown */}
            {(envio.leads_enviados != null || envio.leads_erro != null) && (
              <div className="flex items-center gap-4 px-3 py-2.5 bg-surface-50/60 rounded-xl border border-surface-300/10">
                {envio.leads_enviados != null && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[12px] text-accent font-medium">{envio.leads_enviados} enviados</span>
                  </div>
                )}
                {envio.leads_erro != null && envio.leads_erro > 0 && (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[12px] text-rose-400 font-medium">{envio.leads_erro} erros</span>
                  </div>
                )}
                {statusLabel && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Clock className="w-3.5 h-3.5 text-txt-dim" />
                    <span className="text-[11px] text-txt-muted">{statusLabel}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bar chart */}
            <div className="h-2 bg-surface-200/40 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-accent rounded-l-full"
                style={{ width: `${comNomePct}%` }}
              />
              <div
                className="h-full bg-surface-300/60 rounded-r-full"
                style={{ width: `${semNomePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-300/20 shrink-0">
          <button
            onClick={onClose}
            className="btn-primary text-[13px] px-5 py-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
