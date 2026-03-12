import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  templateName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  templateName,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card-dark-elevated w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-surface-300/20">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h2 className="text-[15px] font-semibold text-txt font-display">Excluir template?</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-[13px] text-txt-secondary leading-relaxed">
            Tem certeza que deseja excluir o template <strong className="text-txt">"{templateName}"</strong>? Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-300/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-txt-secondary hover:text-txt bg-surface-200/30 hover:bg-surface-200/50 rounded-xl border border-surface-300/20 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-rose-500/80 hover:bg-rose-500 rounded-xl transition-all hover:shadow-[0_4px_20px_rgba(239,68,68,0.3)]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};
