// User authentication database (Turso/libSQL - works on Vercel serverless)
// Passwords are hashed with bcrypt, never stored in plain text

import { createClient, type Client } from '@libsql/client';
import { hashSync, compareSync } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
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
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  initialized = true;
}

// Create a new user (signup)
export async function createUser(email: string, name: string, password: string): Promise<User | null> {
  await ensureTables();
  const db = getClient();

  // Check if email already exists
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [email.toLowerCase().trim()],
  });
  if (existing.rows.length > 0) return null;

  const id = uuidv4();
  const passwordHash = hashSync(password, 12);
  const now = new Date().toISOString();

  await db.execute({
    sql: 'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [id, email.toLowerCase().trim(), name.trim(), passwordHash, now],
  });

  return { id, email: email.toLowerCase().trim(), name: name.trim(), createdAt: now };
}

// Verify credentials and return user (login)
export async function verifyUser(email: string, password: string): Promise<User | null> {
  await ensureTables();
  const db = getClient();

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email.toLowerCase().trim()],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  if (!compareSync(password, row.password_hash as string)) return null;

  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  };
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  await ensureTables();
  const db = getClient();

  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  const row = result.rows[0];

  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  };
}
