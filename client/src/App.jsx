// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatFeed from './components/ChatFeed';
import ChatInput from './components/ChatInput';
import { API_BASE_URL, DEFAULT_MODEL } from './config/constants';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);

  const handleNewChat = () => {
    setMessages([]);
  };

  const handleSendMessage = async (promptText, enableWebSearch = true) => {
    if (!promptText.trim() || loading) return;

    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: promptText },
      { id: aiMsgId, sender: 'assistant', text: '', searching: enableWebSearch }
    ]);

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          model: selectedModel,
          enable_web_search: enableWebSearch
        })
      });

      if (!response.ok) throw new Error('Streaming failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId ? { ...msg, text: msg.text + chunkText } : msg
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#171715] text-[#ecebe4] font-sans overflow-hidden">
      {/* 👈 Sidebar fixed on left */}
      <Sidebar onNewChat={handleNewChat} /> 

      {/* 👈 Main Feed & Input on right */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
        <ChatFeed messages={messages} loading={loading} onSend={handleSendMessage} />
        <ChatInput onSend={handleSendMessage} loading={loading} />
      </div>
    </div>
  );
}