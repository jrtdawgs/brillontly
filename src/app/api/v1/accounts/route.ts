import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createAccount, getAccounts, deleteAllAccounts } from '@/lib/db/database';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'brilliontly-dev-secret-change-in-production'
);

async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('brilliontly-token')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

// GET /api/v1/accounts - List all accounts (decrypted)
export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const accounts = await getAccounts(userId);
    return NextResponse.json({
      success: true,
      data: accounts.map((a) => ({
        id: a.id,
        accountType: a.accountType,
        name: a.data.name,
        holdings: a.data.holdings,
        holdingsCount: a.data.holdings.length,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
      encryption: 'AES-256-GCM',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve accounts. Is encryption key configured?' },
      { status: 500 }
    );
  }
}

// POST /api/v1/accounts - Create encrypted account
export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { accountType, name, holdings } = body;

    if (!accountType || !name || !holdings || !Array.isArray(holdings)) {
      return NextResponse.json(
        { success: false, error: 'accountType, name, and holdings array are required.' },
        { status: 400 }
      );
    }

    const validTypes = ['401k', 'roth_ira', 'taxable', 'hsa', 'brokerage', 'other'];
    if (!validTypes.includes(accountType)) {
      return NextResponse.json(
        { success: false, error: `accountType must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate holdings
    for (const h of holdings) {
      if (!h.ticker || typeof h.shares !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Each holding must have a ticker (string) and shares (number).' },
          { status: 400 }
        );
      }
    }

    const account = await createAccount(userId, accountType, { name, holdings });

    return NextResponse.json({
      success: true,
      data: {
        id: account.id,
        accountType: account.accountType,
        name: account.data.name,
        holdingsCount: account.data.holdings.length,
        encrypted: true,
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create account. Is encryption key configured?' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/accounts - Delete ALL accounts (nuclear option)
export async function DELETE() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const deleted = await deleteAllAccounts(userId);
    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted} account(s). All encrypted data has been permanently removed.`,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete accounts.' },
      { status: 500 }
    );
  }
}
