'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { OfflineStatusIndicator } from '@/components/ui/OfflineStatusIndicator';
import { Branch, HeldTransaction, User } from './types';

interface POSHeaderProps {
  user: User | null;
  branches: Branch[];
  selectedCabangId: string | null;
  setSelectedCabangId: (id: string) => void;
  showBranchDropdown: boolean;
  setShowBranchDropdown: (show: boolean) => void;
  heldTransactions: HeldTransaction[];
  setShowHoldModal: (show: boolean) => void;
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
  handleClosePOS: () => void;
  clearAuth: () => void;
  router: { push: (path: string) => void };
}

export function POSHeader({
  user,
  branches,
  selectedCabangId,
  setSelectedCabangId,
  showBranchDropdown,
  setShowBranchDropdown,
  heldTransactions,
  setShowHoldModal,
  userMenuOpen,
  setUserMenuOpen,
  handleClosePOS,
  clearAuth,
  router,
}: POSHeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="mb-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Tutup POS button for Owner/Manager - top left */}
        {user?.role !== 'KASIR' && (
          <button
            onClick={handleClosePOS}
            tabIndex={-1}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition flex items-center gap-2"
            title="Tutup POS"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
        
        {/* Branch Selector for Owner/Manager */}
        {user?.role !== 'KASIR' && branches.length > 0 && (
          <div className="relative">
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowBranchDropdown(!showBranchDropdown)}
              onBlur={() => setTimeout(() => setShowBranchDropdown(false), 150)}
              className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium cursor-pointer flex items-center gap-2 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
            >
              {branches.find(b => b.id === selectedCabangId)?.name || 'Pilih Cabang'}
              <svg className={`w-4 h-4 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showBranchDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-50">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      setSelectedCabangId(branch.id);
                      localStorage.setItem('activeCabangId', branch.id);
                      setShowBranchDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                      selectedCabangId === branch.id 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {branch.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Branch name for KASIR (read-only) */}
        {user?.role === 'KASIR' && user?.cabang?.name && (
          <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
            {user.cabang.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Offline Status Indicator */}
        <OfflineStatusIndicator />
        
        {/* Held transactions button */}
        {heldTransactions.length > 0 && (
          <button
            onClick={() => setShowHoldModal(true)}
            tabIndex={-1}
            className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {heldTransactions.length} Di-hold
          </button>
        )}
        
        {/* Date */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl">
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        
        {/* User Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              tabIndex={-1}
              className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-sm font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold">{user.name}</p>
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
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
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
                    onClick={() => toggleTheme()}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
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
                  
                  {/* Logout - only for KASIR */}
                  {user.role === 'KASIR' && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleClosePOS();
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  )}
                  
                  {/* Logout - for Owner/Manager */}
                  {user.role !== 'KASIR' && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        clearAuth();
                        router.push('/login');
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
