import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';

async function findOwnedChat(chatId: string, userId: string | undefined) {
  return Chat.findOne({ _id: chatId, userId });
}

export async function createChat(req: Request, res: Response) {
  try {
    const { model, webSearchEnabled } = req.body;
    const chat = await Chat.create({ userId: req.userId, model, webSearchEnabled });
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
}

export async function listChats(req: Request, res: Response) {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('title updatedAt createdAt');
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list chats' });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const { chatId } = req.params as {chatId: string};

    const chat = await findOwnedChat(chatId, req.userId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

export async function addMessage(req: Request, res: Response) {
  try {
    const { chatId } = req.params as {chatId: string};
    const { role, content } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'role and content are required' });
    }

    const chat = await findOwnedChat(chatId, req.userId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const message = await Message.create({ chatId, role, content });
    chat.updatedAt = new Date();
    await chat.save();

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add message' });
  }
}

export async function renameChat(req: Request, res: Response) {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: req.userId },
      { title },
      { new: true }
    );
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to rename chat' });
  }
}

export async function deleteChat(req: Request, res: Response) {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOneAndDelete({ _id: chatId, userId: req.userId });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    await Message.deleteMany({ chatId });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
}
