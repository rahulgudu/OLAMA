import React from 'react';
import { PanelLeftClose, PanelLeft, Sparkles, AlertCircle } from 'lucide-react';
import { AVAILABLE_MODELS } from '../config/constants';

export default function Header({ sidebarOpen, setSidebarOpen, selectedModel, setSelectedModel, error }) {
  return (
    <header className="h-14 border-b border-[#2d2d2a] flex items-center justify-between px-4 bg-[#1e1e1c]/90 backdrop-blur shrink-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 text-[#8e8d8a] hover:text-[#ecebe4] hover:bg-[#262624] rounded-lg transition-colors"
          title="Toggle Sidebar"
        >
          {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#262624] border border-[#383834] rounded-xl text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-[#ecebe4] cursor-pointer font-medium"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#262624] text-[#ecebe4]">
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 border border-red-800/50 px-2.5 py-1 rounded-md">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>API Disconnected</span>
        </div>
      )}
    </header>
  );
}