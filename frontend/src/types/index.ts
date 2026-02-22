export interface User {
  uid: string;
  username: string;
  email: string;
  role: string;
  isFirstLogin?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface BalanceData {
  balance: number;
  currency: string;
}

export interface AIProject {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  title: string;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  fileUrl?: string;
  createdAt: string;
}
