import { User, Lock } from 'lucide-react';

interface LoginFormProps {
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  handleLoginSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
  username,
  setUsername,
  password,
  setPassword,
  loading,
  handleLoginSubmit,
}: LoginFormProps) {
  return (
    <form onSubmit={handleLoginSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Tên đăng nhập</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên đăng nhập"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] transition-all text-slate-700 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA] transition-all text-slate-700 dark:text-white"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 mt-6 rounded-xl bg-[#1B4D3E] hover:bg-[#153D31] text-white font-medium transition-all shadow-lg shadow-[#1B4D3E]/20 flex justify-center items-center"
      >
        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
      </button>
    </form>
  );
}
