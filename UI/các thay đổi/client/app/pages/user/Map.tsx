import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Search, Navigation, Star, X, Loader2, Compass, ChevronDown } from 'lucide-react';
import { Thumbnail } from '../../components/ui/Thumbnail';

declare const L: any;

interface ServiceMarker {
  id: number;
  name: string;
  type: string;
  price: number;
  imageUrl: string;
  mapPoints?: string; // "lat,lng"
  description?: string;
}

export function Map() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [services, setServices] = useState<ServiceMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceMarker | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Hero Search States
  const [heroSearch, setHeroSearch] = useState('');
  const [heroCat, setHeroCat] = useState('ALL');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/services');
      if (!response.ok) throw new Error('Cannot load services');
      const data = await response.json();
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || !services.length) return;

    // Initialize map if not exists
    if (!mapRef.current && typeof L !== 'undefined') {
      mapRef.current = L.map(mapContainerRef.current).setView([11.9404, 108.4583], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Clear previous markers (if dynamic)
    // For now we just add them once
    if (mapRef.current && services.length) {
      services.forEach(service => {
        if (!service.mapPoints || !service.mapPoints.includes(',')) return;

        const [lat, lng] = service.mapPoints.split(',').map(s => parseFloat(s.trim()));
        if (isNaN(lat) || isNaN(lng)) return;

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-8 h-8 rounded-full bg-white border-2 border-[#1B4D3E] flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                  <div class="w-6 h-6 rounded-full ${service.type === 'HOTEL' ? 'bg-blue-500' : service.type === 'TOUR' ? 'bg-green-500' : 'bg-orange-500'} flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(mapRef.current);

        marker.on('click', () => {
          setSelectedService(service);
          mapRef.current.flyTo([lat, lng], 15);
        });
      });
    }

    return () => {
      // Cleanup if needed
    };
  }, [services]);

  const filteredServices = services.filter(s =>
    (s.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)]">
        <Loader2 className="w-12 h-12 text-[#1B4D3E] animate-spin mb-4" />
        <p className="text-muted-foreground">Đang tải bản đồ thông minh...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 space-y-12 pb-20">

      {/* Sync with Marketplace (Booking) Hero Style - Slightly more compact */}
      <div className="relative mb-20">
        <div className="relative rounded-[2rem] overflow-hidden bg-[#0f172a] shadow-xl min-h-[280px] flex items-center justify-center border border-white/10 group">
          {/* Background Image Overlay */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1695867947286-8dd9593f5f8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
              alt="Da Lat Map Hero"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent"></div>
          </div>

          <div className="relative z-10 w-full max-w-4xl px-6 py-12 text-center pb-22">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Bản Đồ <span className="text-[#A8D5BA]">Kỹ Thuật Số Đà Lạt</span>
            </h1>
            <p className="text-lg text-white/90 mb-4 max-w-2xl mx-auto font-medium">
              Tìm kiếm các địa điểm xung quanh bạn và lên kế hoạch di chuyển tối ưu nhất tại thành phố ngàn hoa.
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
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Bạn muốn đi đâu hôm nay? (Lẩu bò, Săn mây...)"
                className="w-full pl-14 pr-6 py-4 rounded-3xl bg-slate-100/50 dark:bg-slate-800/50 border-none outline-none font-bold text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-2 ring-[#A8D5BA]/50 transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="relative w-full md:w-64">
              <Compass className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={heroCat}
                onChange={(e) => setHeroCat(e.target.value)}
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
                navigate(`/user/marketplace?q=${encodeURIComponent(heroSearch)}&cat=${heroCat}`);
              }}
              className="w-full md:w-auto px-10 py-4 rounded-3xl bg-[#1B4D3E] dark:bg-[#A8D5BA] text-white dark:text-slate-950 font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            >
              Khám phá ngay
            </button>
          </div>
        </div>
      </div>
      {/* Map Card Container (Reduced height and synced radius) */}
      <div className="h-[600px] relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800 z-10 mx-2 md:mx-0">
        {/* Search Overlay */}
        <div className="absolute top-6 left-6 z-[1000] w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm địa điểm trên bản đồ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-[#A8D5BA] transition-all text-sm font-medium"
              />
            </div>
            <button className="p-2.5 bg-[#1B4D3E] text-white rounded-xl shadow-lg hover:bg-[#153D31] transition-all">
              <Navigation className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Results List */}
          {searchTerm && (
            <div className="mt-2 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden divide-y divide-slate-100">
              {filteredServices.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    if (s.mapPoints) {
                      const [lat, lng] = s.mapPoints.split(',').map(p => parseFloat(p.trim()));
                      mapRef.current.flyTo([lat, lng], 16);
                      setSelectedService(s);
                      setSearchTerm('');
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                    <Thumbnail src={s.imageUrl} type={s.type} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 line-clamp-1">{s.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.type}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Service Info Sheet (Desktop Right) */}
        {selectedService && (
          <div className="absolute top-6 right-6 z-[1000] w-80 bg-white/90 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 z-10 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="h-40 relative">
              <Thumbnail src={selectedService.imageUrl} type={selectedService.type} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 left-4">
                <span className="px-2 py-0.5 rounded-md bg-[#FBBF24] text-[10px] font-bold text-slate-900 uppercase">
                  {selectedService.type}
                </span>
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-lg mb-1 leading-tight">{selectedService.name}</h3>
              <div className="flex items-center gap-1 text-sm text-slate-500 mb-4">
                <MapPin className="w-4 h-4" />
                <span>Đà Lạt, Lâm Đồng</span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 mb-6 leading-relaxed">
                {selectedService.description || "Dịch vụ chất lượng cao được cung cấp bởi đối tác của Smart Tour Đà Lạt."}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Giá từ</span>
                  <p className="font-bold text-[#1B4D3E]">{selectedService.price.toLocaleString()}đ</p>
                </div>
                <a
                  href="/user/marketplace"
                  className="flex items-center gap-2 px-4 py-2 bg-[#1B4D3E] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#1B4D3E]/20 hover:bg-[#153D31] transition-all"
                >
                  Đặt Ngay
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div className="absolute bottom-8 left-8 z-[1000] flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <div className="flex items-center gap-2" key="tour">
              <div className="w-3 h-3 rounded-full bg-green-500"></div> Tour
            </div>
            <div className="flex items-center gap-2" key="hotel">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div> Hotel
            </div>
            <div className="flex items-center gap-2" key="restaurant">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div> Restaurant
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
