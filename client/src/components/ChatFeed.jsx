import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { APP_NAME } from '../config/constants';

export default function ChatFeed({ messages, loading }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 items-start py-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-[#8e8d8a] text-sm py-1">
              <span className="font-medium text-[#c2c0b6]">{APP_NAME} is thinking</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}