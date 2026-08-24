# FRONTEND UI / UX AUDIT REPORT

**Target Frontend**: `frontend/` (React 19 + Vite + Material-UI)  
**Date**: 2026-08-23  

---

## 1. COMPONENT & ARCHITECTURE AUDIT

| Feature / Module | Current State | Problem Identified | Proposed Improvement | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **Component Cleanup** | Duplicate components in `src/components/` and `src/components/common/` | `src/components/NewsCard.jsx` and `Navbar.jsx` exist in root components folder alongside `common/` versions | Remove redundant root component files; consolidate imports to `src/components/common/` and `src/components/Navbar/` | **HIGH** |
| **Theme System** | Material-UI theme configured in `src/theme/theme.js` | Colors, shadows, and typography exist in separate files without unified dark/light support | Consolidate `createAppTheme()` with glassmorphism tokens, custom palette, and consistent typography | **MEDIUM** |
| **Home Page (`Home.jsx`)** | Hero, Category bar, Featured horizontal card, News grid, Sidebar widgets | Search input was not bound to immediate keyboard clear/submit in hero | Bind Hero search input directly to `handleSearch` and sync with URL `?search=` parameter | **MEDIUM** |
| **For You / Recommendations (`Recommendations.jsx`)** | Personalized news list with hybrid score badges and explanation cards | Card click navigation needed explicit event propagation safety | Ensure recommendation cards trigger article view and record reading history seamlessly | **HIGH** |
| **Article Details (`NewsDetails.jsx`)** | Content display, like, bookmark, and related articles | Reading history call should execute automatically on page mount with authentication check | Trigger `recordReadingHistory(id, token)` automatically on mount, update local reading state, and render related recommendations | **HIGH** |
| **Bookmarks Page (`Bookmarks.jsx`)** | Saved news list with remove action | Empty state lacked direct navigation button to browse news | Add call-to-action button to navigate to news feed when bookmarks are empty | **MEDIUM** |
| **Search & Categories** | `CategoryBar.jsx` & `SearchInput.jsx` | Category selection filtered in-memory but search parameter sync needed refinement | Ensure URL search params `?category=` and `?search=` stay in sync with search bar | **MEDIUM** |
| **Mobile Responsiveness** | Responsive grid with MUI breakpoints (`xs`, `sm`, `md`, `lg`) | Mobile drawer required clear nav icons for all routes | Ensure `MobileDrawer.jsx` includes Home, For You, Bookmarks, Analytics, and Admin links | **MEDIUM** |

---

## 2. DESIGN SYSTEM TOKENS

- **Primary Color**: `#2563EB` (Vibrant Tech Blue)
- **Secondary Color**: `#7C3AED` (Deep AI Purple)
- **Success Color**: `#10B981` (Emerald Green)
- **Background Color**: `#F8FAFC` (Slate Light) / Dark Mode Support
- **Typography**: Inter / Roboto font family with 800-weight headings and 400/600-weight body.
- **Card Border Radius**: `16px` (`theme.shape.borderRadius * 2`)
- **Card Shadow**: Subtle elevation (`0 4px 20px rgba(0,0,0,0.06)`) with hover elevation.
