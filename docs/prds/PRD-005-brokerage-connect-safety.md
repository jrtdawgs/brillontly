# PRD-005: Brokerage Connect Safety Fixes

**Status:** In Progress
**Date:** 2026-03-11
**Author:** Josh Torres
**Implemented by:** Claude Sonnet 4.6

---

## Problem

User wants to connect Fidelity and Robinhood via SnapTrade but previously the site crashed during brokerage connection. Before testing live, audit and fix all crash points.

## Bugs Found

### Bug 1 (Critical): `redirectUri` not passed to SnapTrade OAuth
- `getConnectionLink()` in `snaptrade.ts` does not pass `redirectUri` to the SDK
- The connect route passes it as a 3rd argument but the function ignores it
- Result: after OAuth completes, SnapTrade redirects to its own default URL, not back to `/accounts?connected=true`
- The `connected=true` handler never fires → the app thinks it failed

### Bug 2 (Crash Risk): `price.toFixed()` / `openPnl.toFixed()` on non-numbers
- SnapTrade API can return numeric fields as strings or null
- `h.price.toFixed(2)` will throw `TypeError: h.price.toFixed is not a function` if SnapTrade returns `"12.34"` (string)
- Fix: use `Number(h.price).toFixed(2)` with null guards

## Out of Scope
- Robinhood: not enabled on Josh's API keys (Fidelity, Chase, Wells Fargo, Empower only). No crash — just won't appear in SnapTrade portal.
- DB functions: solid, encrypted, no issues found.

## Changes

### `src/lib/brokerage/snaptrade.ts`
- Update `getConnectionLink()` to accept optional `redirectUri` parameter and pass it to the SDK

### `src/app/(app)/accounts/page.tsx`
- Wrap `price` and `openPnl` in `Number()` before calling `.toFixed()`
