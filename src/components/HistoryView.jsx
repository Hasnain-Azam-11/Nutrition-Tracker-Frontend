import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Calendar, ChevronRight, ChevronDown, Activity, Sparkles, TrendingUp } from 'lucide-react'

export default function HistoryView() {
  const [historyDays, setHistoryDays] = useState([])
  const [weeklyAverages, setWeeklyAverages] = useState({ calories: 0, protein: 0 })
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(null) // date string of expanded day
  const [error, setError] = useState('')

  // Load history data for the past 7 days
  const loadHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const today = new Date()
      const days = []
      const promises = []

      // Generate dates for the past 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        days.push({
          dateStr,
          dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
          formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })
        promises.push(api.getFoodLogs(dateStr))
      }

      const results = await Promise.all(promises)
      
      let totalCal = 0
      let totalProt = 0
      let loggedDaysCount = 0

      const mappedDays = days.map((day, idx) => {
        const dayLogsList = results[idx]
        const dayTotals = dayLogsList.reduce((acc, log) => {
          acc.calories += Number(log.calories) || 0
          acc.protein += Number(log.protein_g) || 0
          return acc
        }, { calories: 0, protein: 0 })

        if (dayLogsList.length > 0) {
          totalCal += dayTotals.calories
          totalProt += dayTotals.protein
          loggedDaysCount++
        }

        return {
          ...day,
          totals: dayTotals,
          logs: dayLogsList
        }
      })

      setHistoryDays(mappedDays)
      
      const divisor = loggedDaysCount || 1
      setWeeklyAverages({
        calories: Math.round(totalCal / divisor),
        protein: Math.round(totalProt / divisor)
      })

    } catch (err) {
      console.error(err)
      setError('Could not load history details. Check backend server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const toggleDayLogs = (dateStr) => {
    if (expandedDay === dateStr) {
      setExpandedDay(null)
    } else {
      setExpandedDay(dateStr)
    }
  }

  const maxCalories = Math.max(...historyDays.map(d => d.totals.calories), 2000)
  const maxProtein = Math.max(...historyDays.map(d => d.totals.protein), 100)

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 transition-all duration-300">
      
      <h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
        <TrendingUp size={24} className="text-orange-500" />
        <span>Weekly Intake History</span>
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 text-sm rounded-2xl border border-rose-500/25">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-2" />
          <span className="text-xs text-zinc-500">Computing logs...</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* WEEKLY AVERAGES CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Weekly Calories Avg</span>
                <span className="text-3xl font-extrabold text-zinc-100 mt-1 block">
                  {weeklyAverages.calories} <span className="text-sm font-semibold text-zinc-500">kcal/day</span>
                </span>
              </div>
              <div className="p-3 bg-orange-500/10 text-orange-450 rounded-xl shadow-lg shadow-orange-500/5">
                <Activity size={20} />
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Weekly Protein Avg</span>
                <span className="text-3xl font-extrabold text-zinc-100 mt-1 block">
                  {weeklyAverages.protein} <span className="text-sm font-semibold text-zinc-500">g/day</span>
                </span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-450 rounded-xl shadow-lg shadow-emerald-500/5">
                <Sparkles size={20} />
              </div>
            </div>
          </div>

          {/* COLUMN CHART FOR CALORIES & PROTEIN */}
          <div className="glass-panel rounded-3xl p-6 bg-zinc-900/60 border border-zinc-800 shadow-xl">
            <h3 className="text-sm font-bold text-zinc-350 mb-6 uppercase tracking-wider text-left">Weekly Trends</h3>
            
            <div className="h-48 flex items-end justify-between gap-2 px-2 mt-4">
              {historyDays.slice().reverse().map((day) => {
                const calHeight = (day.totals.calories / maxCalories) * 100
                const protHeight = (day.totals.protein / maxProtein) * 100
                return (
                  <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex justify-center items-end gap-1.5 h-36">
                      {/* Calories Column */}
                      <div 
                        style={{ height: `${Math.max(calHeight, 4)}%` }} 
                        className="w-3 sm:w-4 bg-orange-500 rounded-t-md hover:brightness-110 transition-all duration-300 relative group shadow-[0_0_10px_rgba(249,115,22,0.15)]"
                        title={`${Math.round(day.totals.calories)} kcal`}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 text-zinc-150 text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-25">
                          {Math.round(day.totals.calories)} kcal
                        </span>
                      </div>
                      {/* Protein Column */}
                      <div 
                        style={{ height: `${Math.max(protHeight, 4)}%` }} 
                        className="w-3 sm:w-4 bg-emerald-500 rounded-t-md hover:brightness-110 transition-all duration-300 relative group shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                        title={`${Math.round(day.totals.protein)}g Protein`}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 text-zinc-150 text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-25">
                          {Math.round(day.totals.protein)}g P
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-500">{day.dayName}</span>
                  </div>
                )
              })}
            </div>
            
            <div className="flex gap-4 justify-center items-center mt-6 text-[10px] font-bold text-zinc-450">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-orange-500 rounded" />
                <span>Calories</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded" />
                <span>Protein (g)</span>
              </div>
            </div>
          </div>

          {/* HISTORY DAYS LIST */}
          <div className="glass-panel rounded-3xl overflow-hidden border border-zinc-800 shadow-xl bg-zinc-900/60">
            <div className="divide-y divide-zinc-850/80">
              {historyDays.map((day) => {
                const isOpen = expandedDay === day.dateStr
                const totalFoodCount = day.logs.length
                
                return (
                  <div key={day.dateStr} className="w-full">
                    <button
                      onClick={() => toggleDayLogs(day.dateStr)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-850/30 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-sm text-zinc-200">{day.formattedDate}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{day.dayName}</span>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          {totalFoodCount} logged
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden sm:flex gap-4 text-xs font-semibold text-zinc-400">
                          <span>Calories: <strong className="text-zinc-200">{Math.round(day.totals.calories)}</strong></span>
                          <span>Protein: <strong className="text-zinc-200">{Math.round(day.totals.protein)}g</strong></span>
                        </div>
                        {isOpen ? <ChevronDown size={16} className="text-zinc-400" /> : <ChevronRight size={16} className="text-zinc-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-2 bg-zinc-950/20 border-t border-zinc-850/60 animate-fadeIn">
                        {day.logs.length === 0 ? (
                          <p className="text-xs text-zinc-500 italic py-2 text-left">No food logs created for this day.</p>
                        ) : (
                          <div className="space-y-2">
                            {day.logs.map((log) => (
                              <div 
                                key={log.id} 
                                className="flex justify-between items-center text-xs p-3 bg-zinc-950 border border-zinc-900 text-zinc-200 rounded-xl shadow-inner hover:bg-zinc-900/40"
                              >
                                <div className="flex flex-col text-left">
                                  <span className="font-bold text-zinc-250">{log.food_name}</span>
                                  <span className="text-[10px] text-zinc-500 mt-0.5">{log.quantity || 1} {log.unit || 'serving'}</span>
                                </div>
                                <div className="flex gap-3 text-zinc-300 font-extrabold">
                                  <span className="text-orange-450">{Math.round(log.calories)} kcal</span>
                                  <span className="text-emerald-450">{Math.round(log.protein_g)}g P</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          {/* Spacer to prevent navigation overlap */}
        </div>
        {/* Spacer to prevent navigation overlap */}
        <div className="h-12"  />
      </div>
      )}
    </div>
  )
}
