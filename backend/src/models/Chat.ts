import { Schema, model, Document, Types } from 'mongoose';

export interface IChat extends Document {
    userId: Types.ObjectId;
    title: string;
    aimodel: string;
    webSearchEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, default: 'New Chat' },
        aimodel: { type: String, default: 'phi4-mini' },
        webSearchEnabled: { type: Boolean, default: true }
    },
    { timestamps: true }
);

export const Chat = model<IChat>('Chat', chatSchema);
