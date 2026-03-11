// SnapTrade brokerage integration
// Free tier: 5 connections, read-only, daily refresh
// Supports: Fidelity, Robinhood, Schwab, Vanguard, and 100+ more
//
// Required env vars:
//   SNAPTRADE_CLIENT_ID - from dashboard.snaptrade.com
//   SNAPTRADE_CONSUMER_KEY - from dashboard.snaptrade.com

import { Snaptrade } from 'snaptrade-typescript-sdk';

let client: Snaptrade | null = null;

export function getSnapTradeClient(): Snaptrade {
  if (client) return client;

  const clientId = process.env.SNAPTRADE_CLIENT_ID;
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;

  if (!clientId || !consumerKey) {
    throw new Error(
      'SnapTrade is not configured. Set SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY environment variables. ' +
      'Sign up free at https://dashboard.snaptrade.com'
    );
  }

  client = new Snaptrade({
    clientId,
    consumerKey,
  });

  return client;
}

// Register a user with SnapTrade (call once per user)
export async function registerUser(userId: string) {
  const snaptrade = getSnapTradeClient();
  const response = await snaptrade.authentication.registerSnapTradeUser({
    userId,
  });
  return response.data;
}

// Delete a user from SnapTrade
export async function deleteUser(userId: string) {
  const snaptrade = getSnapTradeClient();
  await snaptrade.authentication.deleteSnapTradeUser({ userId });
}

// Generate a connection portal URL for the user to link their brokerage
export async function getConnectionLink(userId: string, userSecret: string, redirectUri?: string) {
  const snaptrade = getSnapTradeClient();
  const response = await snaptrade.authentication.loginSnapTradeUser({
    userId,
    userSecret,
    ...(redirectUri ? { customRedirect: redirectUri } : {}),
  });
  return response.data;
}

// Get all connected accounts for a user
export async function getAccounts(userId: string, userSecret: string) {
  const snaptrade = getSnapTradeClient();
  const response = await snaptrade.accountInformation.listUserAccounts({
    userId,
    userSecret,
  });
  return response.data;
}

// Get holdings for all accounts
export async function getHoldings(userId: string, userSecret: string) {
  const snaptrade = getSnapTradeClient();
  const response = await snaptrade.accountInformation.getAllUserHoldings({
    userId,
    userSecret,
  });
  return response.data;
}

// Get holdings for a specific account
export async function getAccountHoldings(
  userId: string,
  userSecret: string,
  accountId: string
) {
  const snaptrade = getSnapTradeClient();
  const response = await snaptrade.accountInformation.getUserAccountPositions({
    userId,
    userSecret,
    accountId,
  });
  return response.data;
}

// Get account balances
export async function getAccountBalances(
  userId: string,
  userSecret: string,
  accountId: string
) {
  const snaptrade = getSnapTradeClient();
  const response = await snaptrade.accountInformation.getUserAccountBalance({
    userId,
    userSecret,
    accountId,
  });
  return response.data;
}

// List supported brokerages
export async function listBrokerages() {
  const snaptrade = getSnapTradeClient();
  const response = await snaptrade.referenceData.listAllBrokerages();
  return response.data;
}

// Check if SnapTrade is configured
export function isSnapTradeConfigured(): boolean {
  return !!(process.env.SNAPTRADE_CLIENT_ID && process.env.SNAPTRADE_CONSUMER_KEY);
}
