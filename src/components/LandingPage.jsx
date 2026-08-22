import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  Mic, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  LogIn,
  UserPlus,
  Play,
  RotateCcw,
  Plus
} from 'lucide-react'

export default function LandingPage({ onGetStarted }) {
  const [demoState, setDemoState] = useState('idle') // idle, recording, typing, parsed
  const [demoText, setDemoText] = useState('')
  const [demoProgress, setDemoProgress] = useState(0)

  const sampleTranscripts = [
    "I had two scrambled eggs with spinach and a slice of toasted sourdough bread.",
    "For dinner, I ate grilled chicken breast, 150 grams of cooked brown rice, and steamed broccoli.",
    "I just finished a protein shake with one banana, a cup of oat milk, and a scoop of whey protein."
  ]

  const sampleParsedOutputs = {
    0: {
      items: [
        { name: "Scrambled Eggs (x2)", calories: 140, protein: 12, carbs: 1, fat: 10 },
        { name: "Spinach", calories: 10, protein: 1, carbs: 2, fat: 0 },
        { name: "Sourdough Toast (1 slice)", calories: 90, protein: 4, carbs: 18, fat: 1 }
      ],
      total: { calories: 240, protein: 17, carbs: 21, fat: 11 }
    },
    1: {
      items: [
        { name: "Grilled Chicken Breast (150g)", calories: 248, protein: 46, carbs: 0, fat: 5 },
        { name: "Brown Rice (150g)", calories: 170, protein: 4, carbs: 36, fat: 1 },
        { name: "Steamed Broccoli", calories: 35, protein: 3, carbs: 7, fat: 0.5 }
      ],
      total: { calories: 453, protein: 53, carbs: 43, fat: 6.5 }
    },
    2: {
      items: [
        { name: "Whey Protein (1 scoop)", calories: 120, protein: 24, carbs: 3, fat: 1.5 },
        { name: "Banana (x1)", calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
        { name: "Oat Milk (1 cup)", calories: 120, protein: 3, carbs: 16, fat: 5 }
      ],
      total: { calories: 345, protein: 28.3, carbs: 46, fat: 6.8 }
    }
  }

  const [activeSampleIndex, setActiveSampleIndex] = useState(0)

  useEffect(() => {
    let timer
    if (demoState === 'recording') {
      timer = setTimeout(() => {
        setDemoState('typing')
      }, 2500)
    } else if (demoState === 'typing') {
      const fullText = sampleTranscripts[activeSampleIndex]
      let currentIdx = 0
      const typeInterval = setInterval(() => {
        setDemoText(fullText.slice(0, currentIdx + 1))
        currentIdx++
        if (currentIdx >= fullText.length) {
          clearInterval(typeInterval)
          setTimeout(() => {
            setDemoState('parsed')
          }, 800)
        }
      }, 30)
      return () => clearInterval(typeInterval)
    }
    return () => clearTimeout(timer)
  }, [demoState, activeSampleIndex])

  const runDemo = () => {
    setDemoText('')
    setDemoState('recording')
  }

  const resetDemo = () => {
    setDemoState('idle')
    setDemoText('')
    setActiveSampleIndex((prev) => (prev + 1) % sampleTranscripts.length)
  }

  const currentParsed = sampleParsedOutputs[activeSampleIndex]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* BACKGROUND DECORATIVE ELEMENTS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* HEADER NAVBAR */}
      <header className="glass-panel border-b border-zinc-800/80 px-6 py-4 sticky top-0 backdrop-blur-md z-45 bg-zinc-950/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500 rounded-xl text-black shadow-md shadow-orange-500/20">
              <Activity size={20} />
            </div>
            <span className="font-extrabold text-xl text-zinc-100 tracking-tight">
              VoiceDiet
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
            <a href="#demo" className="hover:text-zinc-100 transition-colors">Interactive Demo</a>
            <a href="#how-it-works" className="hover:text-zinc-100 transition-colors">How It Works</a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onGetStarted('signin')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/50 transition-all cursor-pointer"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => onGetStarted('signup')}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black rounded-xl text-sm font-extrabold shadow-lg shadow-orange-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <UserPlus size={15} />
              <span>Sign Up</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-xs font-bold text-orange-400 mb-6">
            <Sparkles size={13} />
            <span>AI-Powered Voice Macro Tracker</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-zinc-100 leading-tight tracking-tight max-w-3xl mx-auto">
            Speak Your Meals.<br />
            <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 bg-clip-text text-transparent">
              Track Your Macros.
            </span>
          </h1>

          <p className="mt-6 text-zinc-400 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
            No more tedious database searches or manual entry. Just describe your meals out loud, and let our advanced AI calculate your exact calories and macronutrients instantly.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onGetStarted('signup')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-600 hover:to-amber-600 rounded-2xl font-extrabold text-base shadow-xl shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Start Tracking Free</span>
              <ArrowRight size={18} />
            </button>
            <a
              href="#demo"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 rounded-2xl font-bold text-base transition-all cursor-pointer"
            >
              <span>Watch Demo</span>
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 border-y border-zinc-900 py-8 max-w-3xl mx-auto">
            <div>
              <div className="text-3xl font-extrabold text-orange-500">100%</div>
              <div className="text-zinc-500 text-xs font-semibold mt-1">Hands-Free Entry</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-zinc-100">3 Seconds</div>
              <div className="text-zinc-500 text-xs font-semibold mt-1">Time to Log a Meal</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-zinc-100">150,000+</div>
              <div className="text-zinc-500 text-xs font-semibold mt-1">Foods Parsed</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-orange-500">99%</div>
              <div className="text-zinc-500 text-xs font-semibold mt-1">Accuracy Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE DEMO SECTION */}
      <section id="demo" className="py-16 px-6 bg-zinc-950/50 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black tracking-tight text-zinc-100">
              See It in Action
            </h2>
            <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto">
              Click the button below to simulate how VoiceDiet transcribes and analyzes a meal instantly.
            </p>
          </div>

          <div className="glass-panel border border-zinc-800 bg-zinc-900/40 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 max-w-2xl mx-auto glow-orange">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Interactive Demo Interface</span>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20">
                AI Agent Active
              </span>
            </div>

            {/* Display Simulator Status */}
            <div className="min-h-[220px] bg-zinc-950/80 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
              
              {demoState === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl mb-4 text-orange-500">
                    <Mic size={32} />
                  </div>
                  <p className="text-zinc-300 font-semibold text-sm">
                    Ready to record sample input
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Click the "Simulate Voice Input" button below to start.
                  </p>
                </div>
              )}

              {demoState === 'recording' && (
                <div className="flex-1 flex flex-col items-center justify-center py-6">
                  <div className="flex gap-1.5 items-end justify-center h-12 mb-6">
                    <div className="w-1.5 h-6 bg-orange-500 rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-12 bg-orange-500 rounded-full animate-bounce delay-200" />
                    <div className="w-1.5 h-8 bg-orange-500 rounded-full animate-bounce delay-300" />
                    <div className="w-1.5 h-10 bg-orange-500 rounded-full animate-bounce delay-75" />
                    <div className="w-1.5 h-4 bg-orange-500 rounded-full animate-bounce" />
                  </div>
                  <p className="text-orange-400 font-extrabold text-sm tracking-wide animate-pulse">
                    RECORDING VOICE INPUT...
                  </p>
                  <p className="text-zinc-500 text-[11px] mt-1">
                    Simulating speech to text analysis
                  </p>
                </div>
              )}

              {demoState === 'typing' && (
                <div className="flex-1 flex flex-col justify-center py-6">
                  <div className="text-[11px] uppercase text-zinc-500 font-bold tracking-wider mb-2">Transcribing:</div>
                  <div className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl min-h-[64px] flex items-center">
                    <p className="text-zinc-200 text-sm font-semibold italic border-r-2 border-orange-500 pr-1">
                      "{demoText}"
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-zinc-500 text-xs">
                    <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    <span>Analyzing food items...</span>
                  </div>
                </div>
              )}

              {demoState === 'parsed' && (
                <div className="flex-1 flex flex-col gap-4">
                  <div>
                    <div className="text-[11px] uppercase text-zinc-500 font-bold tracking-wider mb-1">Transcript:</div>
                    <p className="text-zinc-300 text-xs italic font-medium">
                      "{sampleTranscripts[activeSampleIndex]}"
                    </p>
                  </div>

                  <div className="border-t border-zinc-900 pt-3">
                    <div className="text-[11px] uppercase text-zinc-500 font-bold tracking-wider mb-2">AI Macro breakdown:</div>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {currentParsed.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-zinc-900/60 border border-zinc-900 rounded-lg p-2">
                          <span className="font-bold text-zinc-200 truncate max-w-[180px]">{item.name}</span>
                          <div className="flex items-center gap-3 text-zinc-400">
                            <span>{item.calories} kcal</span>
                            <span className="hidden sm:inline text-zinc-600">|</span>
                            <span className="hidden sm:inline">P: {item.protein}g</span>
                            <span className="hidden sm:inline">C: {item.carbs}g</span>
                            <span className="hidden sm:inline">F: {item.fat}g</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-900 pt-3 flex justify-between items-center bg-orange-500/5 -mx-6 -mb-6 p-4 border-b rounded-b-2xl">
                    <span className="font-bold text-zinc-200 text-xs">Logged Total:</span>
                    <div className="flex gap-4 text-xs font-bold text-orange-400">
                      <span>{currentParsed.total.calories} Calories</span>
                      <span>{currentParsed.total.protein}g Protein</span>
                      <span>{currentParsed.total.carbs}g Carbs</span>
                      <span>{currentParsed.total.fat}g Fat</span>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Demo Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {demoState === 'idle' && (
                <button
                  onClick={runDemo}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg shadow-orange-500/10"
                >
                  <Play size={16} fill="black" />
                  <span>Simulate Voice Input</span>
                </button>
              )}

              {demoState !== 'idle' && (
                <button
                  onClick={resetDemo}
                  disabled={demoState === 'recording' || demoState === 'typing'}
                  className="w-full flex items-center justify-center gap-2 py-3.5 border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-extrabold rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RotateCcw size={16} />
                  <span>Reset Demo & Next Example</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-100 tracking-tight">
            Features Tailored For Your Goals
          </h2>
          <p className="text-zinc-400 text-sm mt-3 max-w-md mx-auto">
            Say goodbye to calorie counts that take 10 minutes. Hit your target weight effortlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-panel border border-zinc-800 bg-zinc-900/30 rounded-3xl p-8 hover:border-orange-500/40 transition-all group">
            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/25 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
              <Mic size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">
              Natural Voice Input
            </h3>
            <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
              No need to weigh and match database items manually. Simply dictate what you ate and drank in your own words, including portions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel border border-zinc-800 bg-zinc-900/30 rounded-3xl p-8 hover:border-orange-500/40 transition-all group">
            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/25 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">
              Deep AI Integration
            </h3>
            <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
              Our advanced Large Language Model interprets custom descriptions, handles cooking adjustments, estimates macros, and logs the meal correctly.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel border border-zinc-800 bg-zinc-900/30 rounded-3xl p-8 hover:border-orange-500/40 transition-all group">
            <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/25 rounded-2xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100">
              Real-time Analytics
            </h3>
            <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
              Watch your progress rings adjust live. Get dynamic charts mapping target vs. logged levels of carbs, protein, fat, and hydration.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 bg-zinc-950/70 border-y border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-zinc-100 tracking-tight">
              Get Started In 3 Steps
            </h2>
            <p className="text-zinc-400 text-sm mt-2">
              It takes less than 60 seconds to configure your account.
            </p>
          </div>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 text-orange-400 rounded-full flex items-center justify-center font-black text-xl shrink-0">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Create a Free Account</h3>
                <p className="text-zinc-400 text-sm mt-1">
                  Sign up in seconds. Enter your username, email, and password. No credit card required.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 text-orange-400 rounded-full flex items-center justify-center font-black text-xl shrink-0">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Set Your Nutrition Targets</h3>
                <p className="text-zinc-400 text-sm mt-1">
                  Configure your height, weight, activity levels, and daily target metrics in Settings to customize your dashboard metrics.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 text-orange-400 rounded-full flex items-center justify-center font-black text-xl shrink-0">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100">Hold & Speak</h3>
                <p className="text-zinc-400 text-sm mt-1">
                  Click the recorder button, describe your meal, and your food is logged. Review logs in History anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION (CTA) */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto glass-panel border border-zinc-800 bg-gradient-to-br from-zinc-900/60 to-zinc-950/40 rounded-3xl p-10 sm:p-14 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
            Ready to hit your health goals?
          </h2>
          <p className="mt-4 text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
            Join thousands of users tracking calories and macros faster than ever before.
          </p>

          <button
            onClick={() => onGetStarted('signup')}
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-2xl text-base shadow-xl shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Create Free Account</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-zinc-900 py-10 px-6 text-center text-xs text-zinc-500 bg-zinc-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-orange-500 rounded-lg text-black">
              <Activity size={14} />
            </div>
            <span className="font-extrabold text-sm text-zinc-300">
              VoiceDiet
            </span>
          </div>
          <p>© 2026 VoiceDiet Inc. All rights reserved. Powered by AI and SimpleJWT.</p>
        </div>
      </footer>

    </div>
  )
}
