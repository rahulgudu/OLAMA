/* eslint-disable no-unused-vars */
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Sparkles } from 'lucide-react';
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

        {/* WEB SEARCH & CRAWLING LOADING BADGE */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 items-center py-3 px-4 bg-[#242422] border border-[#383834] rounded-2xl max-w-md shadow-xl"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md animate-pulse">
              <Globe className="w-4 h-4 animate-spin" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-orange-400">
                <span>{APP_NAME} searching & crawling web...</span>
                <span className="text-[10px] text-[#8e8d8a]">GraphRAG + Live Web</span>
              </div>
              
              <div className="h-1.5 w-full bg-[#171715] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}