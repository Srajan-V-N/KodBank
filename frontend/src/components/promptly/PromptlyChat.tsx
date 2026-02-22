'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { usePromptlyStore } from '@/stores/promptlyStore';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { PromptlyMessage } from './PromptlyMessage';
import { PromptlyInput } from './PromptlyInput';
import { TypingIndicator } from './TypingIndicator';

export function PromptlyChat() {
  const { user } = useAuthStore();
  const { messages, currentConversationId, conversations, isWaitingForResponse } = usePromptlyStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const isWelcome = messages.length === 0;

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  const lastAssistantIndex = messages.reduce(
    (acc, msg, idx) => (msg.role === 'assistant' ? idx : acc),
    -1,
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isWaitingForResponse]);

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      <AnimatePresence mode="wait">
        {isWelcome ? (
          /* Welcome State */
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col items-center justify-center relative px-6"
          >
            <div className="absolute top-4 right-4">
              <ThemeToggle />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <p
                className="text-2xl text-foreground text-center mb-12"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Welcome {user?.username}, how can I help you today?
              </p>
            </motion.div>

            <PromptlyInput isWelcome={true} />
          </motion.div>
        ) : (
          /* Chat State */
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-border glass-card">
              <h2 className="text-sm font-semibold text-foreground truncate max-w-xs">
                {currentConversation?.title ?? 'Chat'}
              </h2>
              <ThemeToggle />
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto py-6">
              <div className="max-w-[900px] mx-auto px-6 space-y-6">
                {messages.map((msg, idx) => (
                  <PromptlyMessage
                    key={msg.id}
                    message={msg}
                    isLatestAssistant={idx === lastAssistantIndex}
                  />
                ))}
                <AnimatePresence>
                  {isWaitingForResponse && <TypingIndicator />}
                </AnimatePresence>
              </div>
            </div>

            {/* Input — no divider border */}
            <div className="flex-shrink-0 bg-background/50 backdrop-blur-sm">
              <PromptlyInput isWelcome={false} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
