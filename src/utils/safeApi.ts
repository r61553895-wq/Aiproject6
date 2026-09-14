import type { UserAccount, TokenKey, AdminStats, UserSession } from '../types';

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  isHtmlOrEmpty: boolean;
  error?: string;
}

const SAVED_ACCOUNTS_KEY = 'grokson_saved_accounts';
const CURRENT_USER_KEY = 'grokson_current_user';
const LOCAL_PASSWORDS_KEY = 'grokson_local_passwords';
const REDEEMED_KEYS_KEY = 'grokson_redeemed_keys';
const CUSTOM_KEYS_KEY = 'grokson_custom_keys';

// Pre-defined built-in keys that always work offline / in standalone client
const BUILTIN_KEYS: Record<string, { tokens: number; label: string; maxUses: number }> = {
  'GROK-VIP-100K': { tokens: 100000, label: 'VIP ключ (100,000 токенов)', maxUses: 100 },
  'GROKSON-10K': { tokens: 10000, label: 'Стартовый пакет (10,000 токенов)', maxUses: 100 },
  'GROKSON-50K': { tokens: 50000, label: 'Пакет Мастер (50,000 токенов)', maxUses: 100 },
  'START-2026': { tokens: 20000, label: 'Промокод 2026 (20,000 токенов)', maxUses: 100 },
  'VERCEL-PROMO': { tokens: 25000, label: 'Бонус Vercel (25,000 токенов)', maxUses: 100 },
};

/**
 * Safely fetches an API endpoint and parses JSON without throwing SyntaxError
 * when serverless function is missing, cold-starting, or returns HTML error page
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 12000
): Promise<SafeFetchResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await res.text();
    const trimmed = rawText.trim();

    if (!trimmed) {
      return {
        ok: false,
        status: res.status,
        data: null,
        isHtmlOrEmpty: true,
        error: `Сервер вернул пустой ответ (HTTP ${res.status}). Активирован автономный режим.`,
      };
    }

    const contentType = res.headers.get('content-type') || '';
    const isHtml =
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html') ||
      (!contentType.includes('application/json') && trimmed.includes('<html'));

    if (isHtml) {
      return {
        ok: false,
        status: res.status,
        data: null,
        isHtmlOrEmpty: true,
        error: `Серверный API недоступен (HTML страница вместо API). Включен автономный режим.`,
      };
    }

    try {
      const data = JSON.parse(trimmed);
      return {
        ok: res.ok,
        status: res.status,
        data,
        isHtmlOrEmpty: false,
        error: res.ok ? undefined : data.message || data.error || `Ошибка сервера (${res.status})`,
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        isHtmlOrEmpty: true,
        error: 'Некорректный формат ответа сервера.',
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isAbort = err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      data: null,
      isHtmlOrEmpty: true,
      error: isAbort
        ? 'Таймаут соединения с сервером.'
        : err.message || 'Ошибка подключения к сети.',
    };
  }
}

// ---------------- LOCAL CLIENT FALLBACK ENGINES ----------------

export function getLocalAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAccounts(accounts: UserAccount[]) {
  try {
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}
}

export function getLocalPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalPasswords(passwords: Record<string, string>) {
  try {
    localStorage.setItem(LOCAL_PASSWORDS_KEY, JSON.stringify(passwords));
  } catch {}
}

export function saveAccountPassword(username: string, password: string) {
  try {
    const passwords = getLocalPasswords();
    passwords[username.toLowerCase().trim()] = password;
    saveLocalPasswords(passwords);
  } catch {}
}

/**
 * Syncs saved local accounts to the backend server so the server memoryStore is always restored
 */
export async function syncSavedAccountsWithServer(): Promise<void> {
  try {
    const accounts = getLocalAccounts();
    if (!accounts || accounts.length === 0) return;
    const passwords = getLocalPasswords();
    const payload = accounts.map((acc) => ({
      ...acc,
      password: passwords[acc.username.toLowerCase().trim()] || undefined,
    }));
    await safeFetchJson('/api/auth/sync-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts: payload }),
    }, 4000);
  } catch (e) {
    // Graceful silent fallback
  }
}

