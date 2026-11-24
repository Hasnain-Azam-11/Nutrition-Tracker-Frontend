import React, { useState, useEffect } from 'react'
import { api, isAuthenticated } from './lib/api'
import Auth from './components/Auth'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import VoiceLogger from './components/VoiceLogger'
import HistoryView from './components/HistoryView'
import Settings from './components/Settings'
import { Activity, LogOut, User, LayoutDashboard, PlusCircle, History, Sliders } from 'lucide-react'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [authMode, setAuthMode] = useState(null) // null, 'signin', 'signup'

  // Sync auth state on mount
  useEffect(() => {
    if (isAuthenticated()) {
      setCurrentUser({ username: localStorage.getItem('username') || 'user' })
    }

    const handleAuthExpired = () => {
      setCurrentUser(null)
      setAuthMode(null)
      setCurrentTab('dashboard')
    };

    window.addEventListener('auth-expired', handleAuthExpired)
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired)
    }
  }, [])

  const handleAuthSuccess = (user) => {
    localStorage.setItem('username', user.username)
    setCurrentUser(user)
    setAuthMode(null)
    setCurrentTab('dashboard')
  }

  const handleLogout = () => {
    api.logout()
    setCurrentUser(null)
    setAuthMode(null)
    setCurrentTab('dashboard')
  }

  const handleLogComplete = () => {
    setRefreshTrigger(prev => prev + 1)
    setCurrentTab('dashboard')
  }

  if (!currentUser) {
    if (!authMode) {
      return <LandingPage onGetStarted={(mode) => setAuthMode(mode)} />
    }
    return (
      <Auth 
        initialIsSignUp={authMode === 'signup'} 
        onAuthSuccess={handleAuthSuccess} 
        onCancel={() => setAuthMode(null)} 
      />
    )
  }

  const getTabClass = (tab) => {
    const isActive = currentTab === tab
    return `flex flex-col items-center justify-center gap-1 px-3 py-2 min-h-[44px] rounded-2xl transition-all duration-300 cursor-pointer ${
      isActive 
        ? 'text-black bg-orange-500 shadow-lg shadow-orange-500/20 scale-105 font-bold' 
        : 'text-zinc-400 hover:text-zinc-200'
    }`
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
      
      {/* HEADER NAVBAR */}
      <header className="glass-panel border-b border-zinc-800 px-6 pb-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] sticky top-0 backdrop-blur-md z-45 bg-zinc-950/80">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500 rounded-xl text-black shadow-md shadow-orange-500/20">
              <Activity size={20} />
            </div>
            <span className="font-extrabold text-xl text-zinc-150">
              Bitewise
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <User size={14} className="text-orange-500" />
              <span className="max-w-[120px] truncate md:max-w-none">{currentUser.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl border border-zinc-850 bg-zinc-900/50 hover:bg-zinc-900 text-xs font-bold text-zinc-300 transition-all duration-200 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* CORE VIEW LAYOUT */}
      <main className="flex-1 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] max-w-5xl w-full mx-auto p-4 md:p-6">
        {currentTab === 'dashboard' && (
          <Dashboard 
            onAddClick={() => setCurrentTab('add-meal')} 
            refreshTrigger={refreshTrigger}
          />
        )}
        {currentTab === 'add-meal' && (
          <VoiceLogger 
            onLogComplete={handleLogComplete}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}
        {currentTab === 'history' && <HistoryView />}
        {currentTab === 'settings' && <Settings />}
      </main>

      {/* FLOATING BOTTOM NAVIGATION */}
      <nav className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)] glass-panel border border-zinc-800 bg-zinc-900/90 rounded-3xl shadow-2xl p-2">
        <div className="flex justify-around items-center">
          
          {/* Dashboard Tab */}
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={getTabClass('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-bold">Dashboard</span>
          </button>

          {/* Add Meal Tab */}
          <button
            onClick={() => setCurrentTab('add-meal')}
            className={getTabClass('add-meal')}
          >
            <PlusCircle size={20} />
            <span className="text-[10px] font-bold">Add Food</span>
          </button>

          {/* History Tab */}
          <button
            onClick={() => setCurrentTab('history')}
            className={getTabClass('history')}
          >
            <History size={20} />
            <span className="text-[10px] font-bold">History</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setCurrentTab('settings')}
            className={getTabClass('settings')}
          >
            <Sliders size={20} />
            <span className="text-[10px] font-bold">Settings</span>
          </button>

        </div>
      </nav>
      
    </div>
  )
}

export default App
