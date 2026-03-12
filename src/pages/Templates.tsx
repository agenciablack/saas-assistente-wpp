import React, { useState } from 'react';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTemplates } from '../hooks/useTemplates';
import { useToast } from '../hooks/useToast';
import { PageHeader } from '../components/PageHeader';
import { EnviosNav } from '../components/envios/EnviosNav';
import { TemplateCard } from '../components/envios/TemplateCard';
import { TemplateFormModal } from '../components/envios/TemplateFormModal';
import { ConfirmDeleteModal } from '../components/envios/ConfirmDeleteModal';
import type { TemplateMensagemRow } from '../types/database';

// Adapter to match Template interface used by TemplateCard/TemplateFormModal
function toTemplate(t: TemplateMensagemRow) {
  return {
    id: t.id,
    nome: t.nome,
    tipo: t.tipo,
    mensagem_com_nome: t.mensagem_com_nome,
    mensagem_sem_nome: t.mensagem_sem_nome,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { templates: rawTemplates, loading, criar, atualizar, excluir } = useTemplates();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateMensagemRow | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateMensagemRow | null>(null);

  const templates = rawTemplates.map(toTemplate);

  const handleCreate = async (data: { nome: string; tipo: 'texto' | 'audio'; mensagem_com_nome: string; mensagem_sem_nome: string }) => {
    const result = await criar(data);
    setShowForm(false);
    showToast(result ? 'success' : 'error', result ? 'Template criado com sucesso!' : 'Erro ao criar template');
  };

  const handleEdit = async (data: { nome: string; tipo: 'texto' | 'audio'; mensagem_com_nome: string; mensagem_sem_nome: string }) => {
    if (!editingTemplate) return;
    await atualizar(editingTemplate.id, data);
    setEditingTemplate(null);
    showToast('success', 'Template atualizado!');
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    await excluir(deletingTemplate.id);
    setDeletingTemplate(null);
    showToast('success', 'Template excluido!');
  };

  const handleUsar = (template: ReturnType<typeof toTemplate>) => {
    navigate('/envios', { state: { template } });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Envios em Massa"
        subtitle="Gerencie seus modelos de mensagem"
        rightContent={
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-[13px] px-4 py-2 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Template
          </button>
        }
      />

      <EnviosNav />

      {/* Grid */}
      {loading ? (
        <div className="card-dark p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-6 h-6 text-accent animate-spin mb-3" />
          <p className="text-sm text-txt-muted">Carregando templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="card-dark p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-200/30 flex items-center justify-center">
            <FileText className="w-7 h-7 text-txt-dim" />
          </div>
          <h2 className="text-lg font-semibold text-txt font-display">Nenhum template criado</h2>
          <p className="text-sm text-txt-muted max-w-md">
            Crie templates reutilizáveis para agilizar seus envios em massa.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-[13px] px-5 py-2.5 flex items-center gap-2 mt-2"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template, i) => (
            <div key={template.id} className={`stagger-${Math.min(i + 1, 7)}`} style={{ animationFillMode: 'both' }}>
              <TemplateCard
                template={template}
                onUsar={() => handleUsar(template)}
                onEditar={() => setEditingTemplate(rawTemplates.find((t) => t.id === template.id) ?? null)}
                onExcluir={() => setDeletingTemplate(rawTemplates.find((t) => t.id === template.id) ?? null)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <TemplateFormModal
          onSave={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <TemplateFormModal
          template={toTemplate(editingTemplate)}
          onSave={handleEdit}
          onClose={() => setEditingTemplate(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deletingTemplate && (
        <ConfirmDeleteModal
          templateName={deletingTemplate.nome}
          onConfirm={handleDelete}
          onClose={() => setDeletingTemplate(null)}
        />
      )}
    </div>
  );
};
