'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { getAuth, clearAuth } from '@/lib/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { useCartStore, useCheckoutStore, useProductStore } from '@/stores';
import { useProductSocket } from '@/hooks/useProductSocket';
import { logger } from '@/lib/logger';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog';
import { connectQZ, printReceipt, isQZAvailable, PrintReceiptOptions } from '@/lib/qz-print';
import TransactionHistory from '@/components/TransactionHistory';
import { useOfflineQueueStore } from '@/stores/useOfflineQueueStore';
import { getOfflineCacheService } from '@/lib/offlineCache';
import { transactionsAPI } from '@/lib/api';

// Import POS components
import {
  POSHeader,
  POSProductGrid,
  POSCart,
  POSSuccessModal,
  POSHoldModal,
  POSRequestProductModal,
  POSMobileBlock,
  ConfirmState,
  PrinterSettings,
} from '@/components/pos';

// Detect if device is phone (not tablet or desktop)
function isPhoneDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isPhone = /iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
  const isSmallScreen = window.innerWidth < 768;
  
  return (isPhone || isSmallScreen) && !isTablet;
}

export default function POSPage() {
  const router = useRouter();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const { user } = getAuth();
  
  // Zustand stores
  const {
    cart,
    heldTransactions,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    holdTransaction,
    retrieveHeld,
    deleteHeld,
    updateItemStock,
    getSubtotal,
    getTotal,
    getDiscountAmount,
  } = useCartStore();
  
  const {
    customerName,
    customerPhone,
    paymentMethod,
    cashReceived,
    bankName,
    referenceNo,
    discount,
    discountType,
    showCustomerInfo,
    showDiscount,
    processing,
    lastTransaction,
    lastCashReceived,
    showSuccess,
    setCustomerName,
    setCustomerPhone,
    setPaymentMethod,
    setCashReceived,
    setBankName,
    setReferenceNo,
    setDiscount,
    setDiscountType,
    setShowCustomerInfo,
    setShowDiscount,
    setProcessing,
    setTransactionSuccess,
    closeSuccessModal,
    resetCheckout,
  } = useCheckoutStore();

  const {
    products,
    branches,
    categories,
    selectedCabangId,
    search,
    loading,
    adminWhatsApp,
    setSelectedCabangId,
    setSearch,
    setLoading,
    fetchProducts: fetchProductsStore,
    fetchBranches,
    fetchCategories,
    fetchSettings,
    updateProduct,
    deleteProduct: deleteProductStore,
    updateStock,
    getFilteredProducts,
  } = useProductStore();

  // Calculated values from stores
  const filteredProducts = getFilteredProducts();
  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount(discount, discountType);
  const total = getTotal(discount, discountType);

  // Local UI states
  const [isMobile, setIsMobile] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRequestProductModal, setShowRequestProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: '',
    productType: 'SINGLE' as 'SINGLE' | 'VARIANT',
  });
  const [requestProductLoading, setRequestProductLoading] = useState(false);
  
  // Printer settings
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings | null>(null);
  const [qzConnected, setQzConnected] = useState(false);
  const [printing, setPrinting] = useState(false);
  
  // Generic confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const posContainerRef = useRef<HTMLDivElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);
  
  // Offline queue store
  const {
    isOnline,
    initialize: initializeOfflineQueue,
    queueTransaction,
    isInitialized: isOfflineInitialized,
  } = useOfflineQueueStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    const { token } = getAuth();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Check if phone device
  useEffect(() => {
    const checkPhone = isPhoneDevice();
    setIsMobile(checkPhone);
    if (checkPhone) {
      setLoading(false);
    }
  }, [setLoading]);

  // Initialize offline queue service
  useEffect(() => {
    if (!isOfflineInitialized) {
      initializeOfflineQueue();
    }
  }, [isOfflineInitialized, initializeOfflineQueue]);

  // Helper functions
  const showConfirm = useCallback((options: Omit<ConfirmState, 'open'>) => {
    setConfirmDialog({ ...options, open: true });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  }, []);

  const getEffectiveCabangId = useCallback(() => {
    if (user?.role === 'KASIR') {
      return user?.cabangId;
    }
    return selectedCabangId || localStorage.getItem('activeCabangId') || user?.cabangId;
  }, [user?.role, user?.cabangId, selectedCabangId]);

  // Focus trap
  useEffect(() => {
    if (isMobile) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSuccess || showHoldModal || showCloseConfirm || confirmDialog.open) return;
      
      if (e.key === 'Tab' && posContainerRef.current) {
        const focusableElements = posContainerRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        } else if (!posContainerRef.current.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, showSuccess, showHoldModal, showCloseConfirm, confirmDialog.open]);

  // Auto-focus search on mount
  useEffect(() => {
    if (isMobile) return;
    searchInputRef.current?.focus();
  }, [isMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isSearchFocused = document.activeElement === searchInputRef.current;
      const isCashInputFocused = document.activeElement === cashInputRef.current;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showSuccess) closeSuccessModal();
        searchInputRef.current?.focus();
        return;
      }

      const searchValue = searchInputRef.current?.value || '';
      const shouldTriggerNumpad = cart.length > 0 && 
                                   (!isSearchFocused || searchValue === '') && 
                                   !isCashInputFocused;
      
      if (shouldTriggerNumpad) {
        const numpadKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ','];
        if (numpadKeys.includes(e.key)) {
          e.preventDefault();
          cashInputRef.current?.focus();
          const currentVal = cashInputRef.current?.value || '';
          const newVal = currentVal + (e.key === ',' ? '.' : e.key);
          setCashReceived(parseFloat(newVal.replace(/\./g, '')) || 0);
        }
      }

      if ((e.key === 'Enter' || e.key === 'NumpadEnter') && isCashInputFocused && cart.length > 0) {
        e.preventDefault();
        const processBtn = document.querySelector('[data-process-payment]') as HTMLButtonElement;
        processBtn?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuccess, cart.length, closeSuccessModal, setCashReceived]);

  // Fetch branches for Owner/Manager
  useEffect(() => {
    const initBranches = async () => {
      if (user?.role === 'KASIR') return;
      
      const activeBranches = await fetchBranches();
      
      const savedCabangId = localStorage.getItem('activeCabangId');
      if (savedCabangId && activeBranches.some((b: any) => b.id === savedCabangId)) {
        setSelectedCabangId(savedCabangId);
      } else if (user?.cabangId) {
        setSelectedCabangId(user.cabangId);
      } else if (activeBranches.length > 0) {
        setSelectedCabangId(activeBranches[0].id);
      }
    };
    
    initBranches();
  }, [user?.role, user?.cabangId, fetchBranches, setSelectedCabangId]);

  // Fetch products when cabang changes
  useEffect(() => {
    const effectiveCabangId = getEffectiveCabangId();
    if (effectiveCabangId || user?.role === 'KASIR') {
      fetchProductsStore(effectiveCabangId || '');
      fetchSettings();
      fetchCategories();
    }
  }, [selectedCabangId, user?.role, user?.cabangId, fetchProductsStore, fetchSettings, fetchCategories, getEffectiveCabangId]);

  // beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cart.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cart]);

  // Load printer settings and connect QZ Tray
  useEffect(() => {
    const effectiveCabangId = getEffectiveCabangId();
    if (!effectiveCabangId) return;
    
    const loadPrinterSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/settings/printer?cabangId=${effectiveCabangId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setPrinterSettings({
            autoPrintEnabled: data.autoPrintEnabled ?? true,
            printerName: data.printerName || '',
            paperWidth: data.paperWidth || 58,
            storeName: data.storeName || '',
            branchName: data.branchName || '',
            address: data.address || '',
            phone: data.phone || '',
            footerText1: data.footerText1 || 'Terima kasih atas kunjungan Anda',
            footerText2: data.footerText2 || '',
          });
        }
      } catch (e) {
        logger.error('Failed to load printer settings:', e);
      }
    };
    
    const initQZ = async () => {
      try {
        const available = await isQZAvailable();
        setQzConnected(available);
        if (available) {
          await connectQZ();
        }
      } catch (e) {
        logger.debug('QZ Tray not available:', e);
        setQzConnected(false);
      }
    };
    
    loadPrinterSettings();
    initQZ();
  }, [selectedCabangId, user?.cabangId, getEffectiveCabangId]);

  // Real-time product sync via WebSocket
  useProductSocket({
    onProductCreated: useCallback(() => {
      const effectiveCabangId = getEffectiveCabangId();
      fetchProductsStore(effectiveCabangId || '');
    }, [fetchProductsStore, getEffectiveCabangId]),
    onProductUpdated: useCallback((updatedProduct: any) => {
      updateProduct(updatedProduct);
      const effectiveCabangId = getEffectiveCabangId();
      updatedProduct.variants?.forEach((variant: any) => {
        const stock = variant.stocks?.find((s: any) => s.cabangId === effectiveCabangId);
        if (stock) {
          updateItemStock(variant.id, stock.quantity, stock.price);
        }
      });
    }, [updateProduct, updateItemStock, getEffectiveCabangId]),
    onProductDeleted: useCallback((productId: string) => {
      deleteProductStore(productId);
    }, [deleteProductStore]),
    onStockUpdated: useCallback((stockData: any) => {
      const effectiveCabangId = getEffectiveCabangId();
      if (stockData.cabangId !== effectiveCabangId) return;
      updateStock(stockData.cabangId, stockData.productVariantId, stockData.quantity, stockData.price);
      updateItemStock(stockData.productVariantId, stockData.quantity, stockData.price);
    }, [updateStock, updateItemStock, getEffectiveCabangId]),
    onRefreshNeeded: useCallback(() => {
      const effectiveCabangId = getEffectiveCabangId();
      fetchProductsStore(effectiveCabangId || '');
    }, [fetchProductsStore, getEffectiveCabangId]),
    enabled: !loading,
  });

  // Cart handlers
  const handleAddToCart = (product: any, variant: any) => {
    const effectiveCabangId = getEffectiveCabangId();
    const stock = variant.stocks?.find((s: any) => s.cabangId === effectiveCabangId);
    if (!stock || stock.quantity <= 0) {
      toast.warning('Stok tidak tersedia!');
      return;
    }

    let variantInfo = variant.variantValue;
    const defaultVariants = ['default', 'standar', 'standard', 'default:', '-'];
    if (product.productType === 'SINGLE' || defaultVariants.some((v: string) => variantInfo.toLowerCase().includes(v))) {
      variantInfo = '';
    }

    const success = addToCart({
      productVariantId: variant.id,
      productName: product.name,
      variantInfo,
      sku: variant.sku,
      price: stock.price || 0,
      availableStock: stock.quantity,
    });

    if (!success) {
      toast.warning('Stok tidak mencukupi!');
    }
  };

  const handleUpdateQuantity = (variantId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(variantId);
      return;
    }
    const success = updateQuantity(variantId, newQty);
    if (!success) {
      toast.warning('Stok tidak mencukupi!');
    }
  };

  const resetTransaction = () => {
    clearCart();
    resetCheckout();
  };

  const handleHoldTransaction = () => {
    if (cart.length === 0) { toast.warning('Keranjang masih kosong!'); return; }
    
    holdTransaction({
      customerName,
      customerPhone,
      paymentMethod,
      discount,
      discountType,
      bankName,
      referenceNo,
    });
    resetTransaction();
    toast.success('Transaksi berhasil di-hold!');
  };

  const handleRetrieveHeld = (held: any) => {
    const doRetrieve = () => {
      retrieveHeld(held.id);
      setCustomerName(held.customerName);
      setCustomerPhone(held.customerPhone);
      setPaymentMethod(held.paymentMethod);
      setDiscount(held.discount);
      setDiscountType(held.discountType);
      setBankName(held.bankName);
      setReferenceNo(held.referenceNo);
      setShowHoldModal(false);
    };

    if (cart.length > 0) {
      showConfirm({
        title: 'Ganti Keranjang?',
        description: 'Keranjang saat ini akan diganti dengan transaksi yang di-hold. Lanjutkan?',
        confirmText: 'Ya, Ganti',
        confirmVariant: 'warning',
        onConfirm: doRetrieve,
      });
    } else {
      doRetrieve();
    }
  };

  const handleDeleteHeld = (id: string) => {
    showConfirm({
      title: 'Hapus Transaksi?',
      description: 'Transaksi yang di-hold ini akan dihapus secara permanen.',
      confirmText: 'Hapus',
      confirmVariant: 'danger',
      onConfirm: () => deleteHeld(id),
    });
  };

  // Request Product via WhatsApp
  const handleRequestProduct = async () => {
    if (!newProduct.name || !newProduct.categoryId) {
      toast.warning('Mohon isi minimal Nama Produk dan Kategori');
      return;
    }

    setRequestProductLoading(true);
    try {
      const category = categories.find((c: any) => c.id === newProduct.categoryId);
      const categoryName = category?.name || 'N/A';
      const productTypeLabel = newProduct.productType === 'SINGLE' ? 'Produk Single' : 'Produk Variant';

      const message = `REQUEST PRODUK BARU\n\n` +
        `Nama Produk: ${newProduct.name}\n` +
        `Tipe Produk: ${productTypeLabel}\n` +
        `Kategori: ${categoryName}\n\n` +
        `Diminta oleh: ${user?.name || 'Kasir'}\n` +
        `Cabang: ${user?.cabang?.name || 'N/A'}\n` +
        `Waktu: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappURL = `https://wa.me/${adminWhatsApp}?text=${encodedMessage}`;

      if (typeof window !== 'undefined') {
        window.open(whatsappURL, '_blank');
      }

      setNewProduct({ name: '', categoryId: '', productType: 'SINGLE' });
      setShowRequestProductModal(false);
      toast.success('Request produk dikirim ke WhatsApp admin!');
    } catch (error: any) {
      toast.error('Gagal mengirim request: ' + error.message);
    } finally {
      setRequestProductLoading(false);
    }
  };

  // Handle close POS
  const handleClosePOS = () => setShowCloseConfirm(true);

  const confirmClosePOS = () => {
    if (heldTransactions.length > 0) {
      localStorage.removeItem('heldTransactions');
    }
    setShowCloseConfirm(false);
    if (user?.role === 'KASIR') {
      clearAuth();
      router.push('/login');
    } else {
      router.back();
    }
  };

  // Network error check
  const isNetworkError = (error: any): boolean => {
    if (!error) return false;
    if (error.name === 'AxiosError' && error.code === 'ERR_NETWORK') return true;
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') return true;
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('network error') || msg.includes('failed to fetch') || msg.includes('connection refused')) return true;
    if (error.request && !error.response) return true;
    return false;
  };

  // Handle offline transaction queueing
  const handleOfflineCheckout = async (transactionData: Record<string, unknown>) => {
    try {
      const localId = await queueTransaction(transactionData);
      
      const offlineTransaction = {
        id: localId,
        transactionNo: `OFFLINE-${Date.now()}`,
        createdAt: new Date().toISOString(),
        total: total,
        discount: discountAmount,
        paymentMethod,
        cabangId: getEffectiveCabangId() || '',
        items: cart.map((item) => ({
          id: item.productVariantId,
          productName: item.productName,
          variantInfo: item.variantInfo,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
          productVariantId: item.productVariantId,
        })),
        isOffline: true,
        syncStatus: 'pending' as const,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
      };
      
      try {
        const cacheService = getOfflineCacheService();
        await cacheService.initialize();
        await cacheService.addOfflineTransaction(offlineTransaction);
      } catch (cacheError) {
        console.error('[POS] Error adding to cache:', cacheError);
      }
      
      setTransactionSuccess(offlineTransaction as any, paymentMethod === 'CASH' ? cashReceived : 0);
      resetTransaction();
      toast.success('Transaksi disimpan offline. Akan disync saat online.');
      return true;
    } catch (error) {
      logger.error('Failed to queue offline transaction:', error);
      toast.error('Gagal menyimpan transaksi offline!');
      return false;
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.warning('Keranjang masih kosong!'); return; }
    
    if (paymentMethod === 'CASH') {
      if (cashReceived === 0) { toast.warning('Masukkan uang yang diterima!'); return; }
      if (cashReceived < total) { toast.error(`Uang kurang Rp ${(total - cashReceived).toLocaleString('id-ID')}!`); return; }
    }
    
    if ((paymentMethod === 'DEBIT' || paymentMethod === 'TRANSFER') && !bankName) {
      toast.error('Pilih bank terlebih dahulu!'); return;
    }
    
    if (paymentMethod !== 'CASH' && !referenceNo) {
      toast.error('Nomor referensi wajib diisi!'); return;
    }

    setProcessing(true);
    
    const transactionData = {
      cabangId: getEffectiveCabangId()!,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      items: cart.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        price: item.price,
      })),
      discount: discountAmount,
      tax: 0,
      paymentMethod,
      bankName: bankName || undefined,
      referenceNo: referenceNo || undefined,
      deviceSource: 'WEB',
    };
    
    if (!isOnline) {
      await handleOfflineCheckout(transactionData);
      setProcessing(false);
      return;
    }
    
    try {
      const res = await transactionsAPI.createTransaction(transactionData);

      setTransactionSuccess(res.data.transaction, paymentMethod === 'CASH' ? cashReceived : 0);
      resetTransaction();
      
      const effectiveCabangId = getEffectiveCabangId();
      fetchProductsStore(effectiveCabangId || '');
      
      if (printerSettings?.autoPrintEnabled && qzConnected && res.data.transaction) {
        setTimeout(() => handlePrintReceipt(res.data.transaction, paymentMethod === 'CASH' ? cashReceived : 0), 500);
      }
    } catch (e: any) {
      logger.error('Transaction failed:', e);
      
      if (isNetworkError(e)) {
        toast.warning('Koneksi terputus. Menyimpan transaksi offline...');
        const success = await handleOfflineCheckout(transactionData);
        if (!success) {
          toast.error('Gagal menyimpan offline. Coba lagi.');
        }
      } else {
        toast.error(e.response?.data?.error || 'Transaksi gagal!');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Print receipt function
  const handlePrintReceipt = async (transaction: typeof lastTransaction, cashAmount?: number) => {
    if (!transaction || !printerSettings) {
      toast.error('Data transaksi atau pengaturan printer tidak tersedia');
      return;
    }

    if (!qzConnected) {
      toast.error('QZ Tray tidak terhubung. Pastikan QZ Tray sudah terinstall dan berjalan.');
      return;
    }

    setPrinting(true);
    try {
      const printOptions: PrintReceiptOptions = {
        printerName: printerSettings.printerName,
        paperWidth: printerSettings.paperWidth as 58 | 80,
        storeName: printerSettings.storeName,
        branchName: printerSettings.branchName,
        address: printerSettings.address,
        phone: printerSettings.phone,
        transactionNo: transaction.transactionNo,
        date: new Date(transaction.createdAt).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        items: transaction.items.map((item: any) => ({
          name: item.productName,
          variant: item.variantInfo || undefined,
          qty: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
        })),
        subtotal: transaction.total + (transaction.discount || 0),
        discount: transaction.discount || 0,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
        cashReceived: cashAmount,
        change: cashAmount ? cashAmount - transaction.total : undefined,
        footerText1: printerSettings.footerText1,
        footerText2: printerSettings.footerText2,
        cashierName: user?.name || 'Kasir',
      };

      await printReceipt(printOptions);
      toast.success('Struk berhasil dicetak!');
    } catch (e: any) {
      logger.error('Print error:', e);
      toast.error(`Gagal mencetak: ${e.message || 'Unknown error'}`);
    } finally {
      setPrinting(false);
    }
  };

  // Block phone users (tablet allowed)
  if (isMobile) {
    return <POSMobileBlock user={user} router={router} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div ref={posContainerRef} className="h-screen bg-gray-50 dark:bg-gray-900 px-6 py-4 flex flex-col overflow-hidden">
      {/* Generic Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open: boolean) => !open && closeConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmDialog.onConfirm();
                closeConfirm();
              }}
              className={
                confirmDialog.confirmVariant === 'danger'
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                  : confirmDialog.confirmVariant === 'warning'
                  ? 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500'
                  : 'bg-slate-600 text-white hover:bg-slate-700 focus:ring-slate-500'
              }
            >
              {confirmDialog.confirmText || 'Konfirmasi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <POSHeader
        user={user}
        branches={branches}
        selectedCabangId={selectedCabangId}
        setSelectedCabangId={setSelectedCabangId}
        showBranchDropdown={showBranchDropdown}
        setShowBranchDropdown={setShowBranchDropdown}
        heldTransactions={heldTransactions}
        setShowHoldModal={setShowHoldModal}
        userMenuOpen={userMenuOpen}
        setUserMenuOpen={setUserMenuOpen}
        handleClosePOS={handleClosePOS}
        clearAuth={clearAuth}
        router={router}
      />

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-0">
        {/* Products */}
        <POSProductGrid
          searchInputRef={searchInputRef}
          search={search}
          setSearch={setSearch}
          filteredProducts={filteredProducts}
          products={products}
          loading={loading}
          cart={cart}
          getEffectiveCabangId={getEffectiveCabangId}
          onAddToCart={handleAddToCart}
          onRequestProduct={() => setShowRequestProductModal(true)}
          onShowHistory={() => setShowHistory(true)}
        />

        {/* Cart */}
        <POSCart
          cart={cart}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          showCustomerInfo={showCustomerInfo}
          setShowCustomerInfo={setShowCustomerInfo}
          discount={discount}
          setDiscount={setDiscount}
          discountType={discountType}
          setDiscountType={setDiscountType}
          showDiscount={showDiscount}
          setShowDiscount={setShowDiscount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          bankName={bankName}
          setBankName={setBankName}
          referenceNo={referenceNo}
          setReferenceNo={setReferenceNo}
          cashReceived={cashReceived}
          setCashReceived={setCashReceived}
          cashInputRef={cashInputRef}
          subtotal={subtotal}
          discountAmount={discountAmount}
          total={total}
          processing={processing}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveFromCart={removeFromCart}
          onHold={handleHoldTransaction}
          onCheckout={handleCheckout}
        />
      </div>

      {/* Success Modal */}
      {showSuccess && lastTransaction && (
        <POSSuccessModal
          transaction={lastTransaction}
          cashReceived={lastCashReceived}
          qzConnected={qzConnected}
          printing={printing}
          onPrint={handlePrintReceipt}
          onClose={closeSuccessModal}
        />
      )}

      {/* Hold Modal */}
      {showHoldModal && (
        <POSHoldModal
          heldTransactions={heldTransactions}
          onRetrieve={handleRetrieveHeld}
          onDelete={handleDeleteHeld}
          onClose={() => setShowHoldModal(false)}
        />
      )}

      {/* Close POS Confirmation Dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent className="max-w-xs rounded-2xl p-8">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-base font-medium text-gray-900 dark:text-white text-center">
              {user?.role === 'KASIR' ? 'Akhiri Sesi Kasir?' : 'Kembali ke Dashboard?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
              {cart.length > 0 || heldTransactions.length > 0 ? (
                <>
                  Ada {cart.length > 0 && `${cart.length} item`}
                  {cart.length > 0 && heldTransactions.length > 0 && ' & '}
                  {heldTransactions.length > 0 && `${heldTransactions.length} hold`} yang belum selesai
                </>
              ) : (
                user?.role === 'KASIR' 
                  ? 'Anda akan logout dari sistem'
                  : 'Halaman kasir akan ditutup'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-row gap-8 sm:justify-center mt-6">
            <AlertDialogCancel className="flex-1 m-0 h-11 rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClosePOS}
              className="flex-1 m-0 h-11 rounded-xl bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {user?.role === 'KASIR' ? 'Logout' : 'Ya, Kembali'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Request Product Modal */}
      {showRequestProductModal && (
        <POSRequestProductModal
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          categories={categories}
          loading={requestProductLoading}
          onSubmit={handleRequestProduct}
          onClose={() => setShowRequestProductModal(false)}
        />
      )}

      {/* Transaction History Modal */}
      {showHistory && (
        <TransactionHistory 
          user={user} 
          onClose={() => setShowHistory(false)} 
          cabangId={getEffectiveCabangId()}
        />
      )}
    </div>
  );
}
