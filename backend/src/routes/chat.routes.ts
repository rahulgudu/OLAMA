import { Router } from 'express';
import {
  createChat,
  listChats,
  getMessages,
  addMessage,
  renameChat,
  deleteChat
} from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/chats', createChat);
router.get('/chats', listChats);
router.get('/chats/:chatId/messages', getMessages);
router.post('/chats/:chatId/messages', addMessage);
router.patch('/chats/:chatId', renameChat);
router.delete('/chats/:chatId', deleteChat);

export default router;
