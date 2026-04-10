import { MapPin, Calendar, Search } from 'lucide-react';
import { NavigateFunction } from 'react-router';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1695867947286-8dd9593f5f8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

interface HeroProps {
  navigate: NavigateFunction;
}

export function Hero({ navigate }: HeroProps) {
  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={HERO_IMAGE} alt="Đà Lạt" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background"></div>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">Khám phá Đà Lạt cùng AI</h1>
        <p className="text-xl text-white/90 mb-10">Lên lịch trình thông minh, tối ưu chi phí, trải nghiệm tuyệt vời</p>
        <div className="backdrop-blur-xl bg-card/10 border border-border/20 rounded-2xl p-6 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <input type="text" placeholder="Đi đâu?" className="w-full pl-10 pr-4 py-3 rounded-xl bg-card/20 border border-border/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA]/50" />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <input type="text" placeholder="Khi nào?" className="w-full pl-10 pr-4 py-3 rounded-xl bg-card/20 border border-border/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA]/50" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <input type="text" placeholder="Làm gì?" className="w-full pl-10 pr-4 py-3 rounded-xl bg-card/20 border border-border/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA]/50" />
            </div>
          </div>
          <button 
            onClick={() => navigate('/explore')}
            className="w-full py-3 rounded-xl bg-[#1B4D3E] hover:bg-[#153D31] text-white font-medium transition-all shadow-lg shadow-[#1B4D3E]/30"
          >
            <Search className="w-5 h-5 inline mr-2" />Tìm kiếm
          </button>
        </div>
      </div>
    </section>
  );
}
