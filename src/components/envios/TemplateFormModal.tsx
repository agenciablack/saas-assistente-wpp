import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Template } from '../../types/envios';
import { TipoEnvioSelector } from './TipoEnvioSelector';
import { MensagemEditor } from './MensagemEditor';

interface TemplateFormModalProps {
  template?: Template | null;
  onSave: (data: { nome: string; tipo: 'texto' | 'audio'; mensagem_com_nome: string; mensagem_sem_nome: string }) => void;
  onClose: () => void;
}

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  template,
  onSave,
  onClose,
}) => {
  const isEditing = !!template;
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'texto' | 'audio'>('texto');
  const [mensagemComNome, setMensagemComNome] = useState('');
  const [mensagemSemNome, setMensagemSemNome] = useState('');

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setTipo(template.tipo);
      setMensagemComNome(template.mensagem_com_nome);
      setMensagemSemNome(template.mensagem_sem_nome);
    }
  }, [template]);

  const canSave = nome.trim().length > 0 && mensagemComNome.length > 0 && mensagemSemNome.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ nome: nome.trim(), tipo, mensagem_com_nome: mensagemComNome, mensagem_sem_nome: mensagemSemNome });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card-dark-elevated w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-surface-300/20 shrink-0">
          <h2 className="text-[15px] font-semibold text-txt font-display">
            {isEditing ? 'Editar Template' : 'Novo Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-txt-muted hover:text-txt hover:bg-surface-200/40 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
          {/* Nome */}
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

          {/* Tipo */}
          <div>
            <label className="text-[13px] font-medium text-txt mb-2 block">Tipo</label>
            <TipoEnvioSelector tipo={tipo} onChange={setTipo} />
          </div>

          {/* Mensagens */}
          <MensagemEditor
            label="Mensagem COM nome"
            sublabel="Para leads com nome cadastrado"
            placeholder="Olá, {{nome}}! Digite sua mensagem aqui..."
            value={mensagemComNome}
            onChange={setMensagemComNome}
            showNomeButton
            validacao="deve-ter-nome"
          />

          <MensagemEditor
            label="Mensagem SEM nome"
            sublabel="Para leads sem nome cadastrado"
            placeholder="Olá! Digite sua mensagem aqui..."
            value={mensagemSemNome}
            onChange={setMensagemSemNome}
            validacao="nao-pode-ter-nome"
          />
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-300/20 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-txt-secondary hover:text-txt bg-surface-200/30 hover:bg-surface-200/50 rounded-xl border border-surface-300/20 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="btn-primary text-[13px] px-5 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
