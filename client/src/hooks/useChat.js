import { useState } from 'react';
import { API_BASE_URL, AVAILABLE_MODELS, APP_NAME } from '../config/constants';

export function useChat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! Welcome to **${APP_NAME}**. How can I help you today?`
    }
  ]);

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: `New conversation started with **${APP_NAME}**.`
      }
    ]);
    setError(null);
  };

  const sendMessage = async (promptText) => {
    if (!promptText.trim() || loading) return;

    setError(null);
    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: promptText }
    ]);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, sender: 'ai', text: data.response }
      ]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: `⚠️ **Connection Error:** Could not reach the backend API (${err.message}). Ensure FastAPI and Ollama are running.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return {
    sidebarOpen,
    setSidebarOpen,
    selectedModel,
    setSelectedModel,
    messages,
    loading,
    error,
    handleNewChat,
    sendMessage
  };
}