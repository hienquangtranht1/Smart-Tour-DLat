import { useEffect } from 'react';
import { Compass, Navigation, Loader2, Search, ChevronDown, MapPin } from 'lucide-react';
import { useMarketplace } from './Marketplace/hooks/useMarketplace';
import { FilterBar } from './Marketplace/components/FilterBar';
import { ServiceCard } from './Marketplace/components/ServiceCard';
import { ServiceDetailView } from './Marketplace/components/Detail/ServiceDetailView';
import { Coffee, Hotel } from 'lucide-react';

export function Marketplace() {
  const m = useMarketplace();

  // Map Initialization Logic (Moved to Main for DOM access)
  useEffect(() => {
    if (m.selectedService) {
      initMap(m.selectedService);
    }
  }, [m.selectedService]);

  const initMap = (service: any) => {
    setTimeout(() => {
      const mapEl = document.getElementById('service-map');
      if (!mapEl || !(window as any).L) return;

      const L = (window as any).L;
      const mapContainer = L.DomUtil.get('service-map');
      if (mapContainer != null) mapContainer._leaflet_id = null;

      const pointsStr = service.mapPoints || "";
      const pointBlocks = pointsStr.split('|').filter((x: string) => x);
      const markersData: any[] = [];

      pointBlocks.forEach((block: string) => {
        const parts = block.split(';');
        if (parts.length > 0 && parts[0].includes(',')) {
          const coords = parts[0].split(',');
          const lat = parseFloat(coords[0].trim());
          const lng = parseFloat(coords[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            markersData.push({
              lat: lat, lng: lng,
              name: parts.length > 1 && parts[1] ? parts[1] : service.name,
              image: parts.length > 2 && parts[2] ? parts[2] : '',
              time: parts.length > 3 && parts[3] ? parts[3] : ''
            });
          }
        }
      });

      if (markersData.length === 0) return;
      const map = L.map('service-map');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const latlngs: any[] = [];
      markersData.forEach((m, idx) => {
        latlngs.push([m.lat, m.lng]);
        let popupHtml = `<div style="padding: 5px; min-width: 150px; text-align: center; color: #1e293b;">`;
        popupHtml += `<strong style="color: #3b82f6; font-size: 14px;">\${m.name}</strong><br>`;
        if (m.time) popupHtml += `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">🕒 \${m.time}</div>`;
        if (m.image) popupHtml += `<img src="\${m.image}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 6px; margin-top: 8px;">`;
        popupHtml += `</div>`;
        L.marker([m.lat, m.lng]).addTo(map).bindPopup(popupHtml);
      });

      if (service.serviceType === 'TOUR' && latlngs.length > 1) {
        L.polyline(latlngs, { color: '#f43f5e', weight: 4, dashArray: '8,10' }).addTo(map);
      }
      if (latlngs.length === 1) map.setView(latlngs[0], 14);
      else map.fitBounds(L.latLngBounds(latlngs), { padding: [30, 30] });
    }, 500);
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'HOTEL': return { icon: Hotel, label: 'Khách sạn', color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'RESTAURANT': return { icon: Coffee, label: 'Ẩm thực', color: 'text-orange-500', bg: 'bg-orange-500/10' };
      case 'CAFE': return { icon: Coffee, label: 'Cafe', color: 'text-rose-500', bg: 'bg-rose-500/10' };
      default: return { icon: Compass, label: 'Tour du lịch', color: 'text-green-500', bg: 'bg-green-500/10' };
    }
  };

  if (m.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-[#1B4D3E] animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">Đang tải danh sách dịch vụ...</p>
      </div>
    );
  }

  // Detail View
  if (m.selectedService) {
    return (
      <ServiceDetailView
        selectedService={m.selectedService}
        onBack={() => m.setSelectedService(null)}
        getTypeInfo={getTypeInfo}
        // Review Props
        reviews={m.reviews}
        loadingReviews={m.loadingReviews}
        reviewType={m.reviewType}
        setReviewType={m.setReviewType}
        reviewRating={m.reviewRating}
        setReviewRating={m.setReviewRating}
        reviewContent={m.reviewContent}
        setReviewContent={m.setReviewContent}
        submittingReview={m.submittingReview}
        handleReviewSubmit={m.handleReviewSubmit}
        // Booking Props
        bookingDate={m.bookingDate}
        setBookingDate={m.setBookingDate}
        bookingQuantity={m.bookingQuantity}
        setBookingQuantity={m.setBookingQuantity}
        bookingNights={m.bookingNights}
        bookingTransport={m.bookingTransport}
        setBookingTransport={m.setBookingTransport}
        bookingLoading={m.bookingLoading}
        bookingSuccess={m.bookingSuccess}
        handleBook={m.handleBook}
      />
    );
  }

  // Grid View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 space-y-10">
      
      {/* Sync with AI Planner (Standard) Hero Style */}
      <div className="relative mb-20">
        <div className="relative rounded-[2rem] overflow-hidden bg-[#0f172a] shadow-xl min-h-[280px] flex items-center justify-center border border-white/10 group">
          {/* Background Image Overlay */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1695867947286-8dd9593f5f8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" 
              alt="Marketplace Hero" 
              className="w-full h-full object-cover opacity-50" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent"></div>
          </div>

          <div className="relative z-10 w-full max-w-4xl px-6 py-12 text-center pb-22">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Khám phá <span className="text-[#A8D5BA]">Dịch vụ & Khách sạn</span>
            </h1>
            <p className="text-lg text-white/90 mb-4 max-w-2xl mx-auto font-medium">
              Tìm kiếm chỗ ở và những trải nghiệm tuyệt vời nhất tại thành phố ngàn hoa Đà Lạt.
            </p>
          </div>
        </div>

        {/* Floating Search Bar (OUTSIDE overflow-hidden container) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-6 z-20">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-950/40 flex flex-col md:flex-row items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={m.searchTerm}
                onChange={(e) => m.setSearchTerm(e.target.value)}
                placeholder="Bạn muốn tìm gì hôm nay? (Lẩu bò, Săn mây...)"
                className="w-full pl-14 pr-6 py-4 rounded-3xl bg-slate-100/50 dark:bg-slate-800/50 border-none outline-none font-bold text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-2 ring-[#A8D5BA]/50 transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="relative w-full md:w-64">
              <Compass className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={m.filterType}
                onChange={(e) => m.setFilterType(e.target.value as any)}
                className="w-full pl-14 pr-10 py-4 rounded-3xl bg-slate-100/50 dark:bg-slate-800/50 border-none outline-none font-bold text-slate-700 dark:text-white appearance-none cursor-pointer focus:ring-2 ring-[#A8D5BA]/50 transition-all dark:[color-scheme:dark]"
              >
                <option value="ALL">Tất cả danh mục</option>
                <option value="HOTEL">Khách sạn / Villa</option>
                <option value="TOUR">Tour du lịch</option>
                <option value="RESTAURANT">Quán ăn / Nhà hàng</option>
                <option value="CAFE">Cafe / Sống ảo</option>
                <option value="KHAC">Dịch vụ khác</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                const target = document.getElementById('marketplace-grid');
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full md:w-auto px-10 py-4 rounded-3xl bg-[#1B4D3E] dark:bg-[#A8D5BA] text-white dark:text-slate-950 font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            >
              Khám phá ngay
            </button>
          </div>
        </div>
      </div>

      <div id="marketplace-grid" className="pt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#1B4D3E] dark:text-[#10B981] flex items-center gap-3 uppercase tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-[#1B4D3E]/10 flex items-center justify-center">
              <Compass className="w-6 h-6 text-[#1B4D3E] dark:text-[#10B981]" />
            </div>
            Kết quả tìm kiếm
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={m.requestGPS}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
          >
            <Navigation className="w-4 h-4" /> Định vị GPS
          </button>
          <button
            onClick={m.fetchServices}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95"
          >
            <Loader2 className={`w-4 h-4 \${m.loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>
      </div>

      <FilterBar
        searchTerm={m.searchTerm}
        setSearchTerm={m.setSearchTerm}
        filterType={m.filterType}
        setFilterType={m.setFilterType}
        showOpenNow={m.showOpenNow}
        setShowOpenNow={m.setShowOpenNow}
        showNearMe={m.showNearMe}
        setShowNearMe={m.setShowNearMe}
        requestGPS={m.requestGPS}
        userLocation={m.userLocation}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {m.filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            userLocation={m.userLocation}
            getDistance={m.getDistance}
            isServiceOpen={m.isServiceOpen}
            getTypeInfo={getTypeInfo}
            onSelect={m.setSelectedService}
          />
        ))}
      </div>

      {m.filteredServices.length === 0 && (
        <div className="text-center py-24 bg-slate-50/50 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-200">Không tìm thấy địa điểm</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">Thử tìm kiếm với từ khóa khác...</p>
        </div>
      )}
    </div>
  );
}
