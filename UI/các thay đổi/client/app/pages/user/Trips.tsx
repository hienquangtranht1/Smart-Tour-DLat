import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, CheckCircle, Clock, X, ListOrdered, Receipt, FileText, ArrowRight, Loader2, Star, CreditCard, Search, ChevronDown, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PDFService } from '../../utils/PDFService';

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  orderDate: string;
  services: string;
  bookingDate: string;
  bookingTime?: string;
  endDate?: string;
  bookingDays?: number;
  quantity?: number;
  serviceType: string;
  serviceId?: number;
}

export function Trips() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);

  // Review Modal states
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filtering states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/orders');
      if (!response.ok) throw new Error('Không thể tải lịch sử đơn hàng');
      const data = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (orderId: number, amount: number) => {
    try {
      setPayingOrderId(orderId);
      toast.info('Đang kết nối cổng VNPAY an toàn...');
      const response = await fetch(`/api/payment/create-payment?orderId=${orderId}&amount=${amount}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('Không thể tạo liên kết thanh toán');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedOrder?.serviceId || !comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá!');
      return;
    }

    try {
      setSubmittingReview(true);
      const params = new URLSearchParams();
      params.append('serviceId', selectedOrder.serviceId.toString());
      params.append('rating', rating.toString());
      params.append('content', comment);
      params.append('type', 'REVIEW');

      const response = await fetch(`/api/reviews?${params.toString()}`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Không thể gửi đánh giá');

      toast.success('Cảm ơn bạn! Đánh giá đã được gửi và đang chờ duyệt.');
      setIsReviewOpen(false);
      setComment('');
      setRating(5);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold border border-green-500/20">
            <CheckCircle className="w-3.5 h-3.5" /> Đã xác nhận
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Chờ xử lý
          </span>
        );
      case 'AWAITING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20">
            <CreditCard className="w-3.5 h-3.5" /> Chờ thanh toán
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/20">
            <X className="w-3.5 h-3.5" /> Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 text-xs font-bold border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === 'HOTEL') return 'Lưu trú';
    if (type === 'TOUR') return 'Trải nghiệm';
    if (type === 'RESTAURANT') return 'Ẩm thực';
    return type;
  };

  const getTypeStyle = (type: string) => {
    if (type === 'HOTEL') return 'text-blue-600 bg-blue-500/10 border-blue-200';
    if (type === 'TOUR') return 'text-green-600 bg-green-500/10 border-green-200';
    if (type === 'RESTAURANT') return 'text-orange-600 bg-orange-500/10 border-orange-200';
    return 'text-slate-600 bg-slate-500/10';
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.services.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PAID').reduce((sum, o) => sum + o.totalAmount, 0),
    pending: orders.filter(o => o.status === 'PENDING').reduce((sum, o) => sum + o.totalAmount, 0),
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-[#1B4D3E] dark:text-[#10B981] animate-spin mb-4" />
        <p className="text-muted-foreground">Đang tải lịch sử đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500 space-y-10">

      {/* Sync with AI Planner (Standard) Hero Style */}
      <div className="relative mb-20">
        <div className="relative rounded-[2rem] overflow-hidden bg-[#0f172a] shadow-xl min-h-[280px] flex items-center justify-center border border-white/10 group">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 border-none">
            <img 
              src="https://images.unsplash.com/photo-1695867947286-8dd9593f5f8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080" 
              alt="My Trips Hero" 
              className="w-full h-full object-cover opacity-50 contrast-125" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent"></div>
          </div>
          
          <div className="relative z-10 w-full max-w-4xl px-6 py-12 text-center pb-22">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Quản lý <span className="text-[#A8D5BA]">Chuyến đi của bạn</span>
            </h1>
            <p className="text-lg text-white/90 mb-4 max-w-2xl mx-auto font-medium">
              Theo dõi trạng thái, thanh toán và quản lý các dịch vụ bạn đã đặt tại Đà Lạt.
            </p>
          </div>
        </div>

        {/* Floating Search & Filter Bar (OUTSIDE overflow-hidden container) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-6 z-20">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 rounded-[2.5rem] p-3 shadow-2xl shadow-slate-950/40 flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã đơn hoặc tên dịch vụ..." 
                className="w-full pl-14 pr-6 py-4 rounded-3xl bg-slate-100/50 dark:bg-slate-800/50 border-none outline-none font-bold text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-2 ring-[#A8D5BA]/50 transition-all"
              />
            </div>

            {/* Status Select */}
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-14 pr-10 py-4 rounded-3xl bg-slate-100/50 dark:bg-slate-800/50 border-none outline-none font-bold text-slate-700 dark:text-white appearance-none cursor-pointer focus:ring-2 ring-[#A8D5BA]/50 transition-all dark:[color-scheme:dark]"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">🕒 Chờ xử lý</option>
                <option value="AWAITING_PAYMENT">💳 Chờ thanh toán</option>
                <option value="CONFIRMED">✅ Đã xác nhận</option>
                <option value="CANCELLED">❌ Đã hủy</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>

            {/* Action Button */}
            <button 
              onClick={() => {
                const target = document.getElementById('orders-section');
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full md:w-auto px-10 py-4 rounded-3xl bg-[#1B4D3E] dark:bg-[#A8D5BA] text-white dark:text-slate-950 font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            >
              Lọc kết quả
            </button>
          </div>
        </div>
      </div>

      <div id="orders-section">
        <h2 className="text-2xl font-black mb-2 flex items-center gap-3 text-[#1B4D3E] dark:text-[#10B981] uppercase tracking-tight">
          <ListOrdered className="w-8 h-8" />
          Lịch sử đơn hàng
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#E0F2FE] rounded-[2rem] p-6 border border-blue-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-blue-700/70 mb-1">Tổng đơn hàng</div>
              <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#DCFCE7] rounded-[2rem] p-6 border border-green-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-green-700/70 mb-1">Đã xác nhận</div>
              <div className="text-3xl font-bold text-green-900">{stats.paid.toLocaleString()}đ</div>
            </div>
          </div>
        </div>

        <div className="bg-[#FFEDD5] rounded-[2rem] p-6 border border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-amber-700/70 mb-1">Đang chờ</div>
              <div className="text-3xl font-bold text-amber-900">{stats.pending.toLocaleString()}đ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 md:px-8 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1B4D3E] dark:text-[#10B981] flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Lịch sử giao dịch
          </h2>
          {orders.length > 0 && (
            <button className="text-sm font-bold text-[#1B4D3E] dark:text-[#10B981] hover:underline" onClick={fetchOrders}>
              Làm mới
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <th className="px-6 md:px-8 py-4 border-b border-border">Mã Đơn</th>
                <th className="px-6 md:px-8 py-4 border-b border-border">Dịch Vụ</th>
                <th className="px-6 md:px-8 py-4 border-b border-border">Ngày Đặt</th>
                <th className="px-6 md:px-8 py-4 border-b border-border">Tổng Tiền</th>
                <th className="px-6 md:px-8 py-4 border-b border-border">Trạng Thái</th>
                <th className="px-6 md:px-8 py-4 border-b border-border text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody id="myOrdersList">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 md:px-8 py-5 whitespace-nowrap">
                      <span className="font-mono text-[#1B4D3E] dark:text-[#10B981]">#ORD-{order.id}</span>
                    </td>
                    <td className="px-6 md:px-8 py-5">
                      <div className="font-bold text-foreground mb-1">{order.services}</div>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${getTypeStyle(order.serviceType)}`}>
                        {getTypeLabel(order.serviceType)}
                      </span>
                    </td>
                    <td className="px-6 md:px-8 py-5 text-muted-foreground whitespace-nowrap">
                      {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 md:px-8 py-5 whitespace-nowrap font-bold text-[#1B4D3E] dark:text-[#10B981]">
                      {order.totalAmount.toLocaleString()}đ
                    </td>
                    <td className="px-6 md:px-8 py-5 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 md:px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'AWAITING_PAYMENT' && (
                          <button
                            onClick={() => handlePayment(order.id, order.totalAmount)}
                            disabled={payingOrderId === order.id}
                            className="px-4 py-1.5 rounded-lg bg-[#3B82F6] text-white text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                          >
                            {payingOrderId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                            Thanh toán ngay
                          </button>
                        )}
                        {(order.status === 'PAID' || order.status === 'CONFIRMED' || order.status === 'COMPLETED' || order.status === 'IN_PROGRESS') && (
                          <button
                            onClick={() => { setSelectedOrder(order); setIsReviewOpen(true); }}
                            className="px-3 py-1.5 rounded-lg bg-[#1B4D3E]/10 dark:bg-[#10B981]/10 text-[#1B4D3E] dark:text-[#10B981] text-xs font-bold hover:bg-[#1B4D3E] dark:hover:bg-[#10B981] hover:text-white dark:hover:text-slate-950 transition-all flex items-center gap-1"
                          >
                            <Star className="w-3 h-3 fill-current" /> Đánh giá
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectedOrder(order); setIsDetailsOpen(true); }}
                          className="p-2 rounded-full hover:bg-[#1B4D3E]/10 dark:hover:bg-[#10B981]/10 text-muted-foreground hover:text-[#1B4D3E] dark:hover:text-[#10B981] transition-all"
                          title="Xem chi tiết"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Receipt className="w-12 h-12 mb-4 opacity-20" />
                      <p>Bạn chưa có đơn đặt hàng nào.</p>
                      <a href="/user/marketplace" className="text-[#1B4D3E] dark:text-[#10B981] font-bold hover:underline mt-2">Đi khám phá ngay!</a>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {isReviewOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#1B4D3E] dark:text-[#10B981]">Để lại đánh giá</h3>
              <button onClick={() => setIsReviewOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-4">Bạn đánh giá thế nào về dịch vụ <span className="font-bold text-slate-800 dark:text-white">"{selectedOrder.services}"</span>?</p>

              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      className={`w-10 h-10 ${star <= rating ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn (nhân viên, không gian, chất lượng...)"
                className="w-full h-32 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#A8D5BA] transition-all text-sm"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsReviewOpen(false)}
                className="flex-1 py-3.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="flex-1 py-3.5 rounded-xl bg-[#1B4D3E] dark:bg-[#10B981] dark:text-slate-950 text-white font-bold hover:bg-[#153D31] dark:hover:bg-[#059669] transition-all shadow-lg shadow-[#1B4D3E]/20 dark:shadow-[#10B981]/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi Đánh Giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {isDetailsOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-8 border-b border-border flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div>
                <h3 className="text-2xl font-bold text-[#1B4D3E] dark:text-[#10B981]">Chi tiết đơn hàng</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Mã đơn: #ORD-{selectedOrder.id}</p>
              </div>
              <button onClick={() => setIsDetailsOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div id="order-details-to-pdf" className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dịch vụ</p>
                  <p className="font-bold text-slate-900 dark:text-white leading-snug">{selectedOrder.services}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Loại hình</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{getTypeLabel(selectedOrder.serviceType)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày khởi hành/đến</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {selectedOrder.bookingDate ? new Date(selectedOrder.bookingDate).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Giờ đến</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{selectedOrder.bookingTime ? selectedOrder.bookingTime.substring(0, 5) : '—'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày kết thúc</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {selectedOrder.endDate ? new Date(selectedOrder.endDate).toLocaleDateString('vi-VN') : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thời gian thuê</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {selectedOrder.bookingDays || 1} {selectedOrder.serviceType === 'HOTEL' ? 'đêm' : 'ngày'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Số lượng đặt</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {selectedOrder.quantity || 1} {selectedOrder.serviceType === 'HOTEL' ? 'phòng' : (selectedOrder.serviceType === 'RESTAURANT' ? 'bàn' : 'người')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày tạo đơn</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    {new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}
                  </p>
                </div>

                <div className="col-span-2 pt-4 border-t border-border flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tổng thanh toán</p>
                    <p className="font-bold text-[#1B4D3E] dark:text-[#10B981] text-3xl tracking-tighter">
                      {selectedOrder.totalAmount.toLocaleString()}đ
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 space-y-2">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Trạng thái hiện tại
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{getStatusBadge(selectedOrder.status)}</span>
                </div>
                <p className="text-xs text-blue-600/80 dark:text-blue-300/80 leading-relaxed font-medium">
                  {selectedOrder.status === 'PENDING' && "Đơn hàng của bạn đã được gửi tới Đại lý. Vui lòng chờ Đại lý kiểm tra lịch trống và phê duyệt trước khi tiến hành thanh toán."}
                  {selectedOrder.status === 'AWAITING_PAYMENT' && "Đơn hàng đã được duyệt! Bạn có thể nhấn nút 'Thanh toán ngay' để hoàn tất đặt chỗ qua VNPAY."}
                  {selectedOrder.status === 'PAID' && "Tuyệt vời! Thanh toán đã được xác nhận. Hẹn gặp bạn tại Đà Lạt!"}
                </p>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="flex-1 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-bold hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300"
              >
                Đóng
              </button>
              {selectedOrder.status === 'AWAITING_PAYMENT' && (
                <button
                  onClick={() => { setIsDetailsOpen(false); handlePayment(selectedOrder.id, selectedOrder.totalAmount); }}
                  className="flex-2 py-4 rounded-2xl bg-[#3B82F6] text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" /> Thanh toán ngay
                </button>
              )}
              <button
                onClick={() => PDFService.exportToPDF('order-details-to-pdf', `Doc_SmartTour_ORD_${selectedOrder.id}.pdf`)}
                className="flex-1 py-4 rounded-2xl bg-[#1B4D3E]/10 dark:bg-[#10B981]/10 text-[#1B4D3E] dark:text-[#10B981] font-bold hover:bg-[#1B4D3E] dark:hover:bg-[#10B981] hover:text-white dark:hover:text-slate-950 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" /> Xuất PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
