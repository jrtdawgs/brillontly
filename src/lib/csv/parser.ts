// CSV Parser for brokerage exports
// Supports: Fidelity, Schwab, Robinhood, Vanguard
// Raw CSV is processed in memory only - never persisted

import type { HoldingData } from '@/lib/db/database';

export type Brokerage = 'fidelity' | 'schwab' | 'robinhood' | 'vanguard' | 'generic';

interface ParseResult {
  success: boolean;
  brokerage: Brokerage;
  holdings: HoldingData[];
  errors: string[];
}

// Parse CSV text into rows
function parseCSVRows(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    return row;
  });
}

// Detect which brokerage the CSV is from based on headers
function detectBrokerage(headers: string[]): Brokerage {
  const headerStr = headers.join(',').toLowerCase();

  if (headerStr.includes('account number') && headerStr.includes('symbol') && headerStr.includes('description') && headerStr.includes('quantity')) {
    return 'fidelity';
  }
  if (headerStr.includes('symbol') && headerStr.includes('name') && headerStr.includes('quantity') && headerStr.includes('cost basis')) {
    return 'schwab';
  }
  if (headerStr.includes('instrument') && headerStr.includes('quantity') && headerStr.includes('average cost')) {
    return 'robinhood';
  }
  if (headerStr.includes('investment name') && headerStr.includes('symbol') && headerStr.includes('shares')) {
    return 'vanguard';
  }

  return 'generic';
}

// Find column index by partial header match
function findColumn(headers: string[], ...names: string[]): number {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  for (const name of names) {
    const idx = lowerHeaders.findIndex((h) => h.includes(name.toLowerCase()));
    if (idx >= 0) return idx;
  }
  return -1;
}

// Clean number string (remove $, commas, etc.)
function parseNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[$,\s]/g, '').replace(/[()]/g, '-');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Determine asset type from ticker/name
function guessAssetType(ticker: string, name: string): string {
  const t = ticker.toUpperCase();
  const n = name.toLowerCase();

  if (['BTC-USD', 'BTC', 'ETH-USD', 'ETH'].includes(t)) return 'crypto';
  if (['BITX', 'ETHU', 'BITO', 'GBTC', 'ETHE'].includes(t)) return 'crypto_etf';
  if (['SOXL', 'TQQQ', 'UPRO', 'SPXL', 'TECL', 'FNGU', 'LABU'].includes(t)) return 'leveraged_etf';
  if (n.includes('index fund') || t === 'FXAIX' || t === 'FSKAX' || t === 'VFIAX') return 'index_fund';
  if (n.includes('3x') || n.includes('2x') || n.includes('ultra') || n.includes('leveraged')) return 'leveraged_etf';
  if (n.includes('bitcoin') || n.includes('ethereum') || n.includes('crypto')) return 'crypto_etf';

  return 'etf';
}

// Parse Fidelity CSV
function parseFidelity(rows: string[][], headers: string[]): HoldingData[] {
  const symbolCol = findColumn(headers, 'symbol');
  const nameCol = findColumn(headers, 'description', 'name');
  const sharesCol = findColumn(headers, 'quantity', 'shares');
  const priceCol = findColumn(headers, 'last price', 'price');

  if (symbolCol < 0 || sharesCol < 0) return [];

  return rows
    .filter((row) => row[symbolCol] && row[symbolCol] !== '--' && !row[symbolCol].includes('Total'))
    .map((row) => {
      const ticker = row[symbolCol]?.replace('**', '').trim() || '';
      const name = row[nameCol] || ticker;
      return {
        ticker,
        name,
        shares: parseNumber(row[sharesCol]),
        costBasis: parseNumber(row[priceCol]),
        targetAllocation: 0,
        assetType: guessAssetType(ticker, name),
      };
    })
    .filter((h) => h.shares > 0 && h.ticker);
}

// Parse Schwab CSV
function parseSchwab(rows: string[][], headers: string[]): HoldingData[] {
  const symbolCol = findColumn(headers, 'symbol');
  const nameCol = findColumn(headers, 'name', 'description');
  const sharesCol = findColumn(headers, 'quantity', 'shares');
  const costCol = findColumn(headers, 'cost basis', 'cost');
  const priceCol = findColumn(headers, 'price');

  if (symbolCol < 0 || sharesCol < 0) return [];

  return rows
    .filter((row) => row[symbolCol] && !row[symbolCol].includes('Total') && !row[symbolCol].includes('Account'))
    .map((row) => {
      const ticker = row[symbolCol]?.trim() || '';
      const name = row[nameCol] || ticker;
      const shares = parseNumber(row[sharesCol]);
      const costBasis = costCol >= 0 ? parseNumber(row[costCol]) / (shares || 1) : parseNumber(row[priceCol]);
      return {
        ticker,
        name,
        shares,
        costBasis,
        targetAllocation: 0,
        assetType: guessAssetType(ticker, name),
      };
    })
    .filter((h) => h.shares > 0 && h.ticker);
}

