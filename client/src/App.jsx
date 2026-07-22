import React from 'react';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatFeed from './components/ChatFeed';
import ChatComposer from './components/ChatComposer';
import "./App.css"
export default function App() {
  const {
    sidebarOpen,
    setSidebarOpen,
    selectedModel,
    setSelectedModel,
    messages,
    loading,
    error,
    handleNewChat,
    sendMessage
  } = useChat();

  return (
    <div className="flex h-screen bg-[#1e1e1c] text-[#ecebe4] font-sans antialiased overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onNewChat={handleNewChat} />

      <main className="flex-1 flex flex-col h-full relative bg-[#1e1e1c] overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          error={error}
        />

        <ChatFeed messages={messages} loading={loading} />

        <ChatComposer onSendMessage={sendMessage} loading={loading} />
      </main>
    </div>
  );
}