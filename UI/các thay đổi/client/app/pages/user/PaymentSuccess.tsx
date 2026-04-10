import { Link, useSearchParams } from 'react-router';
import { CheckCircle2, Home, ShoppingBag, ArrowRight, Printer, Share2 } from 'lucide-react';
import { PublicLayout } from '../../components/layouts/PublicLayout';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('vnp_TxnRef')?.split('-').pop() || 'N/A';
  const amount = (parseInt(searchParams.get('vnp_Amount') || '0') / 100).toLocaleString();

  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50/50">
        <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Success Icon Animation */}
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25 scale-150"></div>
            <div className="relative bg-green-500 rounded-full p-6 shadow-xl shadow-green-200">
              <CheckCircle2 className="w-16 h-16 text-white stroke-[2.5px]" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-900">
              Thanh toán thành công!
            </h1>
            <p className="text-slate-500 font-medium">
              Cảm ơn bạn đã tin tưởng Smart Tour. Đơn hàng của bạn đã được xác nhận và đang chờ khởi hành.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Mã đơn hàng</span>
              <span className="text-slate-900 font-bold font-mono">#{orderId}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Tổng thanh toán</span>
              <span className="text-[#1B4D3E] font-black text-xl">{amount}đ</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Trạng thái</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-tighter">Đã thanh toán</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Link
              to="/user/trips"
              className="px-8 py-4 rounded-2xl bg-[#1B4D3E] hover:bg-[#153D31] text-white font-bold transition-all shadow-xl shadow-[#1B4D3E]/20 flex items-center justify-center gap-2 group"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Xem chuyến đi của tôi
            </Link>
            <Link
              to="/explore"
              className="px-8 py-4 rounded-2xl border-2 border-slate-200 hover:border-[#1B4D3E]/30 hover:bg-slate-50 text-slate-700 font-bold transition-all flex items-center justify-center gap-2"
            >
              Tiếp tục khám phá
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Social / Utility Actions */}
          <div className="flex items-center justify-center gap-6 pt-6 opacity-40 hover:opacity-100 transition-opacity">
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-[#1B4D3E] transition-colors">
              <Printer className="w-4 h-4" /> In hóa đơn
            </button>
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-[#1B4D3E] transition-colors">
              <Share2 className="w-4 h-4" /> Chia sẻ
            </button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
