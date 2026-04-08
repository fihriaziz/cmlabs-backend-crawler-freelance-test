const express = require('express');
const { crawl } = require('./crawler');
const path = require('path');
const fs = require('fs').promises;

const app = express();
app.use(express.json());

app.post('/crawl', async (req, res) => {
  const { url, waitForSelector, extraDelay, renderType, fixAssets } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  const filename = `${url.replace(/[^a-z0-9]/gi, '_')}.html`;
  const filePath = path.join(__dirname, 'results', filename);
  try {
    const options = {
      waitForSelector: waitForSelector || null,
      extraDelay: extraDelay || 3000,
      renderType: renderType || 'auto',
      fixAssets: fixAssets !== false
    };
    await crawl(url, filePath, options);
    res.json({ 
      message: 'success', 
      file: filePath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/crawl', async (req, res) => {
  const targets = [
    'https://cmlabs.co',
    'https://sequence.day',
    'https://fihriaziz.netlify.app'
  ];
  const results = [];
  for (const url of targets) {
    const filename = `${url.replace(/[^a-z0-9]/gi, '_')}.html`;
    const filePath = path.join(__dirname, 'results', filename);
    try {
      const options = {
        extraDelay: 3000,
        fixAssets: true
      };
      await crawl(url, filePath, options);
      results.push({ 
        url, 
        status: 'success', 
        file: filePath,
      });
    } catch (err) {
      results.push({ url, status: 'error', error: err.message });
    }
  }
  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Crawler API running on http://localhost:${PORT}`);
});