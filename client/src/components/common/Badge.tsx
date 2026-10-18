import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'sm' }) => {
  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  }[variant];

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles} ${sizeStyles}`}
    >
      {children}
    </span>
  );
};

export const StockStatusBadge: React.FC<{
  stock: number;
  threshold: number;
  isArchived?: boolean;
}> = ({ stock, threshold, isArchived }) => {
  if (isArchived) {
    return <Badge variant="neutral">Archived</Badge>;
  }

  if (stock === 0) {
    return <Badge variant="danger">Out of Stock</Badge>;
  }

  if (stock <= threshold) {
    return <Badge variant="warning">Low Stock ({stock})</Badge>;
  }

  return <Badge variant="success">In Stock ({stock})</Badge>;
};

export const PaymentBadge: React.FC<{ method: string }> = ({ method }) => {
  const m = method?.toLowerCase();
  if (m === 'upi') {
    return <Badge variant="info">UPI</Badge>;
  }
  if (m === 'card') {
    return <Badge variant="neutral">Card</Badge>;
  }
  if (m === 'cash') {
    return <Badge variant="success">Cash</Badge>;
  }
  return <Badge variant="neutral">Other</Badge>;
};
