'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Holding {
  ticker: string;
  name: string;
  shares: number;
  costBasis: number;
  targetAllocation: number;
  assetType: string;
}

interface AccountGroup {
  accountType: string;
  accountName: string;
  holdings: Holding[];
}

interface BrokerageHolding {
  accountId: string;
  accountName: string;
  ticker: string;
  name: string;
  units: number;
  price: number;
  averageCost: number;
  openPnl: number;
}

interface BrokerageAccount {
  id: string;
  name: string;
  number: string;
  institutionName: string;
  type: string;
}

const ACCOUNT_TYPE_OPTIONS = [
  { value: '401k', label: '401(k) → Retirement' },
  { value: 'roth_ira', label: 'Roth IRA → Retirement' },
  { value: 'traditional_ira', label: 'Traditional IRA → Retirement' },
  { value: 'hsa', label: 'HSA → Retirement' },
  { value: 'taxable', label: 'Taxable Brokerage → Investing & Day Trading' },
];

const FEEDS_LABEL: Record<string, string> = {
  '401k': 'Retirement',
  roth_ira: 'Retirement',
  traditional_ira: 'Retirement',
  hsa: 'Retirement',
  taxable: 'Investing & Day Trading',
};

function AccountsContent() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<{ id: string; accountType: string; name: string; holdings: Holding[] }[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importBrokerage, setImportBrokerage] = useState('');
  const [importedAccounts, setImportedAccounts] = useState<AccountGroup[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [brokerageConnected, setBrokerageConnected] = useState(false);
  const [brokerageAccounts, setBrokerageAccounts] = useState<BrokerageAccount[]>([]);
  const [brokerageHoldings, setBrokerageHoldings] = useState<BrokerageHolding[]>([]);
  const [loadingBrokerage, setLoadingBrokerage] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/v1/accounts');
      const data = await res.json();
      if (data.success) setAccounts(data.data);
    } catch { /* not logged in */ }
  };

  const fetchBrokerageStatus = useCallback(async () => {
    setLoadingBrokerage(true);
    try {
      const res = await fetch('/api/v1/brokerage/connect');
      const data = await res.json();
      if (data.success && data.connected) {
        setBrokerageConnected(true);
        setBrokerageAccounts(data.data?.accounts || []);
        setBrokerageHoldings(data.data?.holdings || []);
      } else {
        setBrokerageConnected(false);
      }
    } catch { /* ignore */ }
    setLoadingBrokerage(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchBrokerageStatus();
  }, [fetchBrokerageStatus]);

  // Handle return from SnapTrade OAuth
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setSuccess('Brokerage connected! Fetching your accounts...');
      fetchBrokerageStatus();
      // Clean up URL
      window.history.replaceState({}, '', '/accounts');
    }
  }, [searchParams, fetchBrokerageStatus]);

  const handleConnectBrokerage = async () => {
    setConnecting(true);
    setError('');
    try {
      const res = await fetch('/api/v1/brokerage/connect', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.redirectUrl) {
        window.location.href = data.data.redirectUrl;
      } else {
        setError(data.error || 'Failed to start brokerage connection');
        setConnecting(false);
      }
    } catch {
      setError('Failed to connect to brokerage');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your brokerage? Your CSV-imported accounts will remain.')) return;
    try {
      await fetch('/api/v1/brokerage/connect', { method: 'DELETE' });
      setBrokerageConnected(false);
      setBrokerageAccounts([]);
      setBrokerageHoldings([]);
      setSuccess('Brokerage disconnected.');
    } catch {
      setError('Failed to disconnect');
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const text = await file.text();
    try {
      const res = await fetch('/api/v1/accounts/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: text }),
      });
      const data = await res.json();
      if (data.success) {
        setImportedAccounts(data.data.accounts);
        setImportBrokerage(data.data.brokerage);
      } else {
        setError(data.errors?.join(', ') || 'Failed to parse CSV');
      }
    } catch {
      setError('Failed to process CSV file.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveAll = async () => {
    setError('');
    let saved = 0;
    for (const acct of importedAccounts) {
      try {
        const res = await fetch('/api/v1/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountType: acct.accountType, name: acct.accountName, holdings: acct.holdings }),
        });
        const data = await res.json();
        if (data.success) saved++;
        else setError((prev) => prev + ` ${acct.accountName}: ${data.error}`);
      } catch {
        setError((prev) => prev + ` Failed to save ${acct.accountName}.`);
      }
    }
    if (saved > 0) {
      setSuccess(`${saved} account${saved > 1 ? 's' : ''} imported and encrypted.`);
      setImportedAccounts([]);
      setShowImport(false);
      fetchAccounts();
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL your account data? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/v1/accounts', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setSuccess(data.message); setAccounts([]); }
    } catch {
      setError('Failed to delete accounts.');
    }
  };

  const updateImportedAccount = (idx: number, field: 'accountType' | 'accountName', value: string) => {
    setImportedAccounts((prev) => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  // Group brokerage holdings by account
  const brokerageByAccount = brokerageAccounts.map((acct) => ({
    ...acct,
    holdings: brokerageHoldings.filter((h) => h.accountId === acct.id),
  }));

  const hasAnyAccounts = accounts.length > 0 || brokerageConnected;

  return (
    <div className="space-y-8 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Accounts</h1>
          <p className="text-gray-400 mt-1">Manage your investment accounts. All data is AES-256 encrypted.</p>
        </div>
        <div className="flex items-center gap-2">
          {!brokerageConnected ? (
            <button
              onClick={handleConnectBrokerage}
              disabled={connecting || loadingBrokerage}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {connecting ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Connecting...
                </>
              ) : 'Connect Brokerage'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="bg-[#1e293b] hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-[#334155] hover:border-red-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Disconnect
            </button>
          )}
          <button
            onClick={() => { setShowImport(!showImport); setImportedAccounts([]); setError(''); }}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Import CSV
          </button>
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <svg className="w-6 h-6 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <p className="text-sm text-green-300 font-medium">Your data is encrypted</p>
          <p className="text-xs text-green-400/70">All account data is encrypted with AES-256-GCM before storage.</p>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400">{success}</div>}

      {/* CSV Import */}
      {showImport && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">Import from CSV</h3>
          <div className="mb-6 space-y-3">
            <p className="text-sm text-gray-300 font-medium">How to export your holdings:</p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { label: 'Fidelity (401k / Roth IRA)', color: 'text-blue-400', steps: ['Log in to NetBenefits or Fidelity.com', 'Go to Positions', 'Click Download (top right)', 'Select CSV format'], note: 'Account types auto-detected from CSV' },
                { label: 'Robinhood (Taxable)', color: 'text-green-400', steps: ['Open Robinhood app or web', 'Go to Account → Statements & History', 'Click Download Account Statement', 'Select CSV / spreadsheet format'] },
                { label: 'Schwab (Taxable / IRA)', color: 'text-purple-400', steps: ['Log in to Schwab.com', 'Go to Accounts → Positions', 'Click Export', 'Choose CSV'] },
                { label: 'Vanguard (Roth IRA / 401k)', color: 'text-cyan-400', steps: ['Log in to Vanguard.com', 'Go to My Accounts → Holdings', 'Click Download to spreadsheet', 'Save the CSV file'] },
              ].map((b) => (
                <div key={b.label} className="bg-[#0d1117] border border-[#1e293b] rounded-lg p-4">
                  <p className={`text-sm font-semibold mb-2 ${b.color}`}>{b.label}</p>
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    {b.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                  {b.note && <p className="text-[10px] text-gray-500 mt-2">{b.note}</p>}
                </div>
              ))}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-500 file:cursor-pointer"
          />

          {importedAccounts.length > 0 && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300 font-medium">
                  Detected <span className="text-green-400 capitalize">{importBrokerage}</span> — {importedAccounts.length} account{importedAccounts.length > 1 ? 's' : ''} found
                </span>
                <span className="text-xs text-gray-500">Adjust type or name if incorrect</span>
              </div>

              {importedAccounts.map((acct, idx) => (
                <div key={idx} className="bg-[#0d1117] border border-[#334155] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={acct.accountType}
                      onChange={(e) => updateImportedAccount(idx, 'accountType', e.target.value)}
                      className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500"
                    >
                      {ACCOUNT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <input
                      type="text"
                      value={acct.accountName}
                      onChange={(e) => updateImportedAccount(idx, 'accountName', e.target.value)}
                      className="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500 flex-1 min-w-[160px]"
                    />
                    <span className="text-xs text-cyan-400">→ {FEEDS_LABEL[acct.accountType] || 'Investing'}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#1e293b]">
                          <th className="text-left text-gray-500 py-1.5 px-2">Ticker</th>
                          <th className="text-left text-gray-500 py-1.5 px-2">Name</th>
                          <th className="text-right text-gray-500 py-1.5 px-2">Shares</th>
                          <th className="text-right text-gray-500 py-1.5 px-2">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acct.holdings.map((h, i) => (
                          <tr key={i} className="border-b border-[#1e293b]/40">
                            <td className="py-1.5 px-2 text-white font-mono">{h.ticker}</td>
                            <td className="py-1.5 px-2 text-gray-300 text-xs">{h.name}</td>
                            <td className="text-right py-1.5 px-2 text-white">{h.shares}</td>
                            <td className="text-right py-1.5 px-2 text-gray-400">${h.costBasis.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <button
                onClick={handleSaveAll}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Save & Encrypt All Accounts
              </button>
            </div>
          )}
        </div>
      )}

      {/* Connected Brokerage Accounts */}
      {brokerageConnected && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Live Brokerage</h2>
            <span className="text-xs text-gray-500">via SnapTrade — Fidelity, Chase, Wells Fargo, Empower</span>
          </div>
          {loadingBrokerage ? (
            <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-8 text-center text-gray-500 text-sm">
              Loading accounts...
            </div>
          ) : brokerageByAccount.length === 0 ? (
            <div className="bg-[#111827] border border-blue-500/20 rounded-xl p-6 text-center">
              <p className="text-gray-400 text-sm mb-2">Connected — no accounts found yet.</p>
              <p className="text-xs text-gray-500">SnapTrade syncs overnight. Check back tomorrow or reconnect to add more accounts.</p>
              <button onClick={handleConnectBrokerage} disabled={connecting} className="mt-3 text-blue-400 hover:text-blue-300 text-sm underline">
                Add another account
              </button>
            </div>
          ) : brokerageByAccount.map((acct) => (
            <div key={acct.id} className="bg-[#111827] border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{acct.name || acct.number}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400">{acct.institutionName}</span>
                  {acct.type && acct.type !== 'unknown' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#1e293b] text-gray-400">{acct.type}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Live
                </div>
              </div>
              {acct.holdings.length > 0 ? (
                <div className="space-y-1">
                  {acct.holdings.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{h.ticker}</span>
                        <span className="text-gray-500 text-xs">{h.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-gray-400">
                        <span>{h.units} shares</span>
                        {Number(h.price) > 0 && <span className="text-white">${Number(h.price).toFixed(2)}</span>}
                        {h.openPnl !== null && h.openPnl !== undefined && (
                          <span className={Number(h.openPnl) >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {Number(h.openPnl) >= 0 ? '+' : ''}{Number(h.openPnl).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No holdings data yet — syncs overnight.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CSV Accounts */}
      {accounts.length > 0 && (
        <div className="space-y-4">
          {brokerageConnected && (
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">CSV Imported</h2>
          )}
          {accounts.map((acct) => (
            <div key={acct.id} className="bg-[#111827] border border-[#1e293b] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{acct.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    acct.accountType === '401k' ? 'bg-blue-500/15 text-blue-400' :
                    acct.accountType === 'roth_ira' ? 'bg-purple-500/15 text-purple-400' :
                    acct.accountType === 'hsa' ? 'bg-cyan-500/15 text-cyan-400' :
                    acct.accountType === 'traditional_ira' ? 'bg-indigo-500/15 text-indigo-400' :
                    'bg-amber-500/15 text-amber-400'
                  }`}>
                    {acct.accountType === '401k' ? '401(k)' :
                     acct.accountType === 'roth_ira' ? 'Roth IRA' :
                     acct.accountType === 'traditional_ira' ? 'Traditional IRA' :
                     acct.accountType === 'hsa' ? 'HSA' :
                     acct.accountType === 'taxable' ? 'Taxable' : acct.accountType}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {['401k', 'roth_ira', 'hsa', 'traditional_ira'].includes(acct.accountType) ? '→ Retirement' : '→ Investing & Day Trading'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Encrypted
                </div>
              </div>
              <div className="space-y-1">
                {acct.holdings.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono">{h.ticker}</span>
                      <span className="text-gray-500">{h.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400">
                      <span>{h.shares} shares</span>
                      {h.costBasis > 0 && <span>@ ${h.costBasis.toFixed(2)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasAnyAccounts && !loadingBrokerage && (
        <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">No accounts yet. Connect your brokerage or import a CSV.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleConnectBrokerage}
              disabled={connecting}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              {connecting ? 'Connecting...' : 'Connect Brokerage'}
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              Import CSV
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-4">Supports Fidelity, Chase, Wells Fargo, Empower via live connection</p>
        </div>
      )}

      {/* Danger Zone */}
      {accounts.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h4>
          <p className="text-xs text-gray-400 mb-3">Permanently deletes all encrypted CSV account data. Live brokerage data is unaffected.</p>
          <button
            onClick={handleDeleteAll}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            Delete All CSV Account Data
          </button>
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 p-8">Loading...</div>}>
      <AccountsContent />
    </Suspense>
  );
}
