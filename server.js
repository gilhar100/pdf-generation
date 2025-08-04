const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS middleware (general)
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// ✅ Manual headers for all requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://preview--admin-page.lovable.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ✅ Manual preflight handler
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "https://preview--admin-page.lovable.app");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

app.post('/generate-pdf', async (req, res) => {
  const { html } = req.body;
  if (!html) return res.status(400).send('Missing HTML content');

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape: false,
    });

    await browser.close();

    // ✅ Explicitly set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="report.pdf"',
      'Access-Control-Allow-Origin': 'https://preview--admin-page.lovable.app'
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error('[PDF ERROR]', err);
    res.status(500).send('Failed to generate PDF');
  }
});

app.get('/', (req, res) => {
  res.send('PDF Generator API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
