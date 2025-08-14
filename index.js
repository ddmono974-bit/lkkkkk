const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// تابع اصلی گرفتن دیتا
async function getInstaTrackData(username) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );

  // رفتن به صفحه اینستاگرام در instrack
  await page.goto(`https://instrack.app/instagram/${username}`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);

  const cookies = await page.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const xsrfToken = cookies.find(c => c.name === 'XSRF-TOKEN')?.value || '';

  // گرفتن دیتا از API داخلی instrack
  const apiResponse = await page.evaluate(
    async (url, headers) => {
      const res = await fetch(url, { method: 'GET', headers, credentials: 'include' });
      return await res.json();
    },
    `https://instrack.app/api/account/${username}`,
    {
      'authority': 'instrack.app',
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'referer': `https://instrack.app/instagram/${username}`,
      'sec-ch-ua': '"Chromium";v="115", "Google Chrome";v="115"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'x-xsrf-token': xsrfToken,
      'cookie': cookieHeader
    }
  );

  await browser.close();
  return apiResponse;
}

// مسیر API
app.get('/api/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const data = await getInstaTrackData(username);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// سرور گوش میده
app.listen(PORT, () => console.log(`Instrack API running on port ${PORT}`));
