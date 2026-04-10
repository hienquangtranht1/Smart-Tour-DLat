import { Link, useSearchParams } from 'react-router';
import { XCircle, HelpCircle, ArrowLeft, RefreshCcw, Phone } from 'lucide-react';
import { PublicLayout } from '../../components/layouts/PublicLayout';

export function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('vnp_ResponseCode') || '99';
  
  const getErrorMessage = (code: string) => {
    switch (code) {
      case '24': return 'Giao dịch đã bị hủy bởi bạn.';
      case '11': return 'Thanh toán không thành công do hết hạn giao dịch (Timeout).';
      case '12': return 'Thẻ/Tài khoản của bạn bị khóa hoặc chưa đăng ký Internet Banking.';
      case '51': return 'Tài khoản không đủ số dư để thực hiện giao dịch.';
      case '75': return 'Ngân hàng đang bảo trì. Vui lòng thử lại sau.';
      default: return 'Đã xảy ra lỗi không xác định trong quá trình thanh toán.';
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50/50">
        <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Error Icon */}
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse opacity-50 scale-125"></div>
             <div className="relative bg-red-500 rounded-full p-6 shadow-xl shadow-red-200">
               <XCircle className="w-16 h-16 text-white stroke-[2.5px]" />
             </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-900">
              Thanh toán thất bại
            </h1>
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-red-700 font-bold text-sm">
                Lỗi {errorCode}: {getErrorMessage(errorCode)}
              </p>
            </div>
            <p className="text-slate-500 font-medium pt-2">
              Rất tiếc, giao dịch không thể hoàn tất. Đừng lo lắng, tiền của bạn vẫn chưa bị trừ (hoặc sẽ sớm được hoàn trả nếu có trục trặc).
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
             <Link
               to="/user/trips"
               className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group"
             >
               <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
               Thử lại thanh toán
             </Link>
             <Link
               to="/user/trips"
               className="px-8 py-4 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold transition-all flex items-center justify-center gap-2"
             >
               <ArrowLeft className="w-5 h-5" />
               Quay lại đơn hàng
             </Link>
          </div>

          {/* Support Actions */}
          <div className="pt-8 space-y-4">
            <div className="h-px bg-slate-100 w-24 mx-auto"></div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1B4D3E] hover:underline">
                 <HelpCircle className="w-4 h-4" /> Chính sách hoàn tiền
               </button>
               <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1B4D3E] hover:underline">
                 <Phone className="w-4 h-4" /> Hỗ trợ 24/7
               </button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
