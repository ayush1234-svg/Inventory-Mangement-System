import React, { useEffect, useState } from 'react';
import { Headphones, Package, Smartphone, Sparkles, Usb, Zap } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  category,
  className = 'w-full h-full object-contain',
  containerClassName = 'w-full h-full flex items-center justify-center bg-slate-50',
  iconClassName,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const defaultIconClass = iconClassName || 'w-1/2 h-1/2 min-w-4 min-h-4 max-w-8 max-h-8';

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'Smartphones':
        return <Smartphone className={`${defaultIconClass} text-indigo-500`} />;
      case 'Audio & Headphones':
        return <Headphones className={`${defaultIconClass} text-indigo-500`} />;
      case 'Cables & Chargers':
        return <Zap className={`${defaultIconClass} text-amber-500`} />;
      case 'Power Banks':
        return <Usb className={`${defaultIconClass} text-emerald-500`} />;
      case 'Cases & Covers':
      case 'Screen Protectors':
        return <Sparkles className={`${defaultIconClass} text-sky-500`} />;
      default:
        return <Package className={`${defaultIconClass} text-slate-400`} />;
    }
  };

  if (!src || hasError) {
    return (
      <div className={containerClassName}>
        {getCategoryIcon(category)}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className={className}
      />
    </div>
  );
};
