import { TrendingUp, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { useHome } from './Home/hooks/useHome';
import { Hero } from './Home/components/Hero';
import { ServiceCarousel } from './Home/components/ServiceCarousel';

export function Home() {
  const { tours, hotels, isLoading, handleServiceClick, navigate } = useHome();

  return (
    <div className="animate-in fade-in duration-700">
      <Hero navigate={navigate} />

      {/* Trending Tours */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-6 h-6 text-[#F59E0B]" />
              <h2 className="text-3xl font-bold">Trending Tours</h2>
            </div>
            <p className="text-muted-foreground">Các tour được yêu thích nhất</p>
          </div>
          <Link to="/explore" className="text-[#1B4D3E] dark:text-[#A8D5BA] font-medium flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#1B4D3E]" /></div>
        ) : tours.length > 0 ? (
          <ServiceCarousel items={tours} cta="Đặt ngay" onClick={handleServiceClick} />
        ) : (
          <p className="text-center text-muted-foreground py-10">Chưa có tour nào được đăng. Hãy quay lại sau nhé!</p>
        )}
      </section>

      {/* Top Hotels */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Top Hotels</h2>
            <p className="text-muted-foreground">Khách sạn được đánh giá cao nhất</p>
          </div>
          <Link to="/explore" className="text-[#1B4D3E] dark:text-[#A8D5BA] font-medium flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#1B4D3E]" /></div>
        ) : hotels.length > 0 ? (
          <ServiceCarousel items={hotels} cta="Đặt phòng" onClick={handleServiceClick} />
        ) : (
          <p className="text-center text-muted-foreground py-10">Chưa có khách sạn nào được đăng. Hãy quay lại sau nhé!</p>
        )}
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B4D3E] to-[#A8D5BA]/80"></div>
          <div className="relative p-12 text-center text-white">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-[#FBBF24]" />
            <h2 className="text-4xl font-bold mb-4">Trải nghiệm Lịch trình AI</h2>
            <p className="text-xl mb-8 text-white/90">Để AI thiết kế lịch trình hoàn hảo cho chuyến đi của bạn</p>
            <Link to="/user/ai-planner" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#1B4D3E] hover:bg-slate-50 font-bold transition-all shadow-xl">
              <Sparkles className="w-5 h-5 text-[#1B4D3E]" />Bắt đầu ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
