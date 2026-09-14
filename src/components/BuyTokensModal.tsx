import React, { useState } from 'react';
import { X, Zap, Check, Sparkles, Copy, CheckCheck, Calculator, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BuyTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRedeem: () => void;
}

export const BuyTokensModal: React.FC<BuyTokensModalProps> = ({
  isOpen,
  onClose,
  onOpenRedeem,
}) => {
  if (!isOpen) return null;

  const [copiedTikTok, setCopiedTikTok] = useState(false);
  const [calcCredits, setCalcCredits] = useState<number>(100000);

  // Rate: 0.5 ₽ = 1000 credits (0.0005 ₽ per credit)
  const RATE_PER_1K = 0.5;
  const TIKTOK_CONTACT = '@ctrl_z52';
  const TIKTOK_URL = 'https://www.tiktok.com/@ctrl_z52';

  const handleCopyTikTok = () => {
    try {
      navigator.clipboard.writeText(TIKTOK_CONTACT);
      setCopiedTikTok(true);
      setTimeout(() => setCopiedTikTok(false), 2000);
    } catch (e) {
      // fallback
    }
  };

  const packages = [
    {
      name: 'Базовый',
      credits: 20000,
      price: '10 ₽',
      popular: false,
      description: '20 000 кредитов',
      detail: '~100 развёрнутых ответов',
    },
    {
      name: 'Популярный',
      credits: 100000,
      price: '50 ₽',
      popular: true,
      description: '100 000 кредитов',
      detail: '~500 подробных запросов и кода',
    },
    {
      name: 'Максимальный',
      credits: 500000,
      price: '250 ₽',
      popular: false,
      description: '500 000 кредитов',
      detail: 'Для постоянной ежедневной работы',
    },
  ];

  const calculatedCost = (calcCredits / 1000) * RATE_PER_1K;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto bg-[#09090b] border border-white/15 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center max-w-md mx-auto mb-5 sm:mb-6 pr-6 sm:pr-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span>Тарифы и пополнение</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white font-display">
              0.5 ₽ = 1 000 кредитов
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
              Официальный фиксированный курс покупки кредитов Grokson AI. Кредиты не имеют срока действия.
            </p>
          </div>

          {/* Official TikTok Purchase Banner */}
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#121215] border border-white/20 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                  Покупка и получение ключа
                </div>
                <div className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>Писать за покупкой в TikTok:</span>
                  <a
                    href={TIKTOK_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-white underline hover:text-zinc-300 transition-colors"
                  >
                    {TIKTOK_CONTACT}
                  </a>
                </div>
                <div className="text-xs text-zinc-400">
                  Напишите в личные сообщения нужное количество кредитов и получите ключ активации
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyTikTok}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-medium text-white transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {copiedTikTok ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Скопировать ник</span>
                    </>
                  )}
                </button>

                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <span>Открыть TikTok</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Preset Packages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative rounded-2xl p-4 flex flex-col justify-between border transition-all ${
                  pkg.popular
                    ? 'bg-[#18181b] border-white/30 shadow-xl'
                    : 'bg-[#121215] border-white/10 hover:border-white/20'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white text-black font-bold text-[10px] tracking-wider uppercase font-mono shadow-sm">
                    Выбор пользователей
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">{pkg.name}</div>
                  <div className="text-2xl font-black text-white font-mono mt-1">{pkg.price}</div>
                  <div className="text-xs text-zinc-200 font-mono font-bold mt-0.5 mb-2">
                    {pkg.description}
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-snug">
                    {pkg.detail}
                  </div>
                </div>

                <div className="pt-4">
                  <a
                    href={TIKTOK_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      pkg.popular
                        ? 'bg-white text-black hover:bg-zinc-200 shadow-md'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span>Купить в TikTok</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Calculator */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black border border-white/10 space-y-3 mb-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm font-display">
                <Calculator className="w-4 h-4 text-zinc-400" />
                <span>Калькулятор стоимости по курсу 0.5 ₽ = 1000 кредитов</span>
              </div>
              <div className="text-xs font-mono font-bold text-white">
                {calculatedCost.toLocaleString('ru-RU')} ₽
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Количество кредитов:</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={calcCredits}
                  onChange={(e) => setCalcCredits(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-[#121215] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#121215] border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase font-mono">Итого к оплате</div>
                  <div className="text-lg font-black text-white font-mono">
                    {calculatedCost.toFixed(1).replace('.0', '')} ₽
                  </div>
                </div>
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
                >
                  Заказать
                </a>
              </div>
            </div>
          </div>

          {/* How it works & Key Activation */}
          <div className="p-4 rounded-2xl bg-[#121215] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-zinc-300 shrink-0" />
              <span>После перевода в TikTok администратор отправит вам персональный код ключа.</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenRedeem();
              }}
              className="shrink-0 text-white hover:underline font-semibold cursor-pointer"
            >
              Уже есть ключ? Ввести код
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
