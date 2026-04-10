import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ServiceCard } from './ServiceCard';
import { ServiceItem } from '../hooks/useHome';

interface ServiceCarouselProps {
  items: ServiceItem[];
  cta: string;
  onClick: (id: number) => void;
}

export function ServiceCarousel({ items, cta, onClick }: ServiceCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const displayItems = items.length > 4 ? [...items, ...items] : items;

  // Auto-scroll effect
  useEffect(() => {
    if (items.length <= 4) return;

    let animationFrameId: number;
    const scrollStep = () => {
      if (scrollRef.current && !isPaused && !isDragging) {
        const { scrollLeft, scrollWidth } = scrollRef.current;
        const halfWidth = scrollWidth / 2;
        
        let nextScroll = scrollLeft + 0.5;
        
        if (nextScroll >= halfWidth) {
          nextScroll = 0;
        }
        
        scrollRef.current.scrollLeft = nextScroll;
      }
      animationFrameId = requestAnimationFrame(scrollStep);
    };

    animationFrameId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, isDragging, items.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current || items.length <= 4) return;
    setIsDragging(true);
    setIsPaused(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (items.length > 4) {
      setTimeout(() => setIsPaused(false), 2000);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current || items.length <= 4) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    
    let newScrollLeft = scrollLeft - walk;
    const halfWidth = scrollRef.current.scrollWidth / 2;

    if (newScrollLeft >= halfWidth) newScrollLeft -= halfWidth;
    if (newScrollLeft < 0) newScrollLeft += halfWidth;

    scrollRef.current.scrollLeft = newScrollLeft;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current || items.length <= 4) return;
    setIsPaused(true);
    const amount = 324 * 2;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
    setTimeout(() => setIsPaused(false), 3000);
  };

  return (
    <div className="relative group/carousel">
      {items.length > 4 && (
        <>
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-12 h-12 rounded-full bg-card shadow-xl border border-border flex items-center justify-center text-foreground hover:bg-[#1B4D3E] hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-12 h-12 rounded-full bg-card shadow-xl border border-border flex items-center justify-center text-foreground hover:bg-[#1B4D3E] hover:text-white transition-all opacity-0 group-hover/carousel:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div 
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => items.length > 4 && setIsPaused(true)}
        className={`flex gap-6 overflow-x-hidden ${items.length > 4 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} py-4 select-none mask-fade-edges`}
      >
        {displayItems.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="min-w-[300px] flex-shrink-0">
            <ServiceCard item={item} cta={cta} onClick={onClick} />
          </div>
        ))}
      </div>
      
      <style>{`
        .mask-fade-edges {
          mask-image: linear-gradient(to right, transparent, black 1%, black 99%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 2%, black 98%, transparent);
        }
      `}</style>
    </div>
  );
}