function getRedeemedCodes(): string[] {
  try {
    const raw = localStorage.getItem(REDEEMED_KEYS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markCodeRedeemed(code: string) {
  try {
    const codes = getRedeemedCodes();
    if (!codes.includes(code)) {
      codes.push(code);
      localStorage.setItem(REDEEMED_KEYS_KEY, JSON.stringify(codes));
    }
  } catch {}
}

/**
 * Register account locally in browser localStorage when backend is unavailable
 */
export function registerLocalAccount(params: {
  username: string;
  email?: string;
  name?: string;
  password: string;
  currentUserId?: string;
}): { success: boolean; message: string; account?: UserAccount } {
  const accounts = getLocalAccounts();
  const lowerUser = params.username.toLowerCase().trim();

  // Check if username is already taken locally
  const exists = accounts.some((a) => a.username.toLowerCase() === lowerUser);
  if (exists) {
    return { success: false, message: 'Пользователь с таким логином уже существует' };
  }

  const accountId = params.currentUserId || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newAccount: UserAccount = {
    id: accountId,
    username: params.username.trim(),
    email: params.email?.trim() || undefined,
    name: params.name?.trim() || params.username.trim(),
    tokensBalance: 10000,
    totalTokensUsed: 0,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    role: 'user',
  };

  accounts.unshift(newAccount);
  saveLocalAccounts(accounts);

  const passwords = getLocalPasswords();
  passwords[lowerUser] = params.password;
  saveLocalPasswords(passwords);

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newAccount));
  localStorage.setItem('grokson_tokens_balance', '10000');

  return {
    success: true,
    message: 'Аккаунт успешно создан! Начислено +10 000 токенов.',
    account: newAccount,
  };
}

/**
 * Login account locally from localStorage when backend is unavailable
 */
export function loginLocalAccount(params: {
  login: string;
  password: string;
}): { success: boolean; message?: string; account?: UserAccount } {
  const accounts = getLocalAccounts();
  const search = params.login.toLowerCase().trim();
  const passwords = getLocalPasswords();

  const account = accounts.find(
    (a) => a.username.toLowerCase() === search || (a.email && a.email.toLowerCase() === search)
  );

  if (!account) {
    return {
      success: false,
      message: 'Аккаунт не найден. Проверьте введённый логин или зарегистрируйтесь.',
    };
  }

  const savedPassword = passwords[account.username.toLowerCase()];
  // If we have password saved, check it; if not saved (imported account), allow matching
  if (savedPassword && savedPassword !== params.password) {
    return { success: false, message: 'Неверный пароль' };
  }

  account.lastLoginAt = Date.now();
  saveLocalAccounts(accounts);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(account));
  localStorage.setItem('grokson_tokens_balance', account.tokensBalance.toString());

  return {
    success: true,
    account,
  };
}

/**
 * Redeem token key locally when backend is unavailable
 */
export function redeemLocalKey(
  code: string,
  userId: string,
  currentBalance: number
): { success: boolean; tokens: number; message: string; newBalance: number } {
  const cleanCode = code.trim().toUpperCase();
  const redeemed = getRedeemedCodes();

  // Check custom keys created in admin panel
  let customKeys: TokenKey[] = [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEYS_KEY);
    if (raw) customKeys = JSON.parse(raw);
  } catch {}

  const customKey = customKeys.find((k) => k.code.toUpperCase() === cleanCode);

  if (customKey) {
    if (customKey.usedCount >= customKey.maxUses) {
      return {
        success: false,
        tokens: 0,
        message: 'Лимит активаций этого ключа исчерпан',
        newBalance: currentBalance,
      };
    }
    customKey.usedCount += 1;
    customKey.isRedeemed = customKey.usedCount >= customKey.maxUses;
    customKey.redeemedAt = Date.now();
    customKey.redeemedBy = userId;
    localStorage.setItem(CUSTOM_KEYS_KEY, JSON.stringify(customKeys));

    const newBalance = currentBalance + customKey.tokens;
    localStorage.setItem('grokson_tokens_balance', newBalance.toString());
    markCodeRedeemed(cleanCode);

    return {
      success: true,
      tokens: customKey.tokens,
      message: `Успешно начислено +${customKey.tokens.toLocaleString('ru-RU')} токенов!`,
      newBalance,
    };
  }

  // Check built-in promo keys
  const builtin = BUILTIN_KEYS[cleanCode];
  if (builtin) {
    if (redeemed.includes(cleanCode)) {
      return {
        success: false,
        tokens: 0,
        message: 'Вы уже активировали этот промокод на данном устройстве',
        newBalance: currentBalance,
      };
    }

    markCodeRedeemed(cleanCode);
    const newBalance = currentBalance + builtin.tokens;
    localStorage.setItem('grokson_tokens_balance', newBalance.toString());

    return {
      success: true,
      tokens: builtin.tokens,
      message: `Успешно активирован «${builtin.label}». Баланс пополнен на +${builtin.tokens.toLocaleString('ru-RU')} токенов!`,
      newBalance,
    };
  }

  return {
    success: false,
    tokens: 0,
    message: 'Ключ не найден или недействителен. Проверьте правильность ввода.',
    newBalance: currentBalance,
  };
}
