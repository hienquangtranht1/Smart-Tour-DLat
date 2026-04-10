import { useState, useEffect } from 'react';
import { Bell, Check, Info, ShieldAlert, ShoppingBag, UserPlus, FileText } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

interface Notification {
  id: number;
  message: string;
  type: 'INFO' | 'ORDER_APPROVED' | 'VNPAY_SUCCESS' | 'NEW_BOOKING' | 'NEW_SERVICE' | 'UPDATE_SERVICE' | 'NEW_AGENCY';
  createdAt: string;
  linkTarget: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/unread');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-read', { method: 'POST' });
      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success('Đã xem tất cả thông báo');
      }
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotifClick = async (n: Notification) => {
    setIsOpen(false);
    // Mark as read first
    try {
      await fetch(`/api/notifications/mark-read/${n.id}`, { method: 'POST' });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
    
    // Redirect
    if (n.linkTarget) {
      let target = n.linkTarget;
      // Map legacy/missing billing route to trips
      if (target === 'billing' || target === '/user/billing') {
        target = '/user/trips';
      }

      if (target.startsWith('/')) navigate(target);
      else navigate(`/user/${target}`);
    } else {
      navigate('/user/trips');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_APPROVED':
      case 'VNPAY_SUCCESS': return <ShoppingBag className="w-4 h-4 text-green-500" />;
      case 'NEW_BOOKING': return <FileText className="w-4 h-4 text-indigo-500" />;
      case 'NEW_AGENCY': return <UserPlus className="w-4 h-4 text-amber-500" />;
      case 'NEW_SERVICE':
      case 'UPDATE_SERVICE': return <ShieldAlert className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 z-[1001] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3 opacity-50" />
                <p className="text-sm text-slate-400">Không có thông báo mới nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotifClick(n)}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-700">
            <button 
              onClick={() => { setIsOpen(false); navigate('/user/trips'); }}
              className="text-[11px] font-bold text-[#1B4D3E] dark:text-[#10B981] uppercase tracking-widest hover:underline transition-all"
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close */}
      {isOpen && (
        <div className="fixed inset-0 z-[1000]" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
