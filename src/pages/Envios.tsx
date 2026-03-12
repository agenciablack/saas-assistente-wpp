import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { EnviosNav } from '../components/envios/EnviosNav';
import { Send, Users, Wrench } from 'lucide-react';

export const Envios: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Envios em Massa" subtitle="Dispare mensagens para grupos de leads" />
      <EnviosNav />

      {/* Container com blur */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Conteúdo placeholder com blur */}
        <div className="select-none pointer-events-none blur-[6px] opacity-40">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-3 space-y-5">
              <div className="card-dark p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" />
                  <h3 className="text-[14px] font-semibold text-txt font-display">Selecionar Leads</h3>
                </div>
                <div className="space-y-2.5">
                  {['Aguardando Nome', 'Convite Enviado', 'Interessado', 'Link Enviado', 'Sem Resposta'].map((s) => (
                    <div key={s} className="flex items-center gap-3 px-3 py-2 rounded-xl">
                      <div className="w-[18px] h-[18px] rounded-md border-2 border-accent/40 bg-accent/10" />
                      <span className="text-[13px] text-txt-secondary">{s}</span>
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2.5 bg-accent/5 rounded-xl border border-accent/10">
                  <span className="text-[14px] font-semibold text-accent">124</span>
                  <span className="text-[13px] text-txt-secondary ml-1.5">leads encontrados</span>
                </div>
              </div>

              <div className="card-dark p-5 space-y-3">
                <h3 className="text-[14px] font-semibold text-txt font-display">Tipo de Envio</h3>
                <div className="flex gap-3">
                  <div className="flex-1 p-3 rounded-xl border border-accent/30 bg-accent/5 text-center text-sm text-accent">Audio</div>
                  <div className="flex-1 p-3 rounded-xl border border-surface-300/20 text-center text-sm text-txt-muted">Texto</div>
                </div>
              </div>

              <div className="card-dark p-5 space-y-4">
                <h3 className="text-[14px] font-semibold text-txt font-display">Mensagens</h3>
                <div className="h-24 bg-surface-200/20 rounded-xl" />
                <div className="h-24 bg-surface-200/20 rounded-xl" />
              </div>

              <div className="card-dark p-5">
                <h3 className="text-[14px] font-semibold text-txt font-display mb-4">Configurações</h3>
                <div className="h-10 bg-surface-200/20 rounded-xl" />
              </div>

              <div className="w-full py-3.5 rounded-2xl bg-surface-200/30 text-txt-dim border border-surface-300/20 text-center text-[14px] font-semibold flex items-center justify-center gap-2.5">
                <Send className="w-4 h-4" />
                Enviar para 124 leads
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-2">
              <div className="card-dark p-5">
                <h3 className="text-[14px] font-semibold text-txt font-display mb-4">Leads que vão receber</h3>
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <div className="w-8 h-8 rounded-lg bg-surface-200/50" />
                      <div className="flex-1">
                        <div className="h-3.5 bg-surface-200/40 rounded w-28 mb-1" />
                        <div className="h-3 bg-surface-200/30 rounded w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay "Em desenvolvimento" */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-50 border border-surface-300/20 mb-4 shadow-lg">
              <Wrench className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-txt font-display mb-1.5">Em Desenvolvimento</h3>
            <p className="text-sm text-txt-muted max-w-xs mx-auto leading-relaxed">
              Esta funcionalidade está sendo construída e estará disponível em breve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
