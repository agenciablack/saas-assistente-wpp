import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { WhatsappRotacaoMensagem } from '../../hooks/useWhatsappRotacao';

interface MensagemAberturaFormModalProps {
  mensagem?: WhatsappRotacaoMensagem | null;
  proximaOrdem: number;
  onSave: (data: { mensagem: string; ordem: number }) => Promise<void>;
  onClose: () => void;
}

export const MensagemAberturaFormModal: React.FC<MensagemAberturaFormModalProps> = ({
  mensagem,
  proximaOrdem,
  onSave,
  onClose,
}) => {
  const isEditing = !!mensagem;
  const [texto, setTexto] = useState('');
  const [ordem, setOrdem] = useState(proximaOrdem);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mensagem) {
      setTexto(mensagem.mensagem);
      setOrdem(mensagem.ordem);
    }
  }, [mensagem]);

  const canSave = texto.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({ mensagem: texto.trim(), ordem });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card-dark-elevated w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-surface-300/20">
          <h2 className="text-[15px] font-semibold text-txt font-display">
            {isEditing ? 'Editar Mensagem' : 'Nova Mensagem'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[13px] font-medium text-txt mb-1.5 block">Mensagem</label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Digite a mensagem de abertura..."
              className="input-dark text-[13px] min-h-[80px] resize-y"
              rows={4}
              autoFocus
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-txt mb-1.5 block">Ordem</label>
            <input
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(Number(e.target.value))}
              min={1}
              className="input-dark text-[13px] w-24"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-300/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-txt-secondary hover:text-txt bg-surface-200/30 hover:bg-surface-200/50 rounded-xl border border-surface-300/20 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="btn-primary text-[13px] px-5 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
