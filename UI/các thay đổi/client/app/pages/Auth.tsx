import { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthHeader } from './Auth/components/AuthHeader';
import { LoginForm } from './Auth/components/LoginForm';
import { RegisterForm } from './Auth/components/RegisterForm';
import { BrandingSidebar } from './Auth/components/BrandingSidebar';

const AUTH_IMAGE = 'https://images.unsplash.com/photo-1550627951-4ebb041775ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'USER' | 'STAFF' | 'ADMIN'>('USER');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Staff specific states
  const [agencyName, setAgencyName] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [taxCode, setTaxCode] = useState('');

  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await login(username, password);
      
      const from = location.state?.from?.pathname + (location.state?.from?.search || "");
      const redirectTo = from || searchParams.get('returnTo');
      
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        const targetRole = selectedRole.toLowerCase();
        if (targetRole === 'user') {
          navigate('/user/dashboard');
        } else {
          window.location.href = `http://localhost:8080/${targetRole}.html`;
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) { setErrorMsg('Vui lòng nhập email.'); return; }
    setErrorMsg('');
    try {
      const formData = new URLSearchParams();
      formData.append('email', email);
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccessMsg(data.message);
      setOtpSent(true);
      setCountdown(60);
      const iv = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(iv); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (e: any) { setErrorMsg(e.message || 'Lỗi gửi OTP'); }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) { setErrorMsg('Vui lòng nhập mã OTP.'); return; }
    setLoading(true);
    setErrorMsg('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('email', email);
      formData.append('fullName', fullName);
      formData.append('phone', phone);
      formData.append('otp', otp);
      formData.append('role', selectedRole);
      if (selectedRole === 'STAFF') {
        formData.append('agencyName', agencyName);
        formData.append('businessLicense', businessLicense);
        formData.append('taxCode', taxCode);
      }
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccessMsg(data.message);
      setTimeout(() => { setIsLogin(true); setSuccessMsg(''); }, 3000);
    } catch (e: any) { setErrorMsg(e.message || 'Lỗi đăng ký'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-x-hidden p-4 py-12">
      <div className="fixed inset-0 z-0">
        <img src={AUTH_IMAGE} alt="Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col md:flex-row rounded-3xl overflow-hidden backdrop-blur-xl bg-white/20 dark:bg-black/20 border border-white/30 shadow-2xl min-h-[650px]">
        {/* Branding Sidebar */}
        <BrandingSidebar />

        {/* Form Area */}
        <div className="w-full md:w-7/12 p-8 md:p-12 bg-[#F8FAFC]/95 dark:bg-slate-900/95 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <AuthHeader isLogin={isLogin} selectedRole={selectedRole} setSelectedRole={setSelectedRole} />

            <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-200 font-bold my-6">
              <Chrome className="w-5 h-5 text-[#1B4D3E] dark:text-[#A8D5BA]" /> Tiếp tục với Google
            </button>

            {errorMsg && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm">{errorMsg}</div>}
            {successMsg && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-sm">{successMsg}</div>}

            {isLogin ? (
              <LoginForm 
                username={username} setUsername={setUsername} 
                password={password} setPassword={setPassword} 
                loading={loading} handleLoginSubmit={handleLoginSubmit} 
              />
            ) : (
              <RegisterForm 
                {...{
                  selectedRole, username, setUsername, password, setPassword,
                  email, setEmail, fullName, setFullName, phone, setPhone,
                  otp, setOtp, otpSent, countdown, handleSendOtp, handleRegisterSubmit, loading,
                  agencyName, setAgencyName, businessLicense, setBusinessLicense, taxCode, setTaxCode
                }}
              />
            )}

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
              <button 
                onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-[#F59E0B] hover:text-[#D97706] font-bold"
              >
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
          </div>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; }`}</style>
    </div>
  );
}
