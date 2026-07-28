// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, Loader2 } from 'lucide-react';
import { CHAT_SERVICE_URL, APP_NAME } from '../config/constants';

export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${CHAT_SERVICE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onAuthenticated(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#171715] text-[#ecebe4] px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-[#1c1c1a] border border-[#2d2d2a] rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">{APP_NAME}</h1>
          <p className="text-xs text-[#8e8d8a] mt-1">
            {mode === 'login' ? 'Log in to continue' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 bg-[#242422] border border-[#383834] rounded-xl px-3 py-2.5 focus-within:border-orange-500/60 transition-colors">
            <Mail className="w-4 h-4 text-[#8e8d8a] shrink-0" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-transparent text-sm outline-none placeholder-[#8e8d8a]"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#242422] border border-[#383834] rounded-xl px-3 py-2.5 focus-within:border-orange-500/60 transition-colors">
            <Lock className="w-4 h-4 text-[#8e8d8a] shrink-0" />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              className="w-full bg-transparent text-sm outline-none placeholder-[#8e8d8a]"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white text-sm font-medium py-2.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              'Log In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-xs text-center text-[#8e8d8a] mt-5">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-orange-400 hover:text-orange-300 font-medium cursor-pointer"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
