'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { transactionsAPI, cabangAPI, settingsAPI, productsAPI, API_BASE_URL } from '@/lib/api';
import { getAuth, clearAuth } from '@/lib/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/components/ui/Toast';
import { useCartStore, useCheckoutStore, useProductStore } from '@/stores';
import { useProductSocket } from '@/hooks/useProductSocket';
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

// Detect if device is phone (not tablet or desktop)
// Tablet (768px+) is allowed, only block small phones
function isPhoneDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check for phone-specific keywords (exclude iPad/tablet)
  const isPhone = /iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
  
  // Screen width: < 768 = phone, >= 768 = tablet/desktop allowed
  const isSmallScreen = window.innerWidth < 768;
  
  // Block only phones (small screen AND not tablet)
  return (isPhone || isSmallScreen) && !isTablet;
}

interface CartItem {
  productVariantId: string;
  productName: string;
  variantInfo: string;
  sku: string;
  price: number;
  quantity: number;
  availableStock: number;
}

interface HeldTransaction {
  id: string;
  cart: CartItem[];
  customerName: string;
  customerPhone: string;
  paymentMethod: 'CASH' | 'DEBIT' | 'TRANSFER' | 'QRIS';
  discount: number;
  discountType: 'NOMINAL' | 'PERCENTAGE';
  bankName: string;
  referenceNo: string;
  timestamp: Date;
}

