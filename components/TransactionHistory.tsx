'use client';

import { useState, useEffect, useRef } from 'react';
import { transactionsAPI, returnsAPI, api } from '@/lib/api';
import { getOfflineCacheService, type CachedTransaction } from '@/lib/offlineCache';

interface Transaction {
  id: string;
  transactionNo: string;
  customerName?: string;
  customerPhone?: string;
  total: number;
  totalAmount?: number; // Backend uses totalAmount
  paymentMethod: string;
  isSplitPayment: boolean;
  paymentAmount1?: number;
  paymentMethod2?: string;
  paymentAmount2?: number;
  createdAt: string;
  hasReturnRequest?: boolean;
  returnStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  items: Array<{
    id: string;
    productName?: string;
    variantInfo?: string;
    quantity: number;
    price: number;
    subtotal?: number;
    productVariantId: string;
    productVariant?: {
      id: string;
      variantName: string;
      variantValue: string;
      product: {
        id: string;
        name: string;
      };
    };
  }>;
}

interface ReturnableItem {
  productVariantId: string;
  productName: string;
  variantInfo: string;
  originalQty: number;
  returnedQty: number;
  returnableQty: number;
  price: number;
}

interface AppSettings {
  returnEnabled: boolean;
  returnDeadlineDays: number;
  returnRequiresApproval: boolean;
  exchangeEnabled: boolean;
}

interface Props {
  user: any;
  onClose: () => void;
  cabangId?: string | null;
}

