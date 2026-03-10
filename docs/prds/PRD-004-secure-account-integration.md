# PRD-004: Secure Investment Account Integration

### Parent: PRD-001 (Master)
### Version: 1.0
### Date: 2026-03-10

---

## 1. Objective

Allow users to securely connect and manage their real investment account data
within Brillontly using encrypted storage. No brokerage passwords are ever
stored in the application.

## 2. Security Architecture

### Principles
- **Zero Trust**: Never store brokerage login credentials
- **Encryption at Rest**: All sensitive financial data encrypted with AES-256-GCM
- **Environment Secrets**: Encryption keys stored as environment variables, never in code
- **Read-Only**: Even with third-party integrations, only read-only access
- **Minimal Data**: Only store what is needed (holdings, shares, cost basis)
- **No PII in Logs**: Never log account numbers, balances, or personal data

### What Gets Encrypted
- Account nicknames and identifiers
- Share quantities
- Cost basis amounts
- Account balances
- Any imported CSV data

### What Does NOT Get Encrypted (needed for API lookups)
- Ticker symbols (e.g., SPY, FXAIX)
- Asset types (e.g., ETF, crypto)
- Target allocations (percentages)

### Encryption Method
- Algorithm: AES-256-GCM (authenticated encryption)
- Key: 256-bit key from BRILLONTLY_ENCRYPTION_KEY env var
- IV: Unique random 12-byte IV per encryption operation
- Auth Tag: 16-byte authentication tag to prevent tampering
- Storage Format: base64(iv + authTag + ciphertext)

## 3. Integration Methods

### Method 1: Manual Entry (Phase 1 - Now)
- User inputs holdings manually via secure form
- Data encrypted before writing to database
- Decrypted only in memory when needed for calculations
- User can update shares/cost basis anytime

### Method 2: CSV Import (Phase 1 - Now)
- User exports CSV/statement from brokerage
- Upload to Brillontly (processed in memory, never stored as raw file)
- Parsed data encrypted and saved to database
- Supports: Fidelity, Schwab, Robinhood, Vanguard CSV formats

### Method 3: Snaptrade Integration (Phase 2 - Future)
- Free tier allows limited account connections
- OAuth-based, user authorizes read-only access
- Snaptrade handles credential security
- Brillontly receives only holdings/balance data
- Auto-sync on configurable interval

### Method 4: Plaid Integration (Phase 3 - Future, Paid)
- Industry standard for financial account linking
- Bank-level security and compliance
- Requires paid plan for production

## 4. User Stories

### US-4.1: Manual Account Setup
**As a** user, **I want to** manually enter my investment holdings
**so that** I can see my real portfolio data on the dashboard.

**Acceptance Criteria:**
- Secure form to add/edit accounts (401k, Roth IRA, Taxable)
- For each holding: ticker, shares, cost basis per share
- Data encrypted before saving
- Dashboard updates with real values
- Clear visual confirmation that data is encrypted

### US-4.2: CSV Import
**As a** user, **I want to** upload a CSV export from my brokerage
**so that** I don't have to type everything manually.

**Acceptance Criteria:**
- File upload accepts .csv files only
- Auto-detect brokerage format (Fidelity, Schwab, Robinhood, Vanguard)
- Preview parsed data before saving
- Raw CSV never persisted to disk or database
- Parsed holdings encrypted and saved

### US-4.3: Data Security Visibility
**As a** user, **I want to** see that my data is encrypted
**so that** I feel confident using the platform.

**Acceptance Criteria:**
- Lock icon and "Encrypted" badge on account cards
- Security info page explaining how data is protected
- Ability to delete all account data with one click

## 5. Database Schema Updates

```sql
-- Encrypted user accounts
encrypted_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  encrypted_data TEXT,    -- AES-256-GCM encrypted JSON blob
  account_type TEXT,      -- "401k", "roth_ira", "taxable" (not sensitive)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- The encrypted_data JSON blob contains:
-- {
--   name: "My 401k",
--   holdings: [
--     { ticker: "FXAIX", shares: 100, costBasis: 170 },
--     ...
--   ]
-- }
```

## 6. CSV Format Support

### Fidelity
```csv
Account Number,Account Name,Symbol,Description,Quantity,Last Price,Current Value
```

### Schwab
```csv
Symbol,Name,Quantity,Price,Market Value,Cost Basis
```

### Robinhood
```csv
Instrument,Quantity,Average Cost,Equity
```

### Vanguard
```csv
Account Number,Investment Name,Symbol,Shares,Share Price,Total Value
```

## 7. API Endpoints

```
POST   /api/v1/accounts              - Create encrypted account
GET    /api/v1/accounts              - List accounts (decrypted in memory)
PUT    /api/v1/accounts/:id          - Update account
DELETE /api/v1/accounts/:id          - Delete account
POST   /api/v1/accounts/import-csv   - Import from CSV
DELETE /api/v1/accounts/all          - Delete all data (nuclear option)
```

## 8. Security Checklist

- [ ] AES-256-GCM encryption for all sensitive data
- [ ] Encryption key in environment variable only
- [ ] Unique IV per encryption operation
- [ ] No sensitive data in server logs
- [ ] No raw CSV files persisted
- [ ] HTTPS enforced (Vercel default)
- [ ] Data deletion endpoint working
- [ ] No brokerage credentials ever stored
- [ ] Input validation on all forms
- [ ] XSS protection on displayed data
