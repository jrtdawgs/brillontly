// SQLite database with encrypted account storage
// Sensitive data is encrypted with AES-256-GCM before writing

import Database from 'better-sqlite3';
import path from 'path';
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

interface AccountRow {
  id: string;
  user_id: string;
  encrypted_data: string;
  account_type: string;
  created_at: string;
  updated_at: string;
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'brillontly.db');

  // Ensure directory exists
  const dir = path.dirname(dbPath);
  const fs = require('fs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS encrypted_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      encrypted_data TEXT NOT NULL,
      account_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_user_id
    ON encrypted_accounts(user_id);
  `);

  return db;
}

// Create a new encrypted account
export function createAccount(
  userId: string,
  accountType: string,
  data: AccountData
): DecryptedAccount {
  const database = getDb();
  const id = uuidv4();
  const encrypted = encryptObject(data);
  const now = new Date().toISOString();

  database.prepare(`
    INSERT INTO encrypted_accounts (id, user_id, encrypted_data, account_type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, encrypted, accountType, now, now);

  return { id, userId, accountType, data, createdAt: now, updatedAt: now };
}

// Get all accounts for a user (decrypted)
export function getAccounts(userId: string): DecryptedAccount[] {
  const database = getDb();
  const rows = database.prepare(
    'SELECT * FROM encrypted_accounts WHERE user_id = ? ORDER BY created_at'
  ).all(userId) as AccountRow[];

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    accountType: row.account_type,
    data: decryptObject<AccountData>(row.encrypted_data),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// Get a single account by ID (decrypted)
export function getAccount(id: string, userId: string): DecryptedAccount | null {
  const database = getDb();
  const row = database.prepare(
    'SELECT * FROM encrypted_accounts WHERE id = ? AND user_id = ?'
  ).get(id, userId) as AccountRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    accountType: row.account_type,
    data: decryptObject<AccountData>(row.encrypted_data),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Update an encrypted account
export function updateAccount(
  id: string,
  userId: string,
  data: AccountData
): DecryptedAccount | null {
  const database = getDb();
  const encrypted = encryptObject(data);
  const now = new Date().toISOString();

  const result = database.prepare(`
    UPDATE encrypted_accounts
    SET encrypted_data = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(encrypted, now, id, userId);

  if (result.changes === 0) return null;

  return getAccount(id, userId);
}

// Delete a single account
export function deleteAccount(id: string, userId: string): boolean {
  const database = getDb();
  const result = database.prepare(
    'DELETE FROM encrypted_accounts WHERE id = ? AND user_id = ?'
  ).run(id, userId);
  return result.changes > 0;
}

// Delete ALL accounts for a user (nuclear option)
export function deleteAllAccounts(userId: string): number {
  const database = getDb();
  const result = database.prepare(
    'DELETE FROM encrypted_accounts WHERE user_id = ?'
  ).run(userId);
  return result.changes;
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
