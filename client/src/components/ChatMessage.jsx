import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import { Cpu, User, Copy, Check, Terminal } from 'lucide-react';
import { APP_NAME } from '../config/constants';

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (codeText, id) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-4 text-sm leading-relaxed items-start py-2 ${isUser ? 'justify-end' : ''}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white shadow-md shrink-0 mt-0.5">
          <Cpu className="w-4 h-4" />
        </div>
      )}

      <div className={`flex-1 max-w-2xl space-y-1.5 overflow-hidden ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className="font-semibold text-xs text-[#8e8d8a] tracking-wide">
          {isUser ? 'You' : APP_NAME}
        </div>

        <div
          className={`text-[15px] leading-relaxed font-normal rounded-2xl ${
            isUser
              ? 'bg-[#383834] text-[#ecebe4] max-w-lg border border-[#484844] px-4 py-3'
              : 'text-[#d5d3cb] bg-transparent w-full'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          ) : (
            <div className="prose prose-invert max-w-none break-words">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    const codeId = Math.random().toString(36).substring(2, 9);

                    return !inline && match ? (
                      /* COLORFUL TERMINAL / IDE CONTAINER */
                      <div className="my-4 rounded-xl overflow-hidden border border-[#383834] bg-[#121211] shadow-2xl">
                        {/* Terminal Header Bar */}
                        <div className="flex items-center justify-between px-4 py-2 bg-[#1c1c1a] border-b border-[#2d2d2a]">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
                              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
                            </div>
                            <span className="text-xs font-mono text-[#8e8d8a] ml-2 flex items-center gap-1">
                              <Terminal className="w-3 h-3 text-orange-500" />
                              {match[1]}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopy(codeString, codeId)}
                            className="flex items-center gap-1 text-xs text-[#8e8d8a] hover:text-[#ecebe4] transition-colors py-1 px-2 rounded-md hover:bg-[#2a2a27]"
                          >
                            {copiedCode === codeId ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-green-400 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Highlighted Code Block */}
                        <div className="overflow-x-auto">
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              padding: '1.25rem',
                              background: '#121211',
                              fontSize: '0.875rem',
                              lineHeight: '1.6',
                              fontFamily: 'monospace'
                            }}
                            {...props}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ) : (
                      <code className="bg-[#2a2a27] text-orange-400 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-[#383834] flex items-center justify-center text-[#ecebe4] border border-[#484844] shrink-0 mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </motion.div>
  );
}