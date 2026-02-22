import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';
import {
  chat,
  listConversations,
  getConversation,
  renameConversation,
  deleteConversation,
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  assignProject,
} from '../controllers/ai.controller';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.post('/chat', authenticate, aiRateLimiter, upload.single('file'), chat);
router.get('/conversations', authenticate, listConversations);
router.get('/conversations/:id', authenticate, getConversation);
router.put('/conversations/:id', authenticate, renameConversation);
router.delete('/conversations/:id', authenticate, deleteConversation);
router.put('/conversations/:id/project', authenticate, assignProject);

router.post('/projects', authenticate, createProject);
router.get('/projects', authenticate, listProjects);
router.put('/projects/:id', authenticate, updateProject);
router.delete('/projects/:id', authenticate, deleteProject);

export default router;
