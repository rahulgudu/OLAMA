import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Cpu, User } from 'lucide-react';
import { APP_NAME } from "../config/constants"

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-4 text-sm leading-relaxed items-start py-2 ${isUser ? 'justify-end' : ''}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-md shrink-0 mt-0.5">
          <Cpu className="w-4 h-4" />
        </div>
      )}

      <div className={`flex-1 max-w-2xl space-y-1.5 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className="font-semibold text-xs text-[#8e8d8a] tracking-wide">
          {isUser ? 'You' : APP_NAME}
        </div>

        <div
          className={`text-[15px] leading-relaxed font-normal rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-[#383834] text-[#ecebe4] max-w-lg border border-[#484844]'
              : 'text-[#d5d3cb] bg-transparent pl-0 py-0'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.text}</p>
          ) : (
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#171715] prose-pre:border prose-pre:border-[#2d2d2a] prose-pre:rounded-xl">
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-[#383834] flex items-center justify-center text-[#ecebe4] border border-[#484844] shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );
}