export default function TransactionHistory({ user, onClose, cabangId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Offline state
  const [isFromCache, setIsFromCache] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [cacheTime, setCacheTime] = useState<Date | null>(null);
  const [requestItems, setRequestItems] = useState<{ [key: string]: number }>({});
  const [requestReason, setRequestReason] = useState('CUSTOMER_REQUEST');
  const [requestReasonDetail, setRequestReasonDetail] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestConditionNote, setRequestConditionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [managerOverride, setManagerOverride] = useState(false);
  
  // Exchange product selection
  const [exchangeVariants, setExchangeVariants] = useState<{ [originalVariantId: string]: string }>({});
  const [availableVariants, setAvailableVariants] = useState<any[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  
  // For WRONG_ITEM - product search
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState<any>(null);
  const searchRequestRef = useRef<number>(0); // Track search request to prevent race conditions
  
  // Returnable quantities tracking
  const [returnableItems, setReturnableItems] = useState<ReturnableItem[]>([]);
  const [loadingReturnable, setLoadingReturnable] = useState(false);
  
  // Settings from backend
  const [appSettings, setAppSettings] = useState<AppSettings>({
    returnEnabled: false,
    returnDeadlineDays: 7,
    returnRequiresApproval: true,
    exchangeEnabled: false,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Get effective cabang ID (use prop if provided, otherwise user's cabang)
  const effectiveCabangId = cabangId || user?.cabangId;

  useEffect(() => {
    loadSettings();
    fetchTransactions();
  }, [effectiveCabangId]);

  // Auto-reset WRONG_SIZE if no variant items selected
  useEffect(() => {
    if (!selectedTransaction || requestReason !== 'WRONG_SIZE') return;
    
    const hasVariantItems = selectedTransaction.items.some(
      item => (requestItems[item.productVariantId] || 0) > 0 && hasMultipleVariants(item)
    );
    
    if (!hasVariantItems) {
      setRequestReason('CUSTOMER_REQUEST');
    }
  }, [requestItems, selectedTransaction, requestReason]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings/app');
      setAppSettings(response.data);
    } catch (error) {
      console.error('Error loading app settings:', error);
    } finally {
      setSettingsLoaded(true);
    }
  };

  // Load variants for a specific product (for WRONG_SIZE exchange)
  const loadVariantsForProduct = async (productId: string) => {
    setLoadingVariants(true);
    try {
      const response = await api.get(`/products/${productId}`);
      const product = response.data;
      if (product?.variants) {
        setAvailableVariants(product.variants);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
    } finally {
      setLoadingVariants(false);
    }
  };

  // Search products (for WRONG_ITEM exchange)
  const searchProducts = async (query: string, requestId: number) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const response = await api.get(`/products?search=${encodeURIComponent(query)}&cabangId=${effectiveCabangId}`);
      // Only update results if this is still the latest request
      if (requestId === searchRequestRef.current) {
        const products = Array.isArray(response.data) ? response.data : (response.data?.products || []);
        console.log('[Exchange] Search results for:', query, 'count:', products.length);
        setSearchResults(products);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      if (requestId === searchRequestRef.current) {
        setSearchResults([]);
      }
    } finally {
      if (requestId === searchRequestRef.current) {
        setLoadingSearch(false);
      }
    }
  };

  // Debounced product search - only trigger when reason is WRONG_ITEM
  useEffect(() => {
    // Only search when in WRONG_ITEM mode
    if (requestReason !== 'WRONG_ITEM') {
      return;
    }
    
    if (!productSearch || productSearch.length < 2) {
      setSearchResults([]);
      setLoadingSearch(false);
      return;
    }
    
    // Increment request ID
    const requestId = ++searchRequestRef.current;
    setLoadingSearch(true);
    
    const timer = setTimeout(() => {
      searchProducts(productSearch, requestId);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [productSearch, requestReason, effectiveCabangId]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Refetch when back online
      fetchTransactions();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const cacheService = getOfflineCacheService();
    await cacheService.initialize();
    
    const cabangIdToUse = effectiveCabangId || 'default';
    
    // Check if we're offline - load from cache directly
    if (!navigator.onLine) {
      console.log('[History] Offline - loading from cache');
      try {
        const cached = await cacheService.getCachedTransactions(cabangIdToUse);
        const meta = await cacheService.getCacheMetadata(`transactions_${cabangIdToUse}`);
        
        if (cached.length > 0) {
          setTransactions(cached as any);
          setIsFromCache(true);
          setCacheTime(meta?.lastUpdated ? new Date(meta.lastUpdated) : null);
        } else {
          setTransactions([]);
          setIsFromCache(false);
        }
      } catch (error) {
        console.error('[History] Error loading from cache:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Online - try to fetch from server
    try {
      const res = await transactionsAPI.getTransactions({
        cabangId: effectiveCabangId || undefined,
      });
      
      // Backend returns paginated response: { data: [...], pagination: {...} }
      const txList = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.transactions || []);
      
      // Check return status for each transaction
      let finalTxList = txList;
      try {
        const returnsRes = await returnsAPI.getReturns({
          cabangId: effectiveCabangId,
        });
        const returns = Array.isArray(returnsRes.data) ? returnsRes.data : (returnsRes.data?.returns || []);
        
        finalTxList = txList.map((tx: Transaction) => {
          // Find active return (PENDING or COMPLETED only)
          // REJECTED returns should allow user to submit new return request
          const activeReturn = returns.find((ret: any) => 
            ret.transactionId === tx.id && 
            (ret.status === 'PENDING' || ret.status === 'COMPLETED')
          );
          
          // Also get any return for status display (including rejected)
          const anyReturn = returns.find((ret: any) => ret.transactionId === tx.id);
          
          return {
            ...tx,
            hasReturnRequest: !!activeReturn, // Only block if PENDING or COMPLETED
            returnStatus: anyReturn?.status   // Show any status for display
          };
        });
      } catch {
        // Continue with txList without return status
      }
      
      setTransactions(finalTxList);
      setIsFromCache(false);
      setCacheTime(null);
      
      // Cache the transactions for offline use
      try {
        await cacheService.cacheTransactions(cabangIdToUse, finalTxList);
        console.log('[History] Cached', finalTxList.length, 'transactions');
      } catch (cacheError) {
        console.error('[History] Error caching transactions:', cacheError);
      }
      
    } catch (error: any) {
      console.error('[History] Error fetching transactions:', error);
      
      // If network error, try to load from cache
      if (error.code === 'ERR_NETWORK' || !error.response) {
        console.log('[History] Network error - falling back to cache');
        try {
          const cached = await cacheService.getCachedTransactions(cabangIdToUse);
          const meta = await cacheService.getCacheMetadata(`transactions_${cabangIdToUse}`);
          
          if (cached.length > 0) {
            setTransactions(cached as any);
            setIsFromCache(true);
            setCacheTime(meta?.lastUpdated ? new Date(meta.lastUpdated) : null);
          } else {
            setTransactions([]);
          }
        } catch (cacheError) {
          console.error('[History] Error loading from cache:', cacheError);
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to get item display info
  const getProductName = (item: Transaction['items'][0]) => {
    return item.productName || item.productVariant?.product?.name || 'Unknown Product';
  };

  const getVariantInfo = (item: Transaction['items'][0]) => {
    if (item.variantInfo) return item.variantInfo;
    if (item.productVariant) {
      return item.productVariant.variantValue;
    }
    return '';
  };

  // Check if item has multiple variants (not a single product)
  const hasMultipleVariants = (item: Transaction['items'][0]) => {
    const variantInfo = getVariantInfo(item);
    // Single products have default variant values
    const defaultValues = ['Default', 'Standar', 'Standard', 'default', 'standar', 'standard'];
    return variantInfo && !defaultValues.includes(variantInfo);
  };

  const getSubtotal = (item: Transaction['items'][0]) => {
    return item.subtotal || (item.price * item.quantity);
  };

  const getTotal = (transaction: Transaction) => {
    return transaction.total || transaction.totalAmount || 0;
  };

  const filteredTransactions = transactions.filter((t) =>
    t.transactionNo.toLowerCase().includes(search.toLowerCase()) ||
    t.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    t.customerPhone?.includes(search)
  );

  const handleRequestClick = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowRequestModal(true);
    const items: { [key: string]: number } = {};
    transaction.items.forEach((item) => {
      items[item.productVariantId] = 0;
    });
    setRequestItems(items);
    setPhotoUrls([]);
    setRequestReasonDetail('');
    setRequestConditionNote('');
    setManagerOverride(false);
    setExchangeVariants({});
    setAvailableVariants([]);
    setSelectedExchangeProduct(null);
    setProductSearch('');
    setSearchResults([]);
    
    // Fetch returnable quantities
    setLoadingReturnable(true);
    try {
      const res = await returnsAPI.getReturnableQty(transaction.id);
      setReturnableItems(res.data.items || []);
    } catch (error) {
      console.error('Error fetching returnable quantities:', error);
      // Fallback: assume all quantities are returnable
      setReturnableItems(transaction.items.map(item => ({
        productVariantId: item.productVariantId,
        productName: item.productName || '',
        variantInfo: item.variantInfo || '',
        originalQty: item.quantity,
        returnedQty: 0,
        returnableQty: item.quantity,
        price: item.price,
      })));
    } finally {
      setLoadingReturnable(false);
    }
  };

  // Load variants when selecting an item for WRONG_SIZE exchange
  const handleItemSelectForExchange = async (item: Transaction['items'][0], qty: number) => {
    setRequestItems({
      ...requestItems,
      [item.productVariantId]: qty,
    });
    
    // Load variants for this product if exchange mode
    if (requestReason === 'WRONG_SIZE' && item.productVariant?.product?.id) {
      await loadVariantsForProduct(item.productVariant.product.id);
    }
  };

  const getDaysSinceTransaction = (createdAt: string): number => {
    const transactionDate = new Date(createdAt);
    const today = new Date();
    return Math.floor((today.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = (transaction: Transaction): boolean => {
    return getDaysSinceTransaction(transaction.createdAt) > appSettings.returnDeadlineDays;
  };

  // Check if the reason is for exchange (tukar barang)
  const isExchangeReason = (reason: string): boolean => {
    return ['WRONG_SIZE', 'WRONG_ITEM', 'DEFECTIVE', 'EXPIRED'].includes(reason);
  };

  // Check if it's a write-off exchange (barang rusak tidak masuk stok)
  const isWriteOffReason = (reason: string): boolean => {
    return reason === 'DEFECTIVE' || reason === 'EXPIRED';
  };

  const handleRequestSubmit = async () => {
    if (!selectedTransaction) return;

    const itemsToReturn = Object.entries(requestItems)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([variantId, qty]) => {
        const item = selectedTransaction.items.find((i) => i.productVariantId === variantId);
        return {
          productVariantId: variantId,
          quantity: qty as number,
          price: item!.price,
        };
      });

    if (itemsToReturn.length === 0) {
      alert('Pilih minimal 1 item untuk diretur');
      return;
    }

    // Validate exchange selections
    if (requestReason === 'WRONG_SIZE') {
      const hasAllVariants = itemsToReturn.every(item => exchangeVariants[item.productVariantId]);
      if (!hasAllVariants) {
        alert('Pilih varian pengganti untuk semua item yang akan ditukar');
        return;
      }
    }

    if (requestReason === 'WRONG_ITEM') {
      if (!selectedExchangeProduct) {
        alert('Pilih produk pengganti untuk item yang akan ditukar');
        return;
      }
    }

    // Check if overdue and needs manager override
    const daysSince = getDaysSinceTransaction(selectedTransaction.createdAt);
    const needsOverride = daysSince > appSettings.returnDeadlineDays;

    if (needsOverride && !managerOverride && user?.role !== 'OWNER' && user?.role !== 'MANAGER') {
      alert(`Transaksi ini sudah ${daysSince} hari (batas: ${appSettings.returnDeadlineDays} hari).\n\nPerlu persetujuan Manager/Owner untuk melanjutkan.`);
      return;
    }

    // Prepare exchange items data
    let exchangeItems: Array<{
      productVariantId: string;
      quantity: number;
    }> | undefined;

    if (requestReason === 'WRONG_SIZE') {
      exchangeItems = itemsToReturn.map(item => ({
        productVariantId: exchangeVariants[item.productVariantId],
        quantity: item.quantity,
      }));
    } else if (requestReason === 'WRONG_ITEM' && selectedExchangeProduct) {
      // For WRONG_ITEM, exchange all items to the selected product
      const totalQty = itemsToReturn.reduce((sum, item) => sum + item.quantity, 0);
      exchangeItems = [{
        productVariantId: selectedExchangeProduct.variantId,
        quantity: totalQty,
      }];
    } else if (requestReason === 'DEFECTIVE' || requestReason === 'EXPIRED') {
      // For DEFECTIVE/EXPIRED, exchange with same product variant (new unit)
      exchangeItems = itemsToReturn.map(item => ({
        productVariantId: item.productVariantId, // Same variant
        quantity: item.quantity,
      }));
    }

    try {
      setSubmitting(true);
      
      await returnsAPI.createReturn({
        transactionId: selectedTransaction.id,
        cabangId: effectiveCabangId,
        reason: requestReason,
        reasonDetail: requestReason === 'OTHER' ? requestReasonDetail : undefined,
        notes: requestNotes || undefined,
        conditionNote: requestConditionNote || undefined,
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
        items: itemsToReturn,
        refundMethod: selectedTransaction.paymentMethod,
        managerOverride: needsOverride ? managerOverride : undefined,
        exchangeItems: exchangeItems,
      });
      
      const messageType = isExchangeReason(requestReason) ? 'Tukar' : 'Return';
      alert(`${messageType} request berhasil dikirim!\n\nRequest Anda akan diproses oleh Manager/Owner.`);
      
      setShowRequestModal(false);
      setSelectedTransaction(null);
      setRequestItems({});
      setRequestReason('CUSTOMER_REQUEST');
      setRequestReasonDetail('');
      setRequestNotes('');
      setRequestConditionNote('');
      setPhotoUrls([]);
      setManagerOverride(false);
      setExchangeVariants({});
      setSelectedExchangeProduct(null);
      setProductSearch('');
      setSearchResults([]);
      
      await fetchTransactions();
    } catch (error: any) {
      console.error('[History] Error creating return request:', error);
      const errorData = error.response?.data;
      
      if (errorData?.requiresManagerOverride) {
        alert(`Transaksi ini sudah ${errorData.daysSinceTransaction} hari (batas: ${errorData.deadline} hari).\n\nPerlu persetujuan Manager/Owner.`);
      } else {
        const errorMessage = errorData?.error || error.message || 'Gagal mengirim request';
        alert('Gagal mengirim request return:\n\n' + errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalReturn = () => {
    if (!selectedTransaction) return 0;
    return Object.entries(requestItems).reduce((sum, [variantId, qty]) => {
      const item = selectedTransaction.items.find((i) => i.productVariantId === variantId);
      return sum + (item ? item.price * (qty as number) : 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* History Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Transaksi</h3>
              {/* Offline/Cache Indicator */}
              {(isOffline || isFromCache) && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {isOffline ? 'Mode Offline' : 'Data tersimpan lokal'}
                    {cacheTime && ` • ${cacheTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari invoice number, nama customer, atau nomor HP..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {search ? 'Tidak ada transaksi yang cocok' : 'Belum ada transaksi'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-gray-900 dark:text-white">{transaction.transactionNo}</p>
                          {/* Offline transaction badge */}
                          {(transaction as any).isOffline && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs font-semibold rounded-full flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              {(transaction as any).syncStatus === 'pending' ? 'Belum Sync' : 'Offline'}
                            </span>
                          )}
                          {transaction.returnStatus === 'APPROVED' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-semibold rounded-full">
                              Approved
                            </span>
                          )}
                          {transaction.returnStatus === 'REJECTED' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-semibold rounded-full">
                              Rejected
                            </span>
                          )}
                          {transaction.returnStatus === 'PENDING' && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-semibold rounded-full">
                              ⏳ Pending
                            </span>
                          )}
                          {transaction.returnStatus === 'COMPLETED' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-semibold rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleString('id-ID')}
                        </p>
                        {transaction.customerName && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {transaction.customerName}
                            {transaction.customerPhone && ` - ${transaction.customerPhone}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          Rp {getTotal(transaction).toLocaleString('id-ID')}
                        </p>
                        {transaction.isSplitPayment ? (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            <p>{transaction.paymentMethod}: Rp {transaction.paymentAmount1?.toLocaleString('id-ID')}</p>
                            <p>{transaction.paymentMethod2}: Rp {transaction.paymentAmount2?.toLocaleString('id-ID')}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.paymentMethod}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items:</p>
                      <div className="space-y-1">
                        {transaction.items.map((item) => {
                          const productName = getProductName(item);
                          const variantInfo = getVariantInfo(item);
                          const subtotal = getSubtotal(item);
                          const showVariant = variantInfo && !['Default', 'Standar', 'Standard', 'default', 'standar', 'standard', 'Default: Default', 'Default: Standard', 'Default: Standar', '-', ''].includes(variantInfo);
                          return (
                            <div key={item.id} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                {item.quantity}x {productName}
                                {showVariant && ` (${variantInfo})`}
                              </span>
                              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4">
                      {!appSettings.returnEnabled ? (
                        <div className="w-full py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 cursor-not-allowed">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Fitur Retur Tidak Aktif
                        </div>
                      ) : transaction.hasReturnRequest ? (
                        <div className="w-full py-2 rounded-lg font-medium bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 cursor-not-allowed">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Return Sudah Diajukan
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestClick(transaction)}
                          className="w-full py-2 rounded-lg font-medium transition-colors bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Request Return / Tukar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Return Modal */}
      {showRequestModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isExchangeReason(requestReason) ? 'Request Tukar Barang' : 'Request Return Barang'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedTransaction.transactionNo}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {appSettings.returnRequiresApproval 
                    ? 'Request akan dikirim ke Manager/Owner untuk diproses'
                    : 'Request akan langsung diproses'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedTransaction(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pilih Item & Jumlah Return
                </label>
                {loadingReturnable ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Memuat data...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTransaction.items.map((item) => {
                      const productName = getProductName(item);
                      const variantInfo = getVariantInfo(item);
                      const showVariant = variantInfo && !['Default', 'Standar', 'Standard', 'default', 'standar', 'standard', 'Default: Default', 'Default: Standard', 'Default: Standar'].includes(variantInfo);
                      
                      // Get returnable info
                      const returnableInfo = returnableItems.find(ri => ri.productVariantId === item.productVariantId);
                      const maxReturnable = returnableInfo?.returnableQty ?? item.quantity;
                      const returnedQty = returnableInfo?.returnedQty ?? 0;
                      const isFullyReturned = maxReturnable <= 0;
                      
                      return (
                        <div key={item.productVariantId} className={`flex items-center gap-3 p-3 border rounded-lg ${isFullyReturned ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-60' : 'border-gray-200 dark:border-gray-700'}`}>
                          <div className="flex-1">
                            <p className={`font-medium ${isFullyReturned ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>{productName}</p>
                            {showVariant && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{variantInfo}</p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400">Rp {item.price.toLocaleString('id-ID')} x {item.quantity}</p>
                            {/* Show returnable info */}
                            {returnedQty > 0 && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Sudah diretur: {returnedQty} | Sisa: {maxReturnable}
                              </p>
                            )}
                            {isFullyReturned && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                                ✓ Sudah diretur semua
                              </p>
                            )}
                          </div>
                          <input
                            type="number"
                            min="0"
                            max={maxReturnable}
                            value={requestItems[item.productVariantId] || 0}
                            disabled={isFullyReturned}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setRequestItems({
                                ...requestItems,
                                [item.productVariantId]: Math.min(Math.max(0, val), maxReturnable),
                              });
                            }}
                            className={`w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${isFullyReturned ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-600' : ''}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alasan *
                </label>
                <select
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <optgroup label="Return (Refund) - Uang Kembali">
                    <option value="CUSTOMER_REQUEST">Permintaan Customer</option>
                    <option value="OTHER">Lainnya</option>
                  </optgroup>
                  {appSettings.exchangeEnabled && (() => {
                    // Check if any selected item has variants
                    const hasVariantItems = selectedTransaction.items.some(
                      item => (requestItems[item.productVariantId] || 0) > 0 && hasMultipleVariants(item)
                    );
                    return (
                      <optgroup label="Tukar Barang - Ganti Unit Baru">
                        {hasVariantItems && (
                          <option value="WRONG_SIZE">Salah Ukuran (Tukar Varian)</option>
                        )}
                        <option value="WRONG_ITEM">Salah Barang (Tukar Produk)</option>
                        <option value="DEFECTIVE">Barang Rusak/Cacat (Ganti Baru)</option>
                        <option value="EXPIRED">Kadaluarsa (Ganti Baru)</option>
                      </optgroup>
                    );
                  })()}
                </select>
                
                {/* Exchange Info */}
                {isExchangeReason(requestReason) && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Mode Tukar:</strong> Barang lama akan dikembalikan dan ditukar dengan barang baru.
                      {requestReason === 'WRONG_SIZE' && ' Pilih varian/ukuran lain dari produk yang sama di bawah.'}
                      {requestReason === 'WRONG_ITEM' && ' Cari dan pilih produk pengganti di bawah.'}
                      {(requestReason === 'DEFECTIVE' || requestReason === 'EXPIRED') && ' Barang lama akan di-write off (tidak masuk stok).'}
                    </p>
                  </div>
                )}
              </div>

              {/* Exchange: Variant Picker for WRONG_SIZE */}
              {requestReason === 'WRONG_SIZE' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
                    Pilih Varian Pengganti *
                  </label>
                  {selectedTransaction.items.filter(item => (requestItems[item.productVariantId] || 0) > 0).length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pilih item yang ingin ditukar terlebih dahulu
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedTransaction.items
                        .filter(item => (requestItems[item.productVariantId] || 0) > 0)
                        .map((item) => {
                          const productName = getProductName(item);
                          const productId = item.productVariant?.product?.id;
                          return (
                            <div key={item.productVariantId} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <p className="font-medium text-gray-900 dark:text-white mb-2">
                                {productName} → Tukar ke:
                              </p>
                              {productId ? (
                                <select
                                  value={exchangeVariants[item.productVariantId] || ''}
                                  onChange={(e) => setExchangeVariants({
                                    ...exchangeVariants,
                                    [item.productVariantId]: e.target.value
                                  })}
                                  onFocus={() => loadVariantsForProduct(productId)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                  <option value="">-- Pilih Varian Baru --</option>
                                  {loadingVariants ? (
                                    <option disabled>Loading...</option>
                                  ) : (
                                    availableVariants
                                      .filter(v => v.id !== item.productVariantId) // Exclude current variant
                                      .map(v => (
                                        <option key={v.id} value={v.id}>
                                          {v.variantValue} - Rp {v.stocks?.[0]?.price?.toLocaleString('id-ID') || 'N/A'}
                                        </option>
                                      ))
                                  )}
                                </select>
                              ) : (
                                <p className="text-sm text-red-500">Produk tidak ditemukan</p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Exchange: Product Search for WRONG_ITEM */}
              {requestReason === 'WRONG_ITEM' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-3">
                    Cari Produk Pengganti *
                  </label>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Ketik nama produk atau SKU (min 2 karakter)..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
                  />
                  
                  {loadingSearch && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mencari...</p>
                  )}

                  {!loadingSearch && productSearch.length >= 2 && searchResults.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tidak ada produk ditemukan untuk &quot;{productSearch}&quot;
                    </p>
                  )}
                  
                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-600 rounded-lg">
                      {searchResults.map((product) => (
                        <div key={product.id} className="bg-white dark:bg-gray-800 p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          {product.variants && product.variants.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {product.variants.map((variant: any) => (
                                <button
                                  key={variant.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedExchangeProduct({
                                      productId: product.id,
                                      productName: product.name,
                                      variantId: variant.id,
                                      variantInfo: variant.variantValue,
                                      price: variant.stocks?.[0]?.price || 0,
                                      sku: variant.sku
                                    });
                                    // Clear search after selection
                                    setProductSearch('');
                                    setSearchResults([]);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                                    selectedExchangeProduct?.variantId === variant.id
                                      ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  <span className="font-medium">{variant.variantValue}</span>
                                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                                    Rp {(variant.stocks?.[0]?.price || 0).toLocaleString('id-ID')}
                                  </span>
                                  {variant.sku && (
                                    <span className="text-gray-400 dark:text-gray-500 ml-2 text-xs">
                                      SKU: {variant.sku}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Tidak ada varian tersedia
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Selected Product Display */}
                  {selectedExchangeProduct && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        ✓ Produk Pengganti Dipilih:
                      </p>
                      <p className="text-green-800 dark:text-green-200">
                        {selectedExchangeProduct.productName} - {selectedExchangeProduct.variantInfo}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Rp {selectedExchangeProduct.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Reason Detail (for OTHER) */}
              {requestReason === 'OTHER' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Detail Alasan *
                  </label>
                  <input
                    type="text"
                    value={requestReasonDetail}
                    onChange={(e) => setRequestReasonDetail(e.target.value)}
                    placeholder="Jelaskan alasan return..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* Condition Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kondisi Barang (opsional)
                </label>
                <input
                  type="text"
                  value={requestConditionNote}
                  onChange={(e) => setRequestConditionNote(e.target.value)}
                  placeholder="Misal: Segel rusak, kemasan penyok, dll"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Photo URLs (simple text input for MVP) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Foto Bukti (opsional)
                </label>
                <input
                  type="text"
                  value={photoUrls.join(', ')}
                  onChange={(e) => setPhotoUrls(e.target.value.split(',').map(u => u.trim()).filter(Boolean))}
                  placeholder="URL foto (pisahkan dengan koma jika lebih dari 1)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Foto produk rusak/defect (upload ke cloud storage dulu)
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catatan (opsional)
                </label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="Keterangan tambahan..."
                />
              </div>

              {/* Total */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {isExchangeReason(requestReason) ? 'Nilai Tukar:' : 'Total Return:'}
                  </span>
                  <span className={`text-xl font-bold ${isExchangeReason(requestReason) ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    Rp {getTotalReturn().toLocaleString('id-ID')}
                  </span>
                </div>
                {isExchangeReason(requestReason) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    * Jika produk pengganti berbeda harga, customer bayar/dapat selisih
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleRequestSubmit}
                  disabled={getTotalReturn() === 0 || submitting}
                  className={`flex-1 py-2.5 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
                    isExchangeReason(requestReason)
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {isExchangeReason(requestReason) ? 'Kirim Request Tukar' : 'Kirim Return Request'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
