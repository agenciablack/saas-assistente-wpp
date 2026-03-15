import React from 'react';
import { NavLink } from 'react-router-dom';
import { Send, History, FileText, FlaskConical } from 'lucide-react';
import { cn } from '../../utils/cn';

const tabs = [
  { label: 'Novo Envio', path: '/envios', icon: Send, end: true },
  { label: 'Simular Mensagem', path: '/envios/simulador', icon: FlaskConical, end: false },
  { label: 'Histórico', path: '/envios/historico', icon: History, end: false },
  { label: 'Templates', path: '/envios/templates', icon: FileText, end: false },
];

export const EnviosNav: React.FC = () => {
  return (
    <div className="flex gap-1 p-1 bg-surface-50/80 rounded-xl border border-surface-300/10 w-fit">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.end}
          className={({ isActive }) => cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
            isActive
              ? 'bg-surface-200/60 text-txt shadow-sm border-glow'
              : 'text-[#A8A8B3] hover:text-[#D4D4DB] hover:bg-surface-200/20'
          )}
        >
          <tab.icon className="w-3.5 h-3.5" />
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
};
