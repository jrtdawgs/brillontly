import { NextResponse } from 'next/server';
import { getMultipleQuotes, getHistoricalData, type QuoteData } from '@/lib/market/yahoo';
import { calculateRSI, rsiSignal, currentDrawdown, drawdownSignal, overallSignal } from '@/lib/analytics/signals';
import { TRACKED_ASSETS } from '@/lib/analytics/signals';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Macro tickers for VIX, Dollar, Yields, Bonds
const MACRO_TICKERS = ['^VIX', 'DX-Y.NYB', '^TNX', '^FVX', '^TYX', '^IRX', 'TLT', 'UUP', 'GLD'];

const NO_CACHE = { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all'; // all, signals, macro, quotes

  try {
    if (type === 'macro') {
      return await getMacroData();
    }

    if (type === 'quotes') {
      const tickersParam = searchParams.get('tickers');
      const tickers = tickersParam ? tickersParam.split(',') : TRACKED_ASSETS.map(a => a.ticker);
      const quotes = await getMultipleQuotes(tickers);
      return NextResponse.json(
        { success: true, data: Object.fromEntries(quotes), lastUpdated: new Date().toISOString() },
        { headers: NO_CACHE }
      );
    }

    // type === 'all' or 'signals' - get quotes + compute signals
    return await getSignalData();
  } catch (error) {
    console.error('Live market data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live market data' },
      { status: 500, headers: NO_CACHE }
    );
  }
}

async function getMacroData() {
  const quotes = await getMultipleQuotes(MACRO_TICKERS);

  const vixQuote = quotes.get('^VIX');
  const dollarQuote = quotes.get('DX-Y.NYB') || quotes.get('UUP');
  const tenYearQuote = quotes.get('^TNX');
  const fiveYearQuote = quotes.get('^FVX');
  const thirtyYearQuote = quotes.get('^TYX');
  const thirteenWeekQuote = quotes.get('^IRX');
  const tltQuote = quotes.get('TLT');
  const goldQuote = quotes.get('GLD');

  return NextResponse.json({
    success: true,
    data: {
      vix: vixQuote ? { price: vixQuote.price, change: vixQuote.change, changePercent: vixQuote.changePercent } : null,

      dollarIndex: dollarQuote ? { price: dollarQuote.price, change: dollarQuote.change, changePercent: dollarQuote.changePercent } : null,
      tenYearYield: tenYearQuote ? { price: tenYearQuote.price, change: tenYearQuote.change } : null,
      fiveYearYield: fiveYearQuote ? { price: fiveYearQuote.price, change: fiveYearQuote.change } : null,
      thirtyYearYield: thirtyYearQuote ? { price: thirtyYearQuote.price, change: thirtyYearQuote.change } : null,
      thirteenWeekYield: thirteenWeekQuote ? { price: thirteenWeekQuote.price, change: thirteenWeekQuote.change } : null,
      tlt: tltQuote ? { price: tltQuote.price, change: tltQuote.change, changePercent: tltQuote.changePercent } : null,
      gold: goldQuote ? { price: goldQuote.price, change: goldQuote.change, changePercent: goldQuote.changePercent } : null,
    },
    lastUpdated: new Date().toISOString(),
  }, { headers: NO_CACHE });
}

async function getSignalData() {
  // Get all quotes first
  const allTickers = TRACKED_ASSETS.map(a => a.ticker);
  const quotes = await getMultipleQuotes(allTickers);

  // For each ticker with a quote, compute RSI and signals from 3-month history
  const signalResults: Record<string, {
    quote: QuoteData;
    rsi: number;
    rsiSignal: { type: string; label: string; description: string };
    drawdown: number;
    drawdownSignal: { type: string; label: string; description: string };
    volumeRatio: number;
    overallSignal: { type: string; label: string; description: string };
    category: string;
  }> = {};

  // Fetch historical data in parallel batches for signal computation
  const historyPromises = allTickers.map(async (ticker) => {
    const quote = quotes.get(ticker);
    if (!quote) return;

    const asset = TRACKED_ASSETS.find(a => a.ticker === ticker);
    if (!asset) return;

    try {
      const history = await getHistoricalData(ticker, '3mo', '1d');
      if (history.length < 15) return;

      const closePrices = history.map(h => h.close);
      const volumes = history.map(h => h.volume);

      // Calculate RSI
      const rsi = calculateRSI(closePrices);
      const rsiSig = rsiSignal(rsi);

      // Calculate drawdown from high
      const dd = currentDrawdown(closePrices);
      const ddSig = drawdownSignal(dd, asset.name);

      // Calculate volume ratio
      const avgVol = volumes.slice(0, -1).reduce((s, v) => s + v, 0) / Math.max(volumes.length - 1, 1);
      const currentVol = volumes[volumes.length - 1] || 0;
      const volRatio = avgVol > 0 ? currentVol / avgVol : 1;

      // Overall signal
      const overall = overallSignal([rsiSig, ddSig]);

      signalResults[ticker] = {
        quote,
        rsi,
        rsiSignal: { type: rsiSig.type, label: rsiSig.label, description: rsiSig.description },
        drawdown: dd,
        drawdownSignal: { type: ddSig.type, label: ddSig.label, description: ddSig.description },
        volumeRatio: volRatio,
        overallSignal: { type: overall.type, label: overall.label, description: overall.description },
        category: asset.category,
      };
    } catch {
      // Skip this ticker if history fetch fails
    }
  });

  await Promise.all(historyPromises);

  return NextResponse.json({
    success: true,
    data: signalResults,
    tickerCount: Object.keys(signalResults).length,
    lastUpdated: new Date().toISOString(),
  }, { headers: NO_CACHE });
}
