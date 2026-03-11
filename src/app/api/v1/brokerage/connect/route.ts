import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import {
  registerUser,
  deleteUser,
  getConnectionLink,
  getAccounts,
  getHoldings,
  isSnapTradeConfigured,
} from '@/lib/brokerage/snaptrade';
import {
  saveSnapTradeSecret,
  getSnapTradeSecret,
  deleteSnapTradeConnection,
  hasSnapTradeConnection,
} from '@/lib/db/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'brilliontly-dev-secret-change-in-production'
);

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('brilliontly-token')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

// POST /api/v1/brokerage/connect - Register user + get SnapTrade OAuth URL
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  if (!isSnapTradeConfigured()) return NextResponse.json({ success: false, error: 'SnapTrade not configured' }, { status: 503 });

  try {
    let userSecret: string;
    const existing = await getSnapTradeSecret(user.userId);
    if (existing) {
      userSecret = existing;
    } else {
      try {
        const reg = await registerUser(user.userId);
        userSecret = reg.userSecret!;
      } catch (err: unknown) {
        const e = err as { status?: number; body?: { detail?: string }; message?: string };
        if (e?.status === 400 || e?.body?.detail?.includes('already') || e?.message?.includes('already')) {
          try { await deleteUser(user.userId); } catch { /* ignore */ }
          const reg = await registerUser(user.userId);
          userSecret = reg.userSecret!;
        } else throw err;
      }
      await saveSnapTradeSecret(user.userId, userSecret);
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://brilliontly.vercel.app'}/accounts?connected=true`;
    const loginData = await getConnectionLink(user.userId, userSecret, redirectUri) as Record<string, unknown>;
    const redirectUrl = loginData.redirectURI || loginData.loginRedirectURI || loginData.redirect_uri;

    if (!redirectUrl) return NextResponse.json({ success: false, error: 'No redirect URL from SnapTrade' }, { status: 500 });

    return NextResponse.json({ success: true, data: { redirectUrl } });
  } catch (error: unknown) {
    const err = error as { message?: string; body?: unknown };
    console.error('SnapTrade connect error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to connect' }, { status: 500 });
  }
}

// GET /api/v1/brokerage/connect - Status + live holdings
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  if (!isSnapTradeConfigured()) return NextResponse.json({ success: true, connected: false, configured: false });

  const connected = await hasSnapTradeConnection(user.userId);
  if (!connected) return NextResponse.json({ success: true, connected: false });

  try {
    const userSecret = await getSnapTradeSecret(user.userId);
    if (!userSecret) return NextResponse.json({ success: true, connected: false });

    const [accounts, holdings] = await Promise.all([
      getAccounts(user.userId, userSecret),
      getHoldings(user.userId, userSecret),
    ]);

    return NextResponse.json({
      success: true,
      connected: true,
      data: {
        accounts: (accounts as Record<string, unknown>[]).map((a) => ({
          id: a.id,
          name: a.name,
          number: a.number,
          institutionName: a.institution_name,
          type: (a.meta as Record<string, unknown>)?.type || 'unknown',
        })),
        holdings: (holdings as Record<string, unknown>[]).map((h) => {
          const account = h.account as Record<string, unknown> | undefined;
          const symbol = h.symbol as Record<string, unknown> | undefined;
          const symbolObj = symbol?.symbol as Record<string, unknown> | undefined;
          return {
            accountId: account?.id,
            accountName: account?.name,
            ticker: (symbolObj?.symbol as string) || 'UNKNOWN',
            name: (symbolObj?.description as string) || 'Unknown',
            units: h.units,
            price: h.price,
            averageCost: h.average_purchase_price,
            openPnl: h.open_pnl,
          };
        }),
      },
    });
  } catch (error: unknown) {
    console.error('SnapTrade holdings error:', error);
    return NextResponse.json({ success: true, connected: true, error: 'Failed to fetch holdings' });
  }
}

// DELETE /api/v1/brokerage/connect - Disconnect
export async function DELETE() {
  const user = await getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  try { await deleteUser(user.userId); } catch { /* ignore */ }
  await deleteSnapTradeConnection(user.userId);
  return NextResponse.json({ success: true, message: 'Brokerage disconnected' });
}
