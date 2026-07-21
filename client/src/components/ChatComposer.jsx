import React, { useState, useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { APP_NAME } from '../config/constants';

export default function ChatComposer({ onSendMessage, loading }) {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);

  const handleTextareaChange = (e) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!prompt.trim() || loading) return;

    onSendMessage(prompt.trim());
    setPrompt('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  return (
    <div className="p-4 bg-gradient-to-t from-[#1e1e1c] via-[#1e1e1c] to-transparent shrink-0">
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto bg-[#262624] border border-[#383834] focus-within:border-[#52514c] rounded-2xl p-3 shadow-2xl transition-all"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={prompt}
          onChange={handleTextareaChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={`Ask ${APP_NAME} anything... (Shift+Enter for new line)`}
          className="w-full bg-transparent text-[#ecebe4] placeholder-[#73726d] text-sm focus:outline-none resize-none px-2 max-h-44 min-h-[36px]"
        />

        <div className="flex items-center justify-between pt-2 border-t border-[#32322e] mt-1 px-1">
          <button
            type="button"
            className="p-1.5 text-[#8e8d8a] hover:text-[#ecebe4] hover:bg-[#32322e] rounded-lg transition-colors"
            title="Attach Document (Phase 3)"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!prompt.trim() || loading}
            className={`p-2 rounded-xl transition-all ${
              prompt.trim() && !loading
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md hover:opacity-90'
                : 'bg-[#32322e] text-[#5c5b56] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="text-center text-[11px] text-[#73726d] mt-2 font-medium">
        {APP_NAME} • Running local open-source models via FastAPI
      </div>
    </div>
  );
}