# Panduan Crawler API - SPA, SSR, dan PWA

## Fitur Utama

Crawler mendukung:
- **SPA (Single Page Application)** - Vue.js, React, Angular, dll
- **SSR (Server-Side Rendering)** - Next.js, Nuxt.js, dll
- **PWA (Progressive Web App)** - Web apps dengan Service Workers
- **Auto-detect** - Deteksi otomatis tipe website

## Instalasi Dependencies

```bash
npm install
```

Memastikan `puppeteer` sudah terinstall (sudah ada di package.json).

## Cara Penggunaan

### 1. POST Request - Crawl Single URL

**Basic (Auto-detect):**
```bash
curl -X POST http://localhost:3000/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'
```

**Untuk SPA dengan JS yang kompleks:**
```bash
curl -X POST http://localhost:3000/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "renderType": "spa",
    "extraDelay": 5000,
    "waitForSelector": ".content-loaded"
  }'
```

**Untuk SSR:**
```bash
curl -X POST http://localhost:3000/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "renderType": "ssr",
    "extraDelay": 2000
  }'
```

**Untuk PWA:**
```bash
curl -X POST http://localhost:3000/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "renderType": "pwa",
    "extraDelay": 4000
  }'
```

### 2. GET Request - Crawl Multiple URLs

```bash
curl http://localhost:3000/crawl
```

Crawl semua URL yang didefinisikan di `server.js`.

## Parameter Penjelasan

| Parameter | Tipe | Default | Penjelasan |
|-----------|------|---------|-----------|
| `url` | string | - | URL website yang akan dicrawl **(required)** |
| `renderType` | string | 'auto' | Tipe rendering: `auto`, `spa`, `ssr`, `pwa` |
| `extraDelay` | number | 3000 | Delay tambahan (ms) untuk JS rendering |
| `waitForSelector` | string | null | CSS selector untuk menunggu elemen tertentu |

## Contoh Use Case

### Crawl React SPA
```javascript
{
  "url": "https://my-react-app.com",
  "renderType": "spa",
  "extraDelay": 5000,
  "waitForSelector": ".main-content"
}
```

### Crawl Vue.js dengan API async
```javascript
{
  "url": "https://my-vue-app.com",
  "renderType": "spa",
  "extraDelay": 6000,
  "waitForSelector": "[data-loaded='true']"
}
```

### Crawl Next.js (SSR)
```javascript
{
  "url": "https://my-nextjs-app.com",
  "renderType": "ssr",
  "extraDelay": 2000
}
```

### Crawl PWA
```javascript
{
  "url": "https://my-pwa-app.com",
  "renderType": "pwa",
  "extraDelay": 4000
}
```
## Response Format

```json
{
  "message": "success",
  "file": "/Users/aziz/Desktop/Code/crawler-api/results/https___example_com.html"
}
```

Atau error:
```json
{
  "error": "Error message"
}
```

## Debugging

Lihat console output saat crawl berjalan:
```
[SPA] Menunggu JavaScript rendering untuk: https://example.com
[SPA] Menunggu selector: .content-loaded
[Render] Delay tambahan: 5000ms
✓ Berhasil crawl: https://example.com
  - Judul: My App
  - URL akhir: https://example.com
  - Ukuran: 125430 bytes
```

## Hasil Crawl

Hasil HTML disimpan di folder `results/` dengan format nama:
`https___example_com.html` → `https://example.com`

## Troubleshooting

### Output HTML terlalu kecil (< 1KB)
**Solusi**: Naikkan `extraDelay` atau tambahkan `waitForSelector`

### Timeout error
**Solusi**: Naikkan delay atau periksa apakah website online

### Selector tidak ditemukan
**Solusi**: Gunakan DevTools untuk cari selector yang tepat

## Teknologi yang Didukung

### SPA Frameworks
- ✅ React (Next.js tanpa static generation)
- ✅ Vue.js (Nuxt.js tanpa static generation)
- ✅ Angular
- ✅ Svelte
- ✅ Ember.js

### SSR Frameworks
- ✅ Next.js (ISR, SSR mode)
- ✅ Nuxt.js (SSR mode)
- ✅ SvelteKit (SSR mode)
- ✅ Remix
- ✅ Astro

### PWA Features
- ✅ Service Workers
- ✅ Offline support
- ✅ Web App Manifest
- ✅ Push Notifications

## Catatan Penting

1. **Puppeteer menggunakan Chromium** - Memastikan JavaScript engine modern
2. **Headless mode** - Tidak perlu UI, lebih cepat
3. **networkidle2** - Menunggu hingga hanya 2 connection active atau less
4. **Real User Agent** - Diatur agar server tidak detect bot
