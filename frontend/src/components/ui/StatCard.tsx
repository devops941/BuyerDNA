import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon: Icon,
  iconColor = 'text-slate-700',
  iconBg = 'bg-slate-100',
  badge,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-slate-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {title}
            </span>
            {badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200/80">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(change || subtitle) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {change && (
            <span
              className={`inline-flex items-center font-bold text-[11px] ${
                isPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 mr-1 inline" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-1 inline" />
              )}
              {change} vs prev run
            </span>
          )}
          {subtitle && (
            <span className="text-slate-500 text-[11px] truncate font-medium ml-auto">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
