import React, { useState } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  Users,
  Trash2,
} from 'lucide-react';
import type { UserAccount } from '../types';
import {
  safeFetchJson,
  registerLocalAccount,
  loginLocalAccount,
  saveAccountPassword,
  syncSavedAccountsWithServer,
  getLocalPasswords,
} from '../utils/safeApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: UserAccount) => void;
  currentUserId: string;
  initialMode?: 'login' | 'register';
  savedAccounts?: UserAccount[];
  onQuickSwitch?: (account: UserAccount) => void;
  onRemoveSavedAccount?: (accountId: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserId,
  initialMode = 'login',
  savedAccounts = [],
  onQuickSwitch,
  onRemoveSavedAccount,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Sync mode with initialMode prop when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  // Form fields
  const [loginField, setLoginField] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginField.trim() || !password) {
      setError('Пожалуйста, заполните логин и пароль');
      return;
    }

    setLoading(true);
    try {
      // First attempt: Server API
      const result = await safeFetchJson<{ success: boolean; message?: string; account: UserAccount }>(
        '/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: loginField.trim(),
            password,
          }),
        },
        7000
      );

      if (result.ok && result.data?.success && result.data?.account) {
        saveAccountPassword(result.data.account.username, password);
        syncSavedAccountsWithServer();
        setSuccessMsg('Вход выполнен успешно!');
        setTimeout(() => {
          onSuccess(result.data!.account);
          onClose();
        }, 300);
        return;
      }

      // If server returned user not found or server was restarted: check local storage
      const localCheck = loginLocalAccount({ login: loginField.trim(), password });
      if (localCheck.success && localCheck.account) {
        // Restore account to server memoryStore so future requests sync cleanly
        syncSavedAccountsWithServer();
        setSuccessMsg('Вход выполнен успешно!');
        setTimeout(() => {
          onSuccess(localCheck.account!);
          onClose();
        }, 300);
        return;
      }

      if (!result.isHtmlOrEmpty && result.data?.message) {
        setError(result.data.message);
        return;
      }

      setError(localCheck.message || 'Неверный логин или пароль. Проверьте данные или зарегистрируйтесь.');
    } catch (err: any) {
      // Offline fallback
      const localResult = loginLocalAccount({ login: loginField.trim(), password });
      if (localResult.success && localResult.account) {
        syncSavedAccountsWithServer();
        setSuccessMsg('Вход выполнен успешно!');
        setTimeout(() => {
          onSuccess(localResult.account!);
          onClose();
        }, 300);
      } else {
        setError(localResult.message || 'Ошибка входа. Проверьте логин или зарегистрируйтесь.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUser = registerUsername.trim();
    if (!cleanUser || cleanUser.length < 3) {
      setError('Логин должен содержать не менее 3 символов');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUser)) {
      setError('Логин может содержать только латинские буквы, цифры и знаки _ -');
      return;
    }

    if (!password || password.length < 4) {
      setError('Пароль должен содержать минимум 4 символа');
      return;
    }

    if (password !== confirmPassword) {
      setError('Введённые пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      // First attempt: Server API
      const result = await safeFetchJson<{ success: boolean; message?: string; account: UserAccount }>(
        '/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUser,
            email: registerEmail.trim() || undefined,
            name: registerName.trim() || cleanUser,
            password,
            currentUserId,
          }),
        },
        8000
      );

      if (result.ok && result.data?.success && result.data?.account) {
        // Guarantee password and account are also preserved locally in browser
        saveAccountPassword(cleanUser, password);
        registerLocalAccount({
          username: cleanUser,
          email: registerEmail.trim() || undefined,
          name: registerName.trim() || cleanUser,
          password,
          currentUserId,
        });
        syncSavedAccountsWithServer();

        setSuccessMsg(result.data.message || 'Аккаунт успешно создан! Начислено +10 000 токенов.');
        setTimeout(() => {
          onSuccess(result.data!.account);
          onClose();
        }, 400);
        return;
      }

      // If server explicitly returned a message (e.g. username taken on server)
      if (!result.isHtmlOrEmpty && result.data?.message) {
        setError(result.data.message);
        return;
      }

      // Fallback: local registration
      const localResult = registerLocalAccount({
        username: cleanUser,
        email: registerEmail.trim() || undefined,
        name: registerName.trim() || cleanUser,
        password,
        currentUserId,
      });

      if (localResult.success && localResult.account) {
        saveAccountPassword(cleanUser, password);
        syncSavedAccountsWithServer();
        setSuccessMsg(localResult.message);
        setTimeout(() => {
          onSuccess(localResult.account!);
          onClose();
        }, 400);
      } else {
        setError(localResult.message);
      }
    } catch (err: any) {
      const localResult = registerLocalAccount({
        username: cleanUser,
        email: registerEmail.trim() || undefined,
        name: registerName.trim() || cleanUser,
        password,
        currentUserId,
      });

      if (localResult.success && localResult.account) {
        saveAccountPassword(cleanUser, password);
        syncSavedAccountsWithServer();
        setSuccessMsg(localResult.message);
        setTimeout(() => {
          onSuccess(localResult.account!);
          onClose();
        }, 400);
      } else {
        setError(localResult.message || 'Ошибка регистрации. Попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="auth-modal-content"
        className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-[#09090b] border border-white/15 rounded-2xl shadow-2xl flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-white/10 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">
                {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация аккаунта'}
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                {mode === 'login'
                  ? 'Синхронизация баланса и диалогов'
                  : 'Получите +10 000 токенов в подарок'}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="p-4 pb-0 relative z-10">
          <div className="grid grid-cols-2 p-1 bg-white/5 rounded-xl border border-white/10 text-xs font-medium">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                resetForm();
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Вход
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                resetForm();
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Создать аккаунт</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${mode === 'register' ? 'bg-black/15 text-black' : 'bg-white/10 text-zinc-300'}`}>
                +10K
              </span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-white/10 border border-white/20 flex items-start gap-2.5 text-xs text-white">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-4 relative z-10">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              {/* Saved accounts on this device */}
              {savedAccounts.length > 0 && (
                <div className="space-y-1.5 pb-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-zinc-300" />
                      Сохранённые аккаунты:
                    </span>
                    <span className="text-[10px] text-zinc-500">Нажмите для выбора</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-0.5">
                    {savedAccounts.map((acc) => {
                      const isSelected = loginField.toLowerCase() === acc.username.toLowerCase();
                      return (
                        <div
                          key={acc.id}
                          onClick={() => {
                            setLoginField(acc.username);
                            setError(null);
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white/15 border-white/40 text-white shadow-sm'
                              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-zinc-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 border border-white/20">
                              {(acc.name || acc.username).slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                                <span>{acc.name || acc.username}</span>
                                <span className="text-[10px] text-zinc-400 font-normal">@{acc.username}</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                {acc.tokensBalance.toLocaleString('ru-RU')} токенов
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {onQuickSwitch && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onQuickSwitch(acc);
                                  onClose();
                                }}
                                className="px-2 py-0.5 rounded bg-white text-black hover:bg-zinc-200 text-[10px] font-medium transition-colors"
                              >
                                Выбрать
                              </button>
                            )}
                            {onRemoveSavedAccount && (
                              <button
                                type="button"
                                title="Удалить из списка на этом устройстве"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveSavedAccount(acc.id);
                                }}
                                className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Логин или Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-login-input"
                    type="text"
                    required
                    value={loginField}
                    onChange={(e) => setLoginField(e.target.value)}
                    placeholder="Введите логин или email"
                    className="w-full pl-9 pr-3 py-2.5 bg-black border border-white/15 focus:border-white rounded-xl text-white text-sm placeholder:text-zinc-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Пароль</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ваш пароль"
                    className="w-full pl-9 pr-10 py-2.5 bg-black border border-white/15 focus:border-white rounded-xl text-white text-sm placeholder:text-zinc-600 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="auth-submit-login"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Войти</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Registration bonus callout */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-zinc-300 shrink-0" />
                <span className="text-[11px] text-zinc-300">
                  При регистрации вы получаете <strong>10 000 токенов</strong> и вечное сохранение баланса.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Логин *
                  </label>
                  <div className="relative">
                    <input
                      id="auth-reg-username"
                      type="text"
                      required
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      placeholder="alex_99"
                      className="w-full px-3 py-2 bg-black border border-white/15 focus:border-white rounded-xl text-white text-xs placeholder:text-zinc-600 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Имя (по желанию)
                  </label>
                  <div className="relative">
                    <input
                      id="auth-reg-name"
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Александр"
                      className="w-full px-3 py-2 bg-black border border-white/15 focus:border-white rounded-xl text-white text-xs placeholder:text-zinc-600 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  Email (по желанию)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="auth-reg-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-9 pr-3 py-2 bg-black border border-white/15 focus:border-white rounded-xl text-white text-xs placeholder:text-zinc-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Пароль *
                  </label>
                  <input
                    id="auth-reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Мин. 4 символа"
                    className="w-full px-3 py-2 bg-black border border-white/15 focus:border-white rounded-xl text-white text-xs placeholder:text-zinc-600 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                    Повтор пароля *
                  </label>
                  <input
                    id="auth-reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите пароль"
                    className="w-full px-3 py-2 bg-black border border-white/15 focus:border-white rounded-xl text-white text-xs placeholder:text-zinc-600 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Скрыть пароли' : 'Показать пароли'}</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  id="auth-submit-register"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 text-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Зарегистрироваться (+10 000 бонусов)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security badge footer */}
        <div className="p-3 bg-black border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>Данные учётной записи зашифрованы алгоритмом SHA-256</span>
        </div>
      </div>
    </div>
  );
};
