'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, clearAuth } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard,
  Clock,
  RotateCcw,
  ArrowLeftRight,
  ShoppingCart,
  Receipt,
  History,
  Package,
  Tags,
  BarChart3,
  ClipboardList,
  Repeat2,
  Store,
  Building2,
  Users,
  FileText,
  TrendingUp,
  Settings,
  Printer,
  Shield,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Submenu open states
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Set sidebar open by default on desktop only
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Listen to resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const { user: authUser } = getAuth();
    setUser(authUser);
    
    // Auto-expand menu based on current path
    menuItems.forEach(item => {
      if (item.subMenu) {
        const isActive = item.subMenu.some(sub => 
          pathname === sub.path || pathname.startsWith(sub.path + '/')
        );
        if (isActive) {
          // Hanya expand menu yang aktif, tutup yang lain
          setOpenMenus({ [item.name]: true });
        }
      }
    });
  }, [pathname]);

  useEffect(() => {
    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => {
      // Jika menu yang diklik sudah open, tutup
      if (prev[menuName]) {
        return { [menuName]: false };
      }
      // Jika menu yang diklik belum open, buka dan tutup semua yang lain
      return { [menuName]: true };
    });
  };

  // Menu structure with parent-submenu
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['OWNER', 'MANAGER', 'ADMIN'],
    },
    {
      name: 'Penjualan',
      icon: <ShoppingCart className="w-5 h-5" />,
      roles: ['OWNER', 'MANAGER', 'ADMIN'],
      subMenu: [
        { name: 'Transactions', path: '/dashboard/transactions', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
        { name: 'Returns & Refunds', path: '/dashboard/returns', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
      ],
    },
    {
      name: 'Listing',
      icon: <Package className="w-5 h-5" />,
      roles: ['OWNER', 'MANAGER', 'ADMIN'],
      subMenu: [
        { name: 'Products', path: '/dashboard/products', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
        { name: 'Categories', path: '/dashboard/categories', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
      ],
    },
    {
      name: 'Stock',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['OWNER', 'MANAGER', 'ADMIN'],
      subMenu: [
        { name: 'Overview', path: '/dashboard/stock', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
        { name: 'Stock Opname', path: '/dashboard/stock-opname', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
        { name: 'Transfer Stock', path: '/dashboard/stock-transfers', roles: ['OWNER', 'MANAGER', 'ADMIN'] },
      ],
    },
    {
      name: 'Marketplace',
      path: '/dashboard/marketplace',
      icon: <Store className="w-5 h-5" />,
      roles: ['OWNER', 'MANAGER'],
    },
    {
      name: 'Branches',
      path: '/dashboard/branches',
      icon: <Building2 className="w-5 h-5" />,
      roles: ['OWNER'],
    },
    {
      name: 'Laporan',
      icon: <FileText className="w-5 h-5" />,
      roles: ['OWNER', 'MANAGER'],
      subMenu: [
        { name: 'Sales Report', path: '/dashboard/reports/sales', roles: ['OWNER', 'MANAGER'] },
        { name: 'Stock Report', path: '/dashboard/reports/stock', roles: ['OWNER', 'MANAGER'] },
      ],
    },
    {
      name: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      roles: ['OWNER', 'MANAGER'],
      subMenu: [
        { name: 'General', path: '/dashboard/settings/general', roles: ['OWNER', 'MANAGER'] },
        { name: 'User Management', path: '/dashboard/settings/users', roles: ['OWNER'] },
        { name: 'Printer', path: '/dashboard/settings/printer', roles: ['OWNER', 'MANAGER'] },
        { name: 'Backup Data', path: '/dashboard/settings/backup', roles: ['OWNER'] },
      ],
    },
  ];

  // Filter menu items by role
  const filteredMenuItems = menuItems.filter(item => {
    if (!user?.role || !item.roles.includes(user.role)) return false;
    return true;
  }).map(item => {
    if (item.subMenu) {
      return {
        ...item,
        subMenu: item.subMenu.filter(sub => !sub.roles || sub.roles.includes(user?.role))
      };
    }
    return item;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Mobile Overlay - untuk close sidebar saat klik di luar (HANYA MOBILE) */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        
        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl ${
            sidebarOpen ? 'w-72' : 'w-16 -translate-x-full md:translate-x-0'
          }`}
        >
          <div className="h-full flex flex-col overflow-hidden">
            {/* Logo & Hamburger - STICKY */}
            <div className="flex items-center justify-between px-3 py-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
              {sidebarOpen ? (
                <>
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl mr-3 shadow-md flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {user?.storeName || 'Harapan Abah'}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">By Pelaris.id System</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all flex-shrink-0 ml-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-10 h-10 mx-auto flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Navigation Menu - Parent/Submenu Structure */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
              {filteredMenuItems.map((item) => {
                // Check if this is a parent with submenu
                if (item.subMenu && item.subMenu.length > 0) {
                  const isAnySubActive = item.subMenu.some(sub => 
                    pathname === sub.path || pathname.startsWith(sub.path + '/')
                  );
                  const isOpen = openMenus[item.name] || false;
                  
                  return (
                    <div key={item.name}>
                      {/* Parent Menu Button */}
                      <button
                        onClick={() => {
                          if (sidebarOpen) {
                            toggleMenu(item.name);
                          } else {
                            setSidebarOpen(true);
                            // Buka menu ini, tutup yang lain
                            setOpenMenus({ [item.name]: true });
                          }
                        }}
                        className={`w-full flex items-center ${sidebarOpen ? 'justify-between px-3' : 'justify-center px-2'} py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                          isAnySubActive
                            ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={!sidebarOpen ? item.name : ''}
                      >
                        <div className={`flex items-center ${sidebarOpen ? 'gap-3' : ''}`}>
                          {item.icon}
                          {sidebarOpen && <span>{item.name}</span>}
                        </div>
                        {sidebarOpen && (
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                      
                      {/* Submenu Items */}
                      {sidebarOpen && (
                        <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 mt-1' : 'max-h-0'}`}>
                          <div className="space-y-0.5 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            {item.subMenu.map((subItem) => {
                              const isSubActive = pathname === subItem.path || 
                                (subItem.path !== '/dashboard/stock' && pathname.startsWith(subItem.path + '/'));
                              
                              return (
                                <a
                                  key={subItem.path}
                                  href={subItem.path}
                                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    isSubActive
                                      ? 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                  }`}
                                >
                                  {subItem.name}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Regular menu item without submenu
                const isActive = pathname === item.path;
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    className={`flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'} py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={!sidebarOpen ? item.name : ''}
                  >
                    {item.icon}
                    {sidebarOpen && <span>{item.name}</span>}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="transition-all duration-300">
          {/* Header - STICKY dengan margin sesuai sidebar */}
          <header className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 sticky top-0 z-30 ${sidebarOpen ? 'md:ml-72' : 'md:ml-16'}`}>
            <div className="px-4 md:px-6 py-3 md:py-4">
              {/* Mobile: Hamburger + Page Title + User Dropdown */}
              <div className="flex items-center justify-between md:hidden">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <h1 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                    {pathname === '/dashboard' ? 'Dashboard' :
                     pathname === '/dashboard/stock' ? 'Stock Overview' :
                     pathname === '/dashboard/stock-opname' ? 'Stock Opname' :
                     pathname === '/dashboard/stock-transfers' ? 'Transfer Stock' :
                     pathname.includes('/products') ? 'Produk' :
                     pathname.includes('/categories') ? 'Kategori' :
                     pathname.includes('/transactions') ? 'Transaksi' :
                     pathname.includes('/returns') ? 'Retur' :
                     pathname.includes('/reports') ? 'Reports' :
                     pathname.includes('/branches') ? 'Cabang' :
                     pathname.includes('/marketplace') ? 'Marketplace' :
                     pathname.includes('/settings') ? 'Settings' : 'Dashboard'}
                  </h1>
                </div>
                
                <div className="flex items-center gap-2">
                {/* User Dropdown - Mobile (NO POS BUTTON - POS is desktop only) */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-2 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <div className="w-7 h-7 flex items-center justify-center bg-white/20 rounded-full text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold">{user.name.split(' ')[0]}</span>
                      <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                          {/* Current Time */}
                          <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-lg font-bold">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-xs">{currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* User Info */}
                          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{user.email}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 text-xs font-bold bg-slate-600 text-white rounded uppercase">
                              {user.role}
                            </span>
                          </div>
                          
                          {/* Branch Info */}
                          {user.cabang && (
                            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Cabang</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.cabang.name}</p>
                            </div>
                          )}
                          
                          {/* Dark Mode Toggle */}
                          <button
                            onClick={() => {
                              toggleTheme();
                              setUserMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                          >
                            {theme === 'dark' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                              </svg>
                            )}
                            <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
                          </button>
                          
                          {/* Logout */}
                          <button
                            onClick={() => {
                              handleLogout();
                              setUserMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                </div>
              </div>
              
              {/* Desktop: Navbar with Page Title + POS Button + User Dropdown */}
              <div className="hidden md:flex items-center justify-between">
                {/* Left: Page Icon + Title + Description */}
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 rounded-xl ${
                    pathname === '/dashboard' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    pathname.includes('/reports') ? 'bg-teal-100 dark:bg-teal-900/30' :
                    pathname.includes('/stock') && !pathname.includes('/stock-transfers') && !pathname.includes('/stock-opname') ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    pathname.includes('/stock-opname') ? 'bg-orange-100 dark:bg-orange-900/30' :
                    pathname.includes('/stock-transfers') ? 'bg-cyan-100 dark:bg-cyan-900/30' :
                    pathname.includes('/products') ? 'bg-blue-100 dark:bg-blue-900/30' :
                    pathname.includes('/categories') ? 'bg-amber-100 dark:bg-amber-900/30' :
                    pathname.includes('/transactions') ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                    pathname.includes('/returns') ? 'bg-rose-100 dark:bg-rose-900/30' :
                    pathname.includes('/branches') ? 'bg-sky-100 dark:bg-sky-900/30' :
                    pathname.includes('/marketplace') ? 'bg-pink-100 dark:bg-pink-900/30' :
                    pathname.includes('/settings') ? 'bg-slate-100 dark:bg-slate-900/30' :
                    'bg-gray-100 dark:bg-gray-900/30'
                  }`}>
                    {pathname === '/dashboard' && <LayoutDashboard className="w-8 h-8 text-purple-600 dark:text-purple-400" />}
                    {pathname.includes('/reports') && <BarChart3 className="w-8 h-8 text-teal-600 dark:text-teal-400" />}
                    {pathname.includes('/stock') && !pathname.includes('/stock-transfers') && !pathname.includes('/stock-opname') && !pathname.includes('/reports') && <Package className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />}
                    {pathname.includes('/stock-opname') && <ClipboardList className="w-8 h-8 text-orange-600 dark:text-orange-400" />}
                    {pathname.includes('/stock-transfers') && <ArrowLeftRight className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />}
                    {pathname.includes('/products') && <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
                    {pathname.includes('/categories') && <Tags className="w-8 h-8 text-amber-600 dark:text-amber-400" />}
                    {pathname.includes('/transactions') && <Receipt className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}
                    {pathname.includes('/returns') && <RotateCcw className="w-8 h-8 text-rose-600 dark:text-rose-400" />}
                    {pathname.includes('/branches') && <Building2 className="w-8 h-8 text-sky-600 dark:text-sky-400" />}
                    {pathname.includes('/marketplace') && <Store className="w-8 h-8 text-pink-600 dark:text-pink-400" />}
                    {pathname.includes('/settings') && <Settings className="w-8 h-8 text-slate-600 dark:text-slate-400" />}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {pathname === '/dashboard' ? 'Dashboard' :
                       pathname === '/dashboard/stock' ? 'Stock Overview' :
                       pathname === '/dashboard/stock-opname' ? 'Stock Opname' :
                       pathname === '/dashboard/stock-transfers' ? 'Transfer Stock' :
                       pathname.includes('/products/new') ? 'Tambah Produk' :
                       pathname.includes('/products') && pathname.includes('/edit') ? 'Edit Produk' :
                       pathname.includes('/products') ? 'Kelola Produk' :
                       pathname.includes('/categories') ? 'Kategori Produk' :
                       pathname.includes('/transactions') ? 'Riwayat Transaksi' :
                       pathname.includes('/returns') ? 'Retur & Refund' :
                       pathname.includes('/reports/sales') ? 'Sales Report' :
                       pathname.includes('/reports/stock') ? 'Stock Report' :
                       pathname.includes('/reports') ? 'Reports' :
                       pathname.includes('/branches') ? 'Kelola Cabang' :
                       pathname.includes('/marketplace') ? 'Marketplace Integration' :
                       pathname.includes('/settings/general') ? 'General Settings' :
                       pathname.includes('/settings/users') ? 'User Management' :
                       pathname.includes('/settings/printer') ? 'Printer Settings' :
                       pathname.includes('/settings/backup') ? 'Backup & Restore' :
                       pathname.includes('/settings') ? 'Settings' : 'Dashboard'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {pathname === '/dashboard' ? (user ? `Selamat datang, ${user.name}` : 'Ringkasan bisnis') :
                       pathname === '/dashboard/stock' ? 'Kelola stok dan peringatan' :
                       pathname === '/dashboard/stock-opname' ? 'Validasi stok fisik' :
                       pathname === '/dashboard/stock-transfers' ? 'Transfer antar cabang' :
                       pathname.includes('/products') ? 'Kelola produk & varian' :
                       pathname.includes('/categories') ? 'Kelompokkan produk' :
                       pathname.includes('/transactions') ? 'Lihat semua transaksi' :
                       pathname.includes('/returns') ? 'Kelola permintaan retur' :
                       pathname.includes('/reports/sales') ? 'Analisis penjualan' :
                       pathname.includes('/reports/stock') ? 'Laporan inventori' :
                       pathname.includes('/reports') ? 'Analisis & laporan' :
                       pathname.includes('/branches') ? 'Kelola cabang toko' :
                       pathname.includes('/marketplace') ? 'Integrasi marketplace' :
                       pathname.includes('/settings/users') ? 'Kelola akun pengguna' :
                       pathname.includes('/settings/printer') ? 'Konfigurasi printer' :
                       pathname.includes('/settings/backup') ? 'Backup & restore data' :
                       pathname.includes('/settings') ? 'Pengaturan aplikasi' : ''}
                    </p>
                  </div>
                </div>
                
                {/* Right: POS Button + User Dropdown */}
                <div className="flex items-center gap-3">
                  {/* POS Button */}
                  <a
                    href="/pos"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Buka POS
                  </a>
                  
                  {/* User Dropdown - Desktop */}
                  {user && (
                    <div className="relative">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <div className="w-7 h-7 flex items-center justify-center bg-white/20 rounded-full text-xs font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold">{user.name}</p>
                          <p className="text-xs opacity-80">{user.role}</p>
                        </div>
                        <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Menu */}
                      {userMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                            {/* Current Time */}
                            <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-lg font-bold">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                  <p className="text-xs">{currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{user.email}</p>
                              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-bold bg-slate-600 text-white rounded uppercase">
                                {user.role}
                              </span>
                            </div>
                            
                            {/* Branch Info */}
                            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cabang</p>
                              {user.hasMultiCabangAccess ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-white dark:bg-amber-200 dark:text-gray-800">
                                  <Building2 className="w-3 h-3" />
                                  Semua Cabang
                                </span>
                              ) : user.cabang ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  {user.cabang.name}
                                </span>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
                              )}
                            </div>
                            
                            {/* Dark Mode Toggle */}
                            <button
                              onClick={() => {
                                toggleTheme();
                                setUserMenuOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                            >
                              {theme === 'dark' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                              )}
                              <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
                            </button>
                            
                            {/* Logout */}
                            <button
                              onClick={() => {
                                handleLogout();
                                setUserMenuOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span>Logout</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content dengan margin sesuai sidebar */}
          <main className={`p-6 min-h-screen transition-all duration-300 ${sidebarOpen ? 'md:ml-72' : 'md:ml-16'}`}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
