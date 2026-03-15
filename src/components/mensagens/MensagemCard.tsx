import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, FileText, Trash2, Plus, Play, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { MensagemFunil } from '../../hooks/useMensagensFunil';

interface MensagemCardProps {
  mensagem: MensagemFunil;
  isModified: boolean;
  telefoneTeste: string;
  hasTempoEspera: boolean;
  allowEmptyMessages: boolean;
  showAtivoToggle: boolean;
  onUpdate: (updates: Partial<MensagemFunil>) => void;
  onShowToast: (type: 'success' | 'error', message: string) => void;
}

export const MensagemCard: React.FC<MensagemCardProps> = ({
  mensagem,
  isModified,
  telefoneTeste,
  hasTempoEspera,
  allowEmptyMessages,
  showAtivoToggle,
  onUpdate,
  onShowToast,
}) => {
  const [testing, setTesting] = useState(false);
  const textareaRefs = useRef<Map<number, HTMLTextAreaElement>>(new Map());

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  // Auto-resize all textareas when messages change
  useEffect(() => {
    textareaRefs.current.forEach((el) => autoResize(el));
  }, [mensagem.mensagens, autoResize]);

  const setTextareaRef = useCallback((index: number, el: HTMLTextAreaElement | null) => {
    if (el) {
      textareaRefs.current.set(index, el);
      autoResize(el);
    } else {
      textareaRefs.current.delete(index);
    }
  }, [autoResize]);

  const updateMessage = (index: number, value: string) => {
    const newMensagens = [...mensagem.mensagens];
    newMensagens[index] = value;
    onUpdate({ mensagens: newMensagens });
  };

  const removeMessage = (index: number) => {
    const newMensagens = mensagem.mensagens.filter((_, i) => i !== index);
    onUpdate({ mensagens: newMensagens });
  };

  const addMessage = () => {
    onUpdate({ mensagens: [...mensagem.mensagens, ''] });
  };

  const insertVariable = (index: number, variable: string) => {
    const textarea = textareaRefs.current.get(index);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = mensagem.mensagens[index];
    const newText = text.substring(0, start) + variable + text.substring(end);

    const newMensagens = [...mensagem.mensagens];
    newMensagens[index] = newText;
    onUpdate({ mensagens: newMensagens });

    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      textarea.focus();
    });
  };

  const handleTest = async () => {
    if (!telefoneTeste) {
      onShowToast('error', 'Configure o número de teste no topo da página');
      return;
    }

    setTesting(true);
    try {
      const res = await fetch('https://n8n-n8n.04qisd.easypanel.host/webhook/teste-mensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cenario: mensagem.cenario,
          tipo_envio: mensagem.tipo_envio,
          mensagens: mensagem.mensagens,
          nome_teste: 'João',
          telefone_teste: telefoneTeste.replace(/\D/g, ''),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onShowToast('success', 'Mensagem de teste enviada!');
    } catch {
      onShowToast('error', 'Erro ao enviar teste');
    } finally {
      setTesting(false);
    }
  };

  const renderPreview = () => {
    return mensagem.mensagens
      .filter((m) => m.trim())
      .map((msg, i) => {
        const preview = msg
          .replace(/\{\{nome\}\}/g, 'João')
          .replace(/\(inhale\)/g, '...');
        return (
          <div
            key={i}
            className="max-w-[85%] ml-auto bg-[#005c4b] text-white text-[13px] px-3.5 py-2 rounded-xl rounded-tr-sm leading-relaxed"
          >
            {preview}
          </div>
        );
      });
  };

  const canDelete = allowEmptyMessages || mensagem.mensagens.length > 1;
  const disabled = showAtivoToggle && !mensagem.ativo;

  return (
    <div
      className={cn(
        'card-dark p-5 transition-all duration-300',
        isModified && 'border-[#004AFF]/30',
        disabled && 'opacity-50'
      )}
      style={isModified && !disabled ? { borderColor: 'rgba(0, 74, 255, 0.3)' } : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-txt font-display">{mensagem.titulo}</h3>
            {disabled && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-rose-500/15 text-rose-400 border border-rose-500/20">
                Desativado
              </span>
            )}
          </div>
          <p className="text-[11px] text-txt-muted mt-0.5">{mensagem.descricao}</p>
        </div>

        {showAtivoToggle && (
          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={mensagem.ativo}
              onChange={() => onUpdate({ ativo: !mensagem.ativo })}
            />
            <div className="w-9 h-5 rounded-full transition-colors duration-200 bg-[#374151] peer-checked:bg-[#10b981] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
          </label>
        )}
      </div>

      {/* Toggle Tipo Envio */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onUpdate({ tipo_envio: 'audio' })}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 border',
            mensagem.tipo_envio === 'audio'
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-surface-50 text-txt-muted border-surface-200 hover:border-surface-300',
            disabled && 'pointer-events-none'
          )}
        >
          <Volume2 className="w-3.5 h-3.5" />
          Áudio
        </button>
        <button
          onClick={() => onUpdate({ tipo_envio: 'texto' })}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 border',
            mensagem.tipo_envio === 'texto'
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-surface-50 text-txt-muted border-surface-200 hover:border-surface-300',
            disabled && 'pointer-events-none'
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          Texto
        </button>
      </div>

      {/* Tempo de Espera */}
      {hasTempoEspera && (
        <div className="flex items-center gap-2 mb-4">
          <label className="text-[11px] text-txt-muted font-mono uppercase tracking-wider">
            Tempo de espera:
          </label>
          <input
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={mensagem.tempo_espera_minutos ?? ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              onUpdate({ tempo_espera_minutos: raw === '' ? null : parseInt(raw, 10) });
            }}
            className={cn(
              'w-20 px-3 py-1.5 rounded-lg text-[13px] text-txt bg-surface outline-none border border-surface-200 focus:border-[#004AFF]/30 transition-colors text-center',
              disabled && 'cursor-not-allowed'
            )}
          />
          <span className="text-[11px] text-txt-muted">minutos</span>
        </div>
      )}

      {/* Mensagens */}
      <div className="space-y-3 mb-4">
        {mensagem.mensagens.map((msg, index) => (
          <div key={index} className="relative group">
            <textarea
              ref={(el) => setTextareaRef(index, el)}
              id={`textarea-${mensagem.cenario}-${index}`}
              value={msg}
              disabled={disabled}
              onChange={(e) => {
                updateMessage(index, e.target.value);
                autoResize(e.target);
              }}
              placeholder="Digite a mensagem..."
              className={cn(
                'w-full px-4 py-3 rounded-xl text-[13px] text-txt placeholder-txt-dim bg-surface outline-none border border-surface-200 focus:border-[#004AFF]/30 transition-all duration-200 resize-none leading-relaxed',
                disabled && 'cursor-not-allowed'
              )}
              style={{ minHeight: '80px' }}
            />

            {/* Variable buttons + delete */}
            {!disabled && (
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => insertVariable(index, '{{nome}}')}
                    className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#004AFF]/10 text-[#004AFF] hover:bg-[#004AFF]/20 transition-colors border border-[#004AFF]/20"
                  >
                    {'{{nome}}'}
                  </button>
                  <button
                    onClick={() => insertVariable(index, '(inhale)')}
                    className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#004AFF]/10 text-[#004AFF] hover:bg-[#004AFF]/20 transition-colors border border-[#004AFF]/20"
                  >
                    (inhale)
                  </button>
                </div>

                {canDelete && (
                  <button
                    onClick={() => removeMessage(index)}
                    className="p-1.5 text-txt-dim hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Remover mensagem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Message */}
      {!disabled && (
        <button
          onClick={addMessage}
          className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors mb-5 px-3 py-2 rounded-lg border border-dashed border-emerald-500/30 hover:border-emerald-500/50 w-full justify-center"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar mensagem
        </button>
      )}

      {/* Preview */}
      {mensagem.mensagens.some((m) => m.trim()) && (
        <div className="bg-[#111111] rounded-xl p-4 mb-4 space-y-2">
          <p className="text-[10px] font-mono text-txt-dim uppercase tracking-wider mb-3">
            Preview
          </p>
          {renderPreview()}
        </div>
      )}

      {/* Test Button */}
      <button
        onClick={handleTest}
        disabled={disabled || testing || !mensagem.mensagens.some((m) => m.trim())}
        className={cn(
          'flex items-center justify-center gap-2 w-full py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border',
          'text-txt-secondary border-surface-200 hover:border-[#004AFF]/30 hover:text-[#004AFF] hover:bg-[#004AFF]/5',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-surface-200 disabled:hover:text-txt-secondary disabled:hover:bg-transparent'
        )}
      >
        {testing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Testando...
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" />
            Testar Mensagem
          </>
        )}
      </button>
    </div>
  );
};
