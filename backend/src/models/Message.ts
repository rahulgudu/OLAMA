import { Schema, model, Document, Types } from 'mongoose';

export type MessageRole = 'user' | 'assistant';

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Message = model<IMessage>('Message', messageSchema);
