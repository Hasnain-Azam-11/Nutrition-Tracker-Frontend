import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { 
  Mic, MicOff, Check, Trash2, 
  AlertTriangle, Loader2, Sparkles, PlusCircle, ArrowLeft, Keyboard
} from 'lucide-react'

// Web Speech API interfaces
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function VoiceLogger({ onLogComplete, onCancel }) {
  // Steps: 'record' | 'parsing' | 'confirm' | 'logging'
  const [step, setStep] = useState('record') 
  // Modes for input: 'voice' | 'type'
  const [inputMode, setInputMode] = useState('voice') 
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsedFoods, setParsedFoods] = useState([])
  const [recognition, setRecognition] = useState(null)
  
  const [loadingText, setLoadingText] = useState('')
  const [error, setError] = useState('')
  const [isMicSupported, setIsMicSupported] = useState(true)

  // Initialize Speech Recognition
  useEffect(() => {
    if (!SpeechRecognition) {
      setIsMicSupported(false)
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (event) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        setTranscript(prev => (prev + ' ' + finalTranscript).trim())
      }
    }

    rec.onerror = (e) => {
      console.error('Speech recognition error', e)
      if (e.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access or switch to typing mode.')
        setIsListening(false)
      }
    }

    rec.onend = () => {
      setIsListening(false)
    }

    setRecognition(rec)
  }, [])

  // Toggle listening state
  const toggleListening = () => {
    if (!isMicSupported) {
      setError('Speech recognition is not supported in this browser. Please use Typing Mode.')
      return
    }
    if (!recognition) return

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      setError('')
      try {
        recognition.start()
        setIsListening(true)
      } catch (err) {
        console.error(err)
        setIsListening(false)
      }
    }
  }

  // Calls backend parse endpoint to calculate nutrition
  const handleParseTranscript = async () => {
    if (!transcript.trim()) {
      setError('Please provide a food description before proceeding.')
      return
    }

    setStep('parsing')
    setLoadingText('AI is extracting foods and calculating nutrition...')
    setError('')

    try {
      const data = await api.parseMeal(transcript)

      // Map backend single meal response to parsed foods confirmation list
      setParsedFoods([
        {
          id: Date.now(),
          food_name: data.name || transcript,
          calories: Number(data.calories) || 0,
          protein_g: Number(data.protein_g) || 0,
          carbs_g: Number(data.carbs_g) || 0,
          fat_g: Number(data.fat_g) || 0,
          micronutrients: data.micronutrients || {},
          source: inputMode === 'voice' ? 'ai_voice' : 'ai_text',
          confidence: 'high'
        }
      ])
      setStep('confirm')
    } catch (err) {
      console.error(err)
      setError('Failed to parse description. Check if the backend is running.')
      setStep('record')
    }
  }

  // Card list edit actions
  const updateFoodField = (id, field, value) => {
    setParsedFoods(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  const deleteFoodCard = (id) => {
    setParsedFoods(prev => prev.filter(item => item.id !== id))
  }

  const addNewFoodCard = () => {
    setParsedFoods(prev => [
      ...prev,
      {
        id: Date.now(),
        food_name: 'New food item',
        calories: 150,
        protein_g: 15,
        carbs_g: 10,
        fat_g: 5,
        micronutrients: {},
        source: 'manual',
        confidence: 'high'
      }
    ])
  }

  // Save parsed items to backend database
  const handleConfirmAndSave = async () => {
    if (parsedFoods.length === 0) {
      setError('Please add at least one food item to log.')
      return
    }

    setStep('logging')
    setError('')
    
    let loggedCount = 0;
    try {
      for (const food of parsedFoods) {
        setLoadingText(`Saving "${food.food_name}" (${loggedCount + 1}/${parsedFoods.length})...`)
        
        // Assemble directly from confirmation card state
        const logData = {
          food_name: food.food_name,
          calories: Number(food.calories) || 0,
          protein_g: Number(food.protein_g) || 0,
          carbs_g: Number(food.carbs_g) || 0,
          fat_g: Number(food.fat_g) || 0,
          source: food.source || 'manual',
          ...food.micronutrients
        }

        await api.createFoodLog(logData)
        loggedCount++
      }

      onLogComplete()
    } catch (err) {
      console.error(err)
      setError(`Failed to save logged items. Server reported: ${err.message || err}. Please try again.`)
      setStep('confirm')
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 transition-all duration-300">
      
      {/* 1. Input Screen */}
      {step === 'record' && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 bg-zinc-900/60 border border-zinc-800 shadow-xl flex flex-col items-center glow-orange">
          
          <h2 className="text-2xl font-bold text-zinc-100 mb-2 text-center">Add Foods to Meals</h2>
          <p className="text-zinc-400 text-sm mb-6 text-center max-w-md">
            Choose whether to speak your meal or type it out. Our AI will automatically extract foods, portions, and calculate all nutrients.
          </p>

          {/* Mode Selector Tabs */}
          <div className="flex bg-zinc-950 p-1 rounded-2xl w-full max-w-xs mb-6 border border-zinc-800">
            <button
              onClick={() => {
                setInputMode('voice')
                setError('')
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                inputMode === 'voice'
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Mic size={14} />
              <span>Voice</span>
            </button>
            <button
              onClick={() => {
                setInputMode('type')
                setError('')
                if (isListening && recognition) {
                  recognition.stop()
                  setIsListening(false)
                }
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                inputMode === 'type'
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Keyboard size={14} />
              <span>Type</span>
            </button>
          </div>

          {/* Voice Input Interface */}
          {inputMode === 'voice' && (
            <div className="flex flex-col items-center w-full">
              <div className="relative mb-6 flex justify-center items-center">
                {isListening && (
                  <div className="absolute w-28 h-28 rounded-full bg-orange-500/20 animate-pulse-ring" />
                )}
                <button
                  onClick={toggleListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-black transition-all duration-300 shadow-lg ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-550/20' 
                      : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                  } cursor-pointer relative z-10`}
                >
                  {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
              </div>

              <span className={`text-xs font-extrabold uppercase tracking-wider mb-6 ${
                isListening ? 'text-orange-500 animate-pulse' : 'text-zinc-500'
              }`}>
                {isListening ? 'Listening... Speak your meal' : 'Tap to speak meal'}
              </span>

              <div className="w-full mb-6">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">
                  Voice Transcript
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Say something like: 'I had two fried eggs and a glass of milk'..."
                  rows={4}
                  className="w-full p-4 rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-200 resize-none"
                />
              </div>
            </div>
          )}

          {/* Typing Input Interface */}
          {inputMode === 'type' && (
            <div className="w-full mb-6">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">
                Describe your meal
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Type your foods here, e.g.: 'I had 100g of grilled chicken salad and a cup of orange juice'..."
                rows={6}
                className="w-full p-4 rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all duration-205 resize-none"
              />
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 w-full bg-rose-500/10 text-rose-400 text-sm rounded-2xl flex gap-2 border border-rose-500/25">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 w-full mt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 border border-zinc-850 hover:bg-zinc-900 text-zinc-300 font-extrabold rounded-xl transition-all duration-200 cursor-pointer text-center text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleParseTranscript}
              disabled={!transcript.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold rounded-xl transition-all duration-200 shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <span>Analyze with AI</span>
              <Sparkles size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Parsing Screen */}
      {step === 'parsing' && (
        <div className="glass-panel rounded-3xl p-12 bg-zinc-900/60 border border-zinc-800 shadow-xl flex flex-col items-center justify-center glow-orange">
          <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
          <p className="text-zinc-100 font-bold text-center">{loadingText}</p>
          <span className="text-xs text-zinc-550 mt-2">Powered by Gemini AI</span>
        </div>
      )}

      {/* 3. Confirmation Screen */}
      {step === 'confirm' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setStep('record')}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 font-bold transition-colors duration-200 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-1.5">
              <Sparkles size={18} className="text-orange-500" />
              <span>Confirm Extracted Foods</span>
            </h2>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 text-rose-400 text-sm rounded-2xl flex gap-2 border border-rose-500/25">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Cards List */}
          <div className="space-y-4">
            {parsedFoods.map((food) => {
              return (
                <div 
                  key={food.id}
                  className="glass-panel rounded-2xl p-5 bg-zinc-900/40 border border-zinc-800/80 shadow-md transition-all duration-300 flex flex-col gap-4 relative hover:bg-zinc-900/60"
                >
                  <button
                    onClick={() => deleteFoodCard(food.id)}
                    className="absolute top-4 right-4 text-zinc-550 hover:text-rose-400 transition-colors duration-200 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Food Name */}
                    <div className="col-span-2 md:col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Food Name
                      </label>
                      <input
                        type="text"
                        value={food.food_name}
                        onChange={(e) => updateFoodField(food.id, 'food_name', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    {/* Calories */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Calories (kcal)
                      </label>
                      <input
                        type="number"
                        value={food.calories}
                        onChange={(e) => updateFoodField(food.id, 'calories', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    {/* Protein */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Protein (g)
                      </label>
                      <input
                        type="number"
                        value={food.protein_g}
                        onChange={(e) => updateFoodField(food.id, 'protein_g', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    {/* Carbs */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Carbs (g)
                      </label>
                      <input
                        type="number"
                        value={food.carbs_g}
                        onChange={(e) => updateFoodField(food.id, 'carbs_g', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    {/* Fat */}
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Fat (g)
                      </label>
                      <input
                        type="number"
                        value={food.fat_g}
                        onChange={(e) => updateFoodField(food.id, 'fat_g', Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full">
            <button
              onClick={addNewFoodCard}
              className="flex-1 py-3 border border-dashed border-orange-500/50 hover:bg-orange-500/10 text-orange-400 font-extrabold rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <PlusCircle size={18} />
              <span>Add Custom Food Card</span>
            </button>
            <button
              onClick={handleConfirmAndSave}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-extrabold rounded-2xl shadow-lg shadow-orange-500/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              <span>Log Foods to Diary</span>
              <Check size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Logging Screen */}
      {step === 'logging' && (
        <div className="glass-panel rounded-3xl p-12 bg-zinc-900/60 border border-zinc-800 shadow-xl flex flex-col items-center justify-center glow-orange">
          <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
          <p className="text-zinc-100 font-bold text-center mb-1">{loadingText}</p>
          <span className="text-xs text-zinc-550">Syncing with database...</span>
        </div>
      )}
    </div>
  )
}
