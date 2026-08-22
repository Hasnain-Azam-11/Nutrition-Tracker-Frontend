const API_BASE_URL = 'http://127.0.0.1:8000/api/'

export const getApiBaseUrl = () => API_BASE_URL

// Save tokens to localStorage
export const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access)
  if (refresh) {
    localStorage.setItem('refresh_token', refresh)
  }
}

// Get tokens from localStorage
export const getAccessToken = () => localStorage.getItem('access_token')
export const getRefreshToken = () => localStorage.getItem('refresh_token')

// Clear tokens from localStorage
export const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

// Check if user is authenticated
export const isAuthenticated = () => !!getAccessToken()

// Helper for making API calls with JWT management
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  let response = await fetch(url, config)

  // Handle Token Expiration (401 Unauthorized)
  if (response.status === 401 && getRefreshToken()) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}login/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: getRefreshToken() }),
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        setTokens(refreshData.access)
        
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${refreshData.access}`
        response = await fetch(url, { ...config, headers })
      } else {
        // Refresh token failed/expired, force logout
        clearTokens()
        window.dispatchEvent(new Event('auth-expired'))
      }
    } catch (err) {
      clearTokens()
      window.dispatchEvent(new Event('auth-expired'))
    }
  }

  // Parse response
  if (response.status === 204) {
    return true
  }

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || data.detail || JSON.stringify(data) || 'API request failed')
  }

  return data
}

// Helper to translate backend goal structure to frontend expected shape
const mapBackendGoalToFrontend = (goal) => {
  if (!goal) return null
  
  const micros = goal.micros_goal || {}
  const vitamins = goal.vitamins_goal || {}
  
  return {
    id: goal.id,
    goal_type: goal.goal_type || 'maintain',
    daily_calories: goal.calories_goal ?? 2000,
    daily_protein_g: goal.protein_goal ?? 150,
    daily_carbs_g: goal.carbs_goal ?? 200,
    daily_fat_g: goal.fats_goal ?? 65,
    
    daily_calcium_mg: micros.calcium_mg ?? 1000,
    daily_magnesium_mg: micros.magnesium_mg ?? 420,
    daily_phosphorus_mg: micros.phosphorus_mg ?? 700,
    daily_vitamin_d_mcg: vitamins.vitamin_d_mcg ?? 15,
    daily_vitamin_a_mcg: vitamins.vitamin_a_mcg ?? 900,
    daily_vitamin_c_mg: vitamins.vitamin_c_mg ?? 90,
    daily_vitamin_e_mg: vitamins.vitamin_e_mg ?? 15,
    daily_zinc_mg: micros.zinc_mg ?? 11,
    daily_selenium_mcg: vitamins.selenium_mcg ?? 55,
    daily_biotin_mcg: vitamins.biotin_mcg ?? 30,
    daily_folate_mcg: vitamins.folate_mcg ?? 400,
    daily_iron_mg: micros.iron_mg ?? 18,
    daily_omega_3_g: micros.omega_3_g ?? 1.6,
    daily_potassium_mg: micros.potassium_mg ?? 3400,
    daily_sodium_mg: micros.sodium_mg ?? 2300,
    daily_vitamin_k2_mcg: vitamins.vitamin_k2_mcg ?? vitamins.vitamin_k_mcg ?? 120,
    daily_coq10_mg: micros.coq10_mg ?? vitamins.coq10_mg ?? 100,
    daily_chromium_mcg: micros.chromium_mcg ?? vitamins.chromium_mcg ?? 35,
    daily_iodine_mcg: micros.iodine_mcg ?? vitamins.iodine_mcg ?? 150,
    daily_vitamin_b6_mg: vitamins.vitamin_b6_mg ?? 1.3,
    daily_vitamin_b12_mcg: vitamins.vitamin_b12_mcg ?? 2.4,
    daily_choline_mg: micros.choline_mg ?? vitamins.choline_mg ?? 550,
    daily_chloride_mg: micros.chloride_mg ?? 2300,

    // Preserved references
    calories_goal: goal.calories_goal,
    protein_goal: goal.protein_goal,
    carbs_goal: goal.carbs_goal,
    fats_goal: goal.fats_goal,
    micros_goal: micros,
    vitamins_goal: vitamins
  }
}

// Exported API Actions
export const api = {
  login: async (username, password) => {
    const data = await apiRequest('login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setTokens(data.access, data.refresh)
    return { username }
  },

  register: async (username, email, password) => {
    const data = await apiRequest('registration/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
    setTokens(data.access, data.refresh)
    return { username: data.username }
  },

  logout: () => {
    clearTokens()
  },

  getUserProfile: async () => {
    return await apiRequest('profile/')
  },

  updateUserProfile: async (profileData) => {
    return await apiRequest('profile/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  },

  getUserGoals: async () => {
    const goal = await apiRequest('usergoal/')
    const profile = await apiRequest('profile/').catch(() => null)
    const mapped = mapBackendGoalToFrontend(goal)
    if (profile && profile.weight_kg && mapped) {
      mapped.daily_protein_g = Math.round(profile.weight_kg * 2.2)
      mapped.protein_goal = mapped.daily_protein_g
    }
    return mapped
  },

  updateUserGoals: async (goalsInput) => {
    const goal = await apiRequest('usergoal/', {
      method: 'PUT',
      body: JSON.stringify(goalsInput)
    })
    const mapped = mapBackendGoalToFrontend(goal)
    if (goalsInput.weight_kg && mapped) {
      mapped.daily_protein_g = Math.round(goalsInput.weight_kg * 2.2)
      mapped.protein_goal = mapped.daily_protein_g
    }
    return mapped
  },

  // Fallback helper in case UI initializes goals
  createUserGoals: async (goalsData) => {
    const defaultInput = {
      weight_kg: 70,
      height_cm: 175,
      age: 25,
      gender: 'male',
      activity_level: 'moderate',
      goal_type: 'maintain'
    }
    const goal = await apiRequest('usergoal/', {
      method: 'PUT',
      body: JSON.stringify(defaultInput)
    })
    const mapped = mapBackendGoalToFrontend(goal)
    if (mapped) {
      mapped.daily_protein_g = Math.round(70 * 2.2)
      mapped.protein_goal = mapped.daily_protein_g
    }
    return mapped
  },

  getFoodLogs: async (date = null) => {
    const data = await apiRequest('meals/')
    
    // Map backend array to flat frontend logs format
    const flatMeals = data.map(meal => {
      const flatLog = {
        id: meal.id,
        food_name: meal.name,
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
        source: meal.source,
        logged_at: meal.logged_at
      }
      
      // Copy over micronutrients keys into main object
      if (meal.micronutrients) {
        Object.keys(meal.micronutrients).forEach(key => {
          flatLog[key] = meal.micronutrients[key]
        })
      }
      return flatLog
    })

    // Filter by date client-side to map YYYY-MM-DD parameter
    if (date) {
      return flatMeals.filter(meal => {
        if (!meal.logged_at) return false
        const mealDate = meal.logged_at.split('T')[0]
        return mealDate === date
      })
    }
    
    return flatMeals
  },

  createFoodLog: async (logData) => {
    const payload = {
      name: logData.food_name,
      calories: Math.round(logData.calories || 0),
      protein_g: logData.protein_g || 0,
      carbs_g: logData.carbs_g || 0,
      fat_g: logData.fat_g || 0,
      source: logData.source || 'manual',
      micronutrients: {}
    }

    // Capture micronutrient properties to store in models.JSONField
    Object.keys(logData).forEach(key => {
      if (key.endsWith('_mg') || key.endsWith('_mcg') || key === 'omega_3_g' || key === 'fiber_g') {
        payload.micronutrients[key] = logData[key]
      }
    })

    const meal = await apiRequest('meals/', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const flatLog = {
      id: meal.id,
      food_name: meal.name,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      source: meal.source,
      logged_at: meal.logged_at
    }
    if (meal.micronutrients) {
      Object.keys(meal.micronutrients).forEach(key => {
        flatLog[key] = meal.micronutrients[key]
      })
    }
    return flatLog
  },

  updateFoodLog: async (id, logData) => {
    const payload = {}
    if (logData.food_name !== undefined) payload.name = logData.food_name
    if (logData.calories !== undefined) payload.calories = Math.round(logData.calories)
    if (logData.protein_g !== undefined) payload.protein_g = logData.protein_g
    if (logData.carbs_g !== undefined) payload.carbs_g = logData.carbs_g
    if (logData.fat_g !== undefined) payload.fat_g = logData.fat_g
    if (logData.source !== undefined) payload.source = logData.source

    const microKeys = Object.keys(logData).filter(key => 
      key.endsWith('_mg') || key.endsWith('_mcg') || key === 'omega_3_g' || key === 'fiber_g'
    )
    if (microKeys.length > 0) {
      payload.micronutrients = {}
      microKeys.forEach(key => {
        payload.micronutrients[key] = logData[key]
      })
    }

    const meal = await apiRequest(`meals/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    const flatLog = {
      id: meal.id,
      food_name: meal.name,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      source: meal.source,
      logged_at: meal.logged_at
    }
    if (meal.micronutrients) {
      Object.keys(meal.micronutrients).forEach(key => {
        flatLog[key] = meal.micronutrients[key]
      })
    }
    return flatLog
  },

  deleteFoodLog: async (id) => {
    return await apiRequest(`meals/${id}/`, {
      method: 'DELETE',
    })
  },

  parseMeal: async (text) => {
    return await apiRequest('meals/parse/', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }
}
