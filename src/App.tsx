import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, ChatMessage, UserSession, UserAccount } from './types';
import { Sidebar } from './components/Sidebar';
import { WelcomeBanner } from './components/WelcomeBanner';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { RedeemKeyModal } from './components/RedeemKeyModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { BuyTokensModal } from './components/BuyTokensModal';
import { AuthModal } from './components/AuthModal';
import { AccountModal } from './components/AccountModal';
import { GroksonLogo } from './components/GroksonLogo';
import { generateEdgeAIResponse } from './utils/aiFallback';
import { safeFetchJson, redeemLocalKey, syncSavedAccountsWithServer } from './utils/safeApi';
import {
  Menu,
  Sparkles,
  Zap,
  ShieldCheck,
  RotateCcw,
  MessageSquarePlus,
  User,
} from 'lucide-react';

const SESSIONS_STORAGE_KEY = 'grokson_chats_v1';
const USER_ID_STORAGE_KEY = 'grokson_user_id';
const GUEST_ID_KEY = 'grokson_guest_user_id';
const LOCAL_BALANCE_KEY = 'grokson_tokens_balance';
const CURRENT_USER_KEY = 'grokson_current_user';
const SAVED_ACCOUNTS_KEY = 'grokson_saved_accounts';

const getSessionsKey = (id: string) => (id ? `grokson_sessions_${id}` : 'grokson_sessions_guest');

