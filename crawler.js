const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

async function downloadAsset(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const request = protocol.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.setEncoding('binary');
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(null));
    request.end();
  });
}

async function embedStyleSheets(html, baseUrl) {
  const urlObj = new URL(baseUrl);
  const baseOrigin = urlObj.origin;
  const basePath = urlObj.pathname.replace(/\/$/, '');

  const styleRegex = /<link[^>]*?rel=["']stylesheet["'][^>]*?href=["']([^"']+)["'][^>]*?>/gi;
  let match;

  while ((match = styleRegex.exec(html)) !== null) {
    const href = match[1];
    let absoluteUrl = href;

    if (!href.startsWith('http') && !href.startsWith('data:')) {
      absoluteUrl = href.startsWith('/') ? `${baseOrigin}${href}` : `${baseOrigin}${basePath}/${href}`;
    }

    try {
      const cssContent = await downloadAsset(absoluteUrl);
      if (cssContent) {
        const styleTag = `<style>${cssContent}</style>`;
        html = html.replace(match[0], styleTag);
      }
    } catch (e) {
      console.warn(`Gagal download CSS: ${absoluteUrl}`);
    }
  }

  return html;
}

function fixResourcePaths(html, baseUrl) {
  const urlObj = new URL(baseUrl);
  const baseOrigin = urlObj.origin;
  const basePath = urlObj.pathname.replace(/\/$/, '');


  html = html.replace(/href=["'](?!(?:https?:|\/|#|mailto:|data:))([^"']+)["']/g, (match, url) => {
    const absoluteUrl = url.startsWith('/') ? `${baseOrigin}${url}` : `${baseOrigin}${basePath}/${url}`;
    return `href="${absoluteUrl}"`;
  });


  html = html.replace(/src=["'](?!(?:https?:|\/|#|data:))([^"']+)["']/g, (match, url) => {
    const absoluteUrl = url.startsWith('/') ? `${baseOrigin}${url}` : `${baseOrigin}${basePath}/${url}`;
    return `src="${absoluteUrl}"`;
  });


  html = html.replace(/<img([^>]*?)src=["'](?!(?:https?:|\/|#|data:))([^"']+)["']/g, (match, attrs, url) => {
    const absoluteUrl = url.startsWith('/') ? `${baseOrigin}${url}` : `${baseOrigin}${basePath}/${url}`;
    return `<img${attrs}src="${absoluteUrl}"`;
  });


  html = html.replace(/url\(["']?(?!(?:https?:|\/|#|data:))([^"')]+)["']?\)/g, (match, url) => {
    const absoluteUrl = url.startsWith('/') ? `${baseOrigin}${url}` : `${baseOrigin}${basePath}/${url}`;
    return `url('${absoluteUrl}')`;
  });


  html = html.replace(/action=["'](?!(?:https?:|\/|#|javascript:))([^"']+)["']/g, (match, url) => {
    const absoluteUrl = url.startsWith('/') ? `${baseOrigin}${url}` : `${baseOrigin}${basePath}/${url}`;
    return `action="${absoluteUrl}"`;
  });


  html = html.replace(/<a([^>]*?)href=["'](?!(?:https?:|\/|#|mailto:|javascript:))([^"']+)["']/g, (match, attrs, url) => {
    const absoluteUrl = url.startsWith('/') ? `${baseOrigin}${url}` : `${baseOrigin}${basePath}/${url}`;
    return `<a${attrs}href="${absoluteUrl}"`;
  });

  return html;
}

async function crawl(url, outputPath, options = {}) {
  const {
    waitForSelector = null,
    extraDelay = 3000,
    renderType = 'auto',
    fixAssets = true
  } = options;

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    if (renderType === 'auto' || renderType === 'spa') {
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
      } catch (e) {
      }
    }

    if (waitForSelector) {
      try {
        await page.waitForSelector(waitForSelector, { timeout: 15000 });
      } catch (e) {
        console.warn(`Selector ${waitForSelector} tidak ditemukan`);
      }
    }

    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));

    await page.evaluate(() => {
      if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0';
        document.head.appendChild(meta);
      }
    });

    let html = await page.content();

    if (fixAssets) {
      console.log(`[Assets] Mendownload stylesheet...`);
      html = await embedStyleSheets(html, page.url());
      
      console.log(`[Assets] Memperbaiki resource paths...`);
      html = fixResourcePaths(html, page.url());
      
      html = html.replace('</head>', `<base href="${page.url()}"></base></head>`);
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await fs.writeFile(outputPath, html, 'utf-8');
    
    const pageTitle = await page.title();
    const pageUrl = page.url();
    const fileSize = Buffer.byteLength(html);
    
    console.log(`✓ Berhasil crawl: ${url}`);
    console.log(`  - Judul: ${pageTitle}`);
    console.log(`  - URL akhir: ${pageUrl}`);
    console.log(`  - Ukuran: ${fileSize} bytes`);
    
    return html;
  } catch (err) {
    console.error(`✗ Gagal crawl: ${url}`, err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = { crawl };