// Confirm dialog state type
interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
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
    clearAllHeld,
    updateItemStock,
    getSubtotal,
    getTotal,
    getDiscountAmount,
    getCartItemByVariantId,
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

  // Local UI states (not shared across components)
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
  const [printerSettings, setPrinterSettings] = useState<{
    autoPrintEnabled: boolean;
    printerName: string;
    paperWidth: number;
    storeName: string;
    branchName: string;
    address: string;
    phone: string;
    footerText1: string;
    footerText2: string;
  } | null>(null);
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

  // Redirect to login if not authenticated
  useEffect(() => {
    const { token } = getAuth();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Check if phone device - block access (tablet allowed)
  useEffect(() => {
    const checkPhone = isPhoneDevice();
    setIsMobile(checkPhone);
    if (checkPhone) {
      setLoading(false);
    }
  }, []);

  // Helper function to show confirm dialog
  const showConfirm = useCallback((options: Omit<ConfirmState, 'open'>) => {
    setConfirmDialog({ ...options, open: true });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, open: false }));
  }, []);

  const getEffectiveCabangId = () => {
    // For KASIR, use their assigned cabangId
    // For Owner/Manager, use selected cabang or localStorage
    if (user?.role === 'KASIR') {
      return user?.cabangId;
    }
    return selectedCabangId || localStorage.getItem('activeCabangId') || user?.cabangId;
  };

  // Focus trap - keep Tab navigation within POS content
  useEffect(() => {
    if (isMobile) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trap Tab when no modals are open (userMenuOpen checked inside)
      if (showSuccess || showHoldModal || showCloseConfirm || confirmDialog.open) return;
      
      if (e.key === 'Tab' && posContainerRef.current) {
        const focusableElements = posContainerRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // If shift+tab on first element, go to last
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // If tab on last element, go to first
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
        // If focus is outside container, bring it back
        else if (!posContainerRef.current.contains(document.activeElement)) {
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
    if (isMobile) return; // Don't run if mobile
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in search input
      const isSearchFocused = document.activeElement === searchInputRef.current;
      const isCashInputFocused = document.activeElement === cashInputRef.current;
      
      // ESC - Close modals & focus search
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showSuccess) closeSuccessModal();
        searchInputRef.current?.focus();
        return;
      }

      // Numpad & Number keys - Auto-focus cash input when cart has items
      // Only trigger if search is empty (not actively searching) OR focus is not on search
      const searchValue = searchInputRef.current?.value || '';
      const shouldTriggerNumpad = cart.length > 0 && 
                                   (!isSearchFocused || searchValue === '') && 
                                   !isCashInputFocused;
      
      if (shouldTriggerNumpad) {
        const numpadKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ','];
        if (numpadKeys.includes(e.key)) {
          e.preventDefault();
          cashInputRef.current?.focus();
          // Append the pressed key
          const currentVal = cashInputRef.current?.value || '';
          const newVal = currentVal + (e.key === ',' ? '.' : e.key);
          setCashReceived(parseFloat(newVal.replace(/\./g, '')) || 0);
        }
      }

      // Enter/NumpadEnter - Process payment if cash input is focused
      if ((e.key === 'Enter' || e.key === 'NumpadEnter') && isCashInputFocused && cart.length > 0) {
        e.preventDefault();
        const processBtn = document.querySelector('[data-process-payment]') as HTMLButtonElement;
        processBtn?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuccess, cart.length]);

  // Fetch branches for Owner/Manager
  useEffect(() => {
    const initBranches = async () => {
      if (user?.role === 'KASIR') return;
      
      const activeBranches = await fetchBranches();
      
      // Auto-select: use localStorage or user's cabang or first branch
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
  }, [selectedCabangId, user?.role, user?.cabangId, fetchProductsStore, fetchSettings, fetchCategories]);

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
            storeName: data.storeName || 'Harapan Abah',
            branchName: data.branchName || '',
            address: data.address || '',
            phone: data.phone || '',
            footerText1: data.footerText1 || 'Terima kasih atas kunjungan Anda',
            footerText2: data.footerText2 || '',
          });
        }
      } catch (e) {
        console.error('Failed to load printer settings:', e);
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
        console.error('QZ Tray not available:', e);
        setQzConnected(false);
      }
    };
    
    loadPrinterSettings();
    initQZ();
  }, [selectedCabangId, user?.cabangId]);

  // Real-time product sync via WebSocket
  useProductSocket({
    onProductCreated: useCallback(() => {
      const effectiveCabangId = getEffectiveCabangId();
      fetchProductsStore(effectiveCabangId || '');
    }, [fetchProductsStore]),
    onProductUpdated: useCallback((updatedProduct: any) => {
      updateProduct(updatedProduct);
      
      // Update cart items if the product was updated
      const effectiveCabangId = getEffectiveCabangId();
      updatedProduct.variants?.forEach((variant: any) => {
        const stock = variant.stocks?.find((s: any) => s.cabangId === effectiveCabangId);
        if (stock) {
          updateItemStock(variant.id, stock.quantity, stock.price);
        }
      });
    }, [updateProduct, updateItemStock]),
    onProductDeleted: useCallback((productId: string) => {
      deleteProductStore(productId);
    }, [deleteProductStore]),
    onStockUpdated: useCallback((stockData: any) => {
      const effectiveCabangId = getEffectiveCabangId();
      if (stockData.cabangId !== effectiveCabangId) return;
      
      updateStock(stockData.cabangId, stockData.productVariantId, stockData.quantity, stockData.price);
      updateItemStock(stockData.productVariantId, stockData.quantity, stockData.price);
    }, [updateStock, updateItemStock]),
    onRefreshNeeded: useCallback(() => {
      const effectiveCabangId = getEffectiveCabangId();
      fetchProductsStore(effectiveCabangId || '');
    }, [fetchProductsStore]),
    enabled: !loading,
  });

  const getStockInfo = (quantity: number, inCart: number = 0) => {
    const available = quantity - inCart;
    if (available <= 0) return { color: 'text-gray-400', text: 'Habis', available };
    return { color: 'text-green-600 dark:text-green-400', text: `${available} pcs`, available };
  };

  // Format variant display more naturally
  const formatVariantDisplay = (variantName: string, variantValue: string) => {
    // Remove pipe separator and clean up
    const cleanValue = variantValue.replace(/\s*\|\s*/g, ' ').trim();
    
    // Common patterns to improve readability
    const lowerValue = cleanValue.toLowerCase();
    
    // If it's just a number or size-like value, display as is
    if (/^\d+$/.test(cleanValue)) {
      return cleanValue; // Just "11", "6", etc
    }
    
    // If format is "Word Number" (e.g., "SD 6", "Panjang 11"), display as is
    if (/^[a-zA-Z]+\s+\d+$/.test(cleanValue)) {
      return cleanValue; // "SD 6", "Panjang 11"
    }
    
    // If it contains the variant name in the value, remove redundancy
    // e.g., "Ukuran | M" -> "M", "Size | XL" -> "XL"
    const nameLower = variantName.toLowerCase();
    if (lowerValue.startsWith(nameLower)) {
      return cleanValue.substring(variantName.length).trim();
    }
    
    // Default: return cleaned value
    return cleanValue;
  };

  const handleAddToCart = (product: any, variant: any) => {
    const effectiveCabangId = getEffectiveCabangId();
    const stock = variant.stocks?.find((s: any) => s.cabangId === effectiveCabangId);
    if (!stock || stock.quantity <= 0) {
      toast.warning('Stok tidak tersedia!');
      return;
    }

    // Hide default variant info for SINGLE products
    let variantInfo = variant.variantValue;
    const defaultVariants = ['default', 'standar', 'standard', 'default:', '-'];
    if (product.productType === 'SINGLE' || defaultVariants.some(v => variantInfo.toLowerCase().includes(v))) {
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

  const handleRetrieveHeld = (held: HeldTransaction) => {
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
      onConfirm: () => {
        deleteHeld(id);
      },
    });
  };

  // Request Product via WhatsApp Function
  const handleRequestProduct = async () => {
    if (!newProduct.name || !newProduct.categoryId) {
      toast.warning('Mohon isi minimal Nama Produk dan Kategori');
      return;
    }

    setRequestProductLoading(true);
    try {
      // Get category name
      const category = categories.find(c => c.id === newProduct.categoryId);
      const categoryName = category?.name || 'N/A';
      const productTypeLabel = newProduct.productType === 'SINGLE' ? 'Produk Single' : 'Produk Variant';

      // Build WhatsApp message
      const message = `REQUEST PRODUK BARU\n\n` +
        `Nama Produk: ${newProduct.name}\n` +
        `Tipe Produk: ${productTypeLabel}\n` +
        `Kategori: ${categoryName}\n\n` +
        `Diminta oleh: ${user?.name || 'Kasir'}\n` +
        `Cabang: ${user?.cabang?.name || 'N/A'}\n` +
        `Waktu: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}`;

      // Encode message for WhatsApp URL
      const encodedMessage = encodeURIComponent(message);
      const whatsappURL = `https://wa.me/${adminWhatsApp}?text=${encodedMessage}`;

      // Open WhatsApp
      if (typeof window !== 'undefined') {
        window.open(whatsappURL, '_blank');
      }

      // Reset form and close modal
      setNewProduct({ name: '', categoryId: '', productType: 'SINGLE' });
      setShowRequestProductModal(false);
      
      toast.success('Request produk dikirim ke WhatsApp admin!');
    } catch (error: any) {
      toast.error('Gagal mengirim request: ' + error.message);
    } finally {
      setRequestProductLoading(false);
    }
  };

  // Handle close POS - always show confirmation
  const handleClosePOS = () => {
    setShowCloseConfirm(true);
  };

  const confirmClosePOS = () => {
    // Clear held transactions if user confirms
    if (heldTransactions.length > 0) {
      localStorage.removeItem('heldTransactions');
    }
    setShowCloseConfirm(false);
    // KASIR logout, others go back to previous page
    if (user?.role === 'KASIR') {
      clearAuth();
      router.push('/login');
    } else {
      router.back();
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
    try {
      const paidAmount = paymentMethod === 'CASH' ? cashReceived : total;
      const changeAmount = paymentMethod === 'CASH' ? Math.max(0, cashReceived - total) : 0;
      
      const res = await transactionsAPI.createTransaction({
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
      });

      setTransactionSuccess(res.data.transaction, paymentMethod === 'CASH' ? cashReceived : 0);
      resetTransaction();
      
      // Refresh products after transaction
      const effectiveCabangId = getEffectiveCabangId();
      fetchProductsStore(effectiveCabangId || '');
      
      // Auto print if enabled
      if (printerSettings?.autoPrintEnabled && qzConnected && res.data.transaction) {
        setTimeout(() => handlePrintReceipt(res.data.transaction, paymentMethod === 'CASH' ? cashReceived : 0), 500);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Transaksi gagal!');
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
      console.error('Print error:', e);
      toast.error(`Gagal mencetak: ${e.message || 'Unknown error'}`);
    } finally {
      setPrinting(false);
    }
  };

  // Block phone users (tablet allowed)
  if (isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Akses Tidak Diizinkan
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            POS hanya dapat diakses melalui <span className="font-semibold">Desktop, Laptop, atau Tablet</span>. 
            Silakan gunakan perangkat dengan layar lebih besar untuk mengakses fitur kasir.
          </p>
          {user?.role === 'KASIR' ? (
            <button
              onClick={() => { clearAuth(); router.push('/login'); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          ) : (
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Dashboard
            </a>
          )}
        </div>
      </div>
    );
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
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && closeConfirm()}>
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

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-0">
        {/* Products */}
        <div className="xl:col-span-2 flex flex-col min-h-0">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 flex flex-col flex-1 min-h-0">
            <div className="mb-4 flex-shrink-0 flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari produk, SKU, atau kategori..."
                  className="w-full px-5 py-3 pl-12 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-4 focus:ring-slate-500 focus:border-slate-500 transition text-lg"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {/* Clear search button */}
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Request Produk Button */}
              <button
                onClick={() => setShowRequestProductModal(true)}
                tabIndex={-1}
                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-2 whitespace-nowrap"
                title="Request Produk Baru"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden md:inline">Request Produk</span>
              </button>
              
              {/* History Button */}
              <button
                onClick={() => setShowHistory(true)}
                tabIndex={-1}
                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:border-green-300 dark:hover:border-green-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-2 whitespace-nowrap"
                title="History Transaksi"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden md:inline">History</span>
              </button>
            </div>

            {/* Search result info */}
            {search && !loading && (
              <div className="mb-3 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
                Menampilkan <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredProducts.length}</span> dari {products.length} produk
              </div>
            )}

            <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Memuat produk...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {search ? `Tidak ada hasil untuk "${search}"` : 'Tidak ada produk'}
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    {search ? 'Coba kata kunci lain' : 'Tambahkan produk terlebih dahulu'}
                  </p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                <div key={product.id} className="border-2 border-gray-100 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          {product.category?.name}
                        </span>
                        {product.productType === 'VARIANT' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                            {product.variants?.length || 0} varian
                          </span>
                        )}
                      </div>
                      {/* Show description when searching */}
                      {search && product.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {product.productType === 'SINGLE' ? (
                    (() => {
                      const v = product.variants?.[0];
                      if (!v) return null;
                      const stock = v.stocks?.find((s: any) => s.cabangId === getEffectiveCabangId());
                      const inCartQty = cart.find(i => i.productVariantId === v.id)?.quantity || 0;
                      const stockInfo = getStockInfo(stock?.quantity || 0, inCartQty);
                      const isOut = stockInfo.available <= 0;

                      return (
                        <div>
                          {/* Show SKU when searching */}
                          {search && v.sku && (
                            <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                              SKU: {v.sku}
                            </div>
                          )}
                          <button
                            onClick={() => handleAddToCart(product, v)}
                            disabled={isOut}
                            className={`w-full p-3 rounded-xl border-2 text-sm font-medium transition ${
                              isOut ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-700 dark:to-blue-900/20 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
                            }`}
                          >
                            <div className="text-sm font-bold text-gray-900 dark:text-white">Rp {(stock?.price || 0).toLocaleString('id-ID')}</div>
                            <div className={`text-xs mt-1.5 font-semibold ${stockInfo.color}`}>Stock: {stockInfo.text}</div>
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {product.variants?.map((v: any) => {
                        const stock = v.stocks?.find((s: any) => s.cabangId === getEffectiveCabangId());
                        const inCartQty = cart.find(i => i.productVariantId === v.id)?.quantity || 0;
                        const stockInfo = getStockInfo(stock?.quantity || 0, inCartQty);
                        const isOut = stockInfo.available <= 0;

                        return (
                          <div key={v.id} className="relative">
                            {/* Show SKU on hover tooltip when searching */}
                            {search && v.sku && (
                              <div className="absolute -top-1 -right-1 z-10 group">
                                <div className="bg-gray-800 dark:bg-gray-700 text-white text-[10px] px-1.5 py-0.5 rounded font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {v.sku}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => handleAddToCart(product, v)}
                              disabled={isOut}
                              className={`w-full p-3 rounded-lg border-2 text-sm font-medium transition ${
                                isOut ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-700 dark:to-blue-900/20 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md'
                              }`}
                            >
                              <div className="font-bold text-gray-900 dark:text-white truncate" title={v.variantValue}>
                                {formatVariantDisplay(v.variantName, v.variantValue)}
                              </div>
                              <div className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">Rp {(stock?.price || 0).toLocaleString('id-ID')}</div>
                              <div className={`mt-1 text-xs font-semibold ${stockInfo.color}`}>Stock: {stockInfo.text}</div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="xl:col-span-1 flex flex-col min-h-0">
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-slate-900/20 rounded-2xl shadow-xl border-2 border-slate-100 dark:border-slate-800 p-5 flex flex-col flex-1 min-h-0 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center flex-shrink-0">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Keranjang
            </h2>

            {/* Cart Items - Scrollable */}
            <div className="space-y-2 mb-4 overflow-y-auto flex-1 min-h-0">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">Keranjang masih kosong</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productVariantId} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 p-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.productName}</p>
                      {item.variantInfo && <p className="text-xs text-gray-500 dark:text-gray-400">{item.variantInfo}</p>}
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handleUpdateQuantity(item.productVariantId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 font-bold text-sm">-</button>
                      <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.productVariantId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center bg-blue-100 dark:bg-blue-600 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-500 font-bold text-sm">+</button>
                      <button onClick={() => removeFromCart(item.productVariantId)} className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 text-sm">×</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Info Toggle */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
              <button type="button" onClick={() => setShowCustomerInfo(!showCustomerInfo)} tabIndex={-1} className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <span>Info Pelanggan (opsional)</span>
                <svg className={`w-4 h-4 transition-transform ${showCustomerInfo ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCustomerInfo && (
                <div className="space-y-2 mt-2">
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama Pelanggan" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="No. Telp" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              )}
            </div>

            {/* Discount Toggle */}
            <div className="mb-3">
              <button type="button" onClick={() => setShowDiscount(!showDiscount)} tabIndex={-1} className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-2">
                <span>Diskon (opsional)</span>
                <svg className={`w-4 h-4 transition-transform ${showDiscount ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDiscount && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button type="button" onClick={() => { setDiscountType('NOMINAL'); setDiscount(0); }} className={`py-1.5 px-3 rounded-lg text-sm font-medium transition ${discountType === 'NOMINAL' ? 'bg-slate-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Nominal (Rp)</button>
                    <button type="button" onClick={() => { setDiscountType('PERCENTAGE'); setDiscount(0); }} className={`py-1.5 px-3 rounded-lg text-sm font-medium transition ${discountType === 'PERCENTAGE' ? 'bg-slate-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>Persentase (%)</button>
                  </div>
                  <div className="relative">
                    <input type="number" value={discount || ''} onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">{discountType === 'PERCENTAGE' ? '%' : 'Rp'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metode Pembayaran</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['CASH', 'DEBIT', 'TRANSFER', 'QRIS'] as const).map((method) => (
                  <button key={method} onClick={() => { setPaymentMethod(method); setBankName(''); setReferenceNo(''); setCashReceived(0); }} className={`py-2 px-2 rounded-lg text-xs font-medium transition ${paymentMethod === method ? 'bg-slate-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{method}</button>
                ))}
              </div>
            </div>

            {/* Cash Input */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2 mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Uang Diterima</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                  <input ref={cashInputRef} type="text" value={cashReceived > 0 ? cashReceived.toLocaleString('id-ID') : ''} onChange={(e) => setCashReceived(parseInt(e.target.value.replace(/\D/g, '')) || 0)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0" />
                </div>
                {cashReceived > 0 && (
                  <div className={`rounded-lg p-2 ${cashReceived >= total ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${cashReceived >= total ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{cashReceived >= total ? 'Kembalian:' : 'Kurang:'}</span>
                      <span className={`text-base font-bold ${cashReceived >= total ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>Rp {Math.abs(cashReceived - total).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bank Select */}
            {(paymentMethod === 'DEBIT' || paymentMethod === 'TRANSFER') && (
              <div className="space-y-2 mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank</label>
                <select value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">Pilih Bank</option>
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BRI">BRI</option>
                  <option value="BNI">BNI</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder={paymentMethod === 'DEBIT' ? 'Nomor Approval EDC' : 'Nomor Referensi'} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            )}

            {paymentMethod === 'QRIS' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nomor Referensi</label>
                <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Transaction ID dari QRIS" className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            )}

            {/* Total */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Diskon {discountType === 'PERCENTAGE' ? `(${discount}%)` : ''}:</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">-Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-1">
                <span className="text-gray-900 dark:text-white">Total:</span>
                <span className="text-slate-600 dark:text-blue-400">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button type="button" onClick={handleHoldTransaction} disabled={cart.length === 0} tabIndex={-1} className="flex-1 py-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg font-semibold hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Hold
              </button>
              <button 
                onClick={handleCheckout} 
                disabled={cart.length === 0 || processing} 
                data-process-payment
                className="flex-[2] py-2.5 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {processing ? 'Memproses...' : 'Bayar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Transaksi Berhasil!</h3>
              <p className="text-gray-600 dark:text-gray-400">No. Invoice: <span className="font-mono font-semibold text-gray-900 dark:text-white">{lastTransaction.transactionNo}</span></p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
              {/* Subtotal (if there's discount) */}
              {lastTransaction.discount > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">Rp {(lastTransaction.total + lastTransaction.discount).toLocaleString('id-ID')}</span>
                </div>
              )}
              {/* Discount */}
              {lastTransaction.discount > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Diskon:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">-Rp {lastTransaction.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              {/* Total */}
              <div className={`flex justify-between ${lastTransaction.discount > 0 ? 'pt-2 border-t border-gray-200 dark:border-gray-700' : ''} mb-2`}>
                <span className="text-gray-600 dark:text-gray-400">Total:</span>
                <span className="font-bold text-lg text-gray-900 dark:text-white">Rp {lastTransaction.total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Pembayaran:</span>
                <span className="font-medium text-gray-900 dark:text-white">{lastTransaction.paymentMethod}</span>
              </div>
              {lastTransaction.paymentMethod === 'CASH' && lastCashReceived > 0 && (
                <>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Uang Diterima:</span>
                    <span className="font-medium text-gray-900 dark:text-white">Rp {lastCashReceived.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-green-700 dark:text-green-400 font-semibold">Kembalian:</span>
                    <span className="font-bold text-green-700 dark:text-green-400">Rp {(lastCashReceived - lastTransaction.total).toLocaleString('id-ID')}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handlePrintReceipt(lastTransaction, lastCashReceived > 0 ? lastCashReceived : undefined)}
                disabled={printing || !qzConnected}
                className={`flex-1 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  qzConnected
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                title={!qzConnected ? 'QZ Tray tidak terhubung' : ''}
              >
                {printing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mencetak...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Cetak Struk
                  </>
                )}
              </button>
              <button onClick={() => closeSuccessModal()} className="flex-1 py-2.5 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition">Transaksi Baru</button>
            </div>
            {!qzConnected && (
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-2">
                QZ Tray tidak terhubung. Install QZ Tray untuk mencetak struk.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hold Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaksi Di-hold ({heldTransactions.length})</h2>
              <button onClick={() => setShowHoldModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {heldTransactions.length === 0 ? (
                <p className="text-center text-gray-400 py-12">Tidak ada transaksi di-hold</p>
              ) : (
                heldTransactions.map((held) => {
                  const heldTotal = held.cart.reduce((sum, i) => sum + i.price * i.quantity, 0) - (held.discountType === 'PERCENTAGE' ? (held.cart.reduce((s, i) => s + i.price * i.quantity, 0) * held.discount / 100) : held.discount);
                  return (
                    <div key={held.id} className="border-2 border-amber-200 dark:border-amber-800 rounded-xl p-5 bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-800 dark:to-amber-900/10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold">{new Date(held.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          {held.customerName && <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">{held.customerName}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">Rp {heldTotal.toLocaleString('id-ID')}</p>
                          <p className="text-xs text-gray-500">{held.cart.length} item</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRetrieveHeld(held)} className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition">Lanjutkan</button>
                        <button onClick={() => handleDeleteHeld(held.id)} className="px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/50" title="Hapus">×</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Produk Baru</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kirim request ke admin via WhatsApp</p>
              </div>
              <button
                onClick={() => setShowRequestProductModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Nama produk"
                />
              </div>

              {/* Product Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tipe Produk <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewProduct({ ...newProduct, productType: 'SINGLE' })}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition ${
                      newProduct.productType === 'SINGLE'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Produk Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProduct({ ...newProduct, productType: 'VARIANT' })}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition ${
                      newProduct.productType === 'VARIANT'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Produk Variant
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {newProduct.productType === 'SINGLE' ? 'Produk tanpa varian (contoh: Air Mineral 600ml)' : 'Produk dengan varian (contoh: Baju dengan ukuran S, M, L, XL)'}
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  value={newProduct.categoryId}
                  onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Belum ada kategori. Buat kategori dulu di dashboard.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowRequestProductModal(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Batal
              </button>
              <button
                onClick={handleRequestProduct}
                disabled={requestProductLoading || !newProduct.name || !newProduct.categoryId}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {requestProductLoading ? (
                  'Mengirim...'
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Kirim Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
