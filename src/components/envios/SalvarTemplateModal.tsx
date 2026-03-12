import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface SalvarTemplateModalProps {
  mensagemComNome: string;
  mensagemSemNome: string;
  tipo: 'texto' | 'audio';
  onSave: (nome: string) => void;
  onClose: () => void;
}

export const SalvarTemplateModal: React.FC<SalvarTemplateModalProps> = ({
  mensagemComNome,
  mensagemSemNome,
  tipo,
  onSave,
  onClose,
}) => {
  const [nome, setNome] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative card-dark-elevated w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-300/20">
          <h2 className="text-[15px] font-semibold text-txt font-display">Salvar como Template</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[13px] font-medium text-txt mb-1.5 block">Nome do template</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Lembrete de Live"
              className="input-dark text-[13px]"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] text-txt-muted font-mono uppercase tracking-wide">
                {tipo === 'audio' ? '🎤 Áudio' : '💬 Texto'} • Com nome
              </span>
              <div className="mt-1 px-3 py-2 bg-surface-50/60 rounded-xl text-[12px] text-txt-secondary leading-relaxed border border-surface-300/10">
                {mensagemComNome || <span className="text-txt-dim italic">Vazio</span>}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-txt-muted font-mono uppercase tracking-wide">Sem nome</span>
              <div className="mt-1 px-3 py-2 bg-surface-50/60 rounded-xl text-[12px] text-txt-secondary leading-relaxed border border-surface-300/10">
                {mensagemSemNome || <span className="text-txt-dim italic">Vazio</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-300/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-txt-secondary hover:text-txt bg-surface-200/30 hover:bg-surface-200/50 rounded-xl border border-surface-300/20 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => { if (nome.trim()) onSave(nome.trim()); }}
            disabled={!nome.trim()}
            className="btn-primary text-[13px] px-5 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Template
          </button>
        </div>
      </div>
    </div>
  );
};
