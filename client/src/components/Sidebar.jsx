// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { MessageSquare, Plus, Database, Cpu, Globe, LogOut, Pencil, Trash2 } from 'lucide-react';
import { APP_NAME } from '../config/constants';

export default function Sidebar({
  chats = [],
  currentChatId,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  onLogout
}) {
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const startEditing = (chat) => {
    setEditingChatId(chat._id);
    setEditingTitle(chat.title || 'New Chat');
  };

  const commitEditing = () => {
    if (editingChatId) onRenameChat?.(editingChatId, editingTitle);
    setEditingChatId(null);
  };

  const cancelEditing = () => setEditingChatId(null);

  const handleDelete = (chatId) => {
    if (window.confirm('Delete this chat? This cannot be undone.')) {
      onDeleteChat?.(chatId);
    }
  };

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

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-2 py-1 font-semibold uppercase tracking-wider text-[10px] text-[#6b6a67]">
          Recent Chats
        </div>

        {chats.length === 0 && (
          <div className="px-3 py-2 text-xs text-[#6b6a67]">No chats yet</div>
        )}

        {chats.map((chat) => {
          const isEditing = editingChatId === chat._id;
          const isActive = chat._id === currentChatId;

          return (
            <div
              key={chat._id}
              className={`group w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                isActive
                  ? 'bg-[#242422] border-[#383834] text-[#ecebe4]'
                  : 'border-transparent text-[#a3a29c] hover:bg-[#1c1c1a]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-orange-400 shrink-0" />

              {isEditing ? (
                <input
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEditing();
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  onBlur={commitEditing}
                  className="flex-1 min-w-0 bg-[#1c1c1a] border border-orange-500/50 rounded px-1.5 py-0.5 text-sm text-[#ecebe4] outline-none"
                />
              ) : (
                <button
                  onClick={() => onSelectChat(chat._id)}
                  className="flex-1 min-w-0 text-left truncate cursor-pointer"
                >
                  {chat.title || 'New Chat'}
                </button>
              )}

              {!isEditing && (
                <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(chat);
                    }}
                    title="Rename"
                    className="p-1 rounded hover:bg-[#2a2a27] hover:text-[#ecebe4] cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(chat._id);
                    }}
                    title="Delete"
                    className="p-1 rounded hover:bg-[#2a2a27] hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom User/Settings Bar */}
      <div className="p-3 border-t border-[#2d2d2a] flex items-center justify-between text-xs text-[#8e8d8a]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[10px]">
            DEV
          </div>
          <span>Local Mac Engine</span>
        </div>
        <button onClick={onLogout} title="Log out" className="hover:text-[#ecebe4] cursor-pointer">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
