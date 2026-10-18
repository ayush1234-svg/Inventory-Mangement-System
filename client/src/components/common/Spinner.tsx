import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', label, className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 gap-2 text-slate-500 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-indigo-600`} />
      {label && <p className="text-xs font-medium text-slate-500">{label}</p>}
    </div>
  );
};
