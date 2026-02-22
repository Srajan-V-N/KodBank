'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Paperclip, Copy, Check } from 'lucide-react';
import { usePromptlyStore } from '@/stores/promptlyStore';
import { useThemeStore } from '@/stores/themeStore';
import type { AIMessage } from '@/types';

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const isDark = useThemeStore((s) => s.theme === 'dark');

  const codeEl = children as React.ReactElement<{ className?: string; children?: string }>;
  const className = codeEl?.props?.className || '';
  const language = /language-(\w+)/.exec(className)?.[1] ?? 'text';
  const codeText = String(codeEl?.props?.children ?? '').replace(/\n$/, '');

  useEffect(() => {
    let cancelled = false;
    async function highlight() {
      try {
        const { codeToHtml } = await import('shiki');
        const result = await codeToHtml(codeText, {
          lang: language,
          theme: isDark ? 'github-dark' : 'github-light',
        });
        if (!cancelled) setHtml(result);
      } catch {
        try {
          const { codeToHtml } = await import('shiki');
          const result = await codeToHtml(codeText, {
            lang: 'text',
            theme: isDark ? 'github-dark' : 'github-light',
          });
          if (!cancelled) setHtml(result);
        } catch {
          if (!cancelled) setHtml(null);
        }
      }
    }
    highlight();
    return () => { cancelled = true; };
  }, [codeText, language, isDark]);

  function handleCodeCopy() {
    navigator.clipboard.writeText(codeText).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    });
  }

  return (
    <div className="relative not-prose my-2 group/code">
      {html ? (
        <div
          className="shiki-wrapper overflow-auto rounded-lg text-xs"
          style={{ fontSize: '0.75rem' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          className="rounded-lg text-xs p-4 m-0 overflow-auto"
          style={{
            background: isDark ? '#0d1117' : '#f6f8fa',
            color: isDark ? '#c9d1d9' : '#24292f',
            fontSize: '0.75rem',
          }}
        >
          <code>{codeText}</code>
        </pre>
      )}

      <div className="absolute top-2 right-2 flex items-center gap-1">
        {codeCopied && (
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 select-none">
            Copied
          </span>
        )}
        <button
          onClick={handleCodeCopy}
          className="text-zinc-400 dark:text-zinc-500 opacity-40 hover:opacity-70 transition-opacity"
          title="Copy code"
        >
          {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

interface PromptlyMessageProps {
  message: AIMessage;
  isLatestAssistant?: boolean;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```\w*\n?/g, '').trim())
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/>\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[-*+]\s+/g, '')
    .trim();
}

export function PromptlyMessage({ message, isLatestAssistant }: PromptlyMessageProps) {
  const { isTypingEffect, typingContent } = usePromptlyStore();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const displayContent =
    isLatestAssistant && isTypingEffect ? typingContent : message.content;

  function handleCopy() {
    const plain = isUser ? message.content : stripMarkdown(displayContent || '');
    navigator.clipboard.writeText(plain).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center mt-1">
          <Sparkles className="w-4 h-4 text-brand" />
        </div>
      )}

      {/* Bubble */}
      <div className={`group flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Paperclip className="w-3 h-3" />
            <span>Attached file</span>
          </a>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-brand/90 text-zinc-900 font-normal rounded-tr-sm'
              : 'glass-card bg-[#fafaf8] dark:bg-transparent border border-black/[0.06] dark:border-transparent shadow-[0_1px_4px_rgba(0,0,0,0.05)] dark:shadow-none text-foreground rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{ pre: CodeBlock as React.ComponentType<React.HTMLAttributes<HTMLPreElement>> }}
              >
                {displayContent || ''}
              </ReactMarkdown>
              {isLatestAssistant && isTypingEffect && (
                <span className="inline-block w-1.5 h-4 bg-brand/80 ml-0.5 animate-pulse rounded-sm" />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <button
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy'}
            className="opacity-50 hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="w-3 h-3 text-brand" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
