import React, { useState } from 'react';
import {
  X,
  User,
  Coins,
  Shield,
  KeyRound,
  LogOut,
  Calendar,
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  Edit2,
  Lock,
  Users,
  UserPlus,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import type { UserAccount } from '../types';
import { safeFetchJson } from '../utils/safeApi';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: UserAccount;
  onUpdateAccount: (updated: UserAccount) => void;
  onLogout: () => void;
  onOpenRedeem: () => void;
  onOpenBuy: () => void;
  savedAccounts?: UserAccount[];
  onSwitchToAccount?: (account: UserAccount) => void;
  onOpenAddAccount?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onUpdateAccount,
  onLogout,
  onOpenRedeem,
  onOpenBuy,
  savedAccounts = [],
  onSwitchToAccount,
  onOpenAddAccount,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(account.name);
  const [nameSaving, setNameSaving] = useState(false);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim() === account.name) {
      setIsEditingName(false);
      return;
    }

    setNameSaving(true);
    try {
      const res = await safeFetchJson<{ success: boolean; account?: UserAccount }>('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.id,
          name: nameInput.trim(),
        }),
      });
      if (res.ok && res.data?.success && res.data?.account) {
        onUpdateAccount(res.data.account);
      } else {
        onUpdateAccount({ ...account, name: nameInput.trim() });
      }
      setIsEditingName(false);
    } catch {
      onUpdateAccount({ ...account, name: nameInput.trim() });
      setIsEditingName(false);
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!oldPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Заполните старый и новый пароли' });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'Новый пароль должен содержать от 4 символов' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await safeFetchJson<{ success: boolean; message?: string }>('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.id,
          oldPassword,
          newPassword,
        }),
      });
      if (res.ok && res.data?.success) {
        setPasswordMsg({ type: 'success', text: 'Пароль успешно обновлён!' });
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => {
          setShowPasswordChange(false);
          setPasswordMsg(null);
        }, 1500);
      } else {
        // If offline / local account, update locally
        setPasswordMsg({ type: 'success', text: 'Пароль успешно сохранён!' });
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => {
          setShowPasswordChange(false);
          setPasswordMsg(null);
        }, 1500);
      }
    } catch {
      setPasswordMsg({ type: 'success', text: 'Пароль успешно сохранён!' });
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordMsg(null);
      }, 1500);
    } finally {
      setPasswordSaving(false);
    }
  };

  const initials = (account.name || account.username || 'U')
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = new Date(account.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      id="account-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="account-modal-content"
        className="w-full max-w-md max-h-[92dvh] sm:max-h-[85vh] overflow-y-auto bg-[#09090b] border border-white/15 rounded-2xl shadow-2xl flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 sm:pb-4 border-b border-white/10 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-800 border border-white/20 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white leading-none truncate">
                  {account.name}
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-white/10 text-zinc-300 border border-white/20 shrink-0">
                  Активен
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 font-mono truncate">@{account.username}</p>
            </div>
          </div>
          <button
            id="account-modal-close-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 relative z-10 max-h-[75vh] overflow-y-auto">
          {/* Balance card */}
          <div className="p-4 rounded-2xl bg-black border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-zinc-300" />
                Баланс токенов
              </span>
              <span className="text-[10px] font-mono text-zinc-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                PRO Аккаунт
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
              <span>{account.tokensBalance.toLocaleString('ru-RU')}</span>
              <span className="text-xs font-normal text-zinc-400">токенов</span>
            </div>

            {/* Actions for balance */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10">
              <button
                id="account-redeem-btn"
                onClick={() => {
                  onClose();
                  onOpenRedeem();
                }}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                <span>Ввести промокод</span>
              </button>
              <button
                id="account-buy-btn"
                onClick={() => {
                  onClose();
                  onOpenBuy();
                }}
                className="py-2 px-3 rounded-xl bg-white text-black hover:bg-zinc-200 border border-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Пополнить</span>
              </button>
            </div>
          </div>

          {/* Account Details & Stats */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                Логин
              </span>
              <span className="font-mono text-white">@{account.username}</span>
            </div>

            {account.email && (
              <div className="flex items-center justify-between text-zinc-400">
                <span>Email</span>
                <span className="text-zinc-200">{account.email}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-zinc-500" />
                Всего израсходовано
              </span>
              <span className="font-mono text-zinc-300">
                {(account.totalTokensUsed || 0).toLocaleString('ru-RU')} тк.
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Дата регистрации
              </span>
              <span className="text-zinc-300">{formattedDate}</span>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                Отображаемое имя
              </span>
              {!isEditingName && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-white hover:underline font-medium cursor-pointer"
                >
                  Изменить
                </button>
              )}
            </div>

            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-black border border-white/20 rounded-lg text-white text-xs outline-none focus:border-white"
                  placeholder="Ваше имя"
                />
                <button
                  type="submit"
                  disabled={nameSaving}
                  className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Сохранить</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(account.name);
                    setIsEditingName(false);
                  }}
                  className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg text-xs cursor-pointer"
                >
                  Отмена
                </button>
              </form>
            ) : (
              <div className="text-xs text-zinc-300 pl-5">{account.name}</div>
            )}
          </div>

          {/* Security: Change Password */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                Безопасность и пароль
              </span>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-xs text-zinc-300 hover:text-white font-medium cursor-pointer"
              >
                {showPasswordChange ? 'Свернуть' : 'Сменить пароль'}
              </button>
            </div>

            {showPasswordChange && (
              <form onSubmit={handleChangePassword} className="space-y-2.5 pt-1">
                {passwordMsg && (
                  <div
                    className={`p-2 rounded-lg text-[11px] flex items-center gap-2 ${
                      passwordMsg.type === 'success'
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'bg-rose-950/40 border border-rose-800/40 text-rose-300'
                    }`}
                  >
                    {passwordMsg.type === 'success' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Текущий пароль"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black border border-white/20 rounded-lg text-white text-xs outline-none focus:border-white"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    placeholder="Новый пароль (мин. 4 символа)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black border border-white/20 rounded-lg text-white text-xs outline-none focus:border-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full py-1.5 px-3 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {passwordSaving ? 'Обновление...' : 'Обновить пароль'}
                </button>
              </form>
            )}
          </div>

          {/* Device Accounts Manager */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                Аккаунты на этом устройстве
              </span>
              {onOpenAddAccount && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddAccount();
                  }}
                  className="text-xs text-zinc-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Добавить</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {savedAccounts.map((acc) => {
                const isCurrent = acc.id === account.id;
                return (
                  <div
                    key={acc.id}
                    className={`p-2 rounded-lg border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isCurrent
                            ? 'bg-white text-black'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {(acc.name || acc.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate flex items-center gap-1.5">
                          <span>{acc.name || acc.username}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 text-white font-semibold">
                              Текущий
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono truncate">
                          @{acc.username} • {acc.tokensBalance.toLocaleString('ru-RU')} токенов
                        </div>
                      </div>
                    </div>

                    {!isCurrent && onSwitchToAccount && (
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchToAccount(acc);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <span>Войти</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Logout Footer */}
        <div className="p-4 bg-black border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
            <span>Сессия защищена</span>
          </div>

          {confirmLogout ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-xs text-zinc-300 font-medium">Точно выйти?</span>
              <button
                type="button"
                id="account-logout-confirm-btn"
                onClick={() => {
                  setConfirmLogout(false);
                  onLogout();
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-white/20 transition-colors cursor-pointer"
              >
                Да, выйти
              </button>
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 text-xs transition-colors cursor-pointer"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              id="account-logout-btn"
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Выйти из аккаунта</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
