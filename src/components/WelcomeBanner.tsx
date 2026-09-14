import React from 'react';
import { GroksonMascot } from './GroksonMascot';
import {
  FileSpreadsheet,
  Terminal,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Zap,
  KeyRound,
  CheckCircle2,
  UserPlus,
  LogIn,
  Users,
  Lock,
} from 'lucide-react';
import type { UserAccount } from '../types';

interface WelcomeBannerProps {
  onSelectPrompt: (promptText: string) => void;
  tokensBalance: number;
  onOpenRedeem: () => void;
  currentUser?: UserAccount | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  savedAccounts?: UserAccount[];
  onSelectSavedAccount?: (account: UserAccount) => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  onSelectPrompt,
  tokensBalance,
  onOpenRedeem,
  currentUser,
  onOpenAuth,
  savedAccounts = [],
  onSelectSavedAccount,
}) => {
  const isRegistered = Boolean(currentUser);

  const capabilities = [
    {
      icon: <FileSpreadsheet className="w-4 h-4 text-zinc-200" />,
      title: 'Системный и бизнес-анализ',
      subtitle: 'Аудит предметной области, выявление узких мест, структурированные отчёты',
      prompt: 'Подготовь детальный план стратегического аудита IT-инфраструктуры компании с матрицей рисков.',
    },
    {
      icon: <Terminal className="w-4 h-4 text-zinc-200" />,
      title: 'Инженерия и архитектура ПО',
      subtitle: 'Отказоустойчивая микросервисная архитектура, написание чистого кода, ревью',
      prompt: 'Спроектируй масштабируемую архитектуру backend-сервиса с кэшированием, очередями задач и защитой от перегрузок.',
    },
    {
      icon: <TrendingUp className="w-4 h-4 text-zinc-200" />,
      title: 'Стратегическое планирование',
      subtitle: 'Дорожные карты проектов, финансовое моделирование, план запуска продуктов',
      prompt: 'Составь регламент и пошаговый план вывода нового технологического продукта на рынок за 90 дней.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-zinc-200" />,
      title: 'Информационная безопасность',
      subtitle: 'Политики ИБ, управление доступом, стандарты обработки и хранения данных',
      prompt: 'Сформулируй базовый регламент корпоративной информационной безопасности для удалённых сотрудников.',
    },
  ];

  // If user is NOT registered, show the strict, beautiful, minimalist Registration Wall
  if (!isRegistered) {
    return (
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-5 sm:space-y-7">
        {/* Main Access Gate Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#09090b] border border-white/15 p-5 sm:p-8 md:p-10 shadow-2xl">
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top Status Strip */}
          <div className="relative z-10 flex items-center justify-between gap-2 border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] sm:text-[11px] font-mono text-zinc-300">
                <Lock className="w-3 h-3 text-zinc-400" />
                <span>ТРЕБУЕТСЯ АВТОРИЗАЦИЯ</span>
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
              GROKSON INTELLIGENCE
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-[0.2em] font-mono text-zinc-400">
                  ОФИЦИАЛЬНАЯ ВЫЧИСЛИТЕЛЬНАЯ СИСТЕМА
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-white tracking-tight leading-tight">
                  Чтобы начать использовать Grokson, зарегистрируйтесь
                </h1>
              </div>

              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-normal">
                Для доступа к диалоговой нейросети, генерации кода и решению аналитических задач требуется зарегистрироваться или войти. При создании аккаунта вы моментально получаете <strong className="text-white font-semibold">+10 000 токенов</strong> в подарок.
              </p>

              {/* Saved accounts on this device: 1-click restore */}
              {savedAccounts.length > 0 && (
                <div className="pt-2 pb-1">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 mb-2 font-medium">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Ваши сохранённые аккаунты на этом устройстве:</span>
                  </div>

                  <div className="space-y-2">
                    {savedAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="p-3 rounded-xl bg-white/[0.04] border border-white/15 flex items-center justify-between gap-3 hover:bg-white/[0.07] hover:border-white/30 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(acc.name || acc.username).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                              <span>{acc.name || acc.username}</span>
                              <span className="text-[10px] text-zinc-400 font-mono">@{acc.username}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              Баланс: {acc.tokensBalance.toLocaleString('ru-RU')} токенов
                            </div>
                          </div>
                        </div>

                        <button
                          id={`quick-login-${acc.username}`}
                          onClick={() => onSelectSavedAccount && onSelectSavedAccount(acc)}
                          className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
                        >
                          Войти в 1 клик
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  id="gate-register-btn"
                  onClick={() => onOpenAuth && onOpenAuth('register')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all cursor-pointer shadow-lg active:scale-98"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Создать аккаунт (+10 000 токенов)</span>
                </button>

                <button
                  id="gate-login-btn"
                  onClick={() => onOpenAuth && onOpenAuth('login')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#121215] border border-white/20 text-white font-semibold text-xs hover:bg-zinc-800 transition-all cursor-pointer active:scale-98"
                >
                  <LogIn className="w-4 h-4 text-zinc-300" />
                  <span>Войти в аккаунт</span>
                </button>
              </div>
            </div>

            {/* Right Column: Monolith Mascot */}
            <div className="lg:col-span-5 flex justify-center items-center py-2 sm:py-0">
              <GroksonMascot size="hero" showBubble={true} bubbleText="SECURITY: GATE LOCKED" />
            </div>
          </div>
        </div>

        {/* 3 Pillar Minimalist Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#09090b] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs font-display">
              <CheckCircle2 className="w-4 h-4 text-zinc-400" />
              <span>+10 000 токенов сразу</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Бесплатный стартовый пакет токенов начисляется каждому зарегистрированному пользователю.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#09090b] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs font-display">
              <CheckCircle2 className="w-4 h-4 text-zinc-400" />
              <span>Сохранение истории</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Все ваши диалоги, сгенерированный код и сессии надёжно привязаны к учётной записи.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#09090b] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs font-display">
              <CheckCircle2 className="w-4 h-4 text-zinc-400" />
              <span>Приватный шлюз ИИ</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Изолированные вычисления на базе защищённой корпоративной архитектуры Grokson.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user IS registered, show the full operational dashboard with prompt launchers
  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-6 space-y-4 sm:space-y-6">
      {/* Official Executive Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#09090b] border border-white/10 p-4 sm:p-7 md:p-10 shadow-2xl">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Technical Status Strip */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 pb-3 sm:pb-4 mb-4 sm:mb-7">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-white/5 border border-white/10 text-[10px] sm:text-[11px] font-mono font-medium text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>CORE: ACTIVE</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500 hidden xs:inline">
              ПОЛЬЗОВАТЕЛЬ: @{currentUser.username} • БАЛАНС: {tokensBalance.toLocaleString('ru-RU')} ТОК.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[10px] sm:text-[11px] tracking-wider sm:tracking-[0.2em] text-zinc-400 font-mono uppercase">
              PLATFORM v2.4
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          {/* Left Column: Official Overview */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-block text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-[0.2em] font-mono text-zinc-400">
                GROKSON INTELLIGENCE PLATFORM
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black font-display text-white tracking-tight leading-snug">
                Корпоративная вычислительная система
              </h1>
            </div>

            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
              Высокопроизводительная изолированная среда для решения аналитических, инженерных и стратегических задач. Интегрирована с защищённым шлюзом вычислений и биллингом токенов.
            </p>

            {/* Official Feature Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 sm:pt-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Комплексный анализ данных</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Проектирование архитектуры ПО</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Токенизированный биллинг</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Приватный защищённый шлюз</span>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <button
                id="welcome-start-session-btn"
                onClick={() =>
                  onSelectPrompt(
                    'Инициализируй сессию. Подготовь комплексный отчёт по аналитике технологического стека и системной оптимизации.'
                  )
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all cursor-pointer shadow-md active:scale-98"
              >
                <span>Инициализировать сессию</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {tokensBalance <= 50 && (
                <button
                  onClick={onOpenRedeem}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-xs hover:bg-white/20 transition-all cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Ввести ключ токенов</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: High-tech Monolith Core */}
          <div className="lg:col-span-5 flex justify-center items-center py-2 sm:py-0">
            <GroksonMascot size="hero" showBubble={true} bubbleText="CORE: OPERATIONAL" />
          </div>
        </div>
      </div>

      {/* Structured Executive Capabilities Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs uppercase font-mono tracking-wider text-zinc-400">
            Специализированные направления вычислений
          </div>
          <span className="text-[11px] font-mono text-zinc-500">READY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {capabilities.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="text-left p-4 rounded-xl bg-[#09090b] border border-white/10 hover:border-white/25 hover:bg-[#121215] transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-zinc-200 transition-colors font-display">
                    {item.title}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
                <span>Запустить сценарий</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

