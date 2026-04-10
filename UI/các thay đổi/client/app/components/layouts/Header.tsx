import { Link } from 'react-router';
import { Search, Moon, Sun, Menu, User, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-[1001] backdrop-blur-xl bg-background/70 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">ST</span>
            </div>
            <span className="text-xl font-bold text-orange-500">
              Smart Tour Đà Lạt
            </span>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm địa điểm, tour, khách sạn..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary/50 border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-4">
            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors">
                Trang chủ
              </Link>
              <Link to="/explore" className="text-foreground/80 hover:text-foreground transition-colors">
                Khám phá
              </Link>
              <Link to="/become-partner" className="text-foreground/80 hover:text-foreground transition-colors">
                Trở thành Đối tác
              </Link>
            </nav>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white hidden md:block text-sm font-medium">{user.name}</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-card border border-white/10 shadow-xl overflow-hidden">
                    <Link
                      to={`/${user.role?.toLowerCase() || 'user'}/dashboard`}
                      className="block px-4 py-3 hover:bg-secondary/50 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User className="w-4 h-4 inline mr-2" />
                      Trang cá nhân
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/50 transition-colors text-destructive"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-6 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-all shadow-lg shadow-orange-500/30"
              >
                Đăng nhập
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
