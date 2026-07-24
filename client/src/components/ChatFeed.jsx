// eslint-disable-next-line no-unused-vars
import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import WelcomeScreen from './WelcomeScreen';

export default function ChatFeed({ messages, loading, onSend }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0) {
    return <WelcomeScreen onSuggestion={(text) => onSend?.(text, true)} />;
  }

  const lastMessage = messages[messages.length - 1];
  const isStreamingReply = loading && lastMessage?.sender === 'assistant';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((msg, idx) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isStreaming={isStreamingReply && idx === messages.length - 1}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}