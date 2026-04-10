import { useState } from 'react';
import { ImageOff, MapPin, Hotel, Coffee, Compass } from 'lucide-react';

interface ThumbnailProps {
  src?: string;
  alt?: string;
  type?: 'TOUR' | 'HOTEL' | 'RESTAURANT' | string;
  className?: string;
}

export function Thumbnail({ src, alt, type, className }: ThumbnailProps) {
  const [isError, setIsError] = useState(!src);

  const getFallbackIcon = () => {
    switch (type) {
      case 'HOTEL':
        return <Hotel className="w-1/3 h-1/3 text-blue-500/50" />;
      case 'RESTAURANT':
        return <Coffee className="w-1/3 h-1/3 text-orange-500/50" />;
      case 'TOUR':
        return <Compass className="w-1/3 h-1/3 text-green-500/50" />;
      default:
        return <MapPin className="w-1/3 h-1/3 text-slate-400/50" />;
    }
  };

  const getFallbackBg = () => {
    switch (type) {
      case 'HOTEL': return 'bg-blue-50';
      case 'RESTAURANT': return 'bg-orange-50';
      case 'TOUR': return 'bg-green-50';
      default: return 'bg-slate-50';
    }
  };

  if (isError || !src || src === 'https://via.placeholder.com/200') {
    return (
      <div className={`flex items-center justify-center ${getFallbackBg()} ${className}`}>
        <div className="flex flex-col items-center gap-2">
          {getFallbackIcon()}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-50">No Image</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Thumbnail'}
      className={className}
      onError={() => setIsError(true)}
    />
  );
}
