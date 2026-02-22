import { Request, Response, NextFunction } from 'express';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { successResponse } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { callPromptly, sanitizeInput } from '../services/ai.service';

interface ConversationRow {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MessageRow {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  fileUrl: string | null;
  createdAt: Date;
}

export async function chat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { message, conversationId: existingConvId, projectId: reqProjectId } = req.body as {
      message: string;
      conversationId?: string;
      projectId?: string;
    };
    const uploadedFile = req.file;

    if (!message || typeof message !== 'string') {
      throw new AppError('Message is required', 400);
    }

    const cleanMessage = sanitizeInput(message);
    if (!cleanMessage) {
      throw new AppError('Message cannot be empty after sanitization', 400);
    }

    let conversationId: string;
    let conversationTitle: string | undefined;
    let isNewConversation = false;
    let validProjectId: string | null = null;

    if (existingConvId) {
      const [rows] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT id, title FROM ai_conversations WHERE id=? AND userId=? LIMIT 1',
        [existingConvId, userId],
      );
      const conv = rows[0] as Pick<ConversationRow, 'id' | 'title'> | undefined;
      if (!conv) throw new AppError('Conversation not found', 404);
      conversationId = conv.id;
    } else {
      conversationId = uuidv4();
      conversationTitle = cleanMessage.slice(0, 60);
      isNewConversation = true;

      if (reqProjectId) {
        const [projRows] = await pool.execute<mysql.RowDataPacket[]>(
          'SELECT id FROM ai_projects WHERE id=? AND userId=? LIMIT 1',
          [reqProjectId, userId],
        );
        if ((projRows as mysql.RowDataPacket[])[0]) validProjectId = reqProjectId;
      }

      await pool.execute(
        'INSERT INTO ai_conversations (id, userId, title, projectId, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(3), NOW(3))',
        [conversationId, userId, conversationTitle, validProjectId],
      );
    }

    let fileUrl: string | null = null;
    let fileContext = '';
    if (uploadedFile) {
      fileUrl = `/uploads/${uploadedFile.filename}`;
      fileContext = ` [User also attached a file: ${uploadedFile.originalname}]`;
    }

    const userContent = cleanMessage + fileContext;

    const aiResponse = await callPromptly(userContent);

    const userMsgId = uuidv4();
    const assistantMsgId = uuidv4();

    await pool.execute(
      'INSERT INTO ai_messages (id, conversationId, role, content, fileUrl, createdAt) VALUES (?, ?, ?, ?, ?, NOW(3))',
      [userMsgId, conversationId, 'user', cleanMessage, fileUrl],
    );
    await pool.execute(
      'INSERT INTO ai_messages (id, conversationId, role, content, fileUrl, createdAt) VALUES (?, ?, ?, ?, ?, NOW(3))',
      [assistantMsgId, conversationId, 'assistant', aiResponse, null],
    );

    await pool.execute(
      'UPDATE ai_conversations SET updatedAt=NOW(3) WHERE id=?',
      [conversationId],
    );

    res.status(200).json(
      successResponse('Chat response generated', {
        conversationId,
        response: aiResponse,
        ...(isNewConversation ? { title: conversationTitle, projectId: validProjectId } : {}),
      }),
    );
  } catch (err) {
    next(err);
  }
}

export async function listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, title, projectId, createdAt, updatedAt FROM ai_conversations WHERE userId=? ORDER BY updatedAt DESC LIMIT 100',
      [userId],
    );
    res.status(200).json(successResponse('Conversations retrieved', { conversations: rows }));
  } catch (err) {
    next(err);
  }
}

export async function getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const [convRows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, title, createdAt, updatedAt FROM ai_conversations WHERE id=? AND userId=? LIMIT 1',
      [id, userId],
    );
    const conv = convRows[0] as ConversationRow | undefined;
    if (!conv) throw new AppError('Conversation not found', 404);

    const [msgRows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, conversationId, role, content, fileUrl, createdAt FROM ai_messages WHERE conversationId=? ORDER BY createdAt ASC',
      [id],
    );

    res.status(200).json(
      successResponse('Conversation retrieved', { conversation: conv, messages: msgRows }),
    );
  } catch (err) {
    next(err);
  }
}

