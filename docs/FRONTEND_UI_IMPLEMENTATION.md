# Nexora — Frontend UI Implementation

## Design System

### Typography
| Role | Font | Weight | Usage |
|---|---|---|---|
| Headlines | Playfair Display | 700–800 | Featured cards, article titles, page headers |
| Body / UI | Inter | 400–600 | Navigation, metadata, body text, buttons |

Loaded via Google Fonts CDN in `index.html`.

### Color Palette

**Light Mode**
| Token | Value | Usage |
|---|---|---|
| `background.default` | `#F6F6F4` | Page canvas (warm off-white) |
| `background.paper` | `#FFFFFF` | Cards, panels, navbar |
| `primary.main` | `#1A1A1A` | Primary text, actions |
| `accent.main` | `#C0392B` | Active category indicator, overline labels |
| `text.primary` | `#111111` | Headlines |
| `text.secondary` | `#6B7280` | Metadata, captions |
| `divider` | `#E5E5E5` | Borders, separators |

**Dark Mode**
| Token | Value |
|---|---|
| `background.default` | `#0D0D0D` |
| `background.paper` | `#1A1A1A` |
| `text.primary` | `#F0F0F0` |
| `text.secondary` | `#9CA3AF` |
| `divider` | `#2A2A2A` |

### Accent Color Rule
`#C0392B` is used **only** for:
- Active category tab indicator (2px underline)
- Category overline labels on cards
- Liked article heart icon

The interface is **not red**. No gradient banners, no AI stat blocks.

### Layout
- Max content width: `1280px` (editorial column)
- Card `border-radius`: `4px` (tight editorial)
- Card `box-shadow`: none — only `border: 1px solid divider`
- Hover: subtle background color shift, no elevation change

---

## Component Architecture

### `NewsCard.jsx` — Three Variants

| Variant | Used in | Description |
|---|---|---|
| `featured` | Home (Today's Focus) | Large 16:9 image, Playfair Display headline, excerpt, meta, actions |
| `standard` | Home grid, Discover, Recommendations, Bookmarks | 16:9 image, category overline, 3-line headline, bookmark icon |
| `compact` | Trending sidebar, Trending page | No image, rank number, headline, source/date, bookmark |

### `CategoryBar.jsx`
- Tab underline style (Google News–inspired)
- Active category: `2px solid #C0392B` border-bottom
- Scrollable on mobile, no visible scrollbar
- No pill buttons

### `NewsCardSkeleton.jsx`
- Matching skeleton for each of the 3 card variants
- Shown while data loads

---

## Page Layouts

### Home (`/`)
```
[Greeting: "Good afternoon, Srinivas"]
[News that understands what matters to you.]

8-column main                    | 4-column sidebar
─────────────────────────────────|──────────────────
TODAY'S FOCUS label              | TRENDING TODAY
Featured article (featured card) | 01 Headline · Source
                                 | 02 Headline · Source
──────────────────────────────── | 03 Headline · Source
[CategoryBar — underline tabs]   | 04 Headline · Source
                                 | 05 Headline · Source
LATEST STORIES label             |──────────────────
[3-col grid of standard cards]   | [Discover promo box]
```

- Greeting uses real user name from JWT decode if authenticated
- Featured article = first result from `GET /news?page=1&limit=30`
- Trending sidebar = `GET /trending`, falls back to news[1–5] if empty
- Category filter is real client-side filter on loaded news
- All news is real backend data

### Discover (`/discover`)
- 2-column editorial story grid
- Same category tabs bar
- Real `GET /news?page=1&limit=30`

### For You (`/recommendations`)
- Requires auth (ProtectedRoute)
- Calls real `GET /personalized-recommendations`
- 2-col card grid with `item.reason` displayed in italics below headline
- Right sidebar: real `GET /analytics` — shows reading stats bar charts (category %)
- No fake scores, no AI formula display

### Trending (`/trending`)
- Pure editorial ranked list, no card grid
- Numbered 01–N using compact card variant
- Real `GET /trending`

### Article Reader (`/news/:id`)
- 720px centered reading column
- Playfair Display headline (h1), Inter body text
- `recordReadingHistory(news._id, token)` called on mount (automatically)
- Mobile: sticky bottom action bar (Like / Bookmark / Share)
- Desktop: inline actions

### Bookmarks (`/bookmarks`)
- 3-col editorial grid
- Real `GET /bookmarks`, `DELETE /bookmark/:id`
- Clean empty state with "Browse news" CTA

### Login / Register (`/login`, `/register`)
- Centered `400px` panel, flat border
- Nexora Playfair wordmark
- No hero graphics, no elevation

### Analytics (`/analytics`)
- Real `GET /analytics`
- KPI tiles (articles read, bookmarks, likes, favourite category)
- Restyled Doughnut chart for likes/dislikes

### Admin Dashboard (`/admin`)
- Real `GET /admin/dashboard`
- 4 KPI tiles + Pie chart + top category

---

## API Integration

All existing service functions preserved **exactly** — zero changes:

```
getAllNews()              → GET /news
searchNews()             → GET /news/search
getTrendingNews()        → GET /trending
getPersonalizedRecommendations() → GET /personalized-recommendations
bookmarkNews()           → POST /bookmark/:id
getBookmarks()           → GET /bookmarks
removeBookmark()         → DELETE /bookmark/:id
likeNews()               → POST /like/:id
dislikeNews()            → POST /dislike/:id
getAnalytics()           → GET /analytics
getAdminDashboard()      → GET /admin/dashboard
recordReadingHistory()   → POST /reading-history/:id
loginUser()              → POST /login
registerUser()           → POST /register
```

Auth: JWT stored in `localStorage`, decoded with `jwt-decode` for `{ id, name, email, role }`.

Protected routes: `/recommendations`, `/analytics`, `/bookmarks`, `/admin`.

---

## Responsive Behavior

| Breakpoint | Layout |
|---|---|
| Desktop `≥960px` | 8/4 column editorial split, 3-col news grid |
| Tablet `600–959px` | 2-col news grid, sidebar collapses below content |
| Mobile `<600px` | Single column, hamburger nav drawer, article sticky action bar |

---

## Build Verification

```bash
cd D:\News_Recommendation_System\frontend
npm run build
# ✅ 0 errors, 1008 modules transformed
```

## Backend Test Verification

```bash
cd D:\News_Recommendation_System\backend
python scripts/run_all_tests.py
# ✅ TOTAL: 29 | PASSED: 29 | FAILED: 0
```
