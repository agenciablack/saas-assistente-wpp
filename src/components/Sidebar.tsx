import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Filter, Send, MessageSquare, MessagesSquare, Phone, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: MessagesSquare, label: 'Conversas', path: '/conversas' },
    { icon: Users, label: 'Leads', path: '/leads' },
    { icon: Filter, label: 'Funil', path: '/funil' },
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
      {/* Subtle gradient overlay */}
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
          onClick={() => {
            signOut();
            navigate('/login', { replace: true });
          }}
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
