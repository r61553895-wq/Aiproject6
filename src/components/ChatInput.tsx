import React, { useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, Zap, UserPlus } from 'lucide-react';
import type { UserAccount } from '../types';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  tokensBalance: number;
  onOpenRedeem: () => void;
  currentUser?: UserAccount | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  isLoading,
  tokensBalance,
  onOpenRedeem,
  currentUser,
  onOpenAuth,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isRegistered = Boolean(currentUser);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isRegistered) {
        if (onOpenAuth) onOpenAuth('register');
        return;
      }
      if (input.trim() && !isLoading && tokensBalance >= 15) {
        onSend();
      }
    }
  };

  const isLowBalance = tokensBalance < 15;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4 pt-1">
      {/* Mandatory Registration Banner for unregistered visitors */}
      {!isRegistered && (
        <div className="mb-2 p-3 sm:p-3.5 rounded-2xl bg-white/[0.04] border border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs sm:text-sm text-zinc-200 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="leading-snug">
              <span className="font-semibold text-white">Требуется регистрация: </span>
              <span className="text-zinc-400">чтобы начать использовать Grokson AI, создайте аккаунт и получите +10 000 токенов в подарок.</span>
            </div>
          </div>
          <button
            id="chat-register-gate-btn"
            onClick={() => onOpenAuth && onOpenAuth('register')}
            className="self-stretch sm:self-auto shrink-0 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Зарегистрироваться</span>
          </button>
        </div>
      )}

      {/* Low balance warning banner if user has no tokens */}
      {isRegistered && isLowBalance && (
        <div className="mb-2 p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="leading-snug">У вас закончились токены. Активируйте ключ доступа для продолжения общения.</span>
          </div>
          <button
            onClick={onOpenRedeem}
            className="self-end sm:self-auto shrink-0 px-3 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Ввести ключ</span>
          </button>
        </div>
      )}

      {/* Input container */}
      <div
        className={`relative rounded-2xl bg-[#09090b] border ${
          !isRegistered ? 'border-white/20' : 'border-white/10'
        } focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20 transition-all shadow-xl`}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={() => {
            if (!isRegistered && onOpenAuth) {
              onOpenAuth('register');
            }
          }}
          placeholder={
            !isRegistered
              ? 'Зарегистрируйтесь, чтобы начать использовать Grokson AI...'
              : isLowBalance
              ? 'Активируйте ключ токенов, чтобы задать вопрос...'
              : 'Спросите Grokson о чём угодно... (Enter для отправки)'
          }
          disabled={isLoading || isLowBalance}
          rows={1}
          className="w-full bg-transparent px-3.5 sm:px-4 pt-3 pb-12 sm:pb-3.5 pr-14 sm:pr-24 text-base sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none max-h-48 disabled:opacity-60 leading-normal cursor-text"
        />

        {/* Action Controls */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1.5 sm:gap-2">
          {/* Estimated token hint */}
          {input.trim() && isRegistered && !isLowBalance && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono px-2 py-1 rounded-lg bg-white/5">
              ~{Math.max(15, Math.ceil(input.trim().length / 3))} ток.
            </span>
          )}

          {/* Send or Register button */}
          {!isRegistered ? (
            <button
              onClick={() => onOpenAuth && onOpenAuth('register')}
              className="px-3 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 active:scale-95 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              title="Зарегистрироваться для начала работы"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Регистрация</span>
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!input.trim() || isLoading || isLowBalance}
              className={`min-w-[40px] min-h-[40px] p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                input.trim() && !isLoading && !isLowBalance
                  ? 'bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-md'
                  : 'bg-white/5 text-zinc-600 cursor-not-allowed'
              }`}
              title="Отправить сообщение"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] sm:text-[11px] text-zinc-500 mt-1.5 sm:mt-2 px-1 gap-1 sm:gap-2">
        <span className="truncate max-w-full">Grokson Neural Core • Приватный ИИ-диалог с защищённым сохранением аккаунта.</span>
        <button
          onClick={onOpenRedeem}
          className="hover:text-zinc-300 transition-colors flex items-center gap-1 font-medium cursor-pointer shrink-0 self-end sm:self-auto"
        >
          <Sparkles className="w-3 h-3 text-zinc-400" />
          <span>Пополнить баланс</span>
        </button>
      </div>
    </div>
  );
};
