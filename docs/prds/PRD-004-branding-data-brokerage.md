# PRD-004: Branding, Market Data, CSV Import & Brokerage Connect

**Status:** Deployed (partial — pending Vercel rate limit reset)
**Date:** 2026-03-11
**Author:** Josh Torres
**Implemented by:** Claude Sonnet 4.6

---

## Overview

Retroactive PRD covering all changes made on 2026-03-11. Four distinct areas of work:
1. Branding cleanup (B logo, favicon, meta description)
2. Market data source switch (Yahoo Finance → Finnhub)
3. CSV import improvements (auto account type detection)
4. SnapTrade brokerage connect (Fidelity, Chase, Wells Fargo, Empower)

---

## 1. Branding

### Problem
- Browser tab showed wrong/mismatched B logo (gator or default favicon)
- Meta description did not reflect Big Bull chatbot or pricing tiers
- GitHub repo was misspelled (`brillontly` → should be `brilliontly`)

### Changes
- Renamed GitHub repo: `jrtdawgs/brillontly` → `jrtdawgs/brilliontly`
- Updated git remote URL locally
- Added `brilliontly.vercel.app` as production domain in Vercel
- Removed `favicon.ico` from `src/app/` so browser uses the SVG B logo exclusively
- Updated `src/app/layout.tsx` meta description:
  > "Get access to Big Bull, a financial advisor chatbot with secure access to your financial data. Free tier includes CSV import. Paid tier will include a brokerage connect option."

### Files Changed
- `src/app/favicon.ico` — deleted
- `src/app/layout.tsx` — meta description updated
- `src/app/icon.tsx` — SVG B logo as favicon (green-to-cyan gradient)
- `public/brilliontly-icon.svg` — SVG B logo for favicon link tag

---

## 2. Market Data: Yahoo Finance → Finnhub

### Problem
- Yahoo Finance is an unofficial API that blocks cloud/serverless IPs (Vercel)
- Market signals and metrics were not updating on the live site

### Solution
- Switch to **Finnhub** (https://finnhub.io) — free tier, 60 req/min, designed for API access
- Requires `FINNHUB_API_KEY` env var (added to Vercel production)

### Files Changed
- `src/lib/market/finnhub.ts` — new Finnhub client (replaces yahoo.ts)
- `src/app/api/v1/market/live/route.ts` — updated to use Finnhub
- `src/app/api/v1/market/[ticker]/route.ts` — updated to use Finnhub

---

## 3. CSV Import — Auto Account Type Detection

### Problem
- CSV import had no way to distinguish 401k vs Roth IRA
- Required manual entry which user did not want

### Solution
- Auto-detect account type from CSV filename and column headers
- Keywords: "401k", "roth", "ira", "fidelity", "empower", "vanguard", etc.
- Split accounts correctly on import with no manual entry

### Files Changed
- `src/components/portfolio/CSVImport.tsx` — auto-detection logic
- `src/app/api/v1/portfolio/route.ts` — updated to handle typed accounts from CSV

---

## 4. SnapTrade Brokerage Connect

### Problem
- "Connect Brokerage" button existed in UI but wasn't wired to SnapTrade OAuth flow
- SnapTrade enabled Fidelity, Chase, Wells Fargo, and Empower for Josh's API keys on 2026-03-11

### Solution
- Wire up Connect Brokerage button to call `POST /api/v1/brokerage/connect`
- Launches SnapTrade OAuth portal for user to link their brokerage
- Returns `redirectUrl` + `userSecret` for subsequent holdings calls

### Supported Brokerages (enabled on this account)
- Fidelity
- Chase
- Wells Fargo
- Empower

### Files Changed
- `src/app/api/v1/brokerage/connect/route.ts` — SnapTrade register + redirect URL
- `src/app/api/v1/brokerage/holdings/route.ts` — fetch accounts + positions
- `src/lib/brokerage/snaptrade.ts` — SnapTrade SDK wrapper

---

## Deployment

- Committed and pushed to `jrtdawgs/brilliontly` (master branch)
- GitHub auto-deploy to `brilliontly.vercel.app`
- Blocked by Vercel 100 deployments/day free tier limit — resets ~3:59 PM EDT 2026-03-11
- `FINNHUB_API_KEY` added to Vercel production env vars by Josh

---

## Outstanding / Follow-up (PRD-005)
- Fix B logo rendering in browser tab (SVG vs cached favicon)
- Verify Finnhub live data loading on production after deploy
- Test SnapTrade OAuth flow end-to-end with Fidelity
- Consider Vercel Pro upgrade to avoid 100/day deploy limit
