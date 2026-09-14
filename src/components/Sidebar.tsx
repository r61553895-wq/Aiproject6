import React from 'react';
import { GroksonLogo } from './GroksonLogo';
import { ChatSession, UserAccount } from '../types';
import {
  Plus,
  MessageSquare,
  Trash2,
  Zap,
  ShieldCheck,
  PanelLeftClose,
  Sparkles,
  User,
  ArrowRight,
  LogOut,
  Users,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
  tokensBalance: number;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onOpenAccount: () => void;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
  onOpenRedeem: () => void;
  onOpenAdmin: () => void;
  onOpenBuy: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAllSessions,
  tokensBalance,
  currentUser,
  onOpenAuth,
  onOpenAccount,
  onLogout,
  onSwitchAccount,
  onOpenRedeem,
  onOpenAdmin,
  onOpenBuy,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[84vw] max-w-[320px] sm:w-80 bg-[#000000] border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out overscroll-contain select-none ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between pt-[max(0.875rem,env(safe-area-inset-top))]">
          <GroksonLogo size="sm" />
          <button
            onClick={onClose}
            aria-label="Закрыть меню"
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold text-xs uppercase tracking-wider transition-all active:scale-98 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Новый диалог</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[11px] font-mono tracking-wider uppercase text-zinc-500 px-3 py-1">
            История диалогов
          </div>

          {sessions.length === 0 ? (
            <div className="text-xs text-zinc-500 text-center py-8 px-4">
              Пока нет сохранённых диалогов. Задайте вопрос Grokson!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white font-medium shadow-xs border border-white/10'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                  <span className="truncate flex-1 text-xs sm:text-sm">{session.title}</span>

                  {/* Delete session button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    title="Удалить диалог"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-zinc-200 hover:bg-white/10 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User Account / Auth Section */}
        <div className="p-3 border-t border-white/10">
          {currentUser ? (
            <div className="flex items-center gap-1.5 w-full">
              <button
                id="sidebar-account-btn"
                onClick={() => {
                  onOpenAccount();
                  if (window.innerWidth < 768) onClose();
                }}
                className="flex-1 min-w-0 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(currentUser.name || currentUser.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono truncate">@{currentUser.username}</div>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-300 font-mono font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/10 shrink-0">
                  Кабинет
                </span>
              </button>

              {onSwitchAccount && (
                <button
                  id="sidebar-switch-btn"
                  onClick={() => {
                    onSwitchAccount();
                    if (window.innerWidth < 768) onClose();
                  }}
                  title="Сменить / Добавить аккаунт"
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}

              {onLogout && (
                <button
                  id="sidebar-logout-btn"
                  onClick={() => {
                    onLogout();
                    if (window.innerWidth < 768) onClose();
                  }}
                  title="Выйти из аккаунта"
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              id="sidebar-login-btn"
              onClick={() => {
                onOpenAuth();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-between transition-all group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Войти в аккаунт</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">Бонус +10 000 токенов</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Token Balance Card */}
        <div className="p-3 border-t border-white/10 pt-0">
          <div className="rounded-2xl bg-[#09090b] border border-white/10 p-3.5 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Zap className="w-3.5 h-3.5 text-zinc-300" />
                <span>Баланс токенов</span>
              </div>
              <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                {tokensBalance.toLocaleString('ru-RU')}
              </span>
            </div>

            {/* Token Progress visual */}
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-white"
                style={{ width: `${tokensBalance <= 0 ? 0 : Math.min(100, Math.max(5, (tokensBalance / 25000) * 100))}%` }}
              />
            </div>

            {/* Actions for tokens */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  onOpenRedeem();
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-zinc-300" />
                <span>Ввести ключ</span>
              </button>
              <button
                onClick={() => {
                  onOpenBuy();
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Тарифы</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/10 space-y-1 bg-[#000000] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* Admin Panel button - without displaying the password */}
          <button
            onClick={() => {
              onOpenAdmin();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-zinc-300" />
              <span className="font-medium">Панель управления</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Доступ</span>
          </button>

          {/* Clear history */}
          {sessions.length > 0 && (
            <button
              onClick={() => {
                onClearAllSessions();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить все диалоги</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
