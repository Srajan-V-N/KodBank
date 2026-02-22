'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  ArrowLeft,
  MessageSquare,
  MoreHorizontal,
  FolderOpen,
  Folder,
  Star,
  Briefcase,
  Code,
  BookOpen,
  Globe,
  Layers,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/axios';
import { usePromptlyStore } from '@/stores/promptlyStore';
import { ProjectModal } from './ProjectModal';
import type { AIConversation, AIProject } from '@/types';

// Map icon string → Lucide component
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Folder,
  Star,
  Briefcase,
  Code,
  BookOpen,
  Globe,
  Layers,
  Zap,
};

function ProjectIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Folder;
  return <Icon className={className} />;
}

export function PromptlySidebar() {
  const router = useRouter();
  const {
    sidebarCollapsed,
    toggleSidebar,
    conversations,
    setConversations,
    currentConversationId,
    setCurrentConversationId,
    setMessages,
    removeConversation,
    updateConversationTitle,
    resetConversation,
    projects,
    setProjects,
    removeProject,
    updateConversationProject,
    setPendingProjectId,
  } = usePromptlyStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Projects UI state
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set());
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectMenuId, setProjectMenuId] = useState<string | null>(null);
  const [moveMenuConvId, setMoveMenuConvId] = useState<string | null>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [renamingId]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setProjectMenuId(null);
      }
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setMoveMenuConvId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchConversations() {
    try {
      const res = await apiClient.get<{ data: { conversations: AIConversation[] } }>(
        '/ai/conversations',
      );
      setConversations(res.data.data.conversations);
    } catch {
      // silently fail
    }
  }

  async function fetchProjects() {
    try {
      const res = await apiClient.get<{ data: { projects: AIProject[] } }>('/ai/projects');
      setProjects(res.data.data.projects);
    } catch {
      // silently fail
    }
  }

  async function handleSelectConversation(conv: AIConversation) {
    if (conv.id === currentConversationId) return;
    setCurrentConversationId(conv.id);
    try {
      const res = await apiClient.get<{
        data: { messages: import('@/types').AIMessage[] };
      }>(`/ai/conversations/${conv.id}`);
      setMessages(res.data.data.messages);
    } catch {
      toast.error('Failed to load conversation');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await apiClient.delete(`/ai/conversations/${id}`);
      removeConversation(id);
    } catch {
      toast.error('Failed to delete conversation');
    }
  }

  function startRename(conv: AIConversation) {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  }

  async function commitRename(id: string) {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }
    try {
      await apiClient.put(`/ai/conversations/${id}`, { title: trimmed });
      updateConversationTitle(id, trimmed);
    } catch {
      toast.error('Failed to rename conversation');
    }
    setRenamingId(null);
  }

  function handleNewChat() {
    resetConversation();
  }

  async function handleDeleteProject(id: string) {
    if (!window.confirm('Delete this project? Chats will return to Recent.')) return;
    setProjectMenuId(null);
    try {
      await apiClient.delete(`/ai/projects/${id}`);
      removeProject(id);
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  }

  async function handleMoveToProject(convId: string, projectId: string | null) {
    setMoveMenuConvId(null);
    try {
      await apiClient.put(`/ai/conversations/${convId}/project`, { projectId });
      updateConversationProject(convId, projectId);
    } catch {
      toast.error('Failed to move conversation');
    }
  }

  function toggleProject(id: string) {
    setOpenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const recentConvs = filtered.filter((c) => !c.projectId);

  return (
    <>
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-shrink-0 h-full glass-card border-r border-border flex flex-col overflow-hidden z-20"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-4">
          {/* Sparkles always visible */}
          <Sparkles className="w-6 h-6 text-brand flex-shrink-0" />

          {/* Promptly text — animated in/out */}
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.span
                key="label"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="flex-1 ml-2 font-semibold text-foreground truncate"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Promptly
              </motion.span>
            )}
          </AnimatePresence>

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0 ml-auto"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* New Chat */}
        <div className="px-2 py-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/60 text-foreground transition-colors text-sm font-medium"
            title="New Chat"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="px-2 pb-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-transparent">
              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="px-2 pb-2">
            <button
              className="w-full flex justify-center p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">

          {/* Projects section */}
          {!sidebarCollapsed && (
            <div className="mb-4">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Projects
                </p>
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="New Project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {projects.length === 0 && (
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                  <FolderOpen className="w-4 h-4 flex-shrink-0" />
                  <span>New Project</span>
                </button>
              )}

              {projects.map((proj) => {
                const isOpen = openProjects.has(proj.id);
                const projConvs = filtered.filter((c) => c.projectId === proj.id);

                return (
                  <div key={proj.id}>
                    {/* Project row */}
                    <div
                      className="group relative flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors"
                      onClick={() => toggleProject(proj.id)}
                    >
                      {/* Color dot */}
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: proj.color }}
                      />
                      <ProjectIcon name={proj.icon} className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-1 min-w-0 truncate text-sm text-foreground">{proj.name}</span>

                      <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />

                      {/* New chat in this project */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetConversation();
                          setPendingProjectId(proj.id);
                        }}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        title={`New chat in ${proj.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {/* 3-dot menu */}
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity" ref={projectMenuId === proj.id ? projectMenuRef : undefined}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectMenuId((prev) => (prev === proj.id ? null : proj.id));
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Project options"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {projectMenuId === proj.id && (
                          <div
                            ref={projectMenuRef}
                            className="absolute right-0 top-7 z-50 w-36 glass-card border border-border rounded-lg shadow-lg py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Project chats accordion */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="chats"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 space-y-0.5 py-0.5">
                            {projConvs.length === 0 && (
                              <p className="text-xs text-muted-foreground px-2 py-1">No chats yet</p>
                            )}
                            {projConvs.map((conv) => (
                              <ConversationRow
                                key={conv.id}
                                conv={conv}
                                currentConversationId={currentConversationId}
                                renamingId={renamingId}
                                renameValue={renameValue}
                                renameInputRef={renameInputRef}
                                moveMenuConvId={moveMenuConvId}
                                moveMenuRef={moveMenuRef}
                                projects={projects}
                                onSelect={handleSelectConversation}
                                onRenameStart={startRename}
                                onRenameChange={setRenameValue}
                                onRenameCommit={commitRename}
                                onRenameCancel={() => setRenamingId(null)}
                                onDelete={handleDelete}
                                onMoveMenuToggle={(id) =>
                                  setMoveMenuConvId((prev) => (prev === id ? null : id))
                                }
                                onMoveToProject={handleMoveToProject}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* Collapsed sidebar: project dots */}
          {sidebarCollapsed && projects.length > 0 && (
            <div className="flex flex-col items-center gap-2 py-1">
              {projects.map((proj) => (
                <span
                  key={proj.id}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: proj.color }}
                  title={proj.name}
                />
              ))}
            </div>
          )}

          {/* Recent Chats */}
          {!sidebarCollapsed && (recentConvs.length > 0 || conversations.length > 0) && (
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 mt-4">
              Recent Chats
            </p>
          )}

          {recentConvs.map((conv) => (
            <ConversationRow
              key={conv.id}
              conv={conv}
              currentConversationId={currentConversationId}
              renamingId={renamingId}
              renameValue={renameValue}
              renameInputRef={renameInputRef}
              moveMenuConvId={moveMenuConvId}
              moveMenuRef={moveMenuRef}
              projects={projects}
              sidebarCollapsed={sidebarCollapsed}
              onSelect={handleSelectConversation}
              onRenameStart={startRename}
              onRenameChange={setRenameValue}
              onRenameCommit={commitRename}
              onRenameCancel={() => setRenamingId(null)}
              onDelete={handleDelete}
              onMoveMenuToggle={(id) =>
                setMoveMenuConvId((prev) => (prev === id ? null : id))
              }
              onMoveToProject={handleMoveToProject}
            />
          ))}

          {!sidebarCollapsed && conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 px-2">
              No conversations yet. Start chatting!
            </p>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="px-2 py-3 border-t border-border">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground text-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Back to Dashboard</span>}
          </button>
        </div>
      </motion.aside>

      {/* New Project Modal */}
      <ProjectModal open={showProjectModal} onClose={() => setShowProjectModal(false)} />
    </>
  );
}

// ---- Extracted ConversationRow component ----

interface ConversationRowProps {
  conv: AIConversation;
  currentConversationId: string | null;
  renamingId: string | null;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement>;
  moveMenuConvId: string | null;
  moveMenuRef: React.RefObject<HTMLDivElement>;
  projects: AIProject[];
  sidebarCollapsed?: boolean;
  onSelect: (conv: AIConversation) => void;
  onRenameStart: (conv: AIConversation) => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: (id: string) => void;
  onRenameCancel: () => void;
  onDelete: (id: string) => void;
  onMoveMenuToggle: (id: string) => void;
  onMoveToProject: (convId: string, projectId: string | null) => void;
}

function ConversationRow({
  conv,
  currentConversationId,
  renamingId,
  renameValue,
  renameInputRef,
  moveMenuConvId,
  moveMenuRef,
  projects,
  sidebarCollapsed,
  onSelect,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onDelete,
  onMoveMenuToggle,
  onMoveToProject,
}: ConversationRowProps) {
  const isActive = conv.id === currentConversationId;
  const showMoveMenu = moveMenuConvId === conv.id;

  return (
    <div
      className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-brand/15 text-brand' : 'hover:bg-muted/60 text-foreground'
      }`}
      onClick={() => onSelect(conv)}
      title={conv.title}
    >
      {sidebarCollapsed ? (
        <MessageSquare className="w-4 h-4 flex-shrink-0 mx-auto" />
      ) : (
        <>
          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
          {renamingId === conv.id ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={() => onRenameCommit(conv.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameCommit(conv.id);
                if (e.key === 'Escape') onRenameCancel();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 bg-background border border-brand rounded px-1 text-sm outline-none text-foreground"
            />
          ) : (
            <span className="flex-1 min-w-0 truncate text-sm">{conv.title}</span>
          )}

          {renamingId !== conv.id && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameStart(conv);
                }}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Rename"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>

              {/* Move to project */}
              {projects.length > 0 && (
                <div
                  className="relative"
                  ref={showMoveMenu ? moveMenuRef : undefined}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveMenuToggle(conv.id);
                    }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Move to project"
                  >
                    <FolderOpen className="w-3 h-3" />
                  </button>

                  {showMoveMenu && (
                    <div
                      ref={moveMenuRef}
                      className="absolute right-0 top-7 z-50 w-44 glass-card border border-border rounded-lg shadow-lg py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {conv.projectId && (
                        <button
                          onClick={() => onMoveToProject(conv.id, null)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Remove from project
                        </button>
                      )}
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => onMoveToProject(conv.id, p.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                            conv.projectId === p.id ? 'text-brand' : 'text-foreground'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
