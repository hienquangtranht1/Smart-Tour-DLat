import { motion } from 'motion/react';
import { Sparkles, Map, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';

export function BrandingSidebar() {
  const navigate = useNavigate();

  return (
    <div className="w-full md:w-5/12 p-10 flex flex-col justify-between text-white relative overflow-hidden bg-[#1B4D3E]">
      {/* Dynamic Background Blobs */}
      <motion.div 
        animate={{ 
          x: [0, 50, 0], 
          y: [0, 30, 0],
          scale: [1, 1.1, 1] 
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -left-20 w-64 h-64 bg-[#A8D5BA]/20 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ 
          x: [0, -40, 0], 
          y: [0, 60, 0],
          scale: [1, 1.2, 1] 
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 -right-20 w-80 h-80 bg-[#F59E0B]/10 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ 
          x: [0, 20, 0], 
          y: [0, -50, 0] 
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-20 left-1/2 w-72 h-72 bg-white/5 rounded-full blur-3xl"
      />

      <div className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/')}
          className="cursor-pointer group inline-flex items-center gap-4 mb-16"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <span className="text-2xl font-black text-white">ST</span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Smart Tour</h1>
            <div className="h-1 w-0 group-hover:w-full bg-orange-400 transition-all duration-300"></div>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.2 }}
           className="space-y-8"
        >
          <div className="space-y-2">
            <h2 className="text-4xl font-bold leading-tight">Giải pháp du lịch <br/><span className="text-[#A8D5BA] flex items-center gap-2 italic">thông minh bậc nhất <Sparkles className="w-8 h-8 text-yellow-400" /></span></h2>
            <p className="text-lg text-white/70 font-medium italic">Kế hoạch du lịch thông minh tại Đà Lạt.</p>
          </div>

          <div className="space-y-6 pt-10 border-t border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Map className="w-5 h-5 text-[#A8D5BA]" />
              </div>
              <div>
                <p className="font-bold">Cá nhân hóa hành trình</p>
                <p className="text-sm text-white/60">Lịch trình riêng biệt dựa trên sở thích và ngân sách của bạn.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#A8D5BA]" />
              </div>
              <div>
                <p className="font-bold">Đảm bảo an tâm 100%</p>
                <p className="text-sm text-white/60">Mọi dịch vụ đều được kiểm duyệt khắt khe và bảo vệ quyền lợi khách hàng.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#A8D5BA]" />
              </div>
              <div>
                <p className="font-bold">Tiết kiệm chi phí tối đa</p>
                <p className="text-sm text-white/60">Tận hưởng các ưu đãi độc quyền từ mạng lưới đối tác rộng khắp.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1 }}
        className="relative z-10 text-xs font-medium tracking-[0.2em] uppercase opacity-50"
      >
        © 2026 Smart Tour Dalat • Version 1.0.4
      </motion.div>
    </div>
  );
}
