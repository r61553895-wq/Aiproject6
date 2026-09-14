import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { ChatMessage } from '../types';
import { GroksonMascot } from './GroksonMascot';
import { Copy, Check, User, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`w-full py-3 sm:py-4 px-2.5 sm:px-6 transition-colors overflow-hidden ${
        isAssistant ? 'bg-[#09090b]/80 border-y border-white/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-2.5 sm:gap-4 min-w-0">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isAssistant ? (
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-black border border-white/20 flex items-center justify-center shadow-md overflow-hidden">
              <GroksonMascot size="sm" showBubble={false} />
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 shadow-md">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
            </div>
          )}
        </div>

        {/* Message body */}
        <div className="flex-1 min-w-0 space-y-1.5 overflow-hidden">
          {/* Header metadata */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide font-display shrink-0">
                {isAssistant ? 'Grokson' : 'Вы'}
              </span>
              {isAssistant && (
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono truncate max-w-[120px] sm:max-w-none">
                  {message.model || 'Grokson Core'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {message.tokensUsed !== undefined && message.tokensUsed > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-zinc-300 bg-white/5 border border-white/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5 text-zinc-300" />
                  <span>{message.tokensUsed} <span className="hidden xs:inline">ток.</span></span>
                </span>
              )}

              {/* Copy button */}
              <button
                onClick={handleCopy}
                title="Копировать текст"
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-sm sm:text-[15px] leading-relaxed text-zinc-200 break-words [overflow-wrap:anywhere] min-w-0 overflow-x-hidden">
            {message.error ? (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 flex items-start gap-2.5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="flex-1">
                  <div>{message.content}</div>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="mt-2 text-xs font-semibold text-rose-200 underline hover:text-white cursor-pointer"
                    >
                      Попробовать снова
                    </button>
                  )}
                </div>
              </div>
            ) : isAssistant ? (
              <div className="markdown-body">
                <Markdown>{message.content}</Markdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
