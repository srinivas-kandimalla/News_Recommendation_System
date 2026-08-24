# Nexora Frontend Browser-Level QA Report

**Date**: August 24, 2026  
**Canonical Frontend**: `frontend/`  
**Test Suite Status**: **PASS**

---

## 1. Browser & Environment Setup

| Metric / Layer | Specification |
|---|---|
| **Browser Execution** | Chrome Headless Automation Subagent |
| **Backend API** | Flask 3.1.3 (Python 3.10, PyTorch, `sentence-transformers/all-MiniLM-L6-v2`) |
| **Database** | MongoDB Server (v7.0) on `mongodb://localhost:27017` |
| **Frontend Server** | Vite 8.2 + React 19 + Material-UI 9.2 + React Router 7.1 on `http://localhost:5173` |
| **Test Environment** | Windows 11 Workspace (`d:\News_Recommendation_System`) |

---

## 2. Desktop QA (1920x1080 & 1440x900)

| Section / Component | Visual & Interactive Inspection Results | Status |
|---|---|---|
| **Navbar** | Brand logo ("Nexora"), search field (⌘K trigger), navigation links (*Home*, *Trending*, *AI For You*, *Bookmarks*, *Analytics*), category dropdown, notifications badge (3 unread), dark mode toggle, profile avatar/menu. | **PASS** |
| **Hero Section** | AI Curated Intelligence banner, search input, stat metric cards (1,250+ Articles Today, 24/7 Live Updates, 98% AI Match Accuracy), hero graphic card. | **PASS** |
| **Categories Bar** | Interactive category chips (*All*, *Technology*, *Business*, *World*, *Sports*, *Entertainment*, *Health*, *Science*). Click triggers real-time news filter. | **PASS** |
| **News Grid** | Featured article card + multi-column grid of news cards with images, category tags, author/source badges, published relative time, click-to-read triggers. | **PASS** |
| **Article Details** | Full article layout with main headline, category badge, author & source attributes, formatted text content, Like/Dislike controls, Bookmark toggle, and Related Articles. | **PASS** |
| **Bookmarks Page** | Filtered view of user-saved articles with single-click bookmark removal and direct read navigation. | **PASS** |
| **AI For You** | Personalized recommendation feed displaying AI match confidence %, explicit reasoning cards (*"Recommended because you frequently read Technology news"*), score breakdown toggles, and user interest distribution charts. | **PASS** |
| **Analytics Dashboard**| Live user engagement metrics (Articles Read count, Bookmarks count, Favorite Category, Favorite Author, Likes vs Dislikes breakdown). | **PASS** |
| **Footer** | Copyright notices, platform tech stack indicators (*Flask • React • MongoDB • Sentence Transformers*), legal & navigation links. | **PASS** |

---

## 3. Mobile QA (390x844 & 768x1024)

| Viewport | Inspection Items | Findings | Status |
|---|---|---|---|
| **390x844** (Mobile Portrait) | Overflow, Navbar drawer, Cards, Buttons | Zero horizontal page scrolling. Top navbar collapses inline elements into a hamburger menu. Tapping hamburger opens right-side navigation drawer. Cards stack vertically. Touch targets exceed 44px min height. | **PASS** |
| **768x1024** (Tablet Portrait) | Grid responsiveness, Typography, Menu | Two-column responsive card grid layout. Category pills scroll smoothly horizontally. Full navbar remains visible with optimized spacing. | **PASS** |

---

## 4. Real Functionality & User Journeys

### User A Journey (Technology Focus)
1. **Registration**: Created account `User Alpha` (`usera_qa_2026@example.com`).
2. **Engagement**: Selected **Technology** category chip, read article *"GPT-5.6 vs Gemini 3.7 Flash vs Grok 4.6: 7x Price Gap [2026]"*.
3. **Interactions**: Executed **Like** and **Bookmark** operations.
4. **Bookmarks Verification**: Verified article saved to `/bookmarks`.
5. **Personalization Verification**: Navigated to `/recommendations`. AI personalization model updated interest profile to **68% Technology**, recommending frontier AI stories with reasoning *"Recommended because you frequently read Technology news."*

