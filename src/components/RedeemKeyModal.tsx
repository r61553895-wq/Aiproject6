import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, KeyRound, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RedeemKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (code: string) => Promise<{ success: boolean; tokens: number; message: string; newBalance: number }>;
  currentBalance: number;
  onOpenBuy?: () => void;
}

export const RedeemKeyModal: React.FC<RedeemKeyModalProps> = ({
  isOpen,
  onClose,
  onRedeem,
  currentBalance,
  onOpenBuy,
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; tokens?: number } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await onRedeem(code.trim().toUpperCase());
      setResult({
        success: res.success,
        message: res.message,
        tokens: res.tokens,
      });

      if (res.success) {
        // Fire celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#38bdf8', '#34d399', '#ffffff', '#fbbf24'],
          });
        } catch (e) {
          // ignore if canvas blocked
        }
        setCode('');
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Ошибка активации ключа',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-[#09090b] border border-white/15 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4 sm:mb-5 pr-8">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-white/10 border border-white/15 text-white shrink-0">
              <KeyRound className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-display">Активация ключа</h3>
              <p className="text-[11px] sm:text-xs text-zinc-400">Пополните ваш персональный баланс токенов</p>
            </div>
          </div>

          {/* Current balance indicator */}
          <div className="mb-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-xs text-zinc-300">Текущий баланс:</span>
            <span className="text-sm font-mono font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              {currentBalance.toLocaleString('ru-RU')} токенов
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Код токен-ключа (ваучера)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Введите код ключа..."
                className="w-full px-4 py-3 rounded-xl bg-black border border-white/15 focus:border-white/40 focus:outline-none text-white font-mono text-sm tracking-wider uppercase placeholder:text-zinc-600 placeholder:normal-case"
              />
            </div>

            {/* Status alert */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm ${
                  result.success
                    ? 'bg-white/10 border border-white/20 text-white'
                    : 'bg-zinc-900 border border-zinc-700 text-zinc-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                )}
                <span>{result.message}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={!code.trim() || loading}
              className="w-full py-3 px-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Активировать токены</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Link to purchase tariffs */}
            {onOpenBuy && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBuy();
                  }}
                  className="text-xs text-zinc-400 hover:text-white transition-colors underline cursor-pointer"
                >
                  Нет ключа? Тариф 0.5 ₽ = 1000 кредитов (TikTok @ctrl_z52)
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
