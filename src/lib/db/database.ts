// Turso/libSQL database with encrypted account storage
// Works on Vercel serverless (no native modules)
// Sensitive data is encrypted with AES-256-GCM before writing

import { createClient, type Client } from '@libsql/client';
import { encryptObject, decryptObject } from '@/lib/crypto/encryption';
import { v4 as uuidv4 } from 'uuid';

export interface HoldingData {
  ticker: string;
  name: string;
  shares: number;
  costBasis: number;
  targetAllocation: number;
  assetType: string;
}

export interface AccountData {
  name: string;
  holdings: HoldingData[];
}

export interface DecryptedAccount {
  id: string;
  userId: string;
  accountType: string;
  data: AccountData;
  createdAt: string;
  updatedAt: string;
}

let client: Client | null = null;

function getClient(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      'TURSO_DATABASE_URL is not set. Sign up free at https://turso.tech and create a database.'
    );
  }

  client = createClient({
    url,
    authToken,
  });

  return client;
}

// Initialize tables (call once on first request)
let initialized = false;
async function ensureTables() {
  if (initialized) return;
  const db = getClient();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS encrypted_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      encrypted_data TEXT NOT NULL,
      account_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id
    ON encrypted_accounts(user_id)
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS snaptrade_connections (
      user_id TEXT PRIMARY KEY,
      encrypted_secret TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  initialized = true;
}

// Create a new encrypted account
export async function createAccount(
  userId: string,
  accountType: string,
  data: AccountData
): Promise<DecryptedAccount> {
  await ensureTables();
  const db = getClient();
  const id = uuidv4();
  const encrypted = encryptObject(data);
  const now = new Date().toISOString();

  await db.execute({
    sql: 'INSERT INTO encrypted_accounts (id, user_id, encrypted_data, account_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, userId, encrypted, accountType, now, now],
  });

  return { id, userId, accountType, data, createdAt: now, updatedAt: now };
}

// Get all accounts for a user (decrypted)
export async function getAccounts(userId: string): Promise<DecryptedAccount[]> {
  await ensureTables();
  const db = getClient();

  const result = await db.execute({
    sql: 'SELECT * FROM encrypted_accounts WHERE user_id = ? ORDER BY created_at',
    args: [userId],
  });

  return result.rows.map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    accountType: row.account_type as string,
    data: decryptObject<AccountData>(row.encrypted_data as string),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

// Get a single account by ID (decrypted)
export async function getAccount(id: string, userId: string): Promise<DecryptedAccount | null> {
  await ensureTables();
  const db = getClient();

  const result = await db.execute({
    sql: 'SELECT * FROM encrypted_accounts WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  return {
    id: row.id as string,
    userId: row.user_id as string,
    accountType: row.account_type as string,
    data: decryptObject<AccountData>(row.encrypted_data as string),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Update an encrypted account
export async function updateAccount(
  id: string,
  userId: string,
  data: AccountData
): Promise<DecryptedAccount | null> {
  await ensureTables();
  const db = getClient();
  const encrypted = encryptObject(data);
  const now = new Date().toISOString();

  const result = await db.execute({
    sql: 'UPDATE encrypted_accounts SET encrypted_data = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    args: [encrypted, now, id, userId],
  });

  if (result.rowsAffected === 0) return null;
  return getAccount(id, userId);
}

// Delete a single account
export async function deleteAccount(id: string, userId: string): Promise<boolean> {
  await ensureTables();
  const db = getClient();

  const result = await db.execute({
    sql: 'DELETE FROM encrypted_accounts WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });

  return (result.rowsAffected ?? 0) > 0;
}

// Delete ALL accounts for a user (nuclear option)
export async function deleteAllAccounts(userId: string): Promise<number> {
  await ensureTables();
  const db = getClient();

  const result = await db.execute({
    sql: 'DELETE FROM encrypted_accounts WHERE user_id = ?',
    args: [userId],
  });

  return result.rowsAffected ?? 0;
}

// SnapTrade connection storage (secret stored encrypted)
export async function saveSnapTradeSecret(userId: string, userSecret: string): Promise<void> {
  await ensureTables();
  const db = getClient();
  const encrypted = encryptObject({ userSecret });
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO snaptrade_connections (user_id, encrypted_secret, created_at, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET encrypted_secret = ?, updated_at = ?`,
    args: [userId, encrypted, now, now, encrypted, now],
  });
}

export async function getSnapTradeSecret(userId: string): Promise<string | null> {
  await ensureTables();
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT encrypted_secret FROM snaptrade_connections WHERE user_id = ?',
    args: [userId],
  });
  if (result.rows.length === 0) return null;
  const decrypted = decryptObject<{ userSecret: string }>(result.rows[0].encrypted_secret as string);
  return decrypted.userSecret;
}

export async function deleteSnapTradeConnection(userId: string): Promise<void> {
  await ensureTables();
  const db = getClient();
  await db.execute({
    sql: 'DELETE FROM snaptrade_connections WHERE user_id = ?',
    args: [userId],
  });
}

export async function hasSnapTradeConnection(userId: string): Promise<boolean> {
  await ensureTables();
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT 1 FROM snaptrade_connections WHERE user_id = ?',
    args: [userId],
  });
  return result.rows.length > 0;
}

// Check if encryption is properly configured
export function isEncryptionConfigured(): boolean {
  try {
    const testData = { test: true };
    const encrypted = encryptObject(testData);
    const decrypted = decryptObject<{ test: boolean }>(encrypted);
    return decrypted.test === true;
  } catch {
    return false;
  }
}