export async function renameConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title } = req.body as { title: string };

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new AppError('Title is required', 400);
    }

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM ai_conversations WHERE id=? AND userId=? LIMIT 1',
      [id, userId],
    );
    if (!rows[0]) throw new AppError('Conversation not found', 404);

    const cleanTitle = title.trim().slice(0, 255);
    await pool.execute(
      'UPDATE ai_conversations SET title=?, updatedAt=NOW(3) WHERE id=? AND userId=?',
      [cleanTitle, id, userId],
    );

    res.status(200).json(successResponse('Conversation renamed', { id, title: cleanTitle }));
  } catch (err) {
    next(err);
  }
}

export async function deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM ai_conversations WHERE id=? AND userId=? LIMIT 1',
      [id, userId],
    );
    if (!rows[0]) throw new AppError('Conversation not found', 404);

    await pool.execute('DELETE FROM ai_conversations WHERE id=? AND userId=?', [id, userId]);

    res.status(200).json(successResponse('Conversation deleted', { id }));
  } catch (err) {
    next(err);
  }
}

// ---- Projects ----

const ALLOWED_ICONS = ['Folder', 'Star', 'Briefcase', 'Code', 'BookOpen', 'Globe', 'Layers', 'Zap'];

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { name, icon, color } = req.body as { name: string; icon?: string; color?: string };

    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new AppError('Project name is required', 400);
    }

    const cleanName = name.trim().slice(0, 100);
    const cleanIcon = ALLOWED_ICONS.includes(icon ?? '') ? icon! : 'Folder';
    const cleanColor = /^#[0-9A-Fa-f]{6}$/.test(color ?? '') ? color! : '#feba01';

    const id = uuidv4();
    await pool.execute(
      'INSERT INTO ai_projects (id, userId, name, icon, color, createdAt) VALUES (?, ?, ?, ?, ?, NOW(3))',
      [id, userId, cleanName, cleanIcon, cleanColor],
    );

    res.status(201).json(successResponse('Project created', { id, name: cleanName, icon: cleanIcon, color: cleanColor, createdAt: new Date().toISOString() }));
  } catch (err) {
    next(err);
  }
}

export async function listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, name, icon, color, createdAt FROM ai_projects WHERE userId=? ORDER BY createdAt ASC',
      [userId],
    );
    res.status(200).json(successResponse('Projects retrieved', { projects: rows }));
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, icon, color } = req.body as { name?: string; icon?: string; color?: string };

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM ai_projects WHERE id=? AND userId=? LIMIT 1',
      [id, userId],
    );
    if (!rows[0]) throw new AppError('Project not found', 404);

    const updates: string[] = [];
    const params: unknown[] = [];

    if (name && name.trim()) {
      updates.push('name=?');
      params.push(name.trim().slice(0, 100));
    }
    if (icon && ALLOWED_ICONS.includes(icon)) {
      updates.push('icon=?');
      params.push(icon);
    }
    if (color && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      updates.push('color=?');
      params.push(color);
    }

    if (updates.length > 0) {
      params.push(id, userId);
      await pool.execute(`UPDATE ai_projects SET ${updates.join(', ')} WHERE id=? AND userId=?`, params);
    }

    res.status(200).json(successResponse('Project updated', { id }));
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM ai_projects WHERE id=? AND userId=? LIMIT 1',
      [id, userId],
    );
    if (!rows[0]) throw new AppError('Project not found', 404);

    await pool.execute('DELETE FROM ai_projects WHERE id=? AND userId=?', [id, userId]);

    res.status(200).json(successResponse('Project deleted', { id }));
  } catch (err) {
    next(err);
  }
}

export async function assignProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { projectId } = req.body as { projectId: string | null };

    const [convRows] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id FROM ai_conversations WHERE id=? AND userId=? LIMIT 1',
      [id, userId],
    );
    if (!convRows[0]) throw new AppError('Conversation not found', 404);

    if (projectId !== null && projectId !== undefined) {
      const [projRows] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM ai_projects WHERE id=? AND userId=? LIMIT 1',
        [projectId, userId],
      );
      if (!projRows[0]) throw new AppError('Project not found', 404);
    }

    await pool.execute(
      'UPDATE ai_conversations SET projectId=? WHERE id=? AND userId=?',
      [projectId ?? null, id, userId],
    );

    res.status(200).json(successResponse('Conversation project updated', { id, projectId: projectId ?? null }));
  } catch (err) {
    next(err);
  }
}