### User B Journey (Sports Focus)
1. **Registration**: Logged out User A and created account `User Beta` (`userb_qa_2026@example.com`).
2. **Engagement**: Filtered by **Sports** category, read article *"FIFA vice-president Sandor Csanyi withdraws support..."*.
3. **Interactions**: Executed **Like** operation.
4. **Personalization Verification**: Navigated to `/recommendations`. AI engine dynamically prioritized Sports content (*"Multiple first-year NFL players win TRO..."*, *"Philadelphia Union vs Inter Miami..."*) with reasoning *"Recommended because you frequently read Sports news."*

---

## 5. Personalization Engine Audit

| Metric | User Alpha (Tech) | User Beta (Sports) | Divergence Confirmed? |
|---|---|---|---|
| **Primary Category** | Technology (68%) | Sports (60%) | **YES** |
| **Top 1 Recommendation** | AI / Quantum Computing | NFL / Football | **YES** |
| **Reason Code** | `interest_similarity_tech` | `interest_similarity_sports` | **YES** |

---

## 6. Authentication & Security Testing

| Test Case | Scenario | Expected Outcome | Actual Outcome | Status |
|---|---|---|---|---|
| **Protected Route** | Navigate to `/recommendations` without auth token | Redirect to `/login` | Redirected to `/login` | **PASS** |
| **Protected Route** | Navigate to `/bookmarks` without auth token | Redirect to `/login` | Redirected to `/login` | **PASS** |
| **Invalid JWT** | Header `Authorization: Bearer invalid.jwt.token` | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| **State Persistence** | Browser refresh on `/recommendations` while logged in | Auth state retained from `localStorage` | User remained logged in | **PASS** |

---

## 7. Negative & Edge Case Testing

| Test Case | Direct Action | Behavior Observed | Status |
|---|---|---|---|
| **404 Route** | Navigate to `/nonexistent` | Clean **Page Not Found** view rendered with "Back to Home" button. | **PASS** |
| **Invalid Article ID** | Navigate to `/news/000000000000000000000000` | Rendered clean **News item not found** fallback state. | **PASS** |
| **Malformed Article ID** | API GET `/reading-history/invalid_id` | HTTP 400 Bad Request error returned cleanly. | **PASS** |
| **Back/Forward Nav** | Browser Back/Forward buttons during deep navigation | Page state and router location updated accurately without console errors. | **PASS** |

---

## 8. Bugs Discovered & Fixes Applied

### Bug 1: Legacy Brand String Inconsistency
- **Severity**: LOW
- **Description**: Frontend Navbar brand title and default fallback strings referenced legacy placeholder `"NewsPulse"` instead of canonical brand name `"Nexora"`.
- **Files Modified**:
  1. [index.html](file:///d:/News_Recommendation_System/frontend/index.html) (`<title>` tag)
  2. [Navbar.jsx](file:///d:/News_Recommendation_System/frontend/src/components/Navbar/Navbar.jsx) (Brand typography)
  3. [MobileDrawer.jsx](file:///d:/News_Recommendation_System/frontend/src/components/Navbar/MobileDrawer.jsx) (Drawer title typography)
  4. [Home.jsx](file:///d:/News_Recommendation_System/frontend/src/pages/Home.jsx) (Fallback source text)
  5. [NewsCard.jsx](file:///d:/News_Recommendation_System/frontend/src/components/common/NewsCard.jsx) (Fallback source text)
- **Fix Policy Adherence**: Changed only minimal UI presentation strings in `frontend/`. No backend algorithms, MIND dataset evaluation files, or benchmark assets were touched.

---

## 9. Backend Regression Verification

Following UI brand adjustments, the full backend regression suite was executed:

```bash
python backend/scripts/run_all_tests.py
```

### Output Summary
```
Ran 29 tests in 22.468s
OK

BACKEND VERIFICATION
====================
Security             PASS
Performance          PASS
News Fetch           PASS
Scheduler            PASS
Embeddings           PASS
Cold Start           PASS
Personalization      PASS
Reading History      PASS
Bookmarks            PASS
Reactions            PASS
Analytics            PASS
Trending             PASS
RBAC                 PASS
Cleanup              PASS

TOTAL: 29
PASSED: 29
FAILED: 0
DEV DB POLLUTION: ZERO (Clean)
```

---

## 10. Remaining Issues & Final Verdict

- **Remaining Issues**: None.
- **Final Verdict**: **PASS**

*The canonical Nexora frontend (`frontend/`) has passed end-to-end browser QA across desktop and mobile viewports, full auth cycles, personalization engine validation, edge-case failure modes, and backend regression verification.*
