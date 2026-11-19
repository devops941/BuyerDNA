import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'royal' | 'loyal' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]';

  const variants = {
    primary:
      'bg-brand-900 hover:bg-brand-950 text-white focus:ring-brand-700 shadow-sm hover:shadow-md',
    secondary:
      'bg-gradient-to-r from-brand-600 to-royal-600 hover:from-brand-700 hover:to-royal-700 text-white focus:ring-brand-500 shadow-sm hover:shadow-glow-royal',
    royal:
      'bg-gradient-to-r from-royal-600 to-brand-600 hover:from-royal-700 hover:to-brand-700 text-white focus:ring-royal-500 shadow-glow-royal',
    loyal:
      'bg-gradient-to-r from-loyal-500 via-amber-500 to-amber-600 hover:from-loyal-600 hover:to-amber-700 text-slate-950 font-bold focus:ring-loyal-400 shadow-sm hover:shadow-glow-gold',
    outline:
      'border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 focus:ring-slate-300 shadow-sm',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm',
    ghost:
      'hover:bg-slate-100 text-slate-700 focus:ring-slate-300',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};
