'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Star, Briefcase, Code, BookOpen, Globe, Layers, Zap, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';
import { usePromptlyStore } from '@/stores/promptlyStore';
import type { AIProject } from '@/types';

const ICONS = [
  { key: 'Folder', Icon: Folder },
  { key: 'Star', Icon: Star },
  { key: 'Briefcase', Icon: Briefcase },
  { key: 'Code', Icon: Code },
  { key: 'BookOpen', Icon: BookOpen },
  { key: 'Globe', Icon: Globe },
  { key: 'Layers', Icon: Layers },
  { key: 'Zap', Icon: Zap },
] as const;

const COLORS = ['#feba01', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899', '#6b7280'];

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectModal({ open, onClose }: ProjectModalProps) {
  const { addProject } = usePromptlyStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>('Folder');
  const [color, setColor] = useState<string>('#feba01');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await apiClient.post<{ data: AIProject }>('/ai/projects', {
        name: name.trim(),
        icon,
        color,
      });
      addProject(res.data.data);
      toast.success('Project created');
      setName('');
      setIcon('Folder');
      setColor('#feba01');
      onClose();
    } catch {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-80 glass-card border border-border rounded-2xl p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">New Project</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Project"
                  maxLength={100}
                  autoFocus
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand/60 transition-colors"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(({ key, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setIcon(key)}
                      className={`p-2 rounded-lg border transition-colors ${
                        icon === key
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground'
                      }`}
                      title={key}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === c ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || loading}
                  className="flex-1 py-2 rounded-lg bg-brand text-zinc-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand/90 transition-colors"
                >
                  {loading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
