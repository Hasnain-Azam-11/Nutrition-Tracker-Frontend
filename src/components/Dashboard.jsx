import React, { useState, useEffect, useMemo } from 'react'
import { api } from '../lib/api'
import {
  ChevronLeft, ChevronRight, Calendar, Plus, Trash2, Edit3,
  Activity, Sparkles, Check, AlertCircle, Bone, Heart, Zap, Utensils, Brain, Droplet
} from 'lucide-react'

// Define default goals in case server fails to load them
const DEFAULT_GOALS = {
  daily_calories: 2000,
  daily_protein_g: 150,
  daily_carbs_g: 200,
  daily_fat_g: 65,
  daily_calcium_mg: 1000,
  daily_magnesium_mg: 420,
  daily_phosphorus_mg: 700,
  daily_vitamin_d_mcg: 15,
  daily_vitamin_a_mcg: 900,
  daily_vitamin_c_mg: 90,
  daily_vitamin_e_mg: 15,
  daily_zinc_mg: 11,
  daily_selenium_mcg: 55,
  daily_biotin_mcg: 30,
  daily_folate_mcg: 400,
  daily_iron_mg: 18,
  daily_omega_3_g: 1.6,
  daily_potassium_mg: 3400,
  daily_sodium_mg: 2300,
  daily_vitamin_k2_mcg: 120,
  daily_coq10_mg: 100,
  daily_chromium_mcg: 35,
  daily_iodine_mcg: 150,
  daily_vitamin_b6_mg: 1.3,
  daily_vitamin_b12_mcg: 2.4,
  daily_choline_mg: 550,
  daily_chloride_mg: 2300
}

// ---- Micronutrient category definitions (single source of truth) ----
const NUTRIENT_CATEGORIES = [
  {
    key: 'bone',
    title: 'Bone & Joint',
    icon: Bone,
    accent: '#38bdf8', // sky-400
    accentSoft: 'rgba(56,189,248,0.12)',
    nutrients: [
      { label: 'Calcium', field: 'calcium_mg', goalField: 'daily_calcium_mg', unit: 'mg' },
      { label: 'Magnesium', field: 'magnesium_mg', goalField: 'daily_magnesium_mg', unit: 'mg' },
      { label: 'Vitamin D', field: 'vitamin_d_mcg', goalField: 'daily_vitamin_d_mcg', unit: 'mcg' },
      { label: 'Vitamin K2', field: 'vitamin_k2_mcg', goalField: 'daily_vitamin_k2_mcg', unit: 'mcg' },
      { label: 'Phosphorus', field: 'phosphorus_mg', goalField: 'daily_phosphorus_mg', unit: 'mg' },
    ]
  },
  {
    key: 'skin',
    title: 'Skin & Cellular',
    icon: Sparkles,
    accent: '#fbbf24', // amber-400
    accentSoft: 'rgba(251,191,36,0.12)',
    nutrients: [
      { label: 'Vitamin C', field: 'vitamin_c_mg', goalField: 'daily_vitamin_c_mg', unit: 'mg' },
      { label: 'Zinc', field: 'zinc_mg', goalField: 'daily_zinc_mg', unit: 'mg' },
      { label: 'Vitamin A', field: 'vitamin_a_mcg', goalField: 'daily_vitamin_a_mcg', unit: 'mcg' },
      { label: 'Vitamin E', field: 'vitamin_e_mg', goalField: 'daily_vitamin_e_mg', unit: 'mg' },
      { label: 'Selenium', field: 'selenium_mcg', goalField: 'daily_selenium_mcg', unit: 'mcg' },
      { label: 'CoQ10', field: 'coq10_mg', goalField: 'daily_coq10_mg', unit: 'mg' },
    ]
  },
  {
    key: 'metabolic',
    title: 'Metabolic',
    icon: Zap,
    accent: '#fb923c', // orange-400
    accentSoft: 'rgba(251,146,60,0.12)',
    nutrients: [
      { label: 'Iron', field: 'iron_mg', goalField: 'daily_iron_mg', unit: 'mg' },
      { label: 'Folate', field: 'folate_mcg', goalField: 'daily_folate_mcg', unit: 'mcg' },
      { label: 'Biotin', field: 'biotin_mcg', goalField: 'daily_biotin_mcg', unit: 'mcg' },
      { label: 'Vitamin B12', field: 'vitamin_b12_mcg', goalField: 'daily_vitamin_b12_mcg', unit: 'mcg' },
      { label: 'Chromium', field: 'chromium_mcg', goalField: 'daily_chromium_mcg', unit: 'mcg' },
      { label: 'Iodine', field: 'iodine_mcg', goalField: 'daily_iodine_mcg', unit: 'mcg' },
    ]
  },
  {
    key: 'heart',
    title: 'Heart & Brain',
    icon: Brain,
    accent: '#a78bfa', // violet-400
    accentSoft: 'rgba(167,139,250,0.12)',
    nutrients: [
      { label: 'Omega 3', field: 'omega_3_g', goalField: 'daily_omega_3_g', unit: 'g', isFloat: true },
      { label: 'Vitamin B6', field: 'vitamin_b6_mg', goalField: 'daily_vitamin_b6_mg', unit: 'mg', isFloat: true },
      { label: 'Vitamin B12', field: 'vitamin_b12_mcg', goalField: 'daily_vitamin_b12_mcg', unit: 'mcg' },
      { label: 'Choline', field: 'choline_mg', goalField: 'daily_choline_mg', unit: 'mg' },
    ]
  },
  {
    key: 'fluid',
    title: 'Fluid Balance',
    icon: Droplet,
    accent: '#22d3ee', // cyan-400
    accentSoft: 'rgba(34,211,238,0.12)',
    nutrients: [
      { label: 'Sodium', field: 'sodium_mg', goalField: 'daily_sodium_mg', unit: 'mg', isCeiling: true },
      { label: 'Potassium', field: 'potassium_mg', goalField: 'daily_potassium_mg', unit: 'mg' },
      { label: 'Chloride', field: 'chloride_mg', goalField: 'daily_chloride_mg', unit: 'mg' },
    ]
  },
]

