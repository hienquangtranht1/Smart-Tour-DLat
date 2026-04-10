import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Zap, MapPin, Calendar, Sunrise, Sun, Sunset, Search, Download, Map as MapIcon, Loader2, DollarSign, Compass, ChevronDown, FileText } from 'lucide-react';
import { PDFService } from '../../utils/PDFService';

interface Activity {
  time: string;
  location: string;
  note: string;
  cost: string;
  icon: 'sunrise' | 'sun' | 'sunset';
}

interface DayPlan {
  dayStr: string;
  activities: Activity[];
}

export function AIPlanner() {
  const navigate = useNavigate();
  const [aiSearch, setAiSearch] = useState('');
  const [aiCategory, setAiCategory] = useState('ALL');
  const [budget, setBudget] = useState('5.000.000');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupType, setGroupType] = useState('Gia đình');
  const [pace, setPace] = useState('Vừa phải');
  const [transport, setTransport] = useState('Xe máy');
  const [preferences, setPreferences] = useState('Săn mây, ăn lẩu');
  const [hotelLocation, setHotelLocation] = useState('');
  const [itinerary, setItinerary] = useState<DayPlan[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(formatCurrency(e.target.value));
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setError('Vui lòng chọn ngày đến và ngày đi!');
      return;
    }
    setError('');
    setIsGenerating(true);
    setItinerary(null);

    try {
      const params = new URLSearchParams();
      params.append('arrival', startDate);
      params.append('departure', endDate);
      params.append('groupType', groupType);
      params.append('pace', pace);
      params.append('budget', budget);
      params.append('transport', transport);
      params.append('preferences', preferences);
      params.append('startLocation', hotelLocation);

      const response = await fetch(`/api/user/ai/generate?${params.toString()}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Lỗi hệ thống AI');
      }

      const data = await response.json();

      if (data.status === 'success' && Array.isArray(data.itinerary)) {
        const mappedItinerary: DayPlan[] = data.itinerary.map((day: any) => ({
          dayStr: day.day,
          activities: [
            { time: 'Buổi sáng', location: day.morning.location, note: day.morning.note, cost: day.morning.cost, icon: 'sunrise' },
            { time: 'Buổi trưa', location: day.noon.location, note: day.noon.note, cost: day.noon.cost, icon: 'sun' },
            { time: 'Buổi tối', location: day.evening.location, note: day.evening.note, cost: day.evening.cost, icon: 'sunset' },
          ]
        }));
        setItinerary(mappedItinerary);
      } else {
        throw new Error('Dữ liệu AI trả về không đúng định dạng');
      }
    } catch (err: any) {
      setError(err.message || 'Hệ thống AI đang bận, vui lòng thử lại sau!');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTimeIcon = (icon: 'sunrise' | 'sun' | 'sunset') => {
    switch (icon) {
      case 'sunrise':
        return <Sunrise className="w-5 h-5 text-[#F59E0B]" />;
      case 'sun':
        return <Sun className="w-5 h-5 text-[#FBBF24]" />;
      case 'sunset':
        return <Sunset className="w-5 h-5 text-[#1B4D3E] dark:text-[#10B981]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">

      {/* Sync with Marketplace (Booking) Hero Style - Slightly more compact */}
      <div className="relative mb-20">
        <div className="relative rounded-[2rem] overflow-hidden bg-[#0f172a] shadow-xl min-h-[280px] flex items-center justify-center border border-white/10 group">
          {/* Background Image Overlay */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1695867947286-8dd9593f5f8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" 
              alt="Da Lat AI Planner Hero" 
              className="w-full h-full object-cover opacity-50" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent"></div>
          </div>
          
          <div className="relative z-10 w-full max-w-4xl px-6 py-12 text-center pb-22">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Thiết kế chuyến đi <span className="text-[#A8D5BA]">Đà Lạt với AI</span>
            </h1>
            <p className="text-lg text-white/90 mb-4 max-w-2xl mx-auto font-medium">
              Cung cấp sở thích của bạn, Trợ lý AI sẽ thiết lập một lịch trình hoàn hảo chỉ trong vài giây.
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
                placeholder="Bạn muốn tìm gì hôm nay? (Lẩu bò, Săn mây...)" 
                value={aiSearch}
                onChange={(e) => setAiSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && navigate(`/user/marketplace?q=${aiSearch}&type=${aiCategory}`)}
                className="w-full pl-14 pr-6 py-4 rounded-3xl bg-slate-100/50 dark:bg-slate-800/50 border-none outline-none font-bold text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-2 ring-[#A8D5BA]/50 transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="relative w-full md:w-64">
              <Compass className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select 
                value={aiCategory}
                onChange={(e) => setAiCategory(e.target.value)}
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
              onClick={() => navigate(`/user/marketplace?q=${aiSearch}&type=${aiCategory}`)}
              className="w-full md:w-auto px-10 py-4 rounded-3xl bg-[#1B4D3E] dark:bg-[#A8D5BA] text-white dark:text-slate-950 font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            >
              Khám phá ngay
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-0 relative z-20 px-4 md:px-0">

        {/* Left: Input Form */}
        <div className="lg:col-span-5 bg-card dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-2xl backdrop-blur-sm dark:bg-card/90">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#1B4D3E]/10 dark:bg-[#10B981]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#1B4D3E] dark:text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1B4D3E] dark:text-[#10B981]">Tham số Lịch trình</h2>
              <p className="text-sm text-muted-foreground">Tùy chỉnh để AI hiểu rõ nhu cầu của bạn</p>
            </div>
          </div>

          <div className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium">Đến ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-secondary focus:ring-2 focus:ring-[#A8D5BA] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium">Về ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-secondary focus:ring-2 focus:ring-[#A8D5BA] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium">Ngân sách (VND)</label>
                <input
                  type="text"
                  value={budget}
                  onChange={handleBudgetChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-secondary focus:ring-2 focus:ring-[#A8D5BA] outline-none"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium">Nhóm khách</label>
                <select
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary focus:ring-2 focus:ring-[#A8D5BA] outline-none"
                >
                  <option value="Cá nhân">Một mình</option>
                  <option value="Cặp đôi">Cặp đôi</option>
                  <option value="Gia đình">Gia đình</option>
                  <option value="Nhóm bạn">Nhóm bạn</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium">Phương tiện</label>
                <select
                  value={transport}
                  onChange={(e) => setTransport(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary focus:ring-2 focus:ring-[#A8D5BA] outline-none"
                >
                  <option value="Xe máy">Xe máy</option>
                  <option value="Ô tô/Taxi">Ô tô / Taxi</option>
                  <option value="Xe đạp">Xe đạp</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium">Nhịp độ</label>
                <select
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl bg-secondary focus:ring-2 focus:ring-[#A8D5BA] outline-none"
                >
                  <option value="Thư giãn">Thư giãn (Chill)</option>
                  <option value="Vừa phải">Vừa phải</option>
                  <option value="Năng động">Năng động (Khám phá tối đa)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-sm font-medium">Điểm Hotel / Nơi Xuất Phát</label>
              <div className="relative">
                <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={hotelLocation}
                  onChange={(e) => setHotelLocation(e.target.value)}
                  placeholder="VD: Khách sạn Mường Thanh, hoặc Bến xe"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl bg-secondary focus:ring-2 focus:ring-[#A8D5BA] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium">Sở thích cá nhân</label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="VD: Thích săn mây, ăn đồ lẩu, ngắm hoàng hôn..."
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-secondary focus:ring-2 focus:ring-[#A8D5BA] outline-none min-h-[80px]"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 mt-2 rounded-xl bg-[#1B4D3E] dark:bg-[#10B981] dark:text-slate-950 hover:bg-[#153D31] dark:hover:bg-[#059669] text-white font-bold transition-all shadow-lg shadow-[#1B4D3E]/20 dark:shadow-[#10B981]/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang thiết kế lịch trình...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-[#FBBF24]" />
                  Tạo Lịch Trình Ngay
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-7">
          {itinerary ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between mx-auto max-w-full bg-[#1B4D3E] dark:bg-emerald-900 border border-transparent dark:border-emerald-700/50 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap className="w-24 h-24 text-white" />
                </div>
                <div className="relative z-10 w-full lg:w-3/4">
                  <h3 className="font-bold text-xl mb-1 italic font-serif text-white dark:text-emerald-300">Sẵn sàng khám phá Đà Lạt!</h3>
                  <div className="flex items-center gap-4 text-xs font-medium text-white/80 dark:text-emerald-100">
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {budget}đ</span>
                    <span className="flex items-center gap-1"><MapIcon className="w-3 h-3" /> {transport}</span>
                  </div>
                </div>
                <button 
                  onClick={() => PDFService.exportToPDF('itinerary-content', 'LichTrinh_SmartTour_DaLat.pdf')}
                  className="relative z-10 flex items-center gap-2 px-6 py-2.5 bg-white text-[#1B4D3E] dark:text-[#10B981] hover:bg-slate-50 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  Mở PDF
                </button>
              </div>

              <div id="itinerary-content" className="space-y-8 bg-white dark:bg-slate-900 p-4 rounded-[2rem]">
                {itinerary.map((dayPlan, dIdx) => (
                  <div key={dIdx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-6 duration-500" style={{ animationDelay: `${dIdx * 150}ms` }}>
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h4 className="text-[#1B4D3E] dark:text-[#10B981] font-black text-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                          {dIdx + 1}
                        </div>
                        {dayPlan.dayStr}
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Thiết kế bởi Gemini</span>
                    </div>

                    <div className="p-8 space-y-0">
                      {dayPlan.activities.map((activity, idx) => (
                        <div key={idx} className={`flex gap-6 pb-8 relative ${idx < dayPlan.activities.length - 1 ? 'border-l-2 border-dashed border-slate-100 dark:border-slate-800 ml-6 pl-10 pt-2' : 'ml-6 pl-10 pt-2'}`}>
                          {/* Dot on line */}
                          {idx < dayPlan.activities.length - 1 && (
                            <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-[#1B4D3E] dark:border-[#10B981] z-10"></div>
                          )}
                          {idx === dayPlan.activities.length - 1 && (
                            <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-[#FBBF24] z-10"></div>
                          )}

                          <div className="flex-1 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-transparent hover:border-[#A8D5BA] hover:bg-white dark:hover:bg-slate-800 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                  {getTimeIcon(activity.icon)}
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-[#1B4D3E]/60 dark:text-[#10B981]/80 uppercase tracking-widest">{activity.time}</p>
                                  <h5 className="font-bold text-lg text-slate-900 dark:text-white">{activity.location}</h5>
                                </div>
                              </div>
                              <span className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-[#1B4D3E] dark:text-[#10B981] font-bold text-xs shadow-sm border border-slate-100 dark:border-slate-800">
                                {activity.cost}
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed indent-2 italic font-medium">
                              "{activity.note}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-card border border-border border-dashed rounded-[2rem] min-h-[500px]">
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="relative w-24 h-24 mx-auto">
                    <Loader2 className="w-full h-full animate-spin text-[#1B4D3E] dark:text-[#10B981] opacity-20" />
                    <Zap className="absolute inset-0 m-auto w-10 h-10 text-[#FBBF24] animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold">Đang kiến tạo hành trình...</h3>
                  <p className="text-muted-foreground max-w-sm">Trí tuệ nhân tạo đang phân tích các địa điểm phù hợp nhất với sở thích của bạn tại Đà Lạt.</p>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-[#1B4D3E]/5 dark:bg-[#10B981]/5 rounded-full flex items-center justify-center mb-4">
                    <MapIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground/80 mb-2">Chưa có lịch trình</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Hãy điền thông tin bên trái và nhấn nút để bắt đầu hành trình khám phá Đà Lạt thông minh.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
