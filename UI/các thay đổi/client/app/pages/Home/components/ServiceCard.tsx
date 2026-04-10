import { Star } from 'lucide-react';
import { Thumbnail } from '../../../components/ui/Thumbnail';
import { ServiceItem } from '../hooks/useHome';

interface ServiceCardProps {
  item: ServiceItem;
  cta: string;
  onClick: (id: number) => void;
}

export function ServiceCard({ item, cta, onClick }: ServiceCardProps) {
  return (
    <div className="group cursor-pointer" onClick={() => onClick(item.id)}>
      <div className="relative overflow-hidden rounded-2xl mb-4">
        <Thumbnail
          src={item.image}
          alt={item.name}
          type={item.type}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-4 right-4 px-3 py-1 rounded-lg backdrop-blur-xl bg-white/20 border border-white/30">
          <Star className="w-4 h-4 inline text-yellow-400 fill-yellow-400" />
          <span className="ml-1 text-white font-medium">{item.rating.toFixed(1)}</span>
        </div>
      </div>
      <h3 className="font-bold mb-2 group-hover:text-[#1B4D3E] dark:group-hover:text-[#A8D5BA] transition-colors">{item.name}</h3>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-[#1B4D3E] dark:text-[#A8D5BA] transition-colors">
          {item.price}đ
        </span>
        <span className="text-sm text-muted-foreground">{item.reviews} đánh giá</span>
      </div>
      <button className="w-full mt-3 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#153D31] text-white font-medium transition-all shadow-md shadow-[#1B4D3E]/20 opacity-0 group-hover:opacity-100">
        {cta}
      </button>
    </div>
  );
}