const loadSessionsFor = (uid: string): ChatSession[] => {
  try {
    const key = getSessionsKey(uid);
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse saved sessions for user:', uid, e);
  }

  // Legacy fallback if migrating from single storage
  try {
    const legacy = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const initialId = `session_${Date.now()}`;
  return [
    {
      id: initialId,
      title: 'Новый диалог',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
};

export default function App() {
  // Current logged in account state (source of truth for identity)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse current user:', e);
    }
    return null;
  });

  // User identification (if logged in, MUST be currentUser.id; otherwise guest ID)
  const [userId, setUserId] = useState<string>(() => {
    try {
      const savedUserStr = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        if (u && u.id) return u.id;
      }
      let guest = localStorage.getItem(GUEST_ID_KEY);
      if (!guest || guest.startsWith('usr_')) {
        guest = localStorage.getItem(USER_ID_STORAGE_KEY) || '';
        if (!guest || guest.startsWith('usr_')) {
          guest = `user_${Math.random().toString(36).substring(2, 9)}`;
        }
        localStorage.setItem(GUEST_ID_KEY, guest);
      }
      return guest;
    } catch (e) {}
    return `user_${Math.random().toString(36).substring(2, 9)}`;
  });

  // Saved accounts history on this device
  const [savedAccounts, setSavedAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) return list;
      }
    } catch (e) {}
    // Seed with currentUser if available
    try {
      const cur = localStorage.getItem(CURRENT_USER_KEY);
      if (cur) {
        const u = JSON.parse(cur);
        if (u && u.id) return [u];
      }
    } catch (e) {}
    return [];
  });

  // Token Balance (0 tokens by default before registration)
  const [tokensBalance, setTokensBalance] = useState<number>(() => {
    const savedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u && typeof u.tokensBalance === 'number') return u.tokensBalance;
      } catch (e) {}
    }
    const saved = localStorage.getItem(LOCAL_BALANCE_KEY);
    return saved ? Number(saved) : 0;
  });

  // Sidebar & Modals state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const openAuthWithMode = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthOpen(true);
  };

  // Chat sessions state (strictly isolated per user/account)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const initialUserStr = localStorage.getItem(CURRENT_USER_KEY);
    let initialUid = '';
    if (initialUserStr) {
      try {
        const u = JSON.parse(initialUserStr);
        if (u && u.id) initialUid = u.id;
      } catch (e) {}
    }
    if (!initialUid) {
      initialUid = localStorage.getItem(GUEST_ID_KEY) || 'guest';
    }
    return loadSessionsFor(initialUid);
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || `session_${Date.now()}`;
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save sessions to localStorage for the active user
  useEffect(() => {
    try {
      const key = getSessionsKey(userId);
      localStorage.setItem(key, JSON.stringify(sessions));
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [sessions, userId]);

  // Save balance to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_BALANCE_KEY, tokensBalance.toString());
  }, [tokensBalance]);

  // Sync user balance with backend
  const syncUserBalance = async () => {
    try {
      const activeId = currentUser ? currentUser.id : userId;
      const res = await safeFetchJson<{ user?: UserSession; account?: UserAccount }>(
        `/api/user/${activeId}`,
        undefined,
        4000
      );
      if (res.ok && res.data) {
        const data = res.data;
        if (data.user && typeof data.user.tokensBalance === 'number') {
          setTokensBalance(data.user.tokensBalance);
        }
        if (data.account) {
          setCurrentUser(data.account);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.account));
          setSavedAccounts((prev) => {
            const exists = prev.some((a) => a.id === data.account!.id);
            const updated = exists
              ? prev.map((a) => (a.id === data.account!.id ? data.account! : a))
              : [data.account!, ...prev];
            localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
            return updated;
          });
        }
      }

      // Sync batch of saved accounts balances
      if (savedAccounts.length > 0) {
        const batchRes = await safeFetchJson<{ accounts?: UserAccount[] }>(
          '/api/auth/batch',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: savedAccounts.map((a) => a.id) }),
          },
          4000
        );
        if (batchRes.ok && batchRes.data?.accounts) {
          const batchAccounts = batchRes.data.accounts;
          if (Array.isArray(batchAccounts) && batchAccounts.length > 0) {
            setSavedAccounts((prev) => {
              const map = new Map<string, UserAccount>();
              for (const acc of batchAccounts) {
                map.set(acc.id, acc);
              }
              const synced = prev.map((a) => map.get(a.id) || a);
              localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(synced));
              return synced;
            });
          }
        }
      }
    } catch {
      // Local balance is already preserved
    }
  };

  // Successful login or registration handler
  const handleAuthSuccess = (account: UserAccount) => {
    // Save current active sessions before switching
    try {
      localStorage.setItem(getSessionsKey(userId), JSON.stringify(sessions));
    } catch (e) {}

    setCurrentUser(account);
    setUserId(account.id);
    setTokensBalance(account.tokensBalance);

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(account));
    localStorage.setItem(USER_ID_STORAGE_KEY, account.id);

    // Update saved accounts list
    setSavedAccounts((prev) => {
      const filtered = prev.filter(
        (a) => a.id !== account.id && a.username.toLowerCase() !== account.username.toLowerCase()
      );
      const updated = [account, ...filtered];
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      return updated;
    });

    // Load sessions specifically for this user account
    const loaded = loadSessionsFor(account.id);
    setSessions(loaded);
    setCurrentSessionId(loaded[0]?.id || `session_${Date.now()}`);
  };

  // Switch to another saved account
  const handleSwitchToAccount = (account: UserAccount) => {
    if (currentUser?.id === account.id) return;

    // Save current sessions
    try {
      localStorage.setItem(getSessionsKey(userId), JSON.stringify(sessions));
    } catch (e) {}

    setCurrentUser(account);
    setUserId(account.id);
    setTokensBalance(account.tokensBalance);

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(account));
    localStorage.setItem(USER_ID_STORAGE_KEY, account.id);

    const loaded = loadSessionsFor(account.id);
    setSessions(loaded);
    setCurrentSessionId(loaded[0]?.id || `session_${Date.now()}`);
  };

  // Remove an account from device list
  const handleRemoveSavedAccount = (accountId: string) => {
    setSavedAccounts((prev) => {
      const updated = prev.filter((a) => a.id !== accountId);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
      return updated;
    });

    // If removing currently logged in account, log out
    if (currentUser?.id === accountId) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    // Save current user sessions
    try {
      localStorage.setItem(getSessionsKey(userId), JSON.stringify(sessions));
    } catch (e) {}

    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);

    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId || guestId.startsWith('usr_')) {
      guestId = `user_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }

    setUserId(guestId);
    localStorage.setItem(USER_ID_STORAGE_KEY, guestId);

    // Load guest sessions
    const guestSessions = loadSessionsFor(guestId);
    setSessions(guestSessions);
    setCurrentSessionId(guestSessions[0]?.id || `session_${Date.now()}`);

    // Fetch guest balance (0 tokens by default before registration)
    safeFetchJson<{ user?: { tokensBalance: number } }>(`/api/user/${guestId}`, undefined, 3000)
      .then((res) => {
        if (res.ok && res.data?.user && typeof res.data.user.tokensBalance === 'number') {
          setTokensBalance(res.data.user.tokensBalance);
        } else {
          setTokensBalance(0);
        }
      })
      .catch(() => setTokensBalance(0));

    setIsAccountOpen(false);
  };

  const handleUpdateAccount = (updated: UserAccount) => {
    setCurrentUser(updated);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    if (typeof updated.tokensBalance === 'number') {
      setTokensBalance(updated.tokensBalance);
    }
    setSavedAccounts((prev) => {
      const list = prev.map((a) => (a.id === updated.id ? updated : a));
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(list));
      return list;
    });
  };

  useEffect(() => {
    syncSavedAccountsWithServer();
    syncUserBalance();

    // Check URL parameters for direct activation key (e.g. ?key=CODE)
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get('key');
    if (urlKey) {
      handleRedeemKey(urlKey).then(() => {
        // Clean URL parameter without reloading page
        window.history.replaceState({}, document.title, window.location.pathname);
      });
    }
  }, [userId]);

  // Current session getter
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isLoading]);

  // Create new chat
  const handleNewChat = () => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'Новый диалог',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setInput('');
  };

  // Delete chat
  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fallbackId = `session_${Date.now()}`;
      setSessions([
        {
          id: fallbackId,
          title: 'Новый диалог',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);
      setCurrentSessionId(fallbackId);
    } else {
      setSessions(remaining);
      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0].id);
      }
    }
  };

  // Clear all chats
  const handleClearAllSessions = () => {
    if (confirm('Вы уверены, что хотите удалить все диалоги?')) {
      const freshId = `session_${Date.now()}`;
      setSessions([
        {
          id: freshId,
          title: 'Новый диалог',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);
      setCurrentSessionId(freshId);
    }
  };

  // Redeem key logic
  const handleRedeemKey = async (code: string) => {
    const activeId = currentUser ? currentUser.id : userId;
    try {
      const res = await safeFetchJson<{
        success: boolean;
        message: string;
        tokens: number;
        newBalance: number;
      }>(
        '/api/keys/redeem',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, userId: activeId }),
        },
        5000
      );

      if (res.ok && res.data?.success && typeof res.data.newBalance === 'number') {
        setTokensBalance(res.data.newBalance);
        if (currentUser) {
          const updated = { ...currentUser, tokensBalance: res.data.newBalance };
          setCurrentUser(updated);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
          setSavedAccounts((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
        }
        return res.data;
      }

      // If server explicitly returned an error message in JSON
      if (!res.isHtmlOrEmpty && res.data?.message) {
        return res.data;
      }

      // Offline / Vercel static fallback
      const local = redeemLocalKey(code, activeId, tokensBalance);
      if (local.success) {
        setTokensBalance(local.newBalance);
        if (currentUser) {
          const updated = { ...currentUser, tokensBalance: local.newBalance };
          setCurrentUser(updated);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
          setSavedAccounts((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
        }
      }
      return local;
    } catch {
      const local = redeemLocalKey(code, activeId, tokensBalance);
      if (local.success) {
        setTokensBalance(local.newBalance);
        if (currentUser) {
          const updated = { ...currentUser, tokensBalance: local.newBalance };
          setCurrentUser(updated);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
          setSavedAccounts((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
        }
      }
      return local;
    }
  };

  // Send message to Grokson
  const handleSendMessage = async (customPrompt?: string) => {
    // Mandatory registration check
    if (!currentUser) {
      openAuthWithMode('register');
      return;
    }

    const messageText = (customPrompt || input).trim();
    if (!messageText || isLoading || tokensBalance < 15) return;

    // Build user message
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    // Update session title from first user query if still "Новый диалог"
    const isFirstMessage = currentSession.messages.length === 0;
    const newTitle = isFirstMessage
      ? messageText.length > 35
        ? messageText.slice(0, 35) + '...'
        : messageText
      : currentSession.title;

    const updatedMessages = [...currentSession.messages, userMsg];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, title: newTitle, messages: updatedMessages, updatedAt: Date.now() }
          : s
      )
    );

    setInput('');
    setIsLoading(true);

    // Check token balance before sending
    if (tokensBalance < 15) {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'У вас недостаточно токенов для генерации ответа. Пожалуйста, пополните баланс с помощью ключа доступа.',
        timestamp: Date.now(),
        error: true,
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...updatedMessages, errorMsg], updatedAt: Date.now() }
            : s
        )
      );
      setIsLoading(false);
      setIsRedeemOpen(true);
      return;
    }

    try {
      // Prepare payload for server
      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let answered = false;
      const activeId = currentUser ? currentUser.id : userId;

      try {
        const result = await safeFetchJson<{
          text?: string;
          tokensUsed?: number;
          model?: string;
          remainingBalance?: number;
          error?: string;
        }>(
          '/api/chat',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: payloadMessages,
              userId: activeId,
            }),
          },
          25000
        );

        const data = result.data;
        if (result.ok && data?.text) {
          const assistantMsg: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: data.text,
            timestamp: Date.now(),
            tokensUsed: data.tokensUsed,
            model: data.model || 'Grokson Intelligence',
          };

          if (typeof data.remainingBalance === 'number') {
            setTokensBalance(data.remainingBalance);
            if (currentUser) {
              const updated = { ...currentUser, tokensBalance: data.remainingBalance };
              setCurrentUser(updated);
              localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
              setSavedAccounts((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a))
              );
            }
          } else if (data.tokensUsed) {
            setTokensBalance((prev) => {
              const next = Math.max(0, prev - data.tokensUsed);
              if (currentUser) {
                const updated = { ...currentUser, tokensBalance: next };
                setCurrentUser(updated);
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
                setSavedAccounts((sp) =>
                  sp.map((a) => (a.id === updated.id ? updated : a))
                );
              }
              return next;
            });
          }

          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId
                ? { ...s, messages: [...updatedMessages, assistantMsg], updatedAt: Date.now() }
                : s
            )
          );
          answered = true;
        } else if (data?.error === 'insufficient_tokens') {
          setIsRedeemOpen(true);
          const errorMsg: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: 'Недостаточно токенов на балансе. Пожалуйста, введите ключ пополнения.',
            timestamp: Date.now(),
            error: true,
          };
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId
                ? { ...s, messages: [...updatedMessages, errorMsg], updatedAt: Date.now() }
                : s
            )
          );
          answered = true;
        }
      } catch (fetchErr) {
        console.warn('Backend gateway unavailable, engaging Grokson Edge Neural Core:', fetchErr);
      }

      // If backend failed or is starting up, seamlessly engage Grokson Edge Neural Core
      if (!answered) {
        const fallback = generateEdgeAIResponse(messageText);
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: fallback.text,
          timestamp: Date.now(),
          tokensUsed: fallback.tokensUsed,
          model: fallback.model,
        };

        setTokensBalance((prev) => {
          const next = Math.max(0, prev - fallback.tokensUsed);
          if (currentUser) {
            const updated = { ...currentUser, tokensBalance: next };
            setCurrentUser(updated);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
            setSavedAccounts((sp) =>
              sp.map((a) => (a.id === updated.id ? updated : a))
            );
          }
          return next;
        });

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: [...updatedMessages, assistantMsg], updatedAt: Date.now() }
              : s
          )
        );
      }
    } catch (err: any) {
      const fallback = generateEdgeAIResponse(messageText);
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: fallback.text,
        timestamp: Date.now(),
        tokensUsed: fallback.tokensUsed,
        model: fallback.model,
      };

      setTokensBalance((prev) => Math.max(0, prev - fallback.tokensUsed));

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...updatedMessages, assistantMsg], updatedAt: Date.now() }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full max-w-[100vw] overflow-x-hidden overflow-y-hidden bg-black text-zinc-100 font-sans">
      {/* ChatGPT-style Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        tokensBalance={tokensBalance}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onLogout={handleLogout}
        onSwitchAccount={() => setIsAuthOpen(true)}
        onOpenRedeem={() => setIsRedeemOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenBuy={() => setIsBuyOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-black">
        {/* Top Navigation Bar */}
        <header className="h-14 sm:h-16 px-2.5 sm:px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/90 backdrop-blur-md z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              aria-label="Открыть меню"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden md:flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-zinc-500 font-display shrink-0">Диалог:</span>
              <span className="text-xs text-zinc-200 font-medium truncate max-w-xs sm:max-w-md">
                {currentSession.title}
              </span>
            </div>

            <div className="md:hidden min-w-0">
              <GroksonLogo size="sm" showText={true} />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Account / Login button */}
            {currentUser ? (
              <button
                id="header-account-btn"
                onClick={() => setIsAccountOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-2 pr-2 sm:pr-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 transition-colors cursor-pointer"
                title="Личный кабинет"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {(currentUser.name || currentUser.username).slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs text-white font-medium max-w-[80px] sm:max-w-[110px] truncate hidden sm:inline">
                  {currentUser.name}
                </span>
              </button>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => openAuthWithMode('register')}
                className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Регистрация / Вход</span>
                <span className="sm:hidden text-[11px]">Войти</span>
              </button>
            )}

            {/* Token balance chip */}
            <button
              onClick={() => setIsRedeemOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 transition-colors cursor-pointer"
              title="Нажмите, чтобы пополнить баланс"
            >
              <Zap className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
              <span className="text-xs font-mono font-bold text-white">
                {tokensBalance.toLocaleString('ru-RU')}
              </span>
              <span className="text-[10px] text-zinc-400 font-sans hidden sm:inline">ток.</span>
            </button>

            {/* Top up / Tariffs button */}
            <button
              onClick={() => setIsBuyOpen(true)}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span>Тарифы</span>
            </button>

            {/* Admin shortcut */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Панель управления"
            >
              <ShieldCheck className="w-4 h-4 text-zinc-300" />
            </button>
          </div>
        </header>

        {/* Conversation Stream or Welcome Hero */}
        <div className="flex-1 overflow-y-auto">
          {currentSession.messages.length === 0 ? (
            <WelcomeBanner
              onSelectPrompt={(p) => handleSendMessage(p)}
              tokensBalance={tokensBalance}
              onOpenRedeem={() => setIsRedeemOpen(true)}
              currentUser={currentUser}
              onOpenAuth={openAuthWithMode}
              savedAccounts={savedAccounts}
              onSelectSavedAccount={handleSwitchToAccount}
            />
          ) : (
            <div className="py-4 space-y-1">
              {currentSession.messages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  onRetry={() => {
                    // Retry last user message
                    const lastUser = currentSession.messages
                      .slice()
                      .reverse()
                      .find((m) => m.role === 'user');
                    if (lastUser) handleSendMessage(lastUser.content);
                  }}
                />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="py-4 px-6 max-w-4xl mx-auto flex items-center gap-3 text-zinc-400 text-xs sm:text-sm">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-zinc-300 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-medium text-zinc-300">Grokson думает</span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input Bottom Section */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          isLoading={isLoading}
          tokensBalance={tokensBalance}
          onOpenRedeem={() => setIsRedeemOpen(true)}
          currentUser={currentUser}
          onOpenAuth={openAuthWithMode}
        />
      </main>

      {/* Redeem Voucher Key Modal */}
      <RedeemKeyModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
        onRedeem={handleRedeemKey}
        currentBalance={tokensBalance}
        onOpenBuy={() => setIsBuyOpen(true)}
      />

      {/* Admin Control Panel Modal (password: zxcqwerty) */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshUserBalance={syncUserBalance}
        currentUserId={userId}
      />

      {/* Buy Tokens / Packages Modal */}
      <BuyTokensModal
        isOpen={isBuyOpen}
        onClose={() => setIsBuyOpen(false)}
        onOpenRedeem={() => setIsRedeemOpen(true)}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        currentUserId={userId}
        initialMode={authModalMode}
        savedAccounts={savedAccounts}
        onQuickSwitch={handleSwitchToAccount}
        onRemoveSavedAccount={handleRemoveSavedAccount}
      />

      {/* User Account / Profile Modal */}
      {currentUser && (
        <AccountModal
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
          account={currentUser}
          onUpdateAccount={handleUpdateAccount}
          onLogout={handleLogout}
          onOpenRedeem={() => setIsRedeemOpen(true)}
          onOpenBuy={() => setIsBuyOpen(true)}
          savedAccounts={savedAccounts}
          onSwitchToAccount={handleSwitchToAccount}
          onOpenAddAccount={() => openAuthWithMode('register')}
        />
      )}
    </div>
  );
}
