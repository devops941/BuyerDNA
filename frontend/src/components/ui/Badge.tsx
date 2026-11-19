import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'teal' | 'royal' | 'loyal' | 'champions';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700 border-slate-200/80',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
  danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
  info: 'bg-blue-50 text-blue-800 border-blue-200/80',
  purple: 'bg-purple-50 text-purple-800 border-purple-200/80',
  teal: 'bg-teal-50 text-teal-800 border-teal-200/80',
  royal: 'bg-brand-50 text-brand-800 border-brand-200 shadow-sm',
  loyal: 'bg-amber-50 text-amber-900 border-amber-300 font-bold shadow-sm',
  champions: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border-amber-300 font-extrabold shadow-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  size = 'md',
}) => {
  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${variantStyles[variant]} ${sizeStyle} ${className}`}
    >
      {children}
    </span>
  );
};
