import React, { useMemo } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color?: 'emerald' | 'cyan' | 'amber' | 'rose';
  sparklineData?: number[];
}

const colorMap = {
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-400',
    iconRing: 'ring-emerald-500/20',
    glow: 'group-hover:shadow-[0_0_40px_rgba(16,185,129,0.08)]',
    gradient: 'from-emerald-500/8 via-transparent to-transparent',
    sparkline: '#10B981',
    sparklineFill: 'rgba(16, 185, 129, 0.08)',
    dot: 'bg-emerald-400',
    accentLine: 'bg-gradient-to-r from-emerald-500/40 to-transparent',
  },
  cyan: {
    icon: 'bg-blue-600/10 text-blue-400',
    iconRing: 'ring-blue-600/20',
    glow: 'group-hover:shadow-[0_0_40px_rgba(0,74,255,0.08)]',
    gradient: 'from-blue-600/8 via-transparent to-transparent',
    sparkline: '#004AFF',
    sparklineFill: 'rgba(0, 74, 255, 0.08)',
    dot: 'bg-blue-400',
    accentLine: 'bg-gradient-to-r from-blue-600/40 to-transparent',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-400',
    iconRing: 'ring-amber-500/20',
    glow: 'group-hover:shadow-[0_0_40px_rgba(245,158,11,0.08)]',
    gradient: 'from-amber-500/8 via-transparent to-transparent',
    sparkline: '#F59E0B',
    sparklineFill: 'rgba(245, 158, 11, 0.08)',
    dot: 'bg-amber-400',
    accentLine: 'bg-gradient-to-r from-amber-500/40 to-transparent',
  },
  rose: {
    icon: 'bg-rose-500/10 text-rose-400',
    iconRing: 'ring-rose-500/20',
    glow: 'group-hover:shadow-[0_0_40px_rgba(244,63,94,0.08)]',
    gradient: 'from-rose-500/8 via-transparent to-transparent',
    sparkline: '#F43F5E',
    sparklineFill: 'rgba(244, 63, 94, 0.08)',
    dot: 'bg-rose-400',
    accentLine: 'bg-gradient-to-r from-rose-500/40 to-transparent',
  },
};

const Sparkline: React.FC<{ data: number[]; color: string; fill: string }> = ({ data, color, fill }) => {
  const width = 100;
  const height = 32;
  const padding = 2;

  const points = useMemo(() => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    return data.map((val, i) => ({
      x: padding + (i / (data.length - 1)) * (width - padding * 2),
      y: padding + (1 - (val - min) / range) * (height - padding * 2),
    }));
  }, [data]);

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="1" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-fill-${color})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2" fill={color} />
    </svg>
  );
};

const defaultSparklines: Record<string, number[]> = {
  emerald: [4, 6, 5, 8, 7, 9, 10, 8, 12, 11, 13],
  cyan: [8, 10, 9, 12, 11, 15, 14, 13, 16, 15, 18],
  amber: [3, 2, 4, 3, 5, 4, 3, 5, 4, 6, 3],
  rose: [5, 4, 6, 5, 3, 4, 5, 3, 4, 3, 2],
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendType = 'neutral',
  icon: Icon,
  color = 'emerald',
  sparklineData,
}) => {
  const colors = colorMap[color];
  const data = sparklineData || defaultSparklines[color];

  const trendConfig = {
    positive: { color: 'text-emerald-400', icon: TrendingUp, bg: 'bg-emerald-500/8' },
    negative: { color: 'text-rose-400', icon: TrendingDown, bg: 'bg-rose-500/8' },
    neutral: { color: 'text-txt-muted', icon: Minus, bg: 'bg-surface-300/10' },
  };

  const TrendIcon = trendConfig[trendType].icon;

  return (
    <div className={cn(
      "card-dark p-5 group transition-all duration-500 h-full flex flex-col relative",
      colors.glow
    )}>
      {/* Subtle gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none", colors.gradient)} />

      {/* Top accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-[1px]", colors.accentLine)} />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "p-2.5 rounded-xl ring-1 transition-all duration-300 group-hover:scale-105",
            colors.icon,
            colors.iconRing
          )}>
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </div>

          {trend && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-medium tracking-wide",
              trendConfig[trendType].bg,
              trendConfig[trendType].color
            )}>
              <TrendIcon className="w-3 h-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>

        {/* Label */}
        <p className="text-txt-muted text-[11px] font-semibold uppercase tracking-[0.08em] mb-1">{title}</p>

        {/* Value */}
        <div className="text-[2rem] font-bold text-txt font-display tracking-tight leading-none mb-1 animate-count-up">
          {value}
        </div>

        {subtitle && (
          <p className="text-[11px] text-txt-dim leading-relaxed mb-3">{subtitle}</p>
        )}

        {/* Sparkline */}
        <div className="mt-auto pt-3">
          <div className="sparkline-container">
            <Sparkline data={data} color={colors.sparkline} fill={colors.sparklineFill} />
          </div>
        </div>
      </div>
    </div>
  );
};
