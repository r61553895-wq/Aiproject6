import express, { Request, Response } from 'express';
import { callGigaChat } from './gigachat';
import {
  getOrCreateUser,
  deductUserTokens,
  topUpUserTokens,
  getAllKeys,
  createTokenKey,
  redeemTokenKey,
  revokeTokenKey,
  getAdminStats,
  getAllUsers,
  registerAccount,
  loginAccount,
  getAccountById,
  updateAccountProfile,
  changeAccountPassword,
  getAccountsBatch,
  syncAccounts,
} from './storage';

const DEFAULT_GIGACHAT_KEY =
  process.env.GIGACHAT_AUTH_KEY ||
  'MDFhMDk0NGMtZDg2MS03NTE4LTk1YzktOTY2NmI1ZWIyMTFhOmM2NGRjMDQzLWZjMTMtNGE0Ny1iMGM1LTJjMmM3NGU4ZDQ5MQ==';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'zxcqwerty';

const app = express();
app.use(express.json());

// Enable CORS for local/cross-origin and serverless requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-password'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to verify admin access
function requireAdmin(req: Request, res: Response, next: () => void) {
  const adminPass = req.headers['x-admin-password'] || req.query.admin_password;
  if (adminPass !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Неверный пароль администратора' });
  }
  next();
}

// Router containing all API routes
const apiRouter = express.Router();

// Health check and GigaChat status
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    gigachatConfigured: Boolean(DEFAULT_GIGACHAT_KEY),
    environment: process.env.VERCEL ? 'vercel_serverless' : 'standard',
    timestamp: Date.now(),
  });
});

// Get or register a user session
apiRouter.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const user = getOrCreateUser(userId);
  const account = getAccountById(userId);
  res.json({ user, account });
});

// ----------------- Authentication Routes -----------------

// Register a new account
apiRouter.post('/auth/register', (req, res) => {
  const { username, email, password, name, currentUserId } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Логин и пароль обязательны' });
  }

  const result = registerAccount({
    username,
    email,
    password,
    name,
    currentUserId,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// Login with credentials
apiRouter.post('/auth/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ success: false, message: 'Введите логин и пароль' });
  }

  const result = loginAccount({ login, password });
  if (!result.success) {
    return res.status(401).json(result);
  }

  res.json(result);
});

// Get current account profile
apiRouter.get('/auth/me/:id', (req, res) => {
  const account = getAccountById(req.params.id);
  if (!account) {
    return res.status(404).json({ success: false, message: 'Аккаунт не найден' });
  }
  res.json({ success: true, account });
});

// Fetch batch of accounts by IDs (for multi-account sync on client)
apiRouter.post('/auth/batch', (req, res) => {
  const { ids } = req.body;
  const accounts = getAccountsBatch(ids || []);
  res.json({ success: true, accounts });
});

// Synchronize accounts from client device to ensure accounts are never lost
apiRouter.post('/auth/sync-accounts', (req, res) => {
  const { accounts } = req.body;
  const synced = syncAccounts(Array.isArray(accounts) ? accounts : []);
  res.json({ success: true, accounts: synced });
});

// Update display name / profile
apiRouter.post('/auth/update-profile', (req, res) => {
  const { userId, name } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ success: false, message: 'userId и имя обязательны' });
  }

  const result = updateAccountProfile(userId, { name });
  res.json(result);
});

// Change password
apiRouter.post('/auth/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Все поля обязательны' });
  }

  const result = changeAccountPassword(userId, oldPassword, newPassword);
  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// Redeem a token voucher key
apiRouter.post('/keys/redeem', (req, res) => {
  const { code, userId } = req.body;
  if (!code || !userId) {
    return res.status(400).json({ success: false, message: 'Код ключа и userId обязательны' });
  }

  const result = redeemTokenKey(code, userId);
  res.json(result);
});

