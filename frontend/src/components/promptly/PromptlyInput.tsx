'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Paperclip, Mic, MicOff, ArrowUp, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';
import { usePromptlyStore } from '@/stores/promptlyStore';
import type { AIConversation, AIMessage } from '@/types';

interface PromptlyInputProps {
  isWelcome: boolean;
}

export function PromptlyInput({ isWelcome }: PromptlyInputProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const {
    currentConversationId,
    setCurrentConversationId,
    addConversation,
    addMessage,
    setIsLoading,
    isLoading,
    startTypingEffect,
    appendTypingChar,
    isTypingEffect,
    setIsWaitingForResponse,
    pendingProjectId,
    setPendingProjectId,
    projects,
  } = usePromptlyStore();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    setHasSpeechRecognition(!!SpeechRecognitionAPI);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
    }
  }, [text]);

  // Typing animation interval
  useEffect(() => {
    if (!isTypingEffect) return;
    const interval = setInterval(() => {
      appendTypingChar();
    }, 12);
    return () => clearInterval(interval);
  }, [isTypingEffect, appendTypingChar]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setText('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const optimisticUserMsg: AIMessage = {
      id: `optimistic-${Date.now()}`,
      conversationId: currentConversationId ?? '',
      role: 'user',
      content: trimmed,
      fileUrl: file ? URL.createObjectURL(file) : undefined,
      createdAt: new Date().toISOString(),
    };
    addMessage(optimisticUserMsg);
    setIsWaitingForResponse(true);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', trimmed);
      if (currentConversationId) formData.append('conversationId', currentConversationId);
      if (!currentConversationId && pendingProjectId) formData.append('projectId', pendingProjectId);
      if (file) formData.append('file', file);

      const res = await apiClient.post<{
        data: { conversationId: string; response: string; title?: string; projectId?: string | null };
      }>('/ai/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { conversationId, response, title } = res.data.data;

      if (!currentConversationId) {
        setCurrentConversationId(conversationId);
        const newConv: AIConversation = {
          id: conversationId,
          title: title ?? trimmed.slice(0, 60),
          projectId: pendingProjectId ?? undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addConversation(newConv);
        if (pendingProjectId) setPendingProjectId(null);
      }

      const assistantMsgId = `assistant-${Date.now()}`;
      startTypingEffect(response, assistantMsgId);
    } catch (err: unknown) {
      setIsWaitingForResponse(false);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message ?? 'Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  }, [
    text,
    isLoading,
    file,
    currentConversationId,
    pendingProjectId,
    addMessage,
    setIsLoading,
    setIsWaitingForResponse,
    setCurrentConversationId,
    addConversation,
    setPendingProjectId,
    startTypingEffect,
  ]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('File must be smaller than 10MB');
      return;
    }
    setFile(selected);
  }

  function toggleVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice recognition failed');
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  const canSend = text.trim().length > 0 && !isLoading;

  // Gradient border style applied when focused
  const boxStyle: React.CSSProperties = isFocused
    ? {
        background:
          'linear-gradient(hsl(var(--background)), hsl(var(--background))) padding-box, linear-gradient(135deg, #feba01, #f59e0b) border-box',
        border: '1px solid transparent',
      }
    : {};

  return (
    <motion.div
      layout
      className={`w-full px-4 pb-4 ${
        isWelcome
          ? 'relative max-w-2xl w-full'
          : 'relative max-w-3xl mx-auto mt-auto'
      }`}
    >
      {/* Project badge */}
      {pendingProjectId && (() => {
        const proj = projects.find((p) => p.id === pendingProjectId);
        if (!proj) return null;
        return (
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5 glass-card rounded-lg w-fit text-sm text-foreground">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color }} />
            <span className="text-muted-foreground">New chat in</span>
            <span className="font-medium">{proj.name}</span>
            <button
              onClick={() => setPendingProjectId(null)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })()}

      {/* File chip */}
      {file && (
        <div className="mb-2 flex items-center gap-2 px-3 py-1.5 glass-card rounded-lg w-fit text-sm text-foreground">
          <Paperclip className="w-3.5 h-3.5 text-brand" />
          <span className="truncate max-w-xs">{file.name}</span>
          <button
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input box */}
      <div
        className="bg-background rounded-3xl flex flex-col gap-2 p-3 border border-border transition-all duration-200"
        style={boxStyle}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter message… Shift+Enter for newline"
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed disabled:opacity-50"
          style={{ minHeight: '24px', maxHeight: '144px' }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Attach file"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Attach file"
              type="button"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice input */}
            {hasSpeechRecognition && (
              <button
                onClick={toggleVoice}
                className={`p-1.5 rounded-lg transition-colors ${
                  isListening
                    ? 'text-brand animate-pulse bg-brand/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
                type="button"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Send button */}
          <motion.button
            onClick={handleSend}
            disabled={!canSend}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-600 transition-colors"
            title="Send"
            type="button"
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-zinc-900/40 border-t-zinc-900 rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
