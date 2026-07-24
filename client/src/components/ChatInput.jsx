// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { Send, Paperclip, Globe, Sparkles } from 'lucide-react';

export default function ChatInput({ onSend, loading }) {
  const [input, setInput] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    onSend(input, webSearchEnabled);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 bg-[#171715] border-t border-[#2d2d2a]">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
        <div className="flex flex-col bg-[#242422] border border-[#383834] rounded-2xl shadow-xl focus-within:border-orange-500/60 transition-colors overflow-hidden">
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Nexus AI anything... (Press Enter to send)"
            rows={2}
            className="w-full bg-transparent text-[#ecebe4] placeholder-[#8e8d8a] p-3 text-sm resize-none focus:outline-none"
          />

          <div className="flex items-center justify-between px-3 py-2 bg-[#1c1c1a] border-t border-[#2d2d2a]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  webSearchEnabled
                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                    : 'bg-transparent border-[#383834] text-[#8e8d8a] hover:text-[#ecebe4]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web Search {webSearchEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                title="Upload Document"
                className="p-1.5 text-[#8e8d8a] hover:text-[#ecebe4] hover:bg-[#2a2a27] rounded-lg transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`flex items-center justify-center p-2 rounded-xl text-white transition-all ${
                input.trim() && !loading
                  ? 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-md cursor-pointer'
                  : 'bg-[#383834] text-[#8e8d8a] cursor-not-allowed'
              }`}
            >
              {loading ? (
                <Sparkles className="w-4 h-4 animate-spin text-orange-300" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}