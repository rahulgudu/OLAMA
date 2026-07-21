import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { APP_NAME } from '../config/constants';

export default function Sidebar({ isOpen, onNewChat }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 256, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="bg-[#171715] border-r border-[#2d2d2a] flex flex-col justify-between overflow-hidden z-20 shrink-0 h-full"
        >
          <div className="p-3 w-64">
            <div className="flex items-center gap-2.5 px-3 py-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center font-bold text-xs text-white">
                N
              </div>
              <span className="font-bold text-base tracking-tight text-[#ecebe4]">{APP_NAME}</span>
            </div>

            <button
              onClick={onNewChat}
              className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#262624] hover:bg-[#32322e] text-[#ecebe4] border border-[#383834] rounded-xl text-sm font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-orange-500" />
              <span>New Chat</span>
            </button>

            <div className="mt-6 px-2 text-[11px] font-bold text-[#73726d] uppercase tracking-wider">
              Workspace History
            </div>

            <div className="mt-2 space-y-1">
              <button className="w-full flex items-center justify-between px-2.5 py-2 text-sm text-[#c2c0b6] bg-[#262624]/60 hover:bg-[#262624] rounded-lg transition-colors text-left group">
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-4 h-4 shrink-0 text-[#8e8d8a]" />
                  <span className="truncate">Current Session</span>
                </div>
                <Trash2 className="w-3.5 h-3.5 text-[#73726d] opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity" />
              </button>
            </div>
          </div>

          <div className="p-3 border-t border-[#2d2d2a] w-64">
            <div className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-[#c2c0b6]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                DEV
              </div>
              <div className="flex flex-col truncate">
                <span className="truncate text-xs font-semibold text-[#ecebe4]">Developer Workspace</span>
                <span className="text-[10px] text-[#73726d]">Local Environment</span>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}