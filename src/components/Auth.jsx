import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Mail, Lock, Activity, AlertCircle, ArrowRight, Sparkles, CheckCircle2, User, X } from 'lucide-react'

export default function Auth({ onAuthSuccess, initialIsSignUp = false, onCancel }) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setIsSignUp(initialIsSignUp)
    setError('')
    setMessage('')
  }, [initialIsSignUp])

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        if (!username || !email || !password) {
          throw new Error('Please fill in all fields.')
        }
        await api.register(username, email, password)
        setMessage('Registration successful! You can now sign in.')
        setIsSignUp(false)
        setPassword('')
      } else {
        if (!username || !password) {
          throw new Error('Please fill in all fields.')
        }
        const user = await api.login(username, password)
        onAuthSuccess(user)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto my-auto p-4 transition-colors duration-300">
      
      <div className="w-full glass-panel rounded-3xl p-6 sm:p-8 border border-zinc-800 bg-zinc-900/95 shadow-2xl relative z-10 glow-orange">
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-all min-h-[44px] min-w-[44px] hover:bg-zinc-800/60 rounded-xl cursor-pointer flex items-center justify-center"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3.5 bg-orange-500 rounded-2xl text-black shadow-lg shadow-orange-500/20 mb-4 ring-4 ring-orange-500/10">
            <Activity size={32} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
            Bitewise
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Speak your meals. Track your macros.
          </p>
        </div>

        {/* Card Navigation */}
        <div className="flex border-b border-zinc-800 mb-6">
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all duration-300 cursor-pointer ${
              !isSignUp
                ? 'border-orange-500 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => {
              setIsSignUp(false)
              setError('')
              setMessage('')
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all duration-300 cursor-pointer ${
              isSignUp
                ? 'border-orange-500 text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => {
              setIsSignUp(true)
              setError('')
              setMessage('')
            }}
          >
            Create Account
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-500/10 text-rose-400 text-sm rounded-2xl flex items-start gap-2.5 border border-rose-500/25">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 text-emerald-400 text-sm rounded-2xl flex items-start gap-2.5 border border-emerald-500/25">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Forms */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="text"
                required
                placeholder="yourusername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/35 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-800 pt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
          <Sparkles size={12} className="text-orange-500" />
          <span>Django REST + SimpleJWT Security Enabled</span>
        </div>
      </div>
    </div>
  )
}
