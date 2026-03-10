import { NextResponse } from 'next/server';
import { parseCSV } from '@/lib/csv/parser';

// POST /api/v1/accounts/import-csv - Parse CSV (does NOT save, just preview)
export async function POST(request: Request) {
  try {
    const { csvText } = await request.json();

    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json(
        { success: false, errors: ['No CSV text provided.'] },
        { status: 400 }
      );
    }

    const result = parseCSV(csvText);

    return NextResponse.json({
      success: result.success,
      data: {
        brokerage: result.brokerage,
        holdings: result.holdings,
        holdingsCount: result.holdings.length,
      },
      errors: result.errors,
    });
  } catch {
    return NextResponse.json(
      { success: false, errors: ['Failed to parse CSV file.'] },
      { status: 500 }
    );
  }
}
