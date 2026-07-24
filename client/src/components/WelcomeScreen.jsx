// eslint-disable-next-line no-unused-vars
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Database, Cpu, Globe, ArrowUpRight } from 'lucide-react';
import { APP_NAME } from '../config/constants';

const SUGGESTIONS = [
  { icon: Database, text: 'What is the MERN stack? Give me an example.' },
  { icon: Cpu, text: 'Write a Cypher query to model a social network in Neo4j.' },
  { icon: Globe, text: 'What are the latest features in FastAPI?' },
  { icon: Sparkles, text: 'Explain how GraphRAG combines vector and graph retrieval.' }
];

export default function WelcomeScreen({ onSuggestion }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative mb-6"
      >
        <motion.div
          className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 blur-xl"
          animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-2xl">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="welcome-gradient-text text-3xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 bg-clip-text text-transparent"
      >
        Welcome to {APP_NAME}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-3 max-w-md text-sm text-[#8e8d8a] leading-relaxed"
      >
        Your local GraphRAG engineering co-pilot — fusing vector memory, knowledge-graph
        traversal, and live web search before every answer.
      </motion.p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {SUGGESTIONS.map(({ icon: Icon, text }, i) => (
          <motion.button
            key={text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.08, duration: 0.3 }}
            whileHover={{ y: -2 }}
            onClick={() => onSuggestion?.(text)}
            className="group flex items-center gap-3 text-left px-4 py-3 bg-[#1c1c1a] border border-[#2d2d2a] rounded-xl hover:border-orange-500/50 hover:bg-[#242422] transition-colors cursor-pointer"
          >
            <Icon className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="text-xs text-[#d5d3cb] flex-1">{text}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#6b6a67] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
