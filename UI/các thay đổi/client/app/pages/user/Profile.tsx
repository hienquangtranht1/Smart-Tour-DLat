import { useState, useRef, useEffect } from 'react';
import { UserCircle, Mail, Phone, MapPin, Calendar, Edit, ShieldCheck, Loader2, Save, X, Camera, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export function Profile() {
  const { user, reloadProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
    dob: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: '', 
        address: '',
        dob: ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('fullName', formData.name);
      params.append('phone', formData.phone);
      params.append('address', formData.address);
      
      const response = await fetch(`/api/auth/profile?${params.toString()}`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        toast.success('Cập nhật hồ sơ thành công!');
        setIsEditing(false);
        reloadProfile();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Cập nhật thất bại');
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await fetch('/api/staff/upload-image', {
        method: 'POST',
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        const newAvatarUrl = data.url;
        
        // Update user profile with new avatar URL
        const params = new URLSearchParams();
        params.append('avatarUrl', newAvatarUrl);
        await fetch(`/api/auth/profile?${params.toString()}`, { method: 'PUT' });
        
        toast.success('Cập nhật ảnh đại diện thành công!');
        reloadProfile();
      } else {
        toast.error('Tải ảnh lên thất bại');
      }
    } catch (error) {
      toast.error('Lỗi khi tải ảnh');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }
    setPasswordLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('oldPassword', passwordForm.oldPassword);
      params.append('newPassword', passwordForm.newPassword);

      const response = await fetch(`/api/auth/change-password?${params.toString()}`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Đổi mật khẩu thành công!');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await response.json();
        toast.error(err.error || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 text-[#1B4D3E] dark:text-[#10B981]">
          <UserCircle className="w-8 h-8" />
          Hồ sơ cá nhân
        </h1>
        <p className="text-muted-foreground font-medium">
          Quản lý thông tin tài khoản của bạn và các tùy chọn bảo mật
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="backdrop-blur-xl bg-card border border-border rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all">
            <div className="text-center">
              <div className="relative w-36 h-36 mx-auto mb-6 group">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1B4D3E] to-[#10B981] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105 duration-300 overflow-hidden border-4 border-white dark:border-slate-800">
                  {user?.avatar ? (
                     <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-6xl font-bold italic">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <button 
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-lg flex items-center justify-center text-[#1B4D3E] dark:text-[#10B981] hover:scale-110 transition-all border border-slate-100 dark:border-slate-600"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
              </div>
              <h2 className="text-2xl font-black mb-1 text-slate-900 dark:text-white uppercase tracking-tight">{user?.name}</h2>
              <p className="text-slate-400 font-medium text-sm mb-6">{user?.email}</p>
              <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1B4D3E]/5 dark:bg-[#10B981]/10 text-[#1B4D3E] dark:text-[#10B981] border border-[#1B4D3E]/10 dark:border-[#10B981]/20 font-bold text-xs uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user?.role === 'STAFF' ? 'Đối tác đại lý' : (user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng Smart Tour')}
              </span>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Tên đăng nhập</span>
                  <span className="font-bold text-slate-800 dark:text-white">{user?.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Mã định danh</span>
                  <span className="font-mono text-xs font-bold text-[#1B4D3E] dark:text-[#10B981] bg-[#1B4D3E]/5 dark:bg-[#10B981]/10 px-2 py-0.5 rounded">#ST-{user?.username.slice(0, 4).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Trạng thái</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Đang hoạt động
                  </span>
                </div>
              </div>
            </div>

            <button 
               onClick={handleAvatarClick}
               disabled={uploading}
               className="w-full mt-10 py-4 rounded-2xl bg-[#1B4D3E] dark:bg-[#10B981] text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#1B4D3E]/20 dark:shadow-none disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              {uploading ? 'Đang tải...' : 'Chụp ảnh / Đổi Avatar'}
            </button>
          </div>
        </div>

        {/* Information Form */}
        <div className="lg:col-span-2">
          <div className="backdrop-blur-xl bg-card border border-border rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-[#1B4D3E] dark:text-[#10B981] uppercase tracking-tight">Thông tin chi tiết</h2>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 rounded-full bg-[#1B4D3E]/5 dark:bg-[#10B981]/10 text-[#1B4D3E] dark:text-[#10B981] hover:bg-[#1B4D3E] dark:hover:bg-[#10B981] hover:text-white dark:hover:text-slate-900 transition-all flex items-center gap-2 border border-[#1B4D3E]/20 font-bold text-xs uppercase tracking-widest"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-full bg-[#1B4D3E] dark:bg-[#10B981] text-white dark:text-slate-950 font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-[#1B4D3E]/20"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block mb-2 font-bold text-[10px] uppercase tracking-widest text-slate-400">Họ và tên hiển thị</label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600 group-focus-within:text-[#1B4D3E] dark:group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    readOnly={!isEditing}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border transition-all font-bold ${isEditing ? 'bg-white dark:bg-slate-800 border-[#1B4D3E]/20 dark:border-[#10B981]/20 focus:ring-2 focus:ring-[#10B981]/20 outline-none text-slate-800 dark:text-white' : 'bg-slate-50 dark:bg-slate-800/30 border-transparent text-slate-500 cursor-not-allowed font-medium'}`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block mb-2 font-bold text-[10px] uppercase tracking-widest text-slate-400">Địa chỉ Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-transparent text-slate-400 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-2 font-bold text-[10px] uppercase tracking-widest text-slate-400">Số điện thoại</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600 group-focus-within:text-[#1B4D3E] dark:group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type="tel"
                    placeholder="VD: 0987xxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border transition-all font-bold ${isEditing ? 'bg-white dark:bg-slate-800 border-[#1B4D3E]/20 dark:border-[#10B981]/20 focus:ring-2 focus:ring-[#10B981]/20 outline-none text-slate-800 dark:text-white' : 'bg-slate-50 dark:bg-slate-800/30 border-transparent text-slate-500'}`}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block mb-2 font-bold text-[10px] uppercase tracking-widest text-slate-400">Địa chỉ thường trú</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600 group-focus-within:text-[#1B4D3E] dark:group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type="text"
                    placeholder="Chưa cập nhật địa chỉ"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border transition-all font-bold ${isEditing ? 'bg-white dark:bg-slate-800 border-[#1B4D3E]/20 dark:border-[#10B981]/20 focus:ring-2 focus:ring-[#10B981]/20 outline-none text-slate-800 dark:text-white' : 'bg-slate-50 dark:bg-slate-800/30 border-transparent text-slate-500'}`}
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block mb-2 font-bold text-[10px] uppercase tracking-widest text-slate-400">Ngày sinh</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600 group-focus-within:text-[#1B4D3E] dark:group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    disabled={!isEditing}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border transition-all font-bold ${isEditing ? 'bg-white dark:bg-slate-800 border-[#1B4D3E]/20 dark:border-[#10B981]/20 focus:ring-2 focus:ring-[#10B981]/20 outline-none text-slate-800 dark:text-white' : 'bg-slate-50 dark:bg-slate-800/30 border-transparent text-slate-500'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="mt-8 backdrop-blur-xl bg-card border border-border rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <h2 className="text-2xl font-black mb-8 text-[#1B4D3E] dark:text-[#10B981] uppercase tracking-tight flex items-center gap-3">
              <Lock className="w-6 h-6" /> Bảo mật & Mật khẩu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block mb-2 font-bold text-[10px] uppercase tracking-widest text-slate-400">Mật khẩu hiện tại</label>
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600 group-focus-within:text-[#10B981] transition-colors" />
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#1B4D3E]/10 dark:border-[#10B981]/20 bg-slate-50 dark:bg-slate-800/30 focus:ring-2 focus:ring-[#10B981]/20 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 font-bold text-[10px] uppercase tracking-widest text-slate-400">Mật khẩu mới</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600" />
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#1B4D3E]/10 dark:border-[#10B981]/20 bg-slate-50 dark:bg-slate-800/30 focus:ring-2 focus:ring-[#10B981]/20 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 font-bold text-[10px] uppercase tracking-widest text-slate-400">Xác nhận mật khẩu</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-slate-600" />
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#1B4D3E]/10 dark:border-[#10B981]/20 bg-slate-50 dark:bg-slate-800/30 focus:ring-2 focus:ring-[#10B981]/20 outline-none transition-all font-bold"
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="px-8 py-4 rounded-full bg-[#1B4D3E] dark:bg-[#10B981] text-white dark:text-slate-950 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-[#1B4D3E]/20"
              >
                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Cập nhật mật khẩu
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="mt-8 backdrop-blur-xl bg-card border border-border rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <h2 className="text-2xl font-black mb-8 text-[#1B4D3E] dark:text-[#10B981] uppercase tracking-tight">Sở thích khám phá Đà Lạt</h2>
            <div className="flex flex-wrap gap-4">
              {['Thiên nhiên', 'Văn hóa cổ điển', 'Ẩm thực phố núi', 'Phiêu lưu mạo hiểm', 'Nghỉ dưỡng sang trọng', 'Check-in cảnh đẹp'].map((tag) => (
                <button
                  key={tag}
                  className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:border-[#10B981]/50 hover:bg-[#10B981]/5 transition-all text-sm font-bold shadow-sm"
                >
                  {tag}
                </button>
              ))}
              <button className="px-6 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-[#10B981] hover:border-[#10B981] hover:bg-[#10B981]/5 transition-all text-sm font-bold">
                + Thêm sở thích
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
