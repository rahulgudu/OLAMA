// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatFeed from './components/ChatFeed';
import ChatInput from './components/ChatInput';
import AuthScreen from './components/AuthScreen';
import { API_BASE_URL, CHAT_SERVICE_URL, DEFAULT_MODEL } from './config/constants';
import { getToken, setToken as saveToken, clearToken } from './utils/auth';

export default function App() {
  const [token, setToken] = useState(getToken());
  const [messages, setMessages] = useState([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${CHAT_SERVICE_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setChats(await res.json());
    } catch (err) {
      console.error('Failed to fetch chats', err);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChats();
  }, [fetchChats]);

  const handleAuthenticated = (newToken) => {
    saveToken(newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    clearToken();
    setToken(null);
    setMessages([]);
    setChats([]);
    setCurrentChatId(null);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleRenameChat = async (chatId, newTitle) => {
    const title = newTitle.trim();
    if (!title) return;

    try {
      const res = await fetch(`${CHAT_SERVICE_URL}/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Failed to rename chat');

      setChats((prev) => prev.map((c) => (c._id === chatId ? { ...c, title } : c)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      const res = await fetch(`${CHAT_SERVICE_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete chat');

      setChats((prev) => prev.filter((c) => c._id !== chatId));
      if (chatId === currentChatId) {
        setMessages([]);
        setCurrentChatId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectChat = async (chatId) => {
    if (chatId === currentChatId || loading) return;
    setCurrentChatId(chatId);
    setMessages([]);

    try {
      const res = await fetch(`${CHAT_SERVICE_URL}/api/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load chat');

      const history = await res.json();
      setMessages(history.map((m) => ({ id: m._id, sender: m.role, text: m.content })));
    } catch (err) {
      console.error(err);
    }
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
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          prompt: promptText,
          model: selectedModel,
          enable_web_search: enableWebSearch,
          chat_id: currentChatId
        })
      });

      if (!response.ok) throw new Error('Streaming failed');

      const newChatId = response.headers.get('X-Chat-Id');
      if (newChatId && newChatId !== currentChatId) {
        setCurrentChatId(newChatId);
      }

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

      fetchChats();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#171715] text-[#ecebe4] font-sans overflow-hidden">
      {/* 👈 Sidebar fixed on left */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onLogout={handleLogout}
      />

      {/* 👈 Main Feed & Input on right */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
        <ChatFeed messages={messages} loading={loading} onSend={handleSendMessage} />
        <ChatInput onSend={handleSendMessage} loading={loading} />
      </div>
    </div>
  );
}
