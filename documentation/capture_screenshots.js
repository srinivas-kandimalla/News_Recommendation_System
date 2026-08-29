const { chromium } = require('d:/News_Recommendation_System/frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'd:\\News_Recommendation_System\\screenshots';
const BASE_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://127.0.0.1:5000';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Launching Chromium browser for screenshot capture...');
  const browser = await chromium.launch({ headless: true });

  // Helper to create page with fixed 1440x900 viewport
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // 1. Get an article ID for News Details page
  let sampleArticleId = null;
  try {
    const res = await page.request.get(`${BACKEND_URL}/news?page=1&limit=1`);
    if (res.ok()) {
      const data = await res.json();
      if (data.articles && data.articles.length > 0) {
        sampleArticleId = data.articles[0]._id;
      }
    }
  } catch (err) {
    console.error('Failed to fetch article for details page:', err.message);
  }

  // Helper for logging in via API
  async function loginAs(email, password) {
    const res = await page.request.post(`${BACKEND_URL}/login`, {
      data: { email, password },
    });
    if (res.ok()) {
      const data = await res.json();
      return data;
    }
    return null;
  }

  const userAuth = await loginAs('user@nexora.com', 'Password123!');
  const adminAuth = await loginAs('admin@nexora.com', 'Password123!');

  console.log('🔑 Authentication acquired:');
  console.log('  User Token:', userAuth ? 'Success' : 'Failed');
  console.log('  Admin Token:', adminAuth ? 'Success' : 'Failed');

  // Define screens to capture
  const screens = [
    {
      id: '01',
      name: 'Login',
      path: '/login',
      requiresAuth: false,
      isLoggedOut: true,
    },
    {
      id: '02',
      name: 'Register',
      path: '/register',
      requiresAuth: false,
      isLoggedOut: true,
    },
    {
      id: '03',
      name: 'Home_Feed',
      path: '/',
      requiresAuth: true,
      role: 'user',
    },
    {
      id: '04',
      name: 'Discover_Search',
      path: '/discover',
      requiresAuth: true,
      role: 'user',
    },
    {
      id: '05',
      name: 'Trending_News',
      path: '/trending',
      requiresAuth: true,
      role: 'user',
    },
    {
      id: '06',
      name: 'Recommendations',
      path: '/for-you',
      requiresAuth: true,
      role: 'user',
    },
    {
      id: '07',
      name: 'News_Details',
      path: sampleArticleId ? `/news/${sampleArticleId}` : '/',
      requiresAuth: true,
      role: 'user',
    },
    {
      id: '08',
      name: 'Bookmarks',
      path: '/bookmarks',
      requiresAuth: true,
      role: 'user',
    },
    {
      id: '09',
      name: 'Realtime_Analytics',
      path: '/analytics',
      requiresAuth: true,
      role: 'user',
    },
    {
      id: '10',
      name: 'Admin_Dashboard',
      path: '/admin',
      requiresAuth: true,
      role: 'admin',
    },
  ];

  const results = [];

  for (const screen of screens) {
    for (const themeMode of ['Light', 'Dark']) {
      const filename = `${screen.id}_${screen.name}_${themeMode}.png`;
      const targetPath = path.join(OUTPUT_DIR, filename);

      try {
        // Navigate to blank or base first to set localStorage
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

        // Set theme mode in localStorage
        await page.evaluate((theme) => {
          localStorage.setItem('nexora_theme_mode', theme.toLowerCase());
        }, themeMode);

        // Handle auth tokens in localStorage
        if (screen.isLoggedOut) {
          await page.evaluate(() => {
            localStorage.removeItem('nexora_token');
            localStorage.removeItem('nexora_user');
          });
        } else if (screen.requiresAuth) {
          const authData = screen.role === 'admin' ? adminAuth : userAuth;
          if (authData) {
            await page.evaluate((auth) => {
              localStorage.setItem('nexora_token', auth.token);
              localStorage.setItem('nexora_user', JSON.stringify(auth.user));
            }, authData);
          }
        }

        // Navigate to target route
        await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500); // Allow smooth transitions and layout settlement

        // Capture 1440x900 viewport screenshot
        await page.screenshot({
          path: targetPath,
          fullPage: false,
        });

        console.log(`✅ Saved: ${filename}`);
        results.push({
          screen: screen.name,
          filename,
          mode: themeMode,
          status: 'SUCCESS',
          path: targetPath,
        });
      } catch (err) {
        console.error(`❌ Failed ${filename}:`, err.message);
        results.push({
          screen: screen.name,
          filename,
          mode: themeMode,
          status: `FAILED: ${err.message}`,
        });
      }
    }
  }

  await browser.close();
  console.log('\n📸 All screenshots captured successfully!');
  console.log(JSON.stringify(results, null, 2));
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
