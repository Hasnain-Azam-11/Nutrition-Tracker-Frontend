import React, { useState, useEffect } from 'react'
import { api, isAuthenticated } from '../lib/api'
import { Save, CheckCircle2, AlertCircle, RefreshCw, Calculator, Sliders, Bone, Sparkles, Zap, Brain, Droplet } from 'lucide-react'

export default function Settings({ onAuthRequired }) {
  const [goalsId, setGoalsId] = useState(null)
  const [goals, setGoals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Calculator inputs stored in state (backed by Profile & local persistence)
  const [gender, setGender] = useState(() => localStorage.getItem('vd_gender') || 'male')
  const [age, setAge] = useState(() => Number(localStorage.getItem('vd_age')) || 25)
  const [weight, setWeight] = useState(() => Number(localStorage.getItem('vd_weight')) || 70)
  const [height, setHeight] = useState(() => Number(localStorage.getItem('vd_height')) || 175)
  const [activity, setActivity] = useState(() => localStorage.getItem('vd_activity') || 'moderate')
  const [goal, setGoal] = useState(() => localStorage.getItem('vd_goal') || 'maintain')

  // Load goals and profile from DB on mount
  const loadSettings = async () => {
    if (!isAuthenticated()) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      // 1. Fetch Goals
      const goalData = await api.getUserGoals()
      if (goalData) {
        setGoalsId(goalData.id)
        setGoals(goalData)
        if (goalData.goal_type) {
          setGoal(goalData.goal_type)
        }
      }

      // 2. Fetch Profile
      const profileData = await api.getUserProfile()
      if (profileData) {
        if (profileData.gender) {
          setGender(profileData.gender === 'women' ? 'female' : 'male')
        }
        if (profileData.age) {
          setAge(profileData.age)
        }
        if (profileData.weight_kg) {
          setWeight(profileData.weight_kg)
        }
        if (profileData.height_feet) {
          // Convert feet to cm for UI input
          setHeight(Math.round(profileData.height_feet * 30.48))
        }
      }
    } catch (err) {
      console.error(err)
      setError('Could not retrieve goals or profile. Check backend server connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Save changes
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      // 1. Update Profile (weight_kg, age, height_feet, gender)
      const profilePayload = {
        age: Number(age),
        weight_kg: Number(weight),
        height_feet: Number((Number(height) / 30.48).toFixed(2)),
        gender: gender === 'female' ? 'women' : 'man'
      }
      await api.updateUserProfile(profilePayload)

      // 2. Update Goals (calls PUT /usergoal/ on backend)
      const goalsPayload = {
        weight_kg: Number(weight),
        height_cm: Number(height),
        age: Number(age),
        gender: gender, // backend expects male/female for calculations
        activity_level: activity, // 'sedentary', 'light', 'moderate', 'active', 'very_active'
        goal_type: goal // 'maintain', 'bulk', 'cut'
      }
      
      const updatedGoals = await api.updateUserGoals(goalsPayload)
      if (updatedGoals) {
        setGoals(updatedGoals)
      }

      // 3. Persist inputs in localStorage
      localStorage.setItem('vd_gender', gender)
      localStorage.setItem('vd_age', age.toString())
      localStorage.setItem('vd_weight', weight.toString())
      localStorage.setItem('vd_height', height.toString())
      localStorage.setItem('vd_activity', activity)
      localStorage.setItem('vd_goal', goal)

      setMessage('Goals calculated and updated successfully on backend!')
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to update targets on server.')
    } finally {
      setSaving(false)
    }
  }

  if (!isAuthenticated()) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 md:p-6 transition-all duration-300">
        <h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
          <Sliders size={24} className="text-orange-500" />
          <span>Nutritional Goals</span>
        </h2>
        <div className="glass-panel bg-zinc-900/60 border border-zinc-800 p-10 rounded-3xl text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-orange-500 shadow-lg glow-orange">
            <Sliders size={32} />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Sign in to customize your goals</h3>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
            Calculate your TDEE, customize macronutrient targets, and configure personalized micronutrient goals when signed in.
          </p>
          <button
            onClick={() => onAuthRequired && onAuthRequired('signin')}
            className="px-6 py-3 min-h-[44px] bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 cursor-pointer transition-all"
          >
            Sign In to Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 transition-all duration-300">
      
      <h2 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
        <Sliders size={24} className="text-orange-500" />
        <span>Nutritional Goals</span>
      </h2>

      {message && (
        <div className="mb-6 p-4 bg-orange-500/10 text-orange-400 text-sm rounded-2xl flex gap-2 border border-orange-500/20">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 text-rose-400 text-sm rounded-2xl flex gap-2 border border-rose-500/25">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-2" />
          <span className="text-xs text-zinc-500">Loading targets...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Main Direct-Input Calculator Card */}
          <div className="glass-panel rounded-3xl p-6 bg-zinc-900/60 border border-zinc-800 shadow-xl space-y-6">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-zinc-800 pb-3">
              <Calculator size={16} className="text-orange-500" />
              <span>Personal Metrics & Calories Calculator</span>
            </span>

            {/* Gender Selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2">Gender</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all duration-200 cursor-pointer ${
                    gender === 'male'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-extrabold'
                      : 'border-zinc-800 hover:bg-zinc-900/50 text-zinc-400'
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all duration-200 cursor-pointer ${
                    gender === 'female'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400 font-extrabold'
                      : 'border-zinc-800 hover:bg-zinc-900/50 text-zinc-400'
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Physical Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Age (years)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  required
                  min="20"
                  max="300"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Height (cm)</label>
                <input
                  type="number"
                  required
                  min="50"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Activity Level Selector */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">Daily Activity Level</label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-150 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="sedentary">Sedentary (desk job, minimal exercise)</option>
                <option value="light">Lightly Active (exercise 1-3 days/wk)</option>
                <option value="moderate">Moderately Active (exercise 3-5 days/wk)</option>
                <option value="active">Very Active (hard exercise 6-7 days/wk)</option>
                <option value="very_active">Extra Active (highly athletic / physical work)</option>
              </select>
            </div>

            {/* Diet Weight Goal */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">Dietary / Weight Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-150 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="maintain">Balanced Maintenance (Stay same weight)</option>
                <option value="cut">Cutting / Fat Loss</option>
                <option value="bulk">Bulking / Muscle Gain</option>
              </select>
            </div>

            {/* LIVE COMPUTED RECOMMENDATION BOX */}
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 glow-orange">
              <div>
                <span className="text-xs font-extrabold text-zinc-300 block uppercase tracking-wider">Current Saved Energy Target</span>
                <p className="text-[10px] text-zinc-500 mt-0.5">Calculated on the fly by the Django REST API BMR engine.</p>
              </div>
              <span className="text-3xl font-black text-orange-500">
                {goals ? goals.daily_calories : 2000} <span className="text-xs font-medium text-zinc-450 uppercase">kcal/day</span>
              </span>
            </div>

          </div>

          {/* Dynamic Macros Display */}
          <div className="glass-panel rounded-3xl p-5 md:p-6 bg-zinc-900/60 border border-zinc-800 shadow-xl space-y-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Calculated Daily Macronutrients</span>

            <div className="grid grid-cols-3 gap-3">
              {/* Protein */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-900 text-center flex flex-col justify-center shadow-inner">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Protein</span>
                <span className="text-lg font-black text-zinc-200 mt-1 block">{goals ? goals.daily_protein_g : 150}g</span>
              </div>

              {/* Carbs */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-900 text-center flex flex-col justify-center shadow-inner">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">Carbs</span>
                <span className="text-lg font-black text-zinc-200 mt-1 block">{goals ? goals.daily_carbs_g : 200}g</span>
              </div>

              {/* Fat */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-900 text-center flex flex-col justify-center shadow-inner">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Fat</span>
                <span className="text-lg font-black text-zinc-200 mt-1 block">{goals ? goals.daily_fat_g : 65}g</span>
              </div>
            </div>
          </div>

          {/* Dynamic Micros Display */}
          <div className="glass-panel rounded-3xl p-6 bg-zinc-900/60 border border-zinc-800 shadow-xl space-y-6">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block font-sans border-b border-zinc-850 pb-3">
              Calculated Daily Micronutrients & Vitamins
            </span>

            <div className="space-y-6 text-left">
              {[
                {
                  title: 'Bone & Joint Wellness',
                  icon: Bone,
                  badgeClass: 'bg-blue-500/10 text-blue-200 border-blue-500/20',
                  nutrients: [
                    { label: 'Calcium', val: `${goals ? goals.daily_calcium_mg : 1000} mg` },
                    { label: 'Magnesium', val: `${goals ? goals.daily_magnesium_mg : 420} mg` },
                    { label: 'Vitamin D', val: `${goals ? goals.daily_vitamin_d_mcg : 15} mcg` },
                    { label: 'Vitamin K2', val: `${goals ? goals.daily_vitamin_k2_mcg : 120} mcg` },
                    { label: 'Phosphorus', val: `${goals ? goals.daily_phosphorus_mg : 700} mg` },
                  ]
                },
                {
                  title: 'Skin & Cellular Vitality',
                  icon: Sparkles,
                  badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                  nutrients: [
                    { label: 'Vitamin C', val: `${goals ? goals.daily_vitamin_c_mg : 90} mg` },
                    { label: 'Zinc', val: `${goals ? goals.daily_zinc_mg : 11} mg` },
                    { label: 'Vitamin A', val: `${goals ? goals.daily_vitamin_a_mcg : 900} mcg` },
                    { label: 'Vitamin E', val: `${goals ? goals.daily_vitamin_e_mg : 15} mg` },
                    { label: 'Selenium', val: `${goals ? goals.daily_selenium_mcg : 55} mcg` },
                    { label: 'CoQ10', val: `${goals ? goals.daily_coq10_mg : 100} mg` },
                  ]
                },
                {
                  title: 'Metabolic & Vitality Health',
                  icon: Zap,
                  badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                  nutrients: [
                    { label: 'Iron', val: `${goals ? goals.daily_iron_mg : 18} mg` },
                    { label: 'Folate', val: `${goals ? goals.daily_folate_mcg : 400} mcg` },
                    { label: 'Biotin', val: `${goals ? goals.daily_biotin_mcg : 30} mcg` },
                    { label: 'Vitamin B12', val: `${goals ? goals.daily_vitamin_b12_mcg : 2.4} mcg` },
                    { label: 'Chromium', val: `${goals ? goals.daily_chromium_mcg : 35} mcg` },
                    { label: 'Iodine', val: `${goals ? goals.daily_iodine_mcg : 150} mcg` },
                  ]
                },
                {
                  title: 'Heart & Brain Health',
                  icon: Brain,
                  badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
                  nutrients: [
                    { label: 'Omega 3', val: `${goals ? goals.daily_omega_3_g : 1.6} g` },
                    { label: 'Vitamin B6', val: `${goals ? goals.daily_vitamin_b6_mg : 1.3} mg` },
                    { label: 'Vitamin B12', val: `${goals ? goals.daily_vitamin_b12_mcg : 2.4} mcg` },
                    { label: 'Choline', val: `${goals ? goals.daily_choline_mg : 550} mg` },
                  ]
                },
                {
                  title: 'Fluid Balance & Hydration',
                  icon: Droplet,
                  badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                  nutrients: [
                    { label: 'Sodium', val: `${goals ? goals.daily_sodium_mg : 2300} mg` },
                    { label: 'Potassium', val: `${goals ? goals.daily_potassium_mg : 3400} mg` },
                    { label: 'Chloride', val: `${goals ? goals.daily_chloride_mg : 2300} mg` },
                  ]
                }
              ].map((category) => {
                const IconComp = category.icon
                return (
                  <div key={category.title} className="space-y-2.5">
                    <div className="flex items-center gap-2 text-zinc-200 font-extrabold text-xs">
                      <div className={`p-1.5 rounded-lg border ${category.badgeClass}`}>
                        <IconComp size={14} />
                      </div>
                      <span>{category.title}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {category.nutrients.map((n) => (
                        <div key={n.label} className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 flex flex-col justify-center">
                          <span className="text-[9px] font-bold text-zinc-500 truncate block leading-none">{n.label}</span>
                          <span className="text-xs font-black text-zinc-300 mt-1 block">{n.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold rounded-2xl shadow-lg shadow-orange-500/20 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span>Calculate & Save Targets</span>
          </button>
          {/* Spacer to prevent navigation overlap */}
          <div className="h-14" />
        </form>
      )}

    </div>
  )
}
