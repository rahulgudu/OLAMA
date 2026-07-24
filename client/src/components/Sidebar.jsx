// eslint-disable-next-line no-unused-vars
import React from 'react';
import { MessageSquare, Plus, Database, Cpu, Globe, Settings } from 'lucide-react';
import { APP_NAME } from '../config/constants';

export default function Sidebar({ onNewChat }) {
  return (
    <aside className="w-64 h-screen bg-[#141412] border-r border-[#2d2d2a] flex flex-col shrink-0">
      {/* App Branding */}
      <div className="p-4 border-b border-[#2d2d2a] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center font-bold text-white shadow-md">
            N
          </div>
          <span className="font-bold text-lg tracking-wide text-[#ecebe4]">{APP_NAME}</span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 bg-[#242422] hover:bg-[#2d2d2a] border border-[#383834] rounded-xl text-sm font-medium text-[#ecebe4] transition-all shadow-sm group cursor-pointer"
        >
          <Plus className="w-4 h-4 text-orange-400 group-hover:rotate-90 transition-transform" />
          <span>New Chat</span>
        </button>
      </div>

      {/* System Active Indicators */}
      <div className="px-3 py-2 space-y-1 text-xs text-[#8e8d8a]">
        <div className="px-2 py-1 font-semibold uppercase tracking-wider text-[10px] text-[#6b6a67]">
          Active Context Engine
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1c1c1a]">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>ChromaDB Vector</span>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1c1c1a]">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Neo4j Graph DB</span>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1c1c1a]">
          <Globe className="w-3.5 h-3.5 text-orange-400" />
          <span>Live Web Crawler</span>
        </div>
      </div>

      {/* History Placeholder */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-2 py-1 font-semibold uppercase tracking-wider text-[10px] text-[#6b6a67]">
          Recent Chats
        </div>
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-[#ecebe4] bg-[#242422] rounded-lg border border-[#383834] cursor-pointer">
          <MessageSquare className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <span className="truncate">FastAPI & GraphRAG</span>
        </div>
      </div>

      {/* Bottom User/Settings Bar */}
      <div className="p-3 border-t border-[#2d2d2a] flex items-center justify-between text-xs text-[#8e8d8a]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[10px]">
            DEV
          </div>
          <span>Local Mac Engine</span>
        </div>
        <Settings className="w-4 h-4 hover:text-[#ecebe4] cursor-pointer" />
      </div>
    </aside>
  );
}