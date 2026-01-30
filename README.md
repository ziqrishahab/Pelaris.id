# Frontend Web - Pelaris.id

> Web Dashboard untuk Pelaris.id Omnichannel POS System

---

## Daftar Isi

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Setup Development](#setup-development)
- [Project Structure](#project-structure)
- [Features](#features)
- [State Management](#state-management)
- [Testing](#testing)

---

## Overview

Web dashboard dibangun dengan Next.js 16 (App Router) untuk owner dan manager dalam mengelola operasional retail. Interface responsive yang support desktop, tablet, dan mobile (read-only untuk POS).

**Key Features:**
- Server-side rendering (SSR) untuk SEO & performance
- Real-time updates via WebSocket
- Dark/Light theme dengan auto-detection
- Skeleton loading states untuk better UX
- Error boundaries untuk error handling
- Dynamic chart loading (chart.js)
- Excel import/export produk
- Thermal printer integration (QZ Tray)
- Responsive design (Tailwind CSS)
- Type-safe API calls (TypeScript)
- **Error Monitoring:** Sentry integration

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.1.1 | React framework dengan SSR |
| **React** | 19.2.1 | UI library |
| **TypeScript** | 5 | Type-safe development |
| **Tailwind CSS** | 4 | Utility-first CSS |
| **Zustand** | Latest | State management |
| **Socket.io Client** | Latest | Real-time sync |
| **Sentry** | Latest | Error monitoring |
| **Chart.js** | Latest | Data visualization |
| **React Hook Form** | Latest | Form handling |
| **Zod** | Latest | Schema validation |
| **Sonner** | Latest | Toast notifications |
| **QZ Tray** | Latest | Thermal printer (58mm/80mm) |
| **Vitest** | 4.0 | Unit testing |

---

## Setup Development

### 1. Prerequisites

- Node.js 22.x atau lebih baru
- Backend API harus running di `http://localhost:5100`

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy file `.env.local.example` menjadi `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5100/api

# App Configuration
NEXT_PUBLIC_APP_NAME=Pelaris.id
NEXT_PUBLIC_APP_VERSION=2.0.0

# Sentry Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENABLED=true

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### 4. Run Development Server

```bash
npm run dev
```

Dashboard akan running di: `http://localhost:3100`

Default login:
- **Owner:** `owner@pelaris.id` / `password123`
- **Manager:** `manager@pelaris.id` / `password123`
- **Kasir:** `kasir@pelaris.id` / `password123`

---

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing/Login page
│   ├── dashboard/           # Dashboard pages
│   ├── pos/                 # Point of Sale
│   ├── products/            # Product management
│   ├── transactions/        # Transaction history
│   ├── stock/               # Stock management
│   ├── returns/             # Returns & exchanges
│   ├── cabang/              # Branch management
│   ├── users/               # User management
│   ├── settings/            # Settings
│   └── globals.css          # Global styles
│
├── components/              # Reusable components
│   ├── ui/                  # UI components (Button, Input, etc)
│   ├── ErrorBoundary.tsx    # Error handling
│   ├── ProtectedRoute.tsx   # Auth guard
│   └── ...
│
├── contexts/                # React contexts
│   └── ThemeContext.tsx     # Dark/Light theme
│
├── hooks/                   # Custom React hooks
│   ├── useSocket.ts         # WebSocket hook
│   ├── useProductSocket.ts  # Product sync hook
│   ├── useMemoization.ts    # Performance hook
│   └── ...
│
├── lib/                     # Utilities
│   ├── api.ts               # API client (axios)
│   ├── auth.ts              # Auth utilities
│   ├── socket.ts            # Socket.io client
│   ├── logger.ts            # Frontend logger
│   ├── qz-print.ts          # Thermal printer
│   ├── validations.ts       # Zod schemas
│   └── ...
│
├── stores/                  # Zustand stores
│   ├── useUserStore.ts      # User state
│   ├── useCartStore.ts      # Shopping cart (POS)
│   ├── useProductStore.ts   # Products state
│   ├── useCabangStore.ts    # Branch state
│   ├── useStockStore.ts     # Stock state
│   └── ...
│
├── public/                  # Static assets
│   ├── images/
│   └── fonts/
│
└── .next/                   # Next.js build output
```

---

## Features

### 1. Dashboard

**Route:** `/dashboard`

Menampilkan overview bisnis:
- Total penjualan hari ini
- Jumlah transaksi
- Produk terlaris
- Low stock alerts
- Grafik penjualan (7 hari terakhir)
- Recent transactions

### 2. Point of Sale (POS)

**Route:** `/pos`

Interface kasir untuk transaksi:
- Product search (nama, SKU, barcode)
- Shopping cart dengan quantity control
- Multiple payment methods:
  - Cash
  - Transfer Bank
  - QRIS
  - Debit Card
- Split payment (kombinasi 2 metode)
- Thermal printer integration
- Auto-print receipt (optional)

**Catatan:** POS hanya accessible di Desktop/Tablet (blocked di mobile phone).

### 3. Product Management

**Route:** `/products`

CRUD produk dengan fitur:
- Create product dengan variants
- Edit product & variants
- Delete product (smart delete)
- Bulk delete (max 100 products)
- Import dari Excel
- Export ke Excel
- Download template Excel
- Image upload (max 10MB)
- Category filtering
- Search & pagination

### 4. Stock Management

**Route:** `/stock`

Manajemen inventory:
- **Stock Adjustment:** Tambah/kurangi stok
- **Stock Transfer:** Transfer antar cabang
- **Low Stock Alerts:** Produk dengan stok rendah
- **Stock Movement History:** Riwayat perubahan stok
- Real-time sync via WebSocket

### 5. Transaction History

**Route:** `/transactions`

Riwayat transaksi:
- List semua transaksi (pagination)
- Filter by date range
- Filter by cabang
- Filter by payment method
- View transaction detail
- Print ulang struk

### 6. Returns & Exchanges

**Route:** `/returns`

Manajemen retur barang:
- Create return request
- Approve/Reject returns
- Reasons: Cacat, Salah Barang, Kadaluarsa, dll
- Auto-adjust stock saat approve
- Print return receipt

### 7. Branch Management

**Route:** `/cabang`

Kelola cabang toko (Owner only):
- Add new branch
- Edit branch (nama, alamat, contact)
- Delete branch
- View branch details
- Assign users to branch

### 8. User Management

**Route:** `/users`

Kelola pengguna (Owner/Manager):
- Add user (Owner, Manager, Kasir)
- Edit user (role, cabang access)
- Delete user
- Reset password
- Multi-cabang access toggle

### 9. Settings

**Route:** `/settings`

Konfigurasi aplikasi:
- **Printer Settings:**
  - Printer name
  - Paper size (58mm/80mm)
  - Store info (nama, alamat, phone)
  - Footer text
  - Auto-print toggle
- **General Settings:**
  - Low stock threshold
  - Currency format
  - Timezone
- **Backup & Restore:**
  - Manual backup database
  - Download backup files
  - Restore from backup

---

## State Management

Menggunakan **Zustand** untuk global state management.

### Store List

| Store | File | Purpose |
|-------|------|---------|
| User Store | `useUserStore.ts` | Auth state, user profile |
| Cart Store | `useCartStore.ts` | Shopping cart (POS) |
| Checkout Store | `useCheckoutStore.ts` | Checkout flow (POS) |
| Product Store | `useProductStore.ts` | Products state |
| Category Store | `useCategoryStore.ts` | Categories state |
| Cabang Store | `useCabangStore.ts` | Branches state |
| Stock Store | `useStockStore.ts` | Stock management |
| Dashboard Store | `useDashboardStore.ts` | Dashboard stats |
| Returns Store | `useReturnsStore.ts` | Returns state |
| Transfer Store | `useTransferStore.ts` | Stock transfer state |

### Example Usage

```typescript
// In component
import { useCartStore } from '@/stores';

function POSPage() {
  const { items, addItem, removeItem, total } = useCartStore();
  
  return (
    <div>
      <h1>Cart Items: {items.length}</h1>
      <p>Total: Rp {total.toLocaleString()}</p>
    </div>
  );
}
```

### Real-time Sync

WebSocket connection via `useProductSocket` hook:

```typescript
import { useProductSocket } from '@/hooks/useProductSocket';

function ProductList() {
  const { refreshProducts } = useProductStore();
  
  useProductSocket({
    onProductCreated: () => refreshProducts(),
    onProductUpdated: () => refreshProducts(),
    onProductDeleted: () => refreshProducts(),
  });
  
  // Component render...
}
```

---

## Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Structure

```
frontend/
├── __tests__/               # Integration tests
├── components/*.test.tsx    # Component tests
├── stores/*.test.ts         # Store tests
├── hooks/*.test.ts          # Hook tests
└── lib/*.test.ts            # Utility tests
```

### Test Coverage

- **Components:** 85%+
- **Stores:** 90%+
- **Hooks:** 80%+
- **Utilities:** 95%+

**Total:** 346 tests passing

---

## Build & Deployment

### Production Build

```bash
npm run build
```

Output di folder `.next/`

### Run Production Server

```bash
npm start
```

### Docker Build

```bash
docker build -t pelaris-frontend -f Dockerfile .
docker run -d -p 3100:3100 pelaris-frontend
```

Lihat [../DEPLOYMENT.md](../DEPLOYMENT.md) untuk full deployment guide.

---

## Thermal Printer Setup

### Prerequisites

1. Install **QZ Tray** di komputer kasir:
   - Download: https://qz.io/download/
   - Install dan jalankan QZ Tray
   - Trust certificate saat diminta

2. Connect thermal printer via USB/Bluetooth

### Configuration

Di Settings (`/settings`):
1. Pilih printer name dari dropdown
2. Set paper size (58mm atau 80mm)
3. Isi store info (nama toko, alamat, phone)
4. Customize footer text
5. Enable auto-print (optional)

### Troubleshooting Printer

**Printer tidak terdetect:**
- Pastikan QZ Tray running (cek system tray)
- Restart browser
- Check printer connection

**Print gagal:**
- Cek printer power & kertas
- Verify printer name correct
- Test print dari QZ Tray

---

## Performance Optimization

### Implemented Optimizations

1. **Code Splitting:**
   - Dynamic imports untuk heavy components
   - Chart.js loaded on-demand
   
2. **Image Optimization:**
   - Next.js Image component
   - Lazy loading images
   
3. **Memoization:**
   - useMemo untuk expensive calculations
   - useCallback untuk stable functions
   
4. **Skeleton Loading:**
   - Immediate visual feedback
   - Better perceived performance
   
5. **API Caching:**
   - SWR untuk data fetching
   - Stale-while-revalidate strategy

### Performance Metrics (Lighthouse)

- **Performance:** 95+
- **Accessibility:** 100
- **Best Practices:** 100
- **SEO:** 100

---

## Troubleshooting

### Error: Cannot connect to API

**Solusi:**
1. Pastikan backend running di port 5100
2. Check `NEXT_PUBLIC_API_URL` di `.env.local`
3. Clear browser cache
4. Restart Next.js dev server

### Error: WebSocket connection failed

**Solusi:**
1. Backend harus support WebSocket (Socket.io)
2. Check firewall tidak block port
3. Verify Socket.io client version compatible

### Dark mode tidak work

**Solusi:**
1. Clear browser localStorage
2. Hard refresh (Ctrl+Shift+R)
3. Check browser support untuk prefers-color-scheme

### Build error: Module not found

**Solusi:**
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

---

## Scripts Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm start                # Run production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Code Quality
npm run typecheck        # TypeScript check
npm run lint             # ESLint
npm run lint:fix         # Auto-fix lint issues
```

---

## Support

- **Internal Documentation:** Lihat README di root project
- **UI/UX Issues:** Buat issue di project tracker
- **Bug Reports:** Include browser, OS, steps to reproduce

---

**Last Updated:** January 2026
