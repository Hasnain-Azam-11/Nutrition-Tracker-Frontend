import React, { useState, useEffect } from 'react'
import { api, isAuthenticated } from './lib/api'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import VoiceLogger from './components/VoiceLogger'
import HistoryView from './components/HistoryView'
import Settings from './components/Settings'
import { Activity, LogOut, User, LayoutDashboard, PlusCircle, History, Sliders, LogIn, UserPlus } from 'lucide-react'

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
    }

    window.addEventListener('auth-expired', handleAuthExpired)
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired)
    }
  }, [])

  const handleAuthSuccess = (user) => {
    localStorage.setItem('username', user.username)
    setCurrentUser(user)
    setAuthMode(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleLogout = () => {
    api.logout()
    setCurrentUser(null)
    setAuthMode(null)
    setCurrentTab('dashboard')
    setRefreshTrigger(prev => prev + 1)
  }

  const handleLogComplete = () => {
    setRefreshTrigger(prev => prev + 1)
    setCurrentTab('dashboard')
  }

  const handleTabClick = (tab) => {
    if (!currentUser && tab !== 'dashboard') {
      setAuthMode('signin')
      return
    }
    setCurrentTab(tab)
  }

  const handleAddClick = () => {
    if (!currentUser) {
      setAuthMode('signin')
      return
    }
    setCurrentTab('add-meal')
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
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300 relative">
      
      {/* HEADER NAVBAR */}
      <header className="glass-panel border-b border-zinc-800 px-4 sm:px-6 pb-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] sticky top-0 backdrop-blur-md z-40 bg-zinc-950/85">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-2.5 text-left cursor-pointer transition-opacity hover:opacity-90"
          >
            <div className="p-2 bg-orange-500 rounded-xl text-black shadow-md shadow-orange-500/20">
              <Activity size={20} />
            </div>
            <span className="font-extrabold text-xl text-zinc-100 tracking-tight">
              Bitewise
            </span>
          </button>

          {/* User Status / Auth Actions in Navbar */}
          {currentUser ? (
            <div className="flex items-center gap-3 sm:gap-4">
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
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setAuthMode('signin')}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs sm:text-sm font-semibold text-zinc-200 transition-all duration-200 cursor-pointer"
              >
                <LogIn size={15} className="text-orange-400" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[44px] rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black text-xs sm:text-sm font-black shadow-md shadow-orange-500/20 transition-all duration-200 cursor-pointer"
              >
                <UserPlus size={15} />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* CORE VIEW LAYOUT */}
      <main className="flex-1 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] max-w-5xl w-full mx-auto p-4 md:p-6">
        {currentTab === 'dashboard' && (
          <Dashboard 
            onAddClick={handleAddClick} 
            refreshTrigger={refreshTrigger}
            currentUser={currentUser}
            onAuthRequired={(mode) => setAuthMode(mode)}
          />
        )}
        {currentTab === 'add-meal' && (
          <VoiceLogger 
            onLogComplete={handleLogComplete}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}
        {currentTab === 'history' && (
          <HistoryView onAuthRequired={(mode) => setAuthMode(mode)} />
        )}
        {currentTab === 'settings' && (
          <Settings onAuthRequired={(mode) => setAuthMode(mode)} />
        )}
      </main>

      {/* FLOATING BOTTOM NAVIGATION */}
      <nav className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-30 max-w-md w-[calc(100%-2rem)] glass-panel border border-zinc-800 bg-zinc-900/90 rounded-3xl shadow-2xl p-2">
        <div className="flex justify-around items-center">
          
          {/* Dashboard Tab */}
          <button
            onClick={() => handleTabClick('dashboard')}
            className={getTabClass('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-bold">Dashboard</span>
          </button>

          {/* Add Meal Tab */}
          <button
            onClick={() => handleTabClick('add-meal')}
            className={getTabClass('add-meal')}
          >
            <PlusCircle size={20} />
            <span className="text-[10px] font-bold">Add Food</span>
          </button>

          {/* History Tab */}
          <button
            onClick={() => handleTabClick('history')}
            className={getTabClass('history')}
          >
            <History size={20} />
            <span className="text-[10px] font-bold">History</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => handleTabClick('settings')}
            className={getTabClass('settings')}
          >
            <Sliders size={20} />
            <span className="text-[10px] font-bold">Settings</span>
          </button>

        </div>
      </nav>

      {/* AUTH MODAL OVERLAY */}
      {authMode && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuthMode(null)
          }}
        >
          <Auth 
            initialIsSignUp={authMode === 'signup'} 
            onAuthSuccess={handleAuthSuccess} 
            onCancel={() => setAuthMode(null)} 
          />
        </div>
      )}
      
    </div>
  )
}

export default App