// Chat endpoint with GigaChat & token metering
apiRouter.post('/chat', async (req, res) => {
  try {
    const { messages, userId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const currentUserId = userId || 'anonymous_guest';
    const user = getOrCreateUser(currentUserId);

    // Minimum balance check: user must have at least 15 tokens
    if (user.tokensBalance < 15) {
      return res.status(403).json({
        error: 'insufficient_tokens',
        message: 'Недостаточно токенов на балансе. Пожалуйста, активируйте ключ или пополните баланс.',
        balance: user.tokensBalance,
      });
    }

    // Call AI Engine
    let replyText = '';
    let tokensUsed = 0;
    let modelName = 'Grokson Neural Core';

    try {
      const gigaResponse = await callGigaChat(messages, DEFAULT_GIGACHAT_KEY);
      replyText = gigaResponse.text;
      tokensUsed = gigaResponse.usage?.total_tokens || 80;
      modelName = 'Grokson Neural Core';
    } catch (gigaErr: any) {
      console.error('AI provider error in /api/chat:', gigaErr?.message || gigaErr);

      // Graceful fallback response so the user always gets a meaningful answer
      replyText = `Привет! Я вычислительная система Grokson. В настоящий момент нейросетевой шлюз перегружен. Пожалуйста, повторите ваш запрос через несколько секунд.`;
      tokensUsed = 20;
    }

    // Deduct tokens from user's balance
    deductUserTokens(currentUserId, tokensUsed);
    const updatedUser = getOrCreateUser(currentUserId);

    res.json({
      text: replyText,
      tokensUsed,
      remainingBalance: updatedUser.tokensBalance,
      model: modelName,
    });
  } catch (err: any) {
    console.error('Unhandled chat endpoint error:', err);
    res.status(500).json({ error: err?.message || 'Внутренняя ошибка сервера' });
  }
});

// Admin Authentication check
apiRouter.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Авторизация успешна' });
  } else {
    res.status(401).json({ success: false, error: 'Неверный пароль администратора' });
  }
});

// Admin: Get all keys and dashboard stats
apiRouter.get('/admin/keys', requireAdmin, (req, res) => {
  const keys = getAllKeys();
  const stats = getAdminStats();
  res.json({ keys, stats });
});

// Admin: Create new token key (single or batch)
apiRouter.post('/admin/keys/create', requireAdmin, (req, res) => {
  const { tokens, label, maxUses, customCode, count } = req.body;

  if (!tokens || Number(tokens) <= 0) {
    return res.status(400).json({ error: 'Количество токенов должно быть больше 0' });
  }

  const batchCount = Math.min(20, Math.max(1, Number(count) || 1));
  const createdKeys = [];

  for (let i = 0; i < batchCount; i++) {
    const key = createTokenKey({
      tokens: Number(tokens),
      label: label ? `${label}${batchCount > 1 ? ` #${i + 1}` : ''}` : undefined,
      maxUses: Number(maxUses) || 1,
      customCode: batchCount === 1 ? customCode : undefined,
    });
    createdKeys.push(key);
  }

  res.json({
    success: true,
    keys: createdKeys,
    stats: getAdminStats(),
  });
});

// Admin: Revoke/delete key
apiRouter.delete('/admin/keys/:code', requireAdmin, (req, res) => {
  const { code } = req.params;
  const success = revokeTokenKey(code);
  res.json({ success, stats: getAdminStats() });
});

// Admin: Get all users
apiRouter.get('/admin/users', requireAdmin, (req, res) => {
  const users = getAllUsers();
  res.json({ users });
});

// Admin: Top-up tokens for a user directly
apiRouter.post('/admin/users/topup', requireAdmin, (req, res) => {
  const { targetUserId, tokens } = req.body;
  if (!targetUserId || !tokens) {
    return res.status(400).json({ error: 'targetUserId и tokens обязательны' });
  }
  const user = topUpUserTokens(targetUserId, Number(tokens));
  res.json({ success: true, user });
});

// Mount router on BOTH '/api' and '/'
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
