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
      text: `Hello! Welcome to **${APP_NAME}**. How can I assist you with your code today?`
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

    // 1. Add User Message and empty AI Placeholder Message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: promptText },
      { id: aiMsgId, sender: 'ai', text: '' } // Placeholder for streaming text
    ]);
    
    setLoading(true);

    try {
      // 2. Fetch from the new Streaming Endpoint
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      // 3. Obtain a ReadableStream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      // 4. Read stream chunks in a loop
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });

        // Append incoming token chunk to the target AI message in real time
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === aiMsgId ? { ...msg, text: msg.text + chunkText } : msg
          )
        );
      }

    } catch (err) {
      setError(err.message);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                text: `⚠️ **Connection Error:** Failed to stream response (${err.message}). Ensure FastAPI and Ollama are running.`
              }
            : msg
        )
      );
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