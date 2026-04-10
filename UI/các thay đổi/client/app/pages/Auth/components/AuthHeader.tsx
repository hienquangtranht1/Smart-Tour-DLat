import { User, Store, Lock } from 'lucide-react';

interface AuthHeaderProps {
  isLogin: boolean;
  selectedRole: 'USER' | 'STAFF' | 'ADMIN';
  setSelectedRole: (role: 'USER' | 'STAFF' | 'ADMIN') => void;
}

export function AuthHeader({ isLogin, selectedRole, setSelectedRole }: AuthHeaderProps) {
  return (
    <div className="text-center mb-6">
      <h2 className="text-3xl font-bold text-[#1B4D3E] dark:text-[#A8D5BA] mb-2">
        {isLogin ? 'Đăng nhập' : 'Tạo tài khoản mới'}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        {isLogin ? 'Chào mừng bạn trở lại với hệ sinh thái Smart Tour!' : 'Khám phá và xây dựng hệ thống du lịch số hóa'}
      </p>

      <div className={`grid ${isLogin ? 'grid-cols-3' : 'grid-cols-2'} gap-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner`}>
        <button
          type="button"
          onClick={() => setSelectedRole('USER')}
          className={`py-2.5 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${selectedRole === 'USER'
              ? 'bg-white dark:bg-slate-700 text-[#1B4D3E] dark:text-[#A8D5BA] shadow-md ring-1 ring-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
        >
          <User className="w-4 h-4" /> Du khách
        </button>
        <button
          type="button"
          onClick={() => setSelectedRole('STAFF')}
          className={`py-2.5 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${selectedRole === 'STAFF'
              ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-md ring-1 ring-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
        >
          <Store className="w-4 h-4" /> Đại lý
        </button>
        {isLogin && (
          <button
            type="button"
            onClick={() => setSelectedRole('ADMIN')}
            className={`py-2.5 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${selectedRole === 'ADMIN'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 shadow-md ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
          >
            <Lock className="w-4 h-4" /> Quản trị
          </button>
        )}
      </div>
    </div>
  );
}
