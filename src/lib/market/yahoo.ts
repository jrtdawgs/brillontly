// Yahoo Finance API client (using free unofficial API)
// No API key required - real-time market data

export interface QuoteData {
  ticker: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  lastUpdated: string;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// In-memory cache with configurable TTL
const quoteCache = new Map<string, { data: QuoteData; timestamp: number }>();
const QUOTE_CACHE_TTL = 15_000; // 15 seconds

// Fetch current quote for a ticker (15-second cache)
export async function getQuote(ticker: string): Promise<QuoteData | null> {
  // Check cache
  const cached = quoteCache.get(ticker);
  if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store', // Always fresh
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose;

    const quote: QuoteData = {
      ticker: meta.symbol,
      name: meta.shortName || meta.longName || ticker,
      price,
      previousClose,
      change: price - previousClose,
      changePercent: ((price - previousClose) / previousClose) * 100,
      dayHigh: meta.regularMarketDayHigh || price,
      dayLow: meta.regularMarketDayLow || price,
      volume: meta.regularMarketVolume || 0,
      avgVolume: 0,
      marketCap: meta.marketCap || 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || price,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || price,
      lastUpdated: new Date().toISOString(),
    };

    // Calculate average volume from 5-day data
    const volumes = result.indicators?.quote?.[0]?.volume;
    if (volumes && volumes.length > 1) {
      const validVolumes = volumes.filter((v: number | null) => v != null && v > 0);
      if (validVolumes.length > 1) {
        // Average of all days except today
        const pastVolumes = validVolumes.slice(0, -1);
        quote.avgVolume = pastVolumes.reduce((s: number, v: number) => s + v, 0) / pastVolumes.length;
      }
    }

    // Cache the result
    quoteCache.set(ticker, { data: quote, timestamp: Date.now() });

    return quote;
  } catch {
    console.error(`Failed to fetch quote for ${ticker}`);
    return null;
  }
}

// Fetch historical price data (1-hour cache for history)
export async function getHistoricalData(
  ticker: string,
  range: '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' = '1y',
  interval: '1d' | '1wk' | '1mo' = '1d'
): Promise<HistoricalDataPoint[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 }, // 5 min cache for historical (RSI/drawdown)
    });

    if (!res.ok) return [];

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};

    const historicalData: HistoricalDataPoint[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.close?.[i] != null) {
        historicalData.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          open: quotes.open?.[i] || 0,
          high: quotes.high?.[i] || 0,
          low: quotes.low?.[i] || 0,
          close: quotes.close[i],
          volume: quotes.volume?.[i] || 0,
        });
      }
    }

    return historicalData;
  } catch {
    console.error(`Failed to fetch historical data for ${ticker}`);
    return [];
  }
}

// Fetch quotes for multiple tickers (parallel, batched)
export async function getMultipleQuotes(tickers: string[]): Promise<Map<string, QuoteData>> {
  const results = new Map<string, QuoteData>();

  // Process in batches of 10 to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    const promises = batch.map(async (ticker) => {
      const quote = await getQuote(ticker);
      if (quote) results.set(ticker, quote);
    });
    await Promise.all(promises);
  }

  return results;
}

// Get full signal data for a ticker (quote + historical for RSI/drawdown)
export async function getTickerSignalData(ticker: string) {
  const [quote, history] = await Promise.all([
    getQuote(ticker),
    getHistoricalData(ticker, '3mo', '1d'),
  ]);

  return { quote, history };
}