// Parse Robinhood CSV
function parseRobinhood(rows: string[][], headers: string[]): HoldingData[] {
  const instrumentCol = findColumn(headers, 'instrument', 'symbol', 'name');
  const sharesCol = findColumn(headers, 'quantity', 'shares');
  const costCol = findColumn(headers, 'average cost', 'cost');

  if (instrumentCol < 0 || sharesCol < 0) return [];

  return rows
    .filter((row) => row[instrumentCol])
    .map((row) => {
      const ticker = row[instrumentCol]?.trim() || '';
      return {
        ticker,
        name: ticker,
        shares: parseNumber(row[sharesCol]),
        costBasis: parseNumber(row[costCol]),
        targetAllocation: 0,
        assetType: guessAssetType(ticker, ticker),
      };
    })
    .filter((h) => h.shares > 0 && h.ticker);
}

// Parse Vanguard CSV
function parseVanguard(rows: string[][], headers: string[]): HoldingData[] {
  const symbolCol = findColumn(headers, 'symbol', 'ticker');
  const nameCol = findColumn(headers, 'investment name', 'name');
  const sharesCol = findColumn(headers, 'shares', 'quantity');
  const priceCol = findColumn(headers, 'share price', 'price');

  if (symbolCol < 0 || sharesCol < 0) return [];

  return rows
    .filter((row) => row[symbolCol] && row[symbolCol] !== '--')
    .map((row) => {
      const ticker = row[symbolCol]?.trim() || '';
      const name = row[nameCol] || ticker;
      return {
        ticker,
        name,
        shares: parseNumber(row[sharesCol]),
        costBasis: parseNumber(row[priceCol]),
        targetAllocation: 0,
        assetType: guessAssetType(ticker, name),
      };
    })
    .filter((h) => h.shares > 0 && h.ticker);
}

// Generic CSV parser (best effort)
function parseGeneric(rows: string[][], headers: string[]): HoldingData[] {
  const symbolCol = findColumn(headers, 'symbol', 'ticker', 'instrument');
  const nameCol = findColumn(headers, 'name', 'description', 'instrument');
  const sharesCol = findColumn(headers, 'shares', 'quantity', 'qty', 'amount');
  const costCol = findColumn(headers, 'cost', 'price', 'basis', 'average');

  if (symbolCol < 0 || sharesCol < 0) return [];

  return rows
    .filter((row) => row[symbolCol])
    .map((row) => {
      const ticker = row[symbolCol]?.trim() || '';
      const name = nameCol >= 0 ? row[nameCol] || ticker : ticker;
      return {
        ticker,
        name,
        shares: parseNumber(row[sharesCol]),
        costBasis: costCol >= 0 ? parseNumber(row[costCol]) : 0,
        targetAllocation: 0,
        assetType: guessAssetType(ticker, name),
      };
    })
    .filter((h) => h.shares > 0 && h.ticker);
}

// Main CSV parsing function
export function parseCSV(csvText: string): ParseResult {
  const errors: string[] = [];

  try {
    const rows = parseCSVRows(csvText);
    if (rows.length < 2) {
      return { success: false, brokerage: 'generic', holdings: [], errors: ['CSV file is empty or has no data rows.'] };
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const brokerage = detectBrokerage(headers);

    let holdings: HoldingData[];

    switch (brokerage) {
      case 'fidelity':
        holdings = parseFidelity(dataRows, headers);
        break;
      case 'schwab':
        holdings = parseSchwab(dataRows, headers);
        break;
      case 'robinhood':
        holdings = parseRobinhood(dataRows, headers);
        break;
      case 'vanguard':
        holdings = parseVanguard(dataRows, headers);
        break;
      default:
        holdings = parseGeneric(dataRows, headers);
    }

    if (holdings.length === 0) {
      errors.push('No valid holdings found in CSV. Make sure the file has columns for ticker/symbol, shares/quantity, and optionally price/cost basis.');
    }

    return {
      success: holdings.length > 0,
      brokerage,
      holdings,
      errors,
    };
  } catch (err) {
    return {
      success: false,
      brokerage: 'generic',
      holdings: [],
      errors: [`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`],
    };
  }
}
