import { Send } from 'lucide-react';

interface RegisterFormProps {
  selectedRole: 'USER' | 'STAFF' | 'ADMIN';
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  fullName: string;
  setFullName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  otp: string;
  setOtp: (val: string) => void;
  otpSent: boolean;
  countdown: number;
  handleSendOtp: () => void;
  handleRegisterSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  // Staff states
  agencyName: string;
  setAgencyName: (val: string) => void;
  businessLicense: string;
  setBusinessLicense: (val: string) => void;
  taxCode: string;
  setTaxCode: (val: string) => void;
}

export function RegisterForm(props: RegisterFormProps) {
  const {
    selectedRole, username, setUsername, password, setPassword,
    email, setEmail, fullName, setFullName, phone, setPhone,
    otp, setOtp, otpSent, countdown, handleSendOtp, handleRegisterSubmit, loading,
    agencyName, setAgencyName, businessLicense, setBusinessLicense, taxCode, setTaxCode
  } = props;

  return (
    <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Tên đăng nhập *</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA]" />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu *</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Họ và tên</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA]" />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Số điện thoại</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#A8D5BA]" />
        </div>
      </div>

      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl space-y-3">
        <div>
          <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Email nhận OTP *</label>
          <div className="flex gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            <button type="button" onClick={handleSendOtp} disabled={countdown > 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
              <Send className="w-4 h-4" /> {countdown > 0 ? `${countdown}s` : 'Gửi'}
            </button>
          </div>
        </div>
        {otpSent && (
          <div>
            <label className="block mb-1 text-sm font-bold text-emerald-700 dark:text-emerald-400">Nhập OTP 6 số từ email *</label>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
              className="w-full px-4 py-3 text-center text-xl tracking-[0.5em] font-bold rounded-xl bg-white dark:bg-slate-800 border-2 border-emerald-400 focus:outline-none" />
          </div>
        )}
      </div>

      {selectedRole === 'STAFF' && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-4">
          <p className="text-sm font-bold text-[#F59E0B]">Thông tin Đại lý / Doanh nghiệp</p>
          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Tên Đại lý / Công ty *</label>
            <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-bold text-slate-700 dark:text-slate-300">Số ĐKKD *</label>
              <input type="text" value={businessLicense} onChange={(e) => setBusinessLicense(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
            </div>
            <div>
              <label className="block mb-1 text-sm font-bold text-slate-700 dark:text-slate-300">Mã số thuế</label>
              <input type="text" value={taxCode} onChange={(e) => setTaxCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" />
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !otpSent}
        className="w-full py-3 mt-4 rounded-xl bg-[#1B4D3E] hover:bg-[#153D31] text-white font-medium transition-all shadow-lg flex justify-center items-center disabled:opacity-50"
      >
        {loading ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
      </button>
    </form>
  );
}
