import { GoogleGenerativeAI } from '@google/generative-ai'

// Access API keys from environment
const getGeminiApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || ''
const getUsdaApiKey = () => import.meta.env.VITE_USDA_API_KEY || 'DEMO_KEY'

// Initialize Gemini Client
const getGeminiModel = () => {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured. Please set VITE_GEMINI_API_KEY in your .env.local file.')
  }
  const genAI = new GoogleGenerativeAI(apiKey)
  // Using gemini-2.5-flash for fast responses
  return genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: "application/json" }
  })
}

// Map USDA nutrients to our schema
const NUTRIENT_MAP = {
  1008: 'calories',       // Energy (kcal)
  1003: 'protein_g',      // Protein (g)
  1005: 'carbs_g',        // Carbohydrate (g)
  1004: 'fat_g',          // Total lipid (fat) (g)
  1079: 'fiber_g',        // Fiber, total dietary (g)
  1087: 'calcium_mg',     // Calcium (mg)
  1090: 'magnesium_mg',   // Magnesium (mg)
  1091: 'phosphorus_mg',  // Phosphorus (mg)
  1114: 'vitamin_d_mcg',  // Vitamin D (D2 + D3) (mcg)
  1104: 'vitamin_a_mcg',  // Vitamin A, RAE (mcg)
  1162: 'vitamin_c_mg',   // Vitamin C (mg)
  1109: 'vitamin_e_mg',   // Vitamin E (mg)
  1095: 'zinc_mg',        // Zinc (mg)
  1103: 'selenium_mcg',   // Selenium (mcg)
  1175: 'biotin_mcg',     // Biotin (mcg)
  1177: 'folate_mcg',     // Folate, total (mcg)
  1089: 'iron_mg',        // Iron (mg)
  1272: 'omega_3_g',      // Fatty acids, total trans (g) (will use LLM for accurate omega-3 if missing)
  1092: 'potassium_mg',   // Potassium (mg)
  1093: 'sodium_mg',      // Sodium (mg)
}

/**
 * Searches the USDA database for candidate foods.
 */
export async function searchUsdaFoods(foodName) {
  const apiKey = getUsdaApiKey()
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(foodName)}&pageSize=5`
  
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn('USDA Search API request failed:', res.statusText)
      return []
    }
    const data = await res.json()
    return data.foods || []
  } catch (error) {
    console.error('Error querying USDA API:', error)
    return []
  }
}

/**
 * Uses Gemini to match the food item to the best USDA candidate.
 */
export async function matchUsdaCandidate(foodName, candidates) {
  if (!candidates || candidates.length === 0) return -1
  
  const model = getGeminiModel()
  const candidateList = candidates.map((c, index) => ({
    index,
    description: c.description,
    brandOwner: c.brandOwner || 'N/A',
    dataType: c.dataType,
    ingredients: c.ingredients || 'N/A'
  }))

  const prompt = `You are a nutrition database matcher.
User queried food: "${foodName}"
Top 5 USDA database candidate items:
${JSON.stringify(candidateList, null, 2)}

Determine which candidate is the best matches for the user's food.
Return a JSON object in this format:
{
  "best_match_index": number (0-4, or -1 if none of the candidates are a reasonable match)
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const parsed = JSON.parse(text)
    return parsed.best_match_index
  } catch (e) {
    console.error('Error choosing best match with LLM:', e)
    return 0 // default to first match if error
  }
}

/**
 * Ask Gemini to directly estimate nutrients of a food item (Fallback or scaling support).
 */
export async function estimateNutrientsWithAI(foodName, quantity, unit, matchedUsdaFood = null) {
  const model = getGeminiModel()
  
  let matchInfo = 'No database match found, perform full direct estimation.'
  let usdaNutrients = {}
  
  if (matchedUsdaFood) {
    matchInfo = `Database matched USDA food description: "${matchedUsdaFood.description}". FDC ID: ${matchedUsdaFood.fdcId}.`
    // Extract nutrients from USDA record
    if (matchedUsdaFood.foodNutrients) {
      matchedUsdaFood.foodNutrients.forEach(n => {
        const key = NUTRIENT_MAP[n.nutrientId]
        if (key) {
          usdaNutrients[key] = n.value // standard value per 100g
        }
      })
    }
  }

  const prompt = `You are a nutrition calculator assistant.
User Logged Item: "${quantity} ${unit} of ${foodName}"
${matchInfo}
${matchedUsdaFood ? `USDA Nutrients (per 100g if SR/FNDDS database, or per package/serving if branded): ${JSON.stringify(usdaNutrients)}` : ''}

Task: Calculate the total nutritional intake for this entry.
1. Estimate the total weight in grams for this logged portion (e.g. 1 slice of bread = ~28g, 1 cup of chopped apples = ~125g).
2. Compute the nutrients. If a database match is provided, scale its 100g nutrients accordingly. 
3. Fill in any missing nutrients (like magnesium, zinc, omega-3, biotin) using clinical nutrition averages for this food.

Return ONLY a valid JSON object in this exact schema (numeric values only):
{
  "estimated_weight_g": number,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fiber_g": number,
  "calcium_mg": number,
  "magnesium_mg": number,
  "phosphorus_mg": number,
  "vitamin_d_mcg": number,
  "vitamin_a_mcg": number,
  "vitamin_c_mg": number,
  "vitamin_e_mg": number,
  "zinc_mg": number,
  "selenium_mcg": number,
  "biotin_mcg": number,
  "folate_mcg": number,
  "iron_mg": number,
  "omega_3_g": number,
  "potassium_mg": number,
  "sodium_mg": number
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return JSON.parse(text)
  } catch (error) {
    console.error('Error estimating nutrients:', error)
    // Return safe default macros if LLM fails
    return {
      estimated_weight_g: 100,
      calories: 100,
      protein_g: 2,
      carbs_g: 15,
      fat_g: 3,
      fiber_g: 1,
      calcium_mg: 10,
      magnesium_mg: 5,
      phosphorus_mg: 10,
      vitamin_d_mcg: 0,
      vitamin_a_mcg: 0,
      vitamin_c_mg: 0,
      vitamin_e_mg: 0,
      zinc_mg: 0.1,
      selenium_mcg: 0,
      biotin_mcg: 0,
      folate_mcg: 0,
      iron_mg: 0.2,
      omega_3_g: 0,
      potassium_mg: 50,
      sodium_mg: 100
    }
  }
}

/**
 * Main coordinator function to lookup a food name, match it, scale nutrients, and return a completed entry
 */
export async function getNutritionData(foodLogEntry) {
  const { food_name, quantity, unit, meal } = foodLogEntry
  
  // 1. Search USDA database
  const candidates = await searchUsdaFoods(food_name)
  let matchedFood = null
  let fdcId = null
  let matchType = 'ai_estimated'

  if (candidates.length > 0) {
    // 2. Select best match using LLM
    const bestIndex = await matchUsdaCandidate(food_name, candidates)
    if (bestIndex !== -1 && candidates[bestIndex]) {
      matchedFood = candidates[bestIndex]
      fdcId = String(matchedFood.fdcId)
      matchType = 'db_matched'
    }
  }

  // 3. Compute/Estimate nutrients using Gemini
  const nutrients = await estimateNutrientsWithAI(food_name, quantity, unit, matchedFood)

  return {
    food_name,
    quantity: Number(quantity),
    unit,
    meal,
    usda_fdc_id: fdcId,
    match_type: matchType, // 'db_matched' or 'ai_estimated'
    ...nutrients
  }
}
