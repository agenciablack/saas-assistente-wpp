import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  rightContent?: React.ReactNode;
  titleRight?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  rightContent,
  titleRight
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt font-display tracking-tight">{title}</h1>
          {titleRight}
        </div>
        {subtitle && <p className="text-sm text-txt-muted mt-1 font-light">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {rightContent}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 text-txt-muted hover:text-[#004AFF] hover:bg-[#004AFF]/5 rounded-xl transition-all duration-200 disabled:opacity-50 border border-transparent hover:border-[#004AFF]/10"
            title="Atualizar dados"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
        )}
      </div>
    </div>
  );
};