export default function Dashboard({ onAddClick, refreshTrigger }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [logs, setLogs] = useState([])
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('bone')

  // Inline edit state
  const [editingLog, setEditingLog] = useState(null)
  const [editQty, setEditQty] = useState(1)
  const [editUnit, setEditUnit] = useState('serving')

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const fetchedLogs = await api.getFoodLogs(selectedDate)
      setLogs(fetchedLogs)

      let fetchedGoals = await api.getUserGoals()
      if (!fetchedGoals) {
        fetchedGoals = await api.createUserGoals(DEFAULT_GOALS)
      }
      if (fetchedGoals) {
        const formatted = {}
        Object.keys(DEFAULT_GOALS).forEach(key => {
          formatted[key] = fetchedGoals[key] !== undefined ? Number(fetchedGoals[key]) : DEFAULT_GOALS[key]
        })
        setGoals(formatted)
      }
    } catch (err) {
      console.error(err)
      setError('Could not fetch diary data. Is the Django backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedDate, refreshTrigger])

  // Date handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  // Delete log item
  const handleDeleteLog = async (id) => {
    try {
      await api.deleteFoodLog(id)
      setLogs(prev => prev.filter(log => log.id !== id))
    } catch (err) {
      setError('Failed to delete log entry.')
    }
  }

  // Edit log handlers
  const startEditing = (log) => {
    setEditingLog(log)
    setEditQty(log.quantity || 1)
    setEditUnit(log.unit || 'serving')
  }

  const saveEdit = async () => {
    if (!editingLog) return
    try {
      const ratio = editQty / (editingLog.quantity || 1)

      const updatedFields = {
        quantity: Number(editQty),
        unit: editUnit,
        calories: Number((editingLog.calories * ratio).toFixed(2)),
        protein_g: Number((editingLog.protein_g * ratio).toFixed(2)),
        carbs_g: Number((editingLog.carbs_g * ratio).toFixed(2)),
        fat_g: Number((editingLog.fat_g * ratio).toFixed(2)),
        fiber_g: Number(((editingLog.fiber_g || 0) * ratio).toFixed(2)),
        calcium_mg: Number(((editingLog.calcium_mg || 0) * ratio).toFixed(2)),
        magnesium_mg: Number(((editingLog.magnesium_mg || 0) * ratio).toFixed(2)),
        phosphorus_mg: Number(((editingLog.phosphorus_mg || 0) * ratio).toFixed(2)),
        vitamin_d_mcg: Number(((editingLog.vitamin_d_mcg || 0) * ratio).toFixed(2)),
        vitamin_a_mcg: Number(((editingLog.vitamin_a_mcg || 0) * ratio).toFixed(2)),
        vitamin_c_mg: Number(((editingLog.vitamin_c_mg || 0) * ratio).toFixed(2)),
        vitamin_e_mg: Number(((editingLog.vitamin_e_mg || 0) * ratio).toFixed(2)),
        zinc_mg: Number(((editingLog.zinc_mg || 0) * ratio).toFixed(2)),
        selenium_mcg: Number(((editingLog.selenium_mcg || 0) * ratio).toFixed(2)),
        biotin_mcg: Number(((editingLog.biotin_mcg || 0) * ratio).toFixed(2)),
        folate_mcg: Number(((editingLog.folate_mcg || 0) * ratio).toFixed(2)),
        iron_mg: Number(((editingLog.iron_mg || 0) * ratio).toFixed(2)),
        omega_3_g: Number(((editingLog.omega_3_g || 0) * ratio).toFixed(2)),
        potassium_mg: Number(((editingLog.potassium_mg || 0) * ratio).toFixed(2)),
        sodium_mg: Number(((editingLog.sodium_mg || 0) * ratio).toFixed(2)),
      }

      await api.updateFoodLog(editingLog.id, updatedFields)
      setEditingLog(null)
      fetchData()
    } catch (err) {
      setError('Failed to update food log.')
    }
  }

  // Calculate totals
  const totals = logs.reduce((acc, log) => {
    Object.keys(DEFAULT_GOALS).forEach(key => {
      const field = key.replace('daily_', '')
      if (log[field] !== undefined) {
        acc[field] = (acc[field] || 0) + Number(log[field])
      }
    })
    return acc;
  }, {
    calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
    calcium_mg: 0, magnesium_mg: 0, phosphorus_mg: 0, vitamin_d_mcg: 0,
    vitamin_a_mcg: 0, vitamin_c_mg: 0, vitamin_e_mg: 0, zinc_mg: 0, selenium_mcg: 0,
    biotin_mcg: 0, folate_mcg: 0, iron_mg: 0, omega_3_g: 0, potassium_mg: 0, sodium_mg: 0,
    vitamin_k2_mcg: 0, coq10_mg: 0, chromium_mcg: 0, iodine_mcg: 0,
    vitamin_b6_mg: 0, vitamin_b12_mcg: 0, choline_mg: 0, chloride_mg: 0
  })

  // Format percentages helper
  const getPercent = (value, goal) => {
    const target = Number(goal) || 1
    const val = Number(value) || 0
    return Math.min(Math.round((val / target) * 100), 100)
  }

  // Average completion per category (drives the tab pills + summary ring)
  const categoryStats = useMemo(() => {
    return NUTRIENT_CATEGORIES.map(cat => {
      const percents = cat.nutrients.map(n => getPercent(totals[n.field], goals[n.goalField]))
      const avg = percents.length ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length) : 0
      return { ...cat, avg }
    })
  }, [totals, goals])

  const overallMicroAvg = useMemo(() => {
    if (!categoryStats.length) return 0
    return Math.round(categoryStats.reduce((a, c) => a + c.avg, 0) / categoryStats.length)
  }, [categoryStats])

  const activeCat = categoryStats.find(c => c.key === activeCategory) || categoryStats[0]

  const getSourceLabel = (source) => {
    if (source === 'ai_voice') return 'Voice Parse'
    if (source === 'ai_text') return 'AI Extracted'
    return 'Manual Entry'
  }

  const getSourceColor = (source) => {
    if (source === 'ai_voice' || source === 'ai_text') {
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    }
    return 'bg-zinc-800 text-zinc-400 border-zinc-700'
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 transition-all duration-300">

      {/* Date Switcher Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 p-1 rounded-2xl shadow-lg">
          <button
            onClick={handlePrevDay}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all cursor-pointer"
            aria-label="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 px-3 font-extrabold text-zinc-100 text-sm">
            <Calendar size={16} className="text-orange-500" />
            <span>{selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}</span>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all cursor-pointer"
            aria-label="Next Day"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex gap-2">
          {selectedDate !== new Date().toISOString().split('T')[0] && (
            <button
              onClick={handleToday}
              className="px-4 py-2.5 min-h-[44px] border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 font-extrabold text-xs rounded-xl cursor-pointer transition-colors duration-200"
            >
              Today
            </button>
          )}
          <button
            onClick={onAddClick}
            className="px-4 py-2.5 min-h-[44px] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer transition-all duration-200"
          >
            <Plus size={14} />
            <span>Add Food</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 text-sm rounded-2xl flex gap-2 border border-rose-500/25">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-2" />
          <span className="text-xs text-zinc-500">Loading diary...</span>
        </div>
      ) : (
        <div className="space-y-6">

          {/* MACROS OVERVIEW CARD */}
          <div className="glass-panel rounded-3xl p-6 bg-zinc-900/60 border border-zinc-800 shadow-xl glow-orange">
            <h3 className="text-base font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <Activity size={18} className="text-orange-500" />
              <span>Daily Calorie & Macro Balance</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              {/* Circular Calories Ring - Visual Centerpiece */}
              <div className="flex flex-col items-center justify-center p-4 border-r border-zinc-800/50">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <defs>
                      <linearGradient id="calRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                    </defs>
                    <circle cx="64" cy="64" r="54" strokeWidth="10" stroke="rgba(63, 63, 70, 0.2)" fill="transparent" />
                    <circle
                      cx="64" cy="64" r="54" strokeWidth="10" stroke="url(#calRingGrad)"
                      className="progress-ring-circle"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 54}`}
                      strokeDashoffset={`${2 * Math.PI * 54 * (1 - getPercent(totals.calories, goals.daily_calories) / 100)}`}
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0px 0px 8px rgba(249, 115, 22, 0.4))' }}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-zinc-100 tracking-tight">{Math.round(totals.calories)}</span>
                    <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest mt-0.5">/ {Math.round(goals.daily_calories)} kcal</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-zinc-300 mt-4 uppercase tracking-widest">Energy Intake</span>
              </div>

              {/* Progress bars for Protein, Carbs, Fat */}
              <div className="md:col-span-3 space-y-4">
                {/* Protein */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      Protein
                    </span>
                    <span className="text-zinc-450">{Math.round(totals.protein_g)}g / <span className="font-extrabold text-zinc-300">{Math.round(goals.daily_protein_g)}g</span> ({getPercent(totals.protein_g, goals.daily_protein_g)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${getPercent(totals.protein_g, goals.daily_protein_g)}%` }} />
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-sky-500 rounded-full" />
                      Carbohydrates
                    </span>
                    <span className="text-zinc-450">{Math.round(totals.carbs_g)}g / <span className="font-extrabold text-zinc-300">{Math.round(goals.daily_carbs_g)}g</span> ({getPercent(totals.carbs_g, goals.daily_carbs_g)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(14,165,233,0.3)]" style={{ width: `${getPercent(totals.carbs_g, goals.daily_carbs_g)}%` }} />
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                      Fat
                    </span>
                    <span className="text-zinc-450">{Math.round(totals.fat_g)}g / <span className="font-extrabold text-zinc-300">{Math.round(goals.daily_fat_g)}g</span> ({getPercent(totals.fat_g, goals.daily_fat_g)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]" style={{ width: `${getPercent(totals.fat_g, goals.daily_fat_g)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= MICRONUTRIENT & VITAMIN SECTION — REDESIGNED ================= */}
          <div className="glass-panel rounded-3xl p-6 border border-zinc-800 shadow-xl bg-zinc-900/60">

            {/* Header row: title + overall completion ring */}
            <div className="flex items-center justify-between mb-5 gap-4">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles size={18} className="text-orange-500" />
                <span>Micronutrients & Vitamins</span>
              </h3>

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-10 h-10">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="20" cy="20" r="16" strokeWidth="4" stroke="rgba(63,63,70,0.4)" fill="transparent" />
                    <circle
                      cx="20" cy="20" r="16" strokeWidth="4" stroke="#f97316"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - overallMicroAvg / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-zinc-200">{overallMicroAvg}%</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-tight hidden sm:block">Overall<br />Coverage</span>
              </div>
            </div>

            {/* Category tab pills — replaces the wall of 5 stacked boxes */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1 scrollbar-hide">
              {categoryStats.map((cat) => {
                const IconComp = cat.icon
                const isActive = cat.key === activeCategory
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`flex items-center gap-2 shrink-0 px-3.5 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'border-transparent shadow-lg'
                        : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900'
                    }`}
                    style={isActive ? { backgroundColor: cat.accentSoft, borderColor: cat.accent } : {}}
                  >
                    <IconComp size={14} style={{ color: isActive ? cat.accent : '#71717a' }} />
                    <span className={`text-xs font-bold ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`}>{cat.title}</span>
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                      style={{
                        color: isActive ? cat.accent : '#71717a',
                        backgroundColor: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.03)'
                      }}
                    >
                      {cat.avg}%
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Active category detail panel */}
            {activeCat && (
              <div
                className="rounded-2xl p-5 border transition-all duration-300"
                style={{ backgroundColor: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {activeCat.nutrients.map((n) => {
                    const total = totals[n.field]
                    const goal = goals[n.goalField]
                    const percent = getPercent(total, goal)
                    const isOverCeiling = n.isCeiling && total > goal
                    const valStr = n.isFloat
                      ? `${(total || 0).toFixed(1)}${n.unit} / ${(goal || 0).toFixed(1)}${n.unit}`
                      : `${Math.round(total || 0)}${n.unit} / ${Math.round(goal || 0)}${n.unit}`

                    return (
                      <div key={n.label} className="space-y-1.5">
                        <div className="flex justify-between items-baseline text-[11px] font-bold">
                          <span className="text-zinc-300">{n.label}</span>
                          <span className={isOverCeiling ? 'text-rose-400' : 'text-zinc-500'}>{valStr}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isOverCeiling ? 'animate-pulse' : ''}`}
                            style={{
                              width: `${percent}%`,
                              backgroundColor: isOverCeiling ? '#f43f5e' : activeCat.accent,
                              boxShadow: `0 0 8px ${isOverCeiling ? 'rgba(244,63,94,0.4)' : activeCat.accent + '55'}`
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          {/* ================= END MICRONUTRIENT SECTION ================= */}

          {/* UNIFIED LOGGED MEALS FEED */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1 flex justify-between items-center">
              <span>Logged Meals</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold">
                {logs.length} logged
              </span>
            </h4>

            {logs.length === 0 ? (
              <div className="glass-panel bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl text-center flex flex-col items-center justify-center space-y-3 shadow-xl">
                <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 text-orange-500 shadow-lg glow-orange">
                  <Utensils size={24} />
                </div>
                <p className="text-zinc-300 font-extrabold text-sm">Your food diary is empty</p>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                  Tap the mic or describe what you ate to see calories and real-time macros breakdown!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const isEditing = editingLog && editingLog.id === log.id

                  return (
                    <div
                      key={log.id}
                      className="glass-panel rounded-2xl p-4 bg-zinc-900/40 border border-zinc-800/80 shadow-md hover:bg-zinc-900/60 transition-all duration-300 flex flex-col md:flex-row justify-between md:items-center gap-4"
                    >
                      {/* Left: Food Description */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-zinc-200 text-sm">
                            {log.food_name}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getSourceColor(log.source)}`}>
                            {getSourceLabel(log.source)}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-450 block mt-1">
                          {log.quantity || 1} {log.unit || 'serving'} • <strong className="text-orange-500 font-bold">{Math.round(log.calories)} kcal</strong>
                        </span>
                      </div>

                      {/* Middle: Macro Breakdown */}
                      <div className="flex gap-4 text-xs font-bold text-zinc-450 shrink-0">
                        <span>P: <strong className="text-emerald-400 font-black">{Math.round(log.protein_g)}g</strong></span>
                        <span>C: <strong className="text-sky-400 font-black">{Math.round(log.carbs_g)}g</strong></span>
                        <span>F: <strong className="text-rose-400 font-black">{Math.round(log.fat_g)}g</strong></span>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex gap-2 justify-end shrink-0">
                        {isEditing ? (
                          <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
                            <input
                              type="number"
                              step="any"
                              value={editQty}
                              onChange={(e) => setEditQty(Number(e.target.value))}
                              className="w-12 text-xs p-1 border border-zinc-800 rounded bg-zinc-900 text-zinc-100 focus:outline-none"
                            />
                            <select
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value)}
                              className="text-xs p-1 border border-zinc-800 rounded bg-zinc-900 text-zinc-150 focus:outline-none cursor-pointer"
                            >
                              <option value="serving">serving</option>
                              <option value="g">g</option>
                              <option value="oz">oz</option>
                              <option value="cup">cup</option>
                              <option value="tbsp">tbsp</option>
                              <option value="tsp">tsp</option>
                              <option value="piece">piece</option>
                              <option value="slice">slice</option>
                            </select>
                            <button onClick={saveEdit} className="p-1 text-orange-500 hover:bg-zinc-800 rounded cursor-pointer">
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(log)}
                              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 rounded-xl transition-all cursor-pointer"
                              title="Edit Portion"
                              aria-label="Edit Portion"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                              title="Delete Log"
                              aria-label="Delete Log"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {/* Spacer to prevent navigation overlap */}
            <div className="h-14" />
          </div>
        </div>
      )}
    </div>
  )
}