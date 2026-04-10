import { Link } from 'react-router';
import { Facebook, Instagram, Mail, Phone, MapPin, Youtube, Zap, Hotel, Compass, Utensils, Bike, Info, ShieldCheck, FileText, HelpCircle, Apple } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-20 backdrop-blur-xl bg-secondary/30 border-t border-white/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Cột 1: SMART TOUR */}
          <div className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2 text-[#1B4D3E] dark:text-[#10B981] uppercase tracking-tighter">
              <Compass className="w-6 h-6" /> Smart Tour
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hệ thống Lịch trình AI và Đặt vé du lịch chuyên nghiệp, tối ưu hành trình khám phá Đà Lạt.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-[#1B4D3E]/10 transition-colors">
                  <MapPin className="w-4 h-4 text-[#1B4D3E] dark:text-[#10B981]" />
                </div>
                <span>123 Phù Đổng Thiên Vương, Đà Lạt</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-[#1B4D3E]/10 transition-colors">
                  <Mail className="w-4 h-4 text-[#1B4D3E] dark:text-[#10B981]" />
                </div>
                <span>xinchao@smarttour.site</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-[#1B4D3E] dark:text-[#10B981] group">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-[#1B4D3E]/10 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span>1900 1234</span>
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              {[
                { icon: Facebook, color: 'hover:text-blue-600' },
                { icon: Instagram, color: 'hover:text-pink-600' },
                { icon: Youtube, color: 'hover:text-red-600' },
                { 
                  isCustom: true,
                  icon: () => (
                    <svg viewBox="0 0 448 512" className="w-5 h-5 fill-current">
                      <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                    </svg>
                  ), 
                  color: 'hover:text-black dark:hover:text-white' 
                }
              ].map((social, i) => (
                <a key={i} href="#" className={`w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center transition-all hover:-translate-y-1 ${social.color} border border-slate-100 dark:border-slate-700`}>
                  {social.isCustom ? (social as any).icon() : <social.icon className="w-5 h-5" />}
                </a>
              ))}
            </div>
          </div>

          {/* Cột 2: DỊCH VỤ NỔI BẬT */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Dịch vụ nổi bật</h3>
            <ul className="space-y-4">
              {[
                { icon: Zap, label: 'Lên Lịch Trình AI', to: '/user/ai-planner' },
                { icon: Hotel, label: 'Khách Sạn & Resort', to: '/explore?type=HOTEL' },
                { icon: Compass, label: 'Tour Khám Phá', to: '/explore?type=TOUR' },
                { icon: Utensils, label: 'Bản đồ Ẩm Thực', to: '/explore?type=RESTAURANT' },
                { icon: Bike, label: 'Thuê Xe Máy Trị An', to: '/explore?type=KHAC' }
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.to} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-[#1B4D3E] dark:hover:text-[#10B981] transition-colors group">
                    <link.icon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: THÔNG TIN */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Thông tin</h3>
            <ul className="space-y-4 mb-8">
              {[
                { icon: Info, label: 'Về Chúng Tôi', to: '/about' },
                { icon: ShieldCheck, label: 'Chính Sách Bảo Mật', to: '/privacy' },
                { icon: FileText, label: 'Điều Khoản Đặt Chỗ', to: '/terms' },
                { icon: HelpCircle, label: 'Trung Tâm Trợ Giúp', to: '/support' }
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.to} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-[#1B4D3E] dark:hover:text-[#10B981] transition-colors group">
                    <link.icon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="p-4 rounded-2xl bg-[#E12B28] text-white flex items-center gap-3 shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer transition-transform group">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-black uppercase leading-tight">
                Đã thông báo<br />Bộ Công Thương
              </div>
            </div>
          </div>

          {/* Cột 4: THANH TOÁN & ỨNG DỤNG */}
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-sm">Chấp nhận thanh toán</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white px-2 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center h-10">
                  <svg viewBox="0 0 24 24" className="w-10 h-10"><path fill="#1A1F71" d="M14.04 15.632l.867-5.385h1.403l-.867 5.385h-1.403zM17.43 10.247c-.322-.124-.823-.258-1.442-.258-1.587 0-2.704.843-2.712 2.054-.01.893.796 1.391 1.404 1.688.625.305.836.5.833.772-.005.417-.5.607-1.026.607-.638 0-.98-.103-1.503-.326l-.21-.098-.224 1.389c.374.172 1.066.322 1.782.33 1.688 0 2.784-.836 2.796-2.128.008-.71-.422-1.248-1.35-1.701-.562-.284-.908-.475-.908-.765 0-.256.287-.528.913-.528.513-.008.887.11 1.173.232l.14.066.216-1.341zM11.666 10.247h1.312l.82 5.385h-1.398l-.183-.878h-1.996l-.47.878H8.337l3.329-5.385zm.183 1.447l-.578 3.06h1.232l-.654-3.06zM6.793 10.247l-1.352 3.665-.145-.736C4.945 11.967 4.14 10.97 3.238 10.49l2.13 5.142h1.47l2.188-5.385H6.793z" /></svg>
                </div>
                <div className="bg-white px-2 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center h-10">
                  <svg viewBox="0 0 24 24" className="w-8 h-8"><path fill="#EB001B" d="M11.1 12c0-1.74.84-3.23 2.14-4.14-1.12-.86-2.52-1.4-4.04-1.4-3.6 0-6.52 2.92-6.52 6.52s2.92 6.52 6.52 6.52c1.52 0 2.92-.54 4.04-1.4-1.3-.91-2.14-2.43-2.14-4.14z"/><path fill="#F79E1B" d="M21.32 12c0 3.6-2.92 6.52-6.52 6.52-1.52 0-2.92-.54-4.04-1.4 1.3-.91 2.14-2.43 2.14-4.14 0-1.74-.84-3.23-2.14-4.14 1.12-.86-2.52-1.4-4.04-1.4 3.6 0 6.52 2.92 6.52 6.52z"/><path fill="#FF5F00" d="M13.24 7.86c-1.3.91-2.14 2.43-2.14 4.14 0 1.74.84 3.23 2.14 4.14.3.23.64.42 1 .58.36.16.74.28 1.14.36-1.12.86-2.52 1.4-4.04 1.4-1.52 0-2.92-.54-4.04-1.4 1.3-.91 2.14-2.43 2.14-4.14 0-1.74-.84-3.23-2.14-4.14-1.12-.86-2.52-1.4-4.04-1.4 1.52 0 2.92.54 4.04 1.4z"/></svg>
                </div>
                <div className="bg-white px-2 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center h-10">
                  <span className="text-[10px] font-black text-[#005BAA]">VNPAY</span>
                </div>
                <div className="bg-white px-2 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center h-10 col-span-1">
                  <span className="text-[10px] font-black text-[#AE2070]">MoMo</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-sm">Ứng dụng di động</h3>
              <div className="space-y-3">
                <button className="w-full h-14 px-5 rounded-2xl bg-[#0F172A] text-white flex items-center gap-4 hover:bg-black transition-all shadow-lg group border border-white/5">
                  <svg viewBox="0 0 384 512" className="w-8 h-8 fill-white group-hover:scale-110 transition-transform">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-20.8-83.6-20.1-42.3.8-82.7 24.7-104.1 62.7-46.3 82.3-11.8 203.9 33 269.1 21.8 31.8 48.6 67.3 82.4 66.1 31.3-1.2 43.1-20.2 81-20.2 37.9 0 49.3 20.2 81.9 19.6 34.1-.5 57.5-32 79.4-63.9 25-36.4 35-71.6 35.5-73.4-1.1-.4-68.7-26.3-68.9-102.4zM260.3 86.4C282.7 58.9 297.1 21.5 292.8 0c-35.7 1.5-79 24.6-104.6 54.7-22.9 26.9-43.1 65.2-37.7 86.5 39.1 3.1 79.1-21.1 109.8-54.8z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] opacity-60 leading-none mb-1 uppercase tracking-wider">Download on the</div>
                    <div className="text-lg font-bold leading-none tracking-tight">App Store</div>
                  </div>
                </button>
                <button className="w-full h-14 px-5 rounded-2xl bg-[#0F172A] text-white flex items-center gap-4 hover:bg-black transition-all shadow-lg group border border-white/5">
                  <svg viewBox="0 0 512 512" className="w-7 h-7 group-hover:scale-110 transition-transform">
                    <path fill="#fff" d="M7.9 7.2C7.1 8 6.6 9.2 6.6 10.7v490.6c0 1.5.5 2.7 1.3 3.5l2.2 2.2L253.6 256 10.1 5l-2.2 2.2z"/>
                    <path fill="#fff" d="M342 167.6L10.1 5l243.5 251 88.4-88.4z"/>
                    <path fill="#fff" d="M342 344.4l-88.4-88.4-243.5 251L342 344.4z"/>
                    <path fill="#fff" d="M414.7 217.1l-72.7-49.5L253.6 256l88.4 88.4 72.7-49.5c21.1-13.7 21.1-34.1 0-47.8z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] opacity-60 leading-none mb-1 uppercase tracking-wider">GET IT ON</div>
                    <div className="text-lg font-bold leading-none tracking-tight">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Bản quyền của Smart Tour Đà Lạt © 2026. Sinh viên thực hiện: Nhóm 6.<br />
            <span className="opacity-60">Đồ án được phát triển song song với hệ thống API Spring Boot và AI Gemini.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

// Internal small icon component for the MOIT badge
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
