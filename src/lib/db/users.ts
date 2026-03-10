// User authentication database
// Passwords are hashed with bcrypt, never stored in plain text

import Database from 'better-sqlite3';
import path from 'path';
import { hashSync, compareSync } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'brillontly.db');
  const dir = path.dirname(dbPath);
  const fs = require('fs');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

// Create a new user (signup)
export function createUser(email: string, name: string, password: string): User | null {
  const database = getDb();

  // Check if email already exists
  const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return null;

  const id = uuidv4();
  const passwordHash = hashSync(password, 12);
  const now = new Date().toISOString();

  database.prepare(
    'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, email.toLowerCase().trim(), name.trim(), passwordHash, now);

  return { id, email: email.toLowerCase().trim(), name: name.trim(), createdAt: now };
}

// Verify credentials and return user (login)
export function verifyUser(email: string, password: string): User | null {
  const database = getDb();
  const row = database.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).get(email.toLowerCase().trim()) as UserRow | undefined;

  if (!row) return null;
  if (!compareSync(password, row.password_hash)) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
  };
}

// Get user by ID
export function getUserById(id: string): User | null {
  const database = getDb();
  const row = database.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).get(id) as UserRow | undefined;

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
  };
}
