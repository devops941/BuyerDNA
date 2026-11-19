import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading analytics data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3 min-h-[300px]">
      <div className="relative w-10 h-10">
        <div className="w-10 h-10 rounded-full border-2 border-slate-200"></div>
        <div className="w-10 h-10 rounded-full border-2 border-brand-900 border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
